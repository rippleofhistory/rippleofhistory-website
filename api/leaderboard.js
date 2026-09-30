import { getSql, listScores, saveScore } from "./leaderboard-core.js";

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

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const sql = getSql();
  if (!sql) {
    res.setHeader("Cache-Control", "no-store");
    res.status(503).json({ error: "board offline", rows: [] });
    return;
  }

  try {
    if (req.method === "GET") {
      const rows = await listScores(sql);
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.status(200).json({ rows });
      return;
    }
    if (req.method === "POST") {
      const result = await saveScore(sql, readBody(req));
      res.setHeader("Cache-Control", "no-store");
      if (result.error) {
        res.status(400).json({ error: result.error, rows: [] });
        return;
      }
      res.status(200).json(result);
      return;
    }
    res.status(405).json({ error: "method", rows: [] });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: String(error.message || error), rows: [] });
  }
}
