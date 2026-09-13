import {
  SHOPIFY_STORE_URL,
  loadCatalog,
  formatMoney,
  readCart,
  addToCart,
  setCartQty,
  cartCount,
  cartTotal,
  checkoutUrl,
} from "./shopify.js";

const root = document.querySelector("[data-shop]");
if (root) initShop();

let storeHost = SHOPIFY_STORE_URL.replace(/^https?:\/\//, "");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function optionControls(product) {
  if (!product.options?.length) return "";
  return `<div class="product-options">${product.options
    .map((option) => {
      const values = option.values.filter(Boolean);
      if (values.length < 2) return "";
      return `<label>${escapeHtml(option.name)}
        <select data-option="${escapeHtml(option.name)}">
          ${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}
        </select>
      </label>`;
    })
    .filter(Boolean)
    .join("")}</div>`;
}

function productCard(product) {
  const price = formatMoney(product.amount, product.currency);
  const disabled = !product.variantId || !product.available;
  return `
    <article class="product-card" data-product-id="${escapeHtml(product.id)}" data-variant-id="${escapeHtml(product.variantId || "")}">
      <div class="product-media">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" width="640" height="640">
      </div>
      <div class="product-copy">
        <span class="tag">${product.collection === "ww2hub" ? "WW2Hub" : "Ripple of History"}</span>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(product.blurb)}</p>
        ${optionControls(product)}
        <div class="product-buy">
          <b data-price>${escapeHtml(price)}</b>
          <button class="btn ${disabled ? "btn-ghost" : "btn-gold"}" type="button" data-add="${escapeHtml(product.id)}" ${disabled ? "disabled" : ""}>${disabled ? "Sold out" : "Add to basket"}</button>
        </div>
      </div>
    </article>
  `;
}

function renderCollection(id, products) {
  const mount = document.querySelector(`[data-collection="${id}"]`);
  if (!mount) return;
  if (!products.length) {
    const empty =
      id === "ww2hub"
        ? "No WW2Hub products yet. Tag or collect them as WW2Hub in Shopify and they will land here."
        : "Nothing listed here yet.";
    mount.innerHTML = `<p class="shop-empty">${empty}</p>`;
    return;
  }
  mount.innerHTML = products.map(productCard).join("");
}

function renderStatus(live) {
  const el = document.querySelector("[data-shop-status]");
  if (!el) return;
  if (live) {
    el.innerHTML = `<p>Live from the Shopify shop. New products show up here as you add them. Checkout is on Shopify — card details never sit on this site. <a href="${escapeHtml(SHOPIFY_STORE_URL)}" target="_blank" rel="noreferrer">Open the Shopify store</a>.</p>`;
    el.hidden = false;
    return;
  }
  el.innerHTML = `<p>Could not reach the Shopify catalogue just now. Try again in a moment.</p>`;
  el.hidden = false;
}

function renderCart() {
  const items = readCart();
  const countEl = document.querySelector("[data-cart-count]");
  const list = document.querySelector("[data-cart-list]");
  const totalEl = document.querySelector("[data-cart-total]");
  const pay = document.querySelector("[data-checkout]");
  const note = document.querySelector("[data-cart-note]");
  if (countEl) countEl.textContent = String(cartCount(items));
  if (totalEl) {
    const currency = items[0]?.currency || "GBP";
    totalEl.textContent = formatMoney(cartTotal(items), currency);
  }
  if (list) {
    if (!items.length) {
      list.innerHTML = `<p class="shop-empty">Basket is empty.</p>`;
    } else {
      list.innerHTML = items
        .map(
          (item) => `
        <article class="cart-line">
          <img src="${escapeHtml(item.image)}" alt="" width="72" height="72">
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(formatMoney(item.amount, item.currency))} each</p>
            <div class="cart-qty">
              <button type="button" data-qty="${escapeHtml(item.key)}" data-delta="-1" aria-label="Fewer">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-qty="${escapeHtml(item.key)}" data-delta="1" aria-label="More">+</button>
            </div>
          </div>
        </article>`,
        )
        .join("");
    }
  }
  const canPay = items.some((item) => item.variantId);
  if (pay) {
    pay.disabled = !canPay || !items.length;
    pay.textContent = canPay ? "Checkout with Shopify" : "Checkout with Shopify";
  }
  if (note) note.hidden = canPay;
}

