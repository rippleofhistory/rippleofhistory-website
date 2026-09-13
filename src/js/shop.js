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
let gallery = [];
let galleryIndex = 0;

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
  const views = (product.images || []).length;
  return `
    <article class="product-card" data-product-id="${escapeHtml(product.id)}" data-variant-id="${escapeHtml(product.variantId || "")}">
      <button class="product-media" type="button" data-open-product="${escapeHtml(product.id)}" aria-label="View ${escapeHtml(product.title)}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" width="640" height="640">
        <span class="product-peek">${views > 1 ? `${views} views` : "Details"}</span>
      </button>
      <div class="product-copy">
        <span class="tag">${product.collection === "ww2hub" ? "WW2Hub" : "Ripple of History"}</span>
        <h3><button type="button" data-open-product="${escapeHtml(product.id)}">${escapeHtml(product.title)}</button></h3>
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
    pay.textContent = "Checkout with Shopify";
  }
  if (note) note.hidden = canPay;
}

function setCartOpen(open) {
  const drawer = document.querySelector("[data-cart]");
  if (!drawer) return;
  drawer.classList.toggle("is-open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  if (open) document.body.style.overflow = "hidden";
  else if (!document.querySelector("[data-product-dialog].is-open")) document.body.style.overflow = "";
}

function selectedOptions(scope) {
  const opts = {};
  scope.querySelectorAll("[data-option]").forEach((select) => {
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

function colorSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function galleryFor(product, variantId) {
  const images = product.images || [];
  const id = String(variantId || "");
  const variant = product.variants.find((row) => String(row.id) === id);
  const colorOption = product.options.find((option) => /colou?r/i.test(option.name));
  const slugs = (colorOption?.values || []).map(colorSlug).filter(Boolean).sort((a, b) => b.length - a.length);
  const wanted = colorSlug(variant?.options?.Color || variant?.options?.Colour);
  let picked = [];
  if (wanted) {
    picked = images.filter((img) => {
      const file = decodeURIComponent(img.src).toLowerCase();
      const matched = slugs.find((slug) => new RegExp(`-${slug}-(front|back|left|right)(?:-|&|\\.|$)`).test(file));
      return matched === wanted;
    });
  }
  if (!picked.length) {
    picked = images.filter((img) => img.variantIds?.includes(id));
  }
  if (!picked.length) picked = images;
  const list = picked.map((img) => img.src);
  const featured = variant?.image;
  const ordered = featured ? [featured, ...list] : list;
  const seen = new Set();
  return ordered.filter((src) => {
    if (!src || seen.has(src)) return false;
    seen.add(src);
    return true;
  });
}

function renderThumbs() {
  const mount = document.querySelector("[data-thumbs]");
  if (!mount) return;
  mount.hidden = gallery.length < 2;
  mount.innerHTML = gallery
    .map(
      (src, index) =>
        `<button type="button" class="product-thumb${index === galleryIndex ? " is-active" : ""}" data-thumb="${index}" aria-label="View ${index + 1}">
          <img src="${escapeHtml(src)}" alt="">
        </button>`,
    )
    .join("");
}

function showGalleryImage() {
  const img = document.querySelector("[data-zoom-image]");
  if (!img || !gallery.length) return;
  img.src = gallery[galleryIndex];
  renderThumbs();
  const prev = document.querySelector("[data-gallery-prev]");
  const next = document.querySelector("[data-gallery-next]");
  const many = gallery.length > 1;
  if (prev) prev.hidden = !many;
  if (next) next.hidden = !many;
}

function stepGallery(delta) {
  if (!gallery.length) return;
  galleryIndex = (galleryIndex + delta + gallery.length) % gallery.length;
  showGalleryImage();
}

function applyVariant(scope, product, refreshGallery = false) {
  const variant = matchVariant(product, selectedOptions(scope));
  if (!variant) return;
  scope.setAttribute("data-variant-id", variant.id);
  const img = scope.querySelector(".product-media img");
  if (img && (variant.image || product.image)) img.src = variant.image || product.image;
  const price = scope.querySelector("[data-price]");
  if (price) price.textContent = formatMoney(variant.amount, product.currency);
  const add = scope.querySelector("[data-add]");
  if (add) {
    add.disabled = !variant.available;
    add.textContent = variant.available ? "Add to basket" : "Sold out";
    add.classList.toggle("btn-gold", variant.available);
    add.classList.toggle("btn-ghost", !variant.available);
  }
  if (refreshGallery) {
    gallery = galleryFor(product, variant.id);
    galleryIndex = 0;
    showGalleryImage();
  }
}

function lineFromScope(scope, product) {
  const variant =
    product.variants.find((row) => String(row.id) === scope.getAttribute("data-variant-id")) || product.variants[0];
  const extra = variant?.title ? ` · ${variant.title}` : "";
  return {
    ...product,
    variantId: variant?.id || product.variantId,
    amount: variant?.amount || product.amount,
    image: variant?.image || gallery[galleryIndex] || product.image,
    title: `${product.title}${extra}`,
    available: Boolean(variant?.available),
  };
}

function setProductOpen(open) {
  const dialog = document.querySelector("[data-product-dialog]");
  if (!dialog) return;
  dialog.classList.toggle("is-open", open);
  dialog.setAttribute("aria-hidden", String(!open));
  if (open) document.body.style.overflow = "hidden";
  else if (!document.querySelector("[data-cart].is-open")) document.body.style.overflow = "";
}

function setZoomLite(open, src = "", alt = "") {
  const lite = document.querySelector("[data-zoom-lite]");
  const img = document.querySelector("[data-zoom-lite-image]");
  if (!lite) return;
  if (img && src) {
    img.src = src;
    img.alt = alt;
  }
  lite.classList.toggle("is-open", open);
  lite.setAttribute("aria-hidden", String(!open));
}

function openProduct(product, byId) {
  const dialog = document.querySelector("[data-product-dialog]");
  const sheet = document.querySelector("[data-product-sheet]");
  const zoomImg = document.querySelector("[data-zoom-image]");
  if (!dialog || !sheet) return;
  dialog.setAttribute("data-product-id", product.id);
  if (zoomImg) zoomImg.alt = product.title;
  sheet.innerHTML = `
    <span class="tag">${product.collection === "ww2hub" ? "WW2Hub" : "Ripple of History"}</span>
    <h2>${escapeHtml(product.title)}</h2>
    <p class="product-details">${escapeHtml(product.details || product.blurb)}</p>
    ${product.sizeGuide ? `<details class="size-guide"><summary>Size guide</summary><div class="size-guide-body">${product.sizeGuide}</div></details>` : ""}
    ${optionControls(product)}
    <div class="product-buy">
      <b data-price>${escapeHtml(formatMoney(product.amount, product.currency))}</b>
      <button class="btn btn-gold" type="button" data-add="${escapeHtml(product.id)}">Add to basket</button>
    </div>
  `;
  applyVariant(dialog, product, true);
  void byId;
  setProductOpen(true);
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

  const stage = document.querySelector("[data-zoom-stage]");
  const zoomImg = document.querySelector("[data-zoom-image]");
  stage?.addEventListener("mousemove", (event) => {
    if (!zoomImg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    const box = stage.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;
    zoomImg.style.transformOrigin = `${x}% ${y}%`;
    zoomImg.style.transform = "scale(2.2)";
  });
  stage?.addEventListener("mouseleave", () => {
    if (zoomImg) zoomImg.style.transform = "";
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-option]");
    if (!select) return;
    const scope = select.closest("[data-product-dialog]") || select.closest(".product-card");
    const product = byId.get(scope?.getAttribute("data-product-id"));
    if (scope && product) applyVariant(scope, product, Boolean(scope.closest("[data-product-dialog]")));
  });

  document.addEventListener("click", (event) => {
    const openBtn = event.target.closest("[data-open-product]");
    if (openBtn) {
      event.preventDefault();
      const product = byId.get(openBtn.getAttribute("data-open-product"));
      if (product) openProduct(product, byId);
      return;
    }

    const cardClick = event.target.closest(".product-card");
    if (cardClick && !event.target.closest("[data-add], select, label, .product-options")) {
      const product = byId.get(cardClick.getAttribute("data-product-id"));
      if (product) {
        openProduct(product, byId);
        return;
      }
    }

    const thumb = event.target.closest("[data-thumb]");
    if (thumb) {
      galleryIndex = Number(thumb.getAttribute("data-thumb")) || 0;
      showGalleryImage();
      return;
    }

    if (event.target.closest("[data-gallery-prev]")) {
      stepGallery(-1);
      return;
    }
    if (event.target.closest("[data-gallery-next]")) {
      stepGallery(1);
      return;
    }

    if (event.target.closest("[data-zoom-stage]") && !event.target.closest(".gallery-nav")) {
      const src = document.querySelector("[data-zoom-image]")?.src;
      const alt = document.querySelector("[data-zoom-image]")?.alt || "";
      if (src) setZoomLite(true, src, alt);
      return;
    }
    if (event.target.closest("[data-zoom-lite-close]") || event.target.closest("[data-zoom-lite] img") || event.target.matches("[data-zoom-lite]")) {
      setZoomLite(false);
      return;
    }

    const add = event.target.closest("[data-add]");
    if (add && !add.disabled) {
      const scope = add.closest("[data-product-dialog]") || add.closest(".product-card");
      const product = byId.get(add.getAttribute("data-add"));
      if (scope && product) {
        const line = lineFromScope(scope, product);
        if (!line.variantId || line.available === false) return;
        addToCart(line);
        renderCart();
        setCartOpen(true);
      }
      return;
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
      return;
    }

    if (event.target.closest("[data-cart-open]")) setCartOpen(true);
    if (event.target.closest("[data-cart-close]") || event.target.closest("[data-cart-backdrop]")) {
      setCartOpen(false);
    }
    if (event.target.closest("[data-product-close]")) {
      setProductOpen(false);
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
    if (event.key === "Escape") {
      if (document.querySelector("[data-zoom-lite].is-open")) setZoomLite(false);
      else if (document.querySelector("[data-cart].is-open")) setCartOpen(false);
      else setProductOpen(false);
    }
    if (!document.querySelector("[data-product-dialog].is-open")) return;
    if (event.key === "ArrowLeft") stepGallery(-1);
    if (event.key === "ArrowRight") stepGallery(1);
  });
}
