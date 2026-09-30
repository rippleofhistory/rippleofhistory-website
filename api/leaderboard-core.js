import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

export const MAX_SCORE = 200000;

function loadLocalEnv() {
  if (process.env.DATABASE_URL) return;
  try {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const text = fs.readFileSync(path.join(root, ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] == null) process.env[key] = val;
    }
  } catch (err) { /* no local env file */ }
}

loadLocalEnv();

export function getSql() {
  const url = String(process.env.DATABASE_URL || "").trim();
  if (!url || url === "undefined" || url === "null") return null;
  return neon(url);
}

export function cleanEntry(body) {
  const raw = body && typeof body === "object" ? body : {};
  const name = String(raw.name || "KAEL").replace(/[^\w \-']/g, "").trim().slice(0, 16).toUpperCase() || "KAEL";
  const score = Math.floor(Number(raw.score));
  const era = Math.max(1, Math.min(6, Math.floor(Number(raw.era) || 1)));
  if (!Number.isFinite(score) || score < 1 || score > MAX_SCORE) {
    return { error: "invalid score" };
  }
  return { name, score, era };
}

export async function listScores(sql) {
  const rows = await sql`
    SELECT name, score, era,
      (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS at
    FROM rip_scores
    ORDER BY score DESC, created_at ASC
    LIMIT 10
  `;
  return rows.map((row) => ({
    name: row.name,
    score: Number(row.score) || 0,
    era: Number(row.era) || 1,
    at: Number(row.at) || 0,
  }));
}

export async function saveScore(sql, body) {
  const entry = cleanEntry(body);
  if (entry.error) return entry;
  const dup = await sql`
    SELECT id FROM rip_scores
    WHERE name = ${entry.name} AND score = ${entry.score}
      AND created_at > now() - interval '20 seconds'
    LIMIT 1
  `;
  if (!dup.length) {
    await sql`
      INSERT INTO rip_scores (name, score, era)
      VALUES (${entry.name}, ${entry.score}, ${entry.era})
    `;
    await sql`
      DELETE FROM rip_scores
      WHERE id IN (
        SELECT id FROM rip_scores
        ORDER BY score DESC, created_at ASC
        OFFSET 200
      )
    `;
  }
  return { saved: true, rows: await listScores(sql) };
}