function setCartOpen(open) {
  const drawer = document.querySelector("[data-cart]");
  if (!drawer) return;
  drawer.classList.toggle("is-open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
}

function selectedOptions(card) {
  const opts = {};
  card.querySelectorAll("[data-option]").forEach((select) => {
    opts[select.getAttribute("data-option")] = select.value;
  });
  return opts;
}

function matchVariant(product, opts) {
  const names = (product.options || []).map((option) => option.name).filter((name) => opts[name]);
  return (
    product.variants.find((variant) => names.every((name) => variant.options[name] === opts[name])) ||
    product.variants.find((variant) => variant.available) ||
    product.variants[0]
  );
}

function applyVariant(card, product) {
  const variant = matchVariant(product, selectedOptions(card));
  if (!variant) return;
  card.setAttribute("data-variant-id", variant.id);
  const img = card.querySelector(".product-media img");
  if (img && (variant.image || product.image)) img.src = variant.image || product.image;
  const price = card.querySelector("[data-price]");
  if (price) price.textContent = formatMoney(variant.amount, product.currency);
  const add = card.querySelector("[data-add]");
  if (add) {
    add.disabled = !variant.available;
    add.textContent = variant.available ? "Add to basket" : "Sold out";
    add.classList.toggle("btn-gold", variant.available);
    add.classList.toggle("btn-ghost", !variant.available);
  }
}

function lineFromCard(card, product) {
  const variant = product.variants.find((row) => String(row.id) === card.getAttribute("data-variant-id")) || product.variants[0];
  const extra = variant?.title ? ` · ${variant.title}` : "";
  return {
    ...product,
    variantId: variant?.id || product.variantId,
    amount: variant?.amount || product.amount,
    image: variant?.image || product.image,
    title: `${product.title}${extra}`,
    available: Boolean(variant?.available),
  };
}

async function initShop() {
  renderCart();

  let catalog;
  try {
    catalog = await loadCatalog();
    storeHost = catalog.store || storeHost;
  } catch (error) {
    const el = document.querySelector("[data-shop-status]");
    if (el) {
      el.innerHTML = `<p>Could not reach Shopify (${escapeHtml(error.message)}).</p>`;
      el.hidden = false;
    }
    catalog = { live: false, ripple: [], ww2hub: [] };
  }

  const byId = new Map();
  for (const product of [...catalog.ripple, ...catalog.ww2hub]) {
    byId.set(String(product.id), product);
  }

  renderCollection("ripple", catalog.ripple);
  renderCollection("ww2hub", catalog.ww2hub);
  renderStatus(catalog.live);

  root.querySelectorAll(".product-card").forEach((card) => {
    const product = byId.get(card.getAttribute("data-product-id"));
    if (product) applyVariant(card, product);
  });

  const tabs = document.querySelectorAll("[data-shop-tab]");
  const panes = document.querySelectorAll("[data-shop-pane]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.getAttribute("data-shop-tab");
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      panes.forEach((pane) => {
        const show = id === "all" || pane.getAttribute("data-shop-pane") === id;
        pane.hidden = !show;
      });
    });
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-option]");
    if (!select) return;
    const card = select.closest(".product-card");
    const product = byId.get(card?.getAttribute("data-product-id"));
    if (card && product) applyVariant(card, product);
  });

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    if (add && !add.disabled) {
      const card = add.closest(".product-card");
      const product = byId.get(add.getAttribute("data-add"));
      if (card && product) {
        const line = lineFromCard(card, product);
        if (!line.variantId || line.available === false) return;
        addToCart(line);
        renderCart();
        setCartOpen(true);
      }
    }

    const qty = event.target.closest("[data-qty]");
    if (qty) {
      const key = qty.getAttribute("data-qty");
      const delta = Number(qty.getAttribute("data-delta")) || 0;
      const item = readCart().find((row) => row.key === key);
      if (item) {
        setCartQty(key, item.quantity + delta);
        renderCart();
      }
    }

    if (event.target.closest("[data-cart-open]")) setCartOpen(true);
    if (event.target.closest("[data-cart-close]") || event.target.closest("[data-cart-backdrop]")) {
      setCartOpen(false);
    }

    const pay = event.target.closest("[data-checkout]");
    if (pay && !pay.disabled) {
      try {
        window.location.href = checkoutUrl(readCart(), storeHost);
      } catch (error) {
        const note = document.querySelector("[data-cart-note]");
        if (note) {
          note.hidden = false;
          note.textContent = error.message;
        }
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setCartOpen(false);
  });
}
