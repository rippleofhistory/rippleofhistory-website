import { fetchShopifyCatalog } from "./shopify-catalog.js";

const CACHE_MS = 30 * 1000;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function isShopFeed(url) {
  const path = url?.split("?")[0];
  return path === "/api/shop-products" || path === "/api/shop-products.json";
}

export function shopPlugin() {
  let cache = { at: 0, catalog: null };

  async function load() {
    const now = Date.now();
    if (cache.catalog && now - cache.at < CACHE_MS) return cache.catalog;
    const catalog = await fetchShopifyCatalog();
    cache = { at: now, catalog };
    return catalog;
  }

  function attach(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!isShopFeed(req.url)) return next();
      try {
        json(res, 200, await load());
      } catch (error) {
        console.warn("[shopify]", error.message);
        json(res, 502, { live: false, ripple: [], ww2hub: [], error: error.message });
      }
    });
  }

  return {
    name: "shopify-catalog",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
