/**
 * Shopify Storefront API wiring.
 *
 * Leave the Vite env vars empty until the Shopify shop exists.
 * After you create the store:
 *   1. Shopify admin → Settings → Apps and sales channels → Develop apps
 *   2. Create an app, enable Storefront API (unauthenticated_read_product_listings,
 *      unauthenticated_read_product_inventory, unauthenticated_write_checkouts /
 *      unauthenticated_write_carts)
 *   3. Create collections with handles `ripple-of-history` and `ww2hub`
 *   4. Put the shop domain and token in `.env` (see `.env.example`) and rebuild
 */

export const SHOPIFY_DOMAIN = (import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || "").trim();
export const SHOPIFY_TOKEN = (import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || "").trim();
export const SHOPIFY_STORE_URL = (import.meta.env.VITE_SHOPIFY_STORE_URL || "").trim();
export const SHOPIFY_API = "2025-01";

export const isShopifyLive = Boolean(SHOPIFY_DOMAIN && SHOPIFY_TOKEN);

const CART_KEY = "roh-shop-cart";

export const COLLECTIONS = [
  {
    id: "ripple",
    handle: "ripple-of-history",
    title: "Ripple of History",
    blurb: "The channel on a shirt, a mug, a print. Gold on navy, as it should be.",
  },
  {
    id: "ww2hub",
    handle: "ww2hub",
    title: "WW2Hub",
    blurb: "The archive, worn. Maps, the Few, and a hub badge that does not apologise.",
  },
];

/** Shown until the Storefront API is connected. Not for sale. */
export const PLACEHOLDER_CATALOG = {
  ripple: [
    {
      id: "ph-roh-tee",
      handle: "wordmark-tee",
      title: "Wordmark tee",
      blurb: "The gold Ripple of History mark on navy. Soft cotton, no algorithm.",
      image: "/images/logo.jpg",
      amount: "24.00",
      currency: "GBP",
      collection: "ripple",
      placeholder: true,
    },
    {
      id: "ph-roh-mug",
      handle: "on-this-day-mug",
      title: "On This Day mug",
      blurb: "For the morning brief. Holds coffee, tea, and a date you should already know.",
      image: "/images/on-this-day.jpg",
      amount: "14.00",
      currency: "GBP",
      collection: "ripple",
      placeholder: true,
    },
    {
      id: "ph-roh-print",
      handle: "channel-print",
      title: "Channel coast print",
      blurb: "Martello light and a bit of weather. A print for the wall, not the algorithm.",
      image: "/images/still-dover.jpg",
      amount: "18.00",
      currency: "GBP",
      collection: "ripple",
      placeholder: true,
    },
    {
      id: "ph-roh-notebook",
      handle: "chronicle-notebook",
      title: "Chronicle notebook",
      blurb: "A place to write the date before the short goes up.",
      image: "/images/still-quill.jpg",
      amount: "12.00",
      currency: "GBP",
      collection: "ripple",
      placeholder: true,
    },
  ],
  ww2hub: [
    {
      id: "ph-hub-tee",
      handle: "ww2hub-tee",
      title: "WW2Hub tee",
      blurb: "The hub on cotton. For people who argue about tanks in the comments.",
      image: "/images/era-ww2.jpg",
      amount: "24.00",
      currency: "GBP",
      collection: "ww2hub",
      placeholder: true,
    },
    {
      id: "ph-hub-print",
      handle: "the-few-print",
      title: "The Few print",
      blurb: "A wall for the summer that decided whether this island stayed an island.",
      image: "/images/still-victory.jpg",
      amount: "18.00",
      currency: "GBP",
      collection: "ww2hub",
      placeholder: true,
    },
    {
      id: "ph-hub-map",
      handle: "theatre-map",
      title: "Theatre map",
      blurb: "A map you can actually read. Folded once, never surrendered.",
      image: "/images/still-compass.jpg",
      amount: "16.00",
      currency: "GBP",
      collection: "ww2hub",
      placeholder: true,
    },
    {
      id: "ph-hub-pin",
      handle: "hub-pin",
      title: "Hub pin",
      blurb: "Small, brass-looking, and not remotely subtle on a coat.",
      image: "/images/still-crown.jpg",
      amount: "8.00",
      currency: "GBP",
      collection: "ww2hub",
      placeholder: true,
    },
  ],
};

