/* FibreFit support chat.
   Tries, in order:
   1. Claude inside a claude.ai preview (the "sample" capability),
   2. the site's own /api/chat function on Vercel (needs ANTHROPIC_API_KEY),
   3. built-in answers for common questions, so the box always helps. */

(function () {
  const SUPPORT = "+91 97118 98925";
  const EMAIL = "bloomwellventures@gmail.com";
  const history = []; // {role, content}
  let mode = null; // "sample" | "api" | "offline"
  let sampleFn = null;
  let busy = false;

  /* ---------- built-in answers (used when no AI is connected) ---------- */
  const OFFLINE = [
    { k: ["price", "cost", "rs", "₹", "rupee", "kitna", "subscription", "pack"],
      a: "Daily Fibre costs ₹699 for a 15-day pack (15 sachets) and ₹1,199 for a 30-day pack (30 sachets). A monthly subscription of 30 sachets is ₹999 a month." },
    { k: ["how to take", "how do i take", "dose", "use", "kaise", "water", "mix", "start"],
      a: "Days 1 to 7: stir half a sachet into a full glass of water (about 240 ml) and drink it straight away. From day 8: one sachet a day, mixed the same way. Drink plenty of water through the day." },
    { k: ["inside", "ingredient", "contain", "what's in", "whats in", "psyllium", "isabgol", "guar", "methi", "fenugreek", "millet", "banana"],
      a: "Each 12 g sachet has 6 g psyllium husk (isabgol), 2 g PHGG (guar), 1.5 g fenugreek seed fibre, 1.5 g millet-bran fibre and 1 g green-banana resistant starch." },
    { k: ["medicine", "medication", "tablet", "dawai", "pill"],
      a: "Fibre can slow how medicines are absorbed, so take Daily Fibre at least 2 hours apart from them. Please check with your doctor or pharmacist what's right for you." },
    { k: ["pregnan", "nursing", "breastfeed", "diabet", "sugar", "child", "kid", "baby"],
      a: "Please check with your doctor first if you're pregnant, nursing, have diabetes or take regular medicines. For children, ask your paediatrician." },
    { k: ["gas", "bloat", "side effect", "stomach", "pain", "constipat"],
      a: "Some gas or bloating in the first days is common when you add fibre, which is why the first week is half a sachet. If you have chest pain, trouble swallowing or breathing, or severe stomach pain, stop and get medical help straight away." },
    { k: ["order", "buy", "checkout", "deliver", "shipping", "refund", "return", "cancel"],
      a: `Online checkout opens soon. You can add packs to your cart now, sign up for the launch email on the home page, or call ${SUPPORT} or email ${EMAIL} to reserve a pack.` },
    { k: ["gut hydrate", "protein", "gumm", "coming soon", "launch"],
      a: "Gut Hydrate (fibre + electrolytes), Fibre Protein (protein + fibre) and Fibre Gummies (pectin + prebiotic fibre) are coming soon. Tap \"Notify me\" on any of them to get an email at launch." },
    { k: ["laxative", "medicine?", "safe"],
      a: "Daily Fibre is a health supplement, not a laxative or a medicine. It's meant to sit alongside a fibre-rich diet and isn't intended to diagnose, treat, cure or prevent any disease." },
    { k: ["how much fibre", "need", "daily fibre", "25", "30 g"],
      a: "ICMR-NIN recommends 25 g of fibre a day for adult women and 30 g for adult men. One sachet adds 12 g, which is about 48% and 40% of those targets." },
    { k: ["call", "phone", "number", "contact", "human", "talk", "email", "mail"],
      a: `You can call FibreFit support on ${SUPPORT} or email ${EMAIL}.` },
  ];

  function offlineAnswer(q) {
    const t = q.toLowerCase();
    const hit = OFFLINE.find((r) => r.k.some((k) => t.includes(k)));
    return hit
      ? hit.a
      : `I can help with prices, how to take Daily Fibre, what's inside, safety and orders. For anything else, call us on ${SUPPORT} or email ${EMAIL}.`;
  }

  /* ---------- pick the best available engine ---------- */
  async function pickMode() {
    if (mode) return mode;
    try {
      if (window.claude && typeof window.claude.use === "function") {
        const s = await window.claude.use("sample");
        if (s) { sampleFn = s; return (mode = "sample"); }
      }
    } catch (e) { /* fall through */ }
    if (location.protocol.startsWith("http") && !window.claude) return (mode = "api");
    return (mode = "offline");
  }

  async function ask(onPartial) {
    const m = await pickMode();
    const last = history[history.length - 1].content;

    if (m === "sample") {
      try {
        const res = await sampleFn(
          [{ role: "user", content: window.FIBREFIT_ASSISTANT_PROMPT + "\n\nConversation so far follows. Reply only as the assistant." },
           { role: "assistant", content: "Understood." },
           ...history],
          { cache: false, modelTier: "quick", onText: ({ text }) => onPartial(text) }
        );
        return res.text;
      } catch (e) {
        if (e && e.code === "not_granted") mode = "offline";
        return offlineAnswer(last);
      }
    }

    if (m === "api") {
      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        if (r.status === 404 || r.status === 503 || r.status === 405) {
          mode = "offline";
          return offlineAnswer(last);
        }
        const data = await r.json();
        if (!r.ok) return data.error || `Something went wrong. Call us on ${SUPPORT}.`;
        return data.reply;
      } catch (e) {
        mode = "offline";
        return offlineAnswer(last);
      }
    }
    return offlineAnswer(last);
  }

  /* ---------- UI ---------- */
  function build() {
    const launcher = document.createElement("button");
    launcher.className = "chat-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", "chat-panel");
    launcher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span>Ask FibreFit</span>';

    const panel = document.createElement("section");
    panel.className = "chat-panel";
    panel.id = "chat-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "FibreFit support chat");
    panel.innerHTML = `
      <header class="chat-head">
        <div><strong>FibreFit assistant</strong><span>Answers about our products and fibre</span></div>
        <button class="icon-btn chat-close" type="button" aria-label="Close chat">×</button>
      </header>
      <div class="chat-log" role="log" aria-live="polite"></div>
      <div class="chat-chips"></div>
      <form class="chat-form">
        <label class="visually-hidden" for="chat-input">Your question</label>
        <input id="chat-input" class="chat-input" type="text" autocomplete="off" maxlength="600" placeholder="Ask a question…">
        <button class="btn btn-primary chat-send" type="submit">Send</button>
      </form>
      <p class="chat-foot">AI assistant, not medical advice. Need a person? Call ${SUPPORT} or email ${EMAIL}.</p>`;

    document.body.append(launcher, panel);
    const log = panel.querySelector(".chat-log");
    const chips = panel.querySelector(".chat-chips");
    const form = panel.querySelector(".chat-form");
    const input = panel.querySelector(".chat-input");

    const bubble = (role, text) => {
      const b = document.createElement("div");
      b.className = `chat-msg ${role}`;
      b.textContent = text;
      log.appendChild(b);
      log.scrollTop = log.scrollHeight;
      return b;
    };
    const clean = (t) => String(t || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "").trim();

    bubble("assistant", "Hi! I can help with Daily Fibre, our upcoming products, how to take fibre, and orders. What would you like to know?");

    ["How do I take Daily Fibre?", "What's inside a sachet?", "How much does it cost?", "Can I take it with medicines?"].forEach((q) => {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "chat-chip";
      c.textContent = q;
      c.addEventListener("click", () => send(q));
      chips.appendChild(c);
    });

    async function send(text) {
      text = text.trim();
      if (!text || busy) return;
      busy = true;
      chips.hidden = true;
      bubble("user", text);
      history.push({ role: "user", content: text });
      input.value = "";
      const out = bubble("assistant", "…");
      out.classList.add("typing");
      const reply = clean(await ask((partial) => { out.classList.remove("typing"); out.textContent = clean(partial); log.scrollTop = log.scrollHeight; }));
      out.classList.remove("typing");
      out.textContent = reply;
      history.push({ role: "assistant", content: reply });
      log.scrollTop = log.scrollHeight;
      busy = false;
      input.focus();
    }

    form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });

    const setOpen = (open) => {
      panel.hidden = !open;
      launcher.setAttribute("aria-expanded", String(open));
      launcher.classList.toggle("is-open", open);
      if (open) setTimeout(() => input.focus(), 30);
    };
    launcher.addEventListener("click", () => setOpen(panel.hidden));
    panel.querySelector(".chat-close").addEventListener("click", () => { setOpen(false); launcher.focus(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { setOpen(false); launcher.focus(); } });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
