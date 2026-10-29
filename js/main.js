/* FibreFit — site behaviour: menu, gram grid, cart, forms.
   No build step and no libraries, so the site runs as-is on GitHub Pages or Vercel. */

/* ------------------------------------------------------------------
   1. Settings you can change
   ------------------------------------------------------------------ */
const CONFIG = {
  // Paste a form endpoint here (for example from formspree.io) to start
  // collecting emails. While it is empty, forms show a "not connected" note.
  FORM_ENDPOINT: "",
  CURRENCY: "INR",
};

/* ------------------------------------------------------------------
   2. Product catalogue
   ------------------------------------------------------------------ */
const PRODUCTS = {
  "daily-fibre": {
    name: "Daily Fibre",
    image: "assets/photos/daily-fibre.jpg",
    url: "daily-fibre.html",
    packs: {
      "15": { label: "15-day pack", sub: "15 sachets", price: 699, sachets: 15 },
      "30": { label: "30-day pack", sub: "30 sachets", price: 1199, sachets: 30 },
      "sub": { label: "Monthly subscription", sub: "30 sachets delivered every month", price: 999, sachets: 30 },
    },
  },
};

/* The 12 g sachet, gram by gram. Half-gram tiles: 24 tiles = 12 g. */
const FIBRES = [
  { key: "psyllium", name: "Psyllium husk", grams: 6, cls: "g-psyllium", colour: "var(--psyllium)",
    job: "Soaks up water and turns into a soft gel. It adds bulk." },
  { key: "phgg", name: "Partially hydrolysed guar gum (PHGG)", short: "Guar (PHGG)", grams: 2, cls: "g-phgg", colour: "var(--phgg)",
    job: "Dissolves in water without thickening, so the drink stays easy to sip." },
  { key: "fenugreek", name: "Fenugreek seed fibre", short: "Fenugreek", grams: 1.5, cls: "g-fenugreek", colour: "var(--fenugreek)",
    job: "A thick, soluble fibre from methi seeds." },
  { key: "millet", name: "Millet-bran fibre", short: "Millet bran", grams: 1.5, cls: "g-millet", colour: "var(--millet-bran)",
    job: "Whole-grain fibre from the outer bran layer of millet." },
  { key: "banana", name: "Green-banana resistant starch", short: "Green banana", grams: 1, cls: "g-banana", colour: "var(--banana)",
    job: "A starch that passes through the small intestine and is fermented in the large intestine." },
];

/* ------------------------------------------------------------------
   3. Helpers
   ------------------------------------------------------------------ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const rupees = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: CONFIG.CURRENCY, maximumFractionDigits: 0 }).format(n);
const fmtGrams = (g) => `${g}\u00A0g`;

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    return undefined;
  }
}

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

/* ------------------------------------------------------------------
   4. Mobile menu
   ------------------------------------------------------------------ */
