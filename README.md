# FibreFit website

The website for FibreFit. Tagline: **Every gram has a job.**

It's a plain HTML, CSS and JavaScript site. There's no build step and nothing to install, so it runs as-is on Vercel or GitHub Pages.

## What's in here

```
index.html          Home: botanical "inside one sachet" plate, fibre facts in numbers (70% fall short, Lancet figures), what fibre does, six use cases, the range, evidence table, how to take, FAQ, sign-up
daily-fibre.html    Product page: pack picker, add to cart, what's inside, how to take, warnings
science.html        How fibre works, with how sure the science is for each benefit
about.html          Why FibreFit exists, who fibre is for, and notes from the directors
support.html        Customer support: phone, email, help topics and common questions
gut-hydrate.html    Coming-soon product pages (also fibre-protein.html and fibre-gummies.html)
api/chat.js         The AI support chat's server code (runs on Vercel)
js/knowledge.js     Everything the AI assistant knows: edit this to change its answers
js/chat.js          The chat box on every page
assets/photos/      Product photos
css/styles.css      All styling (colours and fonts are set at the top)
js/main.js          Cart, gram chart, menus and forms (prices and settings are at the top)
assets/             Product artwork (SVG) and the favicon
```

## See it on your computer

Double-click `index.html` to open it in your browser. Everything works this way, including the cart.

## Put it on GitHub

**Easiest way, in the browser:**

1. Sign in to GitHub with your own account and click **New repository**.
2. Name it `fibrefit-website`, leave it **Public** or **Private**, and click **Create repository**.
3. On the next page, click **uploading an existing file**.
4. Drag in everything inside this folder (the files and the `css`, `js` and `assets` folders), then click **Commit changes**.

**Or with Git in a terminal**, from inside this folder:

```bash
git init
git add .
git commit -m "First version of the FibreFit website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/fibrefit-website.git
git push -u origin main
```

## Make it live on Vercel

1. Go to vercel.com and sign in **with your GitHub account**.
2. Click **Add New → Project** and pick `fibrefit-website`.
3. Leave every setting as it is (Framework: **Other**) and click **Deploy**.
4. You get a live link like `fibrefit-website.vercel.app`. Every time you push changes to GitHub, the site updates by itself.

## Turn on the AI chat

The "Ask FibreFit" chat box works straight away with built-in answers to common questions. To make it a full AI assistant:

1. Create an API key at console.anthropic.com (Settings → API keys) and add some credit.
2. In Vercel, open your project → **Settings → Environment Variables**.
3. Add `ANTHROPIC_API_KEY` with your key as the value, then redeploy.

The assistant only answers from `js/knowledge.js`, never gives medical advice, and points people to +91 97118 98925 or bloomwellventures@gmail.com when it doesn't know. Never put the API key in any file in this folder.

## Fill these in before launch

| What | Where |
| --- | --- |
| FSSAI licence number | The footer of every page (search for `[to be added]` in each .html file) |
| Launch-email sign-ups | Connected: every sign-up and "Notify me" goes to bloomwellventures@gmail.com through Web3Forms, using the access key in `FORM_ACCESS_KEY` at the top of `js/main.js`. Manage it at web3forms.com. |
| Taking payments | The **Check out** button opens an "orders open soon" message. Connect Razorpay or Shopify when you're ready to sell. |
| Directors' notes | The two quotes in `about.html` are drafts. Kartik and Suhavi should rewrite them in their own words. |
| Support hours | Add your calling hours to `support.html` if you want to show them |
| Product photos | The photos in `assets/photos/` are AI-generated concept shots, upscaled for the web. Swap in real product photos once packaging is printed, using the same file names. |
| Prices | `PRODUCTS` at the top of `js/main.js`, plus the "From ₹699" text on the home page and the price answer in the FAQ |

## Before printing claims anywhere

The health wording follows the safe ("Tier A") lines from the packaging draft. "Every gram has a job" is paired with plain descriptions of what each fibre is, not health claims. Get the site checked by an FSSAI regulatory consultant before launch, the same as the pack.
