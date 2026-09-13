import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchShopifyCatalog } from "./shopify-catalog.js";

const CACHE_MS = 60 * 1000;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=30");
  res.end(JSON.stringify(body));
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

  return {
    name: "shopify-catalog",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/api/shop-products.json") return next();
        try {
          json(res, 200, await load());
        } catch (error) {
          console.warn("[shopify]", error.message);
          json(res, 502, { live: false, ripple: [], ww2hub: [], error: error.message });
        }
      });
    },
    async closeBundle() {
      try {
        const catalog = await load();
        const dir = join(process.cwd(), "dist", "api");
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, "shop-products.json"), `${JSON.stringify(catalog, null, 2)}\n`);
      } catch (error) {
        console.warn("[shopify] build skip:", error.message);
      }
    },
  };
}