function initMenu() {
  const btn = $(".menu-btn");
  const nav = $("#site-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
}

/* ------------------------------------------------------------------
   5. The glass ("Every gram has a job")
   Five fibre layers in a glass of water, each as tall as its weight.
   ------------------------------------------------------------------ */
function glassSVG(uid) {
  const TOP = 24, BOTTOM = 372, PX_PER_G = 24;
  const wallL = (y) => 40 + (18 * (y - TOP)) / (BOTTOM - TOP);
  const wallR = (y) => 210 - (18 * (y - TOP)) / (BOTTOM - TOP);
  const outline = "M40 24 L57.3 358 Q58 372 72 372 L178 372 Q192 372 192.7 358 L210 24";
  const fillTop = BOTTOM - 12 * PX_PER_G;

  let y = BOTTOM;
  const layers = FIBRES.map((f) => {
    const h = f.grams * PX_PER_G;
    const top = y - h;
    const mid = top + h / 2;
    y = top;
    const label = f.short || f.name;
    return `<g class="layer" data-fibre="${f.key}" tabindex="0" role="button" aria-pressed="false"
        aria-label="${f.name}, ${f.grams} grams">
      <rect class="layer-fill" x="30" y="${top + 1}" width="200" height="${h - 2}" style="fill:${f.colour}" clip-path="url(#glass-${uid})"/>
      <rect class="hit" x="${wallR(mid)}" y="${top}" width="${400 - wallR(mid)}" height="${h}"/>
      <line class="leader" x1="${wallR(mid) + 8}" y1="${mid}" x2="234" y2="${mid}"/>
      <text class="layer-label" x="242" y="${mid + 5}">${label} <tspan class="w">${fmtGrams(f.grams)}</tspan></text>
    </g>`;
  }).join("");

  return `<svg class="glass" viewBox="0 0 400 392" aria-label="A glass with five fibre layers, stacked by weight">
    <defs><clipPath id="glass-${uid}"><path d="${outline} Z"/></clipPath></defs>
    <rect class="water" x="30" y="46" width="200" height="${fillTop - 46}" clip-path="url(#glass-${uid})"/>
    ${layers}
    <line class="shine" x1="58" y1="64" x2="70" y2="290"/>
    <path class="rim" d="${outline}"/>
  </svg>`;
}

function initGramGrid() {
  $$("[data-gram-card]").forEach((card, i) => {
    const wrap = $(".glass-wrap", card);
    const panel = $(".gram-job", card);
    if (!wrap || !panel) return;
    const hint = panel.innerHTML;
    wrap.innerHTML = glassSVG(i);
    const svg = $("svg", wrap);

    let current = null;
    const select = (key) => {
      current = current === key ? null : key;
      svg.classList.toggle("has-focus", !!current);
      $$(".layer", svg).forEach((l) => {
        const on = l.dataset.fibre === current;
        l.classList.toggle("on", on);
        l.setAttribute("aria-pressed", String(on));
      });
      if (!current) {
        panel.innerHTML = hint;
        return;
      }
      const f = FIBRES.find((x) => x.key === current);
      const share = Math.round((f.grams / 12) * 100);
      panel.innerHTML = `<div class="job-weight">${fmtGrams(f.grams)} ${f.name}</div>
        <p>${f.job}</p><p class="small">${share}% of every sachet.</p>`;
    };

    svg.addEventListener("click", (e) => {
      const l = e.target.closest(".layer");
      if (l) select(l.dataset.fibre);
    });
    svg.addEventListener("keydown", (e) => {
      const l = e.target.closest(".layer");
      if (l && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        select(l.dataset.fibre);
      }
    });
  });
}

/* ------------------------------------------------------------------
   6. Cart (saved in this browser)
   ------------------------------------------------------------------ */
const CART_KEY = "fibrefit-cart";
let cart = store(CART_KEY) || [];
if (!Array.isArray(cart)) cart = [];

function saveCart() {
  store(CART_KEY, cart);
  renderCart();
}

function addToCart(productId, packId, qty = 1) {
  const p = PRODUCTS[productId];
  if (!p || !p.packs[packId]) return;
  const id = `${productId}:${packId}`;
  const line = cart.find((l) => l.id === id);
  if (line) line.qty = Math.min(line.qty + qty, 20);
  else cart.push({ id, productId, packId, qty });
  saveCart();
  openCart();
}

function setQty(id, qty) {
  const line = cart.find((l) => l.id === id);
  if (!line) return;
  line.qty = qty;
  if (line.qty <= 0) cart = cart.filter((l) => l.id !== id);
  saveCart();
}

function cartLines() {
  return cart
    .map((l) => {
      const p = PRODUCTS[l.productId];
      const pack = p && p.packs[l.packId];
      return pack ? { ...l, product: p, pack, total: pack.price * l.qty } : null;
    })
    .filter(Boolean);
}

function renderCart() {
  const lines = cartLines();
  const count = lines.reduce((n, l) => n + l.qty, 0);
  $$(".cart-count").forEach((el) => (el.textContent = count));
  $$(".cart-btn").forEach((b) => b.setAttribute("aria-label", `Cart, ${count} ${count === 1 ? "item" : "items"}`));

  const body = $("#cart-body");
  const foot = $("#cart-foot");
  if (!body) return;

  if (!lines.length) {
    body.innerHTML = `<div class="empty-cart">
      <h3>Your cart is empty</h3>
      <p>Start with a 15-day pack of Daily Fibre. The first week is a gentle start at half a sachet a day.</p>
      <a class="btn btn-primary" href="daily-fibre.html">Shop Daily Fibre</a></div>`;
    foot.hidden = true;
    return;
  }

  foot.hidden = false;
  body.innerHTML = lines
    .map(
      (l) => `<div class="cart-item" data-id="${l.id}">
      <img src="${l.product.image}" alt="">
      <div>
        <h3>${l.product.name}</h3>
        <div class="variant">${l.pack.label} · ${l.pack.sub}</div>
        <div class="qty" role="group" aria-label="Quantity for ${l.product.name}, ${l.pack.label}">
          <button type="button" data-step="-1" aria-label="Remove one">−</button>
          <span aria-live="polite">${l.qty}</span>
          <button type="button" data-step="1" aria-label="Add one">+</button>
        </div>
        <button type="button" class="remove">Remove</button>
      </div>
      <div class="line-price">${rupees(l.total)}</div>
    </div>`
    )
    .join("");
  $("#cart-subtotal").textContent = rupees(lines.reduce((s, l) => s + l.total, 0));
}

function initCart() {
  const drawer = $("#cart");
  const body = $("#cart-body");
  if (!drawer) return;

  $$(".cart-btn").forEach((b) => b.addEventListener("click", openCart));
  $("#cart-close").addEventListener("click", closeOverlays);

  body.addEventListener("click", (e) => {
    const item = e.target.closest(".cart-item");
    if (!item) return;
    const line = cart.find((l) => l.id === item.dataset.id);
    if (!line) return;
    const step = e.target.closest("[data-step]");
    if (step) setQty(line.id, Math.min(line.qty + Number(step.dataset.step), 20));
    if (e.target.closest(".remove")) {
      setQty(line.id, 0);
      toast("Removed from cart");
    }
  });

  $("#checkout-btn").addEventListener("click", () => openModal("checkout"));

  // any "add to cart" button outside the product page
  $$("[data-add]").forEach((btn) =>
    btn.addEventListener("click", () => addToCart(btn.dataset.add, btn.dataset.pack || "15"))
  );

  renderCart();
}

/* ------------------------------------------------------------------
   7. Overlays: drawer + modals
   ------------------------------------------------------------------ */
let lastFocus = null;

function showScrim() { $("#scrim").classList.add("show"); document.body.style.overflow = "hidden"; }

function openCart() {
  lastFocus = document.activeElement;
  closeModals();
  const d = $("#cart");
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
  showScrim();
  setTimeout(() => $("#cart-close").focus(), 50);
}

function openModal(kind, productName) {
  lastFocus = lastFocus || document.activeElement;
  const d = $("#cart");
  d.classList.remove("open");
  d.setAttribute("aria-hidden", "true");
  const m = $("#modal");
  const title = $("#modal-title");
  const text = $("#modal-text");
  const form = $("form", m);
  form.reset();
  $(".form-msg", m).textContent = "";
  if (kind === "checkout") {
    title.textContent = "Orders open soon";
    text.textContent = "Online checkout isn't live yet. Leave your email and we'll write when it opens. Your cart stays saved in this browser.";
    form.dataset.interest = "checkout";
  } else {
    title.textContent = `Get told when ${productName} launches`;
    text.textContent = "One email when it's ready to order. Nothing else.";
    form.dataset.interest = productName;
  }
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  showScrim();
  setTimeout(() => $("input", m).focus(), 50);
}

function closeModals() {
  const m = $("#modal");
  if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
}

function closeOverlays() {
  closeModals();
  const d = $("#cart");
  if (d) { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); }
  $("#scrim").classList.remove("show");
  document.body.style.overflow = "";
  if (lastFocus) lastFocus.focus();
  lastFocus = null;
}

