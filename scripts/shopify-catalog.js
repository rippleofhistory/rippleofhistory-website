export const SHOPIFY_STORE = (
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.VITE_SHOPIFY_STORE_DOMAIN ||
  "usmhdz-1h.myshopify.com"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const RIPPLE_HANDLES = new Set(["ripple-of-history", "ripple", "ripple-of-history-merch"]);
const WW2HUB_HANDLES = new Set(["ww2hub", "ww2-hub", "ww2hub-merch"]);

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function blurbFrom(product) {
  const text = detailsFrom(product);
  if (!text) return `${product.title} — Ripple of History shop.`;
  return text.length > 180 ? `${text.slice(0, 177).trim()}…` : text;
}

function detailsFrom(product) {
  return stripHtml(product.body_html).split(/Size guide|Age restrictions|In compliance|EU Warranty/i)[0].trim();
}

function sanitizeHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, tag) => {
      const name = String(tag).toLowerCase();
      const allowed = ["table", "thead", "tbody", "tr", "th", "td", "p", "br", "strong", "b", "em", "ul", "ol", "li"];
      if (!allowed.includes(name)) return "";
      if (name === "br") return "<br>";
      return full.startsWith("</") ? `</${name}>` : `<${name}>`;
    });
}

function sizeGuideFrom(html) {
  const raw = String(html || "");
  const match = raw.search(/size[\s-]?guide/i);
  if (match < 0) return "";
  return sanitizeHtml(raw.slice(match));
}

function guessCollection(product) {
  const blob = [product.handle, product.title, product.product_type, product.vendor, ...(product.tags || [])]
    .join(" ")
    .toLowerCase();
  if (/\bww2[\s-]?hub\b/.test(blob) || blob.includes("ww2hub")) return "ww2hub";
  return "ripple";
}

function mapProduct(product, collection) {
  const options = (product.options || [])
    .filter((option) => option.name !== "Title" || (option.values || []).some((value) => value && value !== "Default Title"))
    .map((option) => ({
      name: option.name,
      values: option.values || (option.value ? [option.value] : []),
    }));

  const variants = (product.variants || []).map((variant) => {
    const chosen = {};
    (product.options || []).forEach((option, index) => {
      const key = `option${index + 1}`;
      if (variant[key] && variant[key] !== "Default Title") chosen[option.name] = variant[key];
    });
    return {
      id: String(variant.id),
      title: variant.title === "Default Title" ? "" : variant.title,
      available: Boolean(variant.available),
      amount: String(variant.price),
      options: chosen,
      image: variant.featured_image?.src || "",
    };
  });

  const first = variants.find((variant) => variant.available) || variants[0];
  const images = [];
  const seen = new Set();
  for (const img of product.images || []) {
    if (!img?.src || seen.has(img.src)) continue;
    seen.add(img.src);
    images.push({
      src: img.src,
      alt: img.alt || product.title,
      variantIds: (img.variant_ids || []).map(String),
    });
  }
  const image = first?.image || images[0]?.src || "/images/wordmark.png";

  return {
    id: String(product.id),
    handle: product.handle,
    title: product.title,
    blurb: blurbFrom(product),
    details: detailsFrom(product),
    sizeGuide: sizeGuideFrom(product.body_html),
    image,
    images,
    amount: first?.amount || "0",
    currency: "GBP",
    variantId: first?.id || null,
    available: Boolean(first?.available),
    collection,
    placeholder: false,
    url: `https://${SHOPIFY_STORE}/products/${product.handle}`,
    options,
    variants,
  };
}

async function getJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.json();
}

async function allProducts() {
  const products = [];
  for (let page = 1; page <= 10; page += 1) {
    const data = await getJson(`https://${SHOPIFY_STORE}/products.json?limit=250&page=${page}`);
    const batch = data.products || [];
    products.push(...batch);
    if (batch.length < 250) break;
  }
  return products;
}

async function collectionProducts(handle) {
  try {
    const products = [];
    for (let page = 1; page <= 10; page += 1) {
      const data = await getJson(
        `https://${SHOPIFY_STORE}/collections/${encodeURIComponent(handle)}/products.json?limit=250&page=${page}`,
      );
      const batch = data.products || [];
      products.push(...batch);
      if (batch.length < 250) break;
    }
    return products;
  } catch {
    return [];
  }
}

export async function fetchShopifyCatalog() {
  const products = await allProducts();
  const assigned = new Map();

  let collections = [];
  try {
    const data = await getJson(`https://${SHOPIFY_STORE}/collections.json`);
    collections = data.collections || [];
  } catch {
    collections = [];
  }

  for (const collection of collections) {
    const handle = String(collection.handle || "").toLowerCase();
    let brand = null;
    if (RIPPLE_HANDLES.has(handle)) brand = "ripple";
    if (WW2HUB_HANDLES.has(handle)) brand = "ww2hub";
    if (!brand) continue;
    const items = await collectionProducts(collection.handle);
    for (const product of items) assigned.set(String(product.id), brand);
  }

  const ripple = [];
  const ww2hub = [];
  for (const product of products) {
    const collection = assigned.get(String(product.id)) || guessCollection(product);
    const mapped = mapProduct(product, collection);
    if (collection === "ww2hub") ww2hub.push(mapped);
    else ripple.push(mapped);
  }

  return {
    live: ripple.length + ww2hub.length > 0,
    store: SHOPIFY_STORE,
    fetchedAt: new Date().toISOString(),
    ripple,
    ww2hub,
  };
}