const PRODUCT_FIELDS = `
  id
  handle
  title
  description
  tags
  featuredImage { url altText }
  priceRange { minVariantPrice { amount currencyCode } }
  variants(first: 8) {
    nodes { id title availableForSale }
  }
`;

async function storefront(query, variables = {}) {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`Shopify ${response.status}`);
  }
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

function mapProduct(node, collection) {
  const variant = node.variants?.nodes?.find((v) => v.availableForSale) || node.variants?.nodes?.[0];
  const price = node.priceRange?.minVariantPrice || {};
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    blurb: (node.description || "").replace(/\s+/g, " ").trim().slice(0, 180),
    image: node.featuredImage?.url || "/images/wordmark.png",
    amount: price.amount || "0",
    currency: price.currencyCode || "GBP",
    variantId: variant?.id || null,
    available: Boolean(variant?.availableForSale),
    collection,
    placeholder: false,
  };
}

export async function loadCatalog() {
  if (!isShopifyLive) {
    return {
      live: false,
      ripple: PLACEHOLDER_CATALOG.ripple,
      ww2hub: PLACEHOLDER_CATALOG.ww2hub,
    };
  }

  const data = await storefront(`
    query ShopCollections {
      ripple: collection(handle: "ripple-of-history") {
        products(first: 24) { nodes { ${PRODUCT_FIELDS} } }
      }
      ww2hub: collection(handle: "ww2hub") {
        products(first: 24) { nodes { ${PRODUCT_FIELDS} } }
      }
    }
  `);

  let ripple = (data.ripple?.products?.nodes || []).map((n) => mapProduct(n, "ripple"));
  let ww2hub = (data.ww2hub?.products?.nodes || []).map((n) => mapProduct(n, "ww2hub"));

  if (!ripple.length && !ww2hub.length) {
    const all = await storefront(`
      query AllProducts {
        products(first: 50) { nodes { ${PRODUCT_FIELDS} } }
      }
    `);
    const nodes = all.products?.nodes || [];
    for (const node of nodes) {
      const tags = (node.tags || []).map((t) => String(t).toLowerCase());
      const handle = String(node.handle || "").toLowerCase();
      if (tags.includes("ww2hub") || handle.includes("ww2hub") || handle.includes("hub")) {
        ww2hub.push(mapProduct(node, "ww2hub"));
      } else {
        ripple.push(mapProduct(node, "ripple"));
      }
    }
  }

  return { live: true, ripple, ww2hub };
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
  const key = product.variantId || product.id;
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
      currency: product.currency,
      collection: product.collection,
      placeholder: Boolean(product.placeholder),
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

export async function checkout(items = readCart()) {
  if (!isShopifyLive) {
    throw new Error("Shopify checkout is not live yet.");
  }
  const lines = items
    .filter((item) => item.variantId)
    .map((item) => ({ merchandiseId: item.variantId, quantity: item.quantity }));
  if (!lines.length) {
    throw new Error("Nothing in this basket can go to Shopify yet.");
  }
  const data = await storefront(
    `
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { checkoutUrl }
        userErrors { field message }
      }
    }
  `,
    { input: { lines } },
  );
  const errors = data.cartCreate?.userErrors || [];
  if (errors.length) throw new Error(errors.map((e) => e.message).join("; "));
  const url = data.cartCreate?.cart?.checkoutUrl;
  if (!url) throw new Error("Shopify did not return a checkout URL.");
  return url;
}
