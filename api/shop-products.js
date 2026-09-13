import { fetchShopifyCatalog } from "../scripts/shopify-catalog.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=600");
  try {
    const catalog = await fetchShopifyCatalog();
    res.status(200).json(catalog);
  } catch (error) {
    res.status(502).json({ live: false, error: String(error.message || error), ripple: [], ww2hub: [] });
  }
}
