import { getSql, listScores, saveScore } from "../api/leaderboard-core.js";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function isBoard(url) {
  const path = url?.split("?")[0];
  return path === "/api/leaderboard" || path === "/api/leaderboard.json";
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
      if (!isBoard(req.url)) return next();
      if (req.method === "OPTIONS") {
        json(res, 204, {});
        return;
      }
      const sql = getSql();
      if (!sql) {
        json(res, 503, { error: "board offline", rows: [] });
        return;
      }
      try {
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
      } catch (error) {
        json(res, 502, { error: String(error.message || error), rows: [] });
      }
    });
  }

  return {
    name: "rip-leaderboard",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
