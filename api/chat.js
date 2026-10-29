// Vercel serverless function: POST /api/chat
// Sends the customer's conversation to Claude with FibreFit's knowledge and returns the reply.
// Needs an ANTHROPIC_API_KEY environment variable in your Vercel project settings.

const { FIBREFIT_ASSISTANT_PROMPT } = require("../js/knowledge.js");

const MODEL = process.env.FIBREFIT_CHAT_MODEL || "claude-haiku-5-5";
const MAX_TURNS = 12; // only the latest messages are sent, to keep costs low
const MAX_CHARS = 1500; // per message

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "The assistant isn't set up yet." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const incoming = Array.isArray(body && body.messages) ? body.messages : [];
  const messages = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Send a message to the assistant." });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: FIBREFIT_ASSISTANT_PROMPT,
        messages,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Anthropic API error", r.status, data && data.error);
      return res.status(502).json({ error: "The assistant is busy. Try again in a minute." });
    }
    const reply = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "The assistant is busy. Try again in a minute." });
  }
};
