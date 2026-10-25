import { getSql } from "./leaderboard-core.js";
import { getSave, putSave } from "./tether-core.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function readBody(req) {
  if (req.body == null || req.body === "") return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function queryDevice(req) {
  const q = req.query && typeof req.query === "object" ? req.query : {};
  if (q.device_id) return q.device_id;
  try {
    const url = new URL(req.url || "", "https://www.rippleofhistory.com");
    return url.searchParams.get("device_id") || "";
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const sql = getSql();
  if (!sql) {
    res.setHeader("Cache-Control", "no-store");
    res.status(503).json({ error: "tether offline", save: null });
    return;
  }

  try {
    if (req.method === "GET") {
      const result = await getSave(sql, queryDevice(req));
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      if (result.error) {
        res.status(400).json({ error: result.error, save: null });
        return;
      }
      res.status(200).json(result);
      return;
    }
    if (req.method === "POST") {
      const result = await putSave(sql, readBody(req));
      res.setHeader("Cache-Control", "no-store");
      if (result.error) {
        res.status(400).json({ error: result.error, save: null });
        return;
      }
      res.status(200).json(result);
      return;
    }
    res.status(405).json({ error: "method", save: null });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: String(error.message || error), save: null });
  }
}
