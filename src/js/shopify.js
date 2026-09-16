export const SHOPIFY_DOMAIN = (
  import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || "usmhdz-1h.myshopify.com"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

export const SHOPIFY_STORE_URL = `https://${SHOPIFY_DOMAIN}`;

const CART_KEY = "roh-shop-cart-v2";

export const PLACEHOLDER_CATALOG = {
  ripple: [],
  ww2hub: [],
};

function normalizeCatalog(data) {
  return {
    live: Boolean(data.live),
    store: data.store || SHOPIFY_DOMAIN,
    ripple: Array.isArray(data.ripple) ? data.ripple : [],
    ww2hub: Array.isArray(data.ww2hub) ? data.ww2hub : [],
  };
}

export async function loadCatalog() {
  const urls = ["/api/shop-products", "/api/shop-products.json"];
  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        lastError = new Error(`Shop feed ${response.status}`);
        continue;
      }
      return normalizeCatalog(await response.json());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Shop feed unavailable");
}

export function formatMoney(amount, currency = "GBP") {
  const value = Number(amount);
  if (Number.isNaN(value)) return "";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);
}

export function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  return items;
}

export function addToCart(product) {
  const items = readCart();
  const key = String(product.variantId || product.id);
  const existing = items.find((item) => item.key === key);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({
      key,
      id: product.id,
      variantId: product.variantId || null,
      title: product.title,
      image: product.image,
      amount: product.amount,
      currency: product.currency || "GBP",
      collection: product.collection,
      placeholder: false,
      quantity: 1,
    });
  }
  return writeCart(items);
}

export function setCartQty(key, quantity) {
  const next = readCart()
    .map((item) => (item.key === key ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);
  return writeCart(next);
}

export function cartCount(items = readCart()) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(items = readCart()) {
  return items.reduce((sum, item) => sum + Number(item.amount) * item.quantity, 0);
}

export function checkoutUrl(items = readCart(), store = SHOPIFY_DOMAIN) {
  const lines = items.filter((item) => item.variantId);
  if (!lines.length) throw new Error("Nothing in this basket can go to Shopify yet.");
  const path = lines.map((item) => `${item.variantId}:${item.quantity}`).join(",");
  return `https://${store}/cart/${path}`;
}
