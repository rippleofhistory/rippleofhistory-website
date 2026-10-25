import { getSql, listScores, saveScore } from "../api/leaderboard-core.js";
import { getSave, putSave } from "../api/tether-core.js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function pathOf(url) {
  return url?.split("?")[0] || "";
}

function isBoard(url) {
  const path = pathOf(url);
  return path === "/api/leaderboard" || path === "/api/leaderboard.json";
}

function isTether(url) {
  const path = pathOf(url);
  return path === "/api/tether" || path === "/api/tether.json";
}

function queryParam(url, key) {
  try {
    return new URL(url || "", "http://localhost").searchParams.get(key) || "";
  } catch {
    return "";
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (err) { reject(err); }
    });
    req.on("error", reject);
  });
}

export function leaderboardPlugin() {
  function attach(server) {
    server.middlewares.use(async (req, res, next) => {
      const board = isBoard(req.url);
      const tether = isTether(req.url);
      if (!board && !tether) return next();
      if (req.method === "OPTIONS") {
        json(res, 204, {});
        return;
      }
      const sql = getSql();
      if (!sql) {
        json(res, 503, board ? { error: "board offline", rows: [] } : { error: "tether offline", save: null });
        return;
      }
      try {
        if (board) {
          if (req.method === "GET") {
            json(res, 200, { rows: await listScores(sql) });
            return;
          }
          if (req.method === "POST") {
            const result = await saveScore(sql, await readBody(req));
            json(res, result.error ? 400 : 200, result.error ? { error: result.error, rows: [] } : result);
            return;
          }
          json(res, 405, { error: "method", rows: [] });
          return;
        }
        if (req.method === "GET") {
          const result = await getSave(sql, queryParam(req.url, "device_id"));
          json(res, result.error ? 400 : 200, result.error ? { error: result.error, save: null } : result);
          return;
        }
        if (req.method === "POST") {
          const result = await putSave(sql, await readBody(req));
          json(res, result.error ? 400 : 200, result.error ? { error: result.error, save: null } : result);
          return;
        }
        json(res, 405, { error: "method", save: null });
      } catch (error) {
        json(res, 502, board ? { error: String(error.message || error), rows: [] } : { error: String(error.message || error), save: null });
      }
    });
  }

  return {
    name: "rip-leaderboard",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
