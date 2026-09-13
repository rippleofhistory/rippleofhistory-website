import {
  PLACEHOLDER_CATALOG,
  isShopifyLive,
  SHOPIFY_STORE_URL,
  loadCatalog,
  formatMoney,
  readCart,
  addToCart,
  setCartQty,
  cartCount,
  cartTotal,
  checkout,
} from "./shopify.js";

const root = document.querySelector("[data-shop]");
if (root) initShop();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function productCard(product) {
  const price = formatMoney(product.amount, product.currency);
  const disabled = product.placeholder || !product.variantId;
  const label = disabled ? "Not for sale yet" : "Add to basket";
  return `
    <article class="product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="product-media">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" width="640" height="640">
      </div>
      <div class="product-copy">
        <span class="tag">${product.collection === "ww2hub" ? "WW2Hub" : "Ripple of History"}</span>
        <h3>${escapeHtml(product.title)}</h3>
        <p>${escapeHtml(product.blurb)}</p>
        <div class="product-buy">
          <b>${escapeHtml(price)}</b>
          <button class="btn ${disabled ? "btn-ghost" : "btn-gold"}" type="button" data-add="${escapeHtml(product.id)}" ${disabled ? "disabled" : ""}>${label}</button>
        </div>
      </div>
    </article>
  `;
}

function renderCollection(id, products) {
  const mount = document.querySelector(`[data-collection="${id}"]`);
  if (!mount) return;
  if (!products.length) {
    mount.innerHTML = `<p class="shop-empty">Nothing listed here yet. The collection fills when the Shopify shop is connected.</p>`;
    return;
  }
  mount.innerHTML = products.map(productCard).join("");
}

function renderStatus(live) {
  const el = document.querySelector("[data-shop-status]");
  if (!el) return;
  if (live) {
    el.innerHTML = `<p>Checkout runs through Shopify. Card details never sit on this site.</p>`;
    el.hidden = false;
    return;
  }
  const extra = SHOPIFY_STORE_URL
    ? ` <a href="${escapeHtml(SHOPIFY_STORE_URL)}" target="_blank" rel="noreferrer">Open the Shopify shop</a>.`
    : "";
  el.innerHTML = `<p>The till is not open yet. These are the first lines — Ripple of History and WW2Hub — waiting on a Shopify account. Nothing here takes a card until that shop is live.${extra}</p>`;
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
            <p>${escapeHtml(formatMoney(item.amount, item.currency))} · ${item.placeholder ? "preview" : "each"}</p>
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
  const canPay = isShopifyLive && items.some((item) => item.variantId);
  if (pay) {
    pay.disabled = !canPay || !items.length;
    pay.textContent = canPay ? "Checkout with Shopify" : "Checkout not live yet";
  }
  if (note) {
    note.hidden = canPay;
  }
}

function setCartOpen(open) {
  const drawer = document.querySelector("[data-cart]");
  if (!drawer) return;
  drawer.classList.toggle("is-open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
}

async function initShop() {
  renderStatus(isShopifyLive);
  renderCart();

  let catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    const el = document.querySelector("[data-shop-status]");
    if (el) {
      el.innerHTML = `<p>Could not reach Shopify (${escapeHtml(error.message)}). Showing the preview catalogue instead.</p>`;
      el.hidden = false;
    }
    catalog = {
      live: false,
      ripple: PLACEHOLDER_CATALOG.ripple,
      ww2hub: PLACEHOLDER_CATALOG.ww2hub,
    };
  }

  const byId = new Map();
  for (const product of [...catalog.ripple, ...catalog.ww2hub]) {
    byId.set(product.id, product);
  }

  renderCollection("ripple", catalog.ripple);
  renderCollection("ww2hub", catalog.ww2hub);
  renderStatus(catalog.live);

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

  document.addEventListener("click", async (event) => {
    const add = event.target.closest("[data-add]");
    if (add && !add.disabled) {
      const product = byId.get(add.getAttribute("data-add"));
      if (product) {
        addToCart(product);
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
      pay.disabled = true;
      pay.textContent = "Opening Shopify…";
      try {
        const url = await checkout();
        window.location.href = url;
      } catch (error) {
        pay.disabled = false;
        pay.textContent = "Checkout not live yet";
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