function initOverlays() {
  $("#scrim")?.addEventListener("click", closeOverlays);
  $("#modal-close")?.addEventListener("click", closeOverlays);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeOverlays(); });
  $$("[data-notify]").forEach((b) => b.addEventListener("click", () => openModal("notify", b.dataset.notify)));
}

/* ------------------------------------------------------------------
   8. Email forms
   ------------------------------------------------------------------ */
function initForms() {
  $$("form[data-signup]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $(".form-msg", form);
      const email = $("input[type=email]", form).value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        msg.textContent = "Enter an email address like name@example.com.";
        return;
      }
      if (!CONFIG.FORM_ENDPOINT) {
        msg.textContent = "Thanks! This form isn't connected yet, so your email wasn't sent.";
        return;
      }
      msg.textContent = "Sending…";
      try {
        const res = await fetch(CONFIG.FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email, interest: form.dataset.interest || "newsletter" }),
        });
        if (!res.ok) throw new Error(res.status);
        msg.textContent = "You're on the list. We'll email you at launch.";
        form.reset();
      } catch (err) {
        msg.textContent = "That didn't go through. Check your connection and try again.";
      }
    });
  });
}

/* ------------------------------------------------------------------
   9. Product page: pack picker + quantity
   ------------------------------------------------------------------ */
function initProductPage() {
  const form = $("#buy-form");
  if (!form) return;
  const product = PRODUCTS[form.dataset.product];
  const qtyEl = $("#buy-qty");
  const priceEl = $("#buy-price");
  let qty = 1;

  const update = () => {
    const packId = $("input[name=pack]:checked", form).value;
    priceEl.textContent = rupees(product.packs[packId].price * qty);
    qtyEl.textContent = qty;
  };

  $$(".pack", form).forEach((label) => {
    const pack = product.packs[$("input", label).value];
    $(".price", label).textContent = rupees(pack.price);
    $(".per", label).textContent = `${rupees(Math.round(pack.price / pack.sachets))} a sachet`;
  });

  form.addEventListener("change", update);
  $$("[data-step]", form).forEach((b) =>
    b.addEventListener("click", () => {
      qty = Math.max(1, Math.min(20, qty + Number(b.dataset.step)));
      update();
    })
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addToCart(form.dataset.product, $("input[name=pack]:checked", form).value, qty);
  });
  update();
}

/* ------------------------------------------------------------------
   10. Start
   ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initGramGrid();
  initOverlays();
  initCart();
  initForms();
  initProductPage();
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
});
