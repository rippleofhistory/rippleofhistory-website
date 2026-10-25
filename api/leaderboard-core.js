import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

export const MAX_SCORE = 200000;
export const MAX_POSTS_PER_HOUR = 5;
export const MAX_SCORE_PER_SEC = 220;
export const DIFFICULTIES = ["easy", "medium", "hard", "insane"];
export const MAX_BY_ERA = {
  1: 25000,
  2: 50000,
  3: 80000,
  4: 110000,
  5: 150000,
  6: 200000,
};

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

let schemaReady = false;

export async function ensureSchema(sql) {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS player_runs (
      id bigserial PRIMARY KEY,
      player_name text NOT NULL,
      score integer NOT NULL,
      era_reached smallint NOT NULL,
      difficulty text NOT NULL DEFAULT 'medium',
      duration_ms integer,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT player_runs_name_len CHECK (char_length(player_name) BETWEEN 1 AND 16),
      CONSTRAINT player_runs_score_range CHECK (score >= 1 AND score <= 200000),
      CONSTRAINT player_runs_era_range CHECK (era_reached BETWEEN 1 AND 6),
      CONSTRAINT player_runs_diff CHECK (difficulty IN ('easy', 'medium', 'hard', 'insane'))
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS player_runs_score_idx ON player_runs (score DESC, created_at ASC)`;
  await sql`CREATE INDEX IF NOT EXISTS player_runs_name_created_idx ON player_runs (player_name, created_at DESC)`;
  await sql`
    CREATE TABLE IF NOT EXISTS tether_saves (
      device_id uuid PRIMARY KEY,
      unlocked smallint NOT NULL DEFAULT 1,
      lives smallint NOT NULL DEFAULT 3,
      max_lives smallint NOT NULL DEFAULT 5,
      insane_unlocked boolean NOT NULL DEFAULT false,
      difficulty text NOT NULL DEFAULT 'medium',
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT tether_unlocked CHECK (unlocked BETWEEN 1 AND 6),
      CONSTRAINT tether_lives CHECK (lives BETWEEN 0 AND 5),
      CONSTRAINT tether_max_lives CHECK (max_lives BETWEEN 1 AND 5),
      CONSTRAINT tether_diff CHECK (difficulty IN ('easy', 'medium', 'hard', 'insane'))
    )
  `;
  schemaReady = true;
}

export function cleanEntry(body) {
  const raw = body && typeof body === "object" ? body : {};
  const name = String(raw.name || raw.player_name || "KAEL").replace(/[^\w \-']/g, "").trim().slice(0, 16).toUpperCase() || "KAEL";
  const score = Math.floor(Number(raw.score));
  const era = Math.max(1, Math.min(6, Math.floor(Number(raw.era_reached != null ? raw.era_reached : raw.era) || 1)));
  const difficulty = DIFFICULTIES.includes(String(raw.difficulty || "").toLowerCase())
    ? String(raw.difficulty).toLowerCase()
    : "medium";

  if (!Number.isFinite(score) || score < 1 || score > MAX_SCORE) {
    return { error: "invalid score" };
  }
  const eraCap = MAX_BY_ERA[era] || MAX_SCORE;
  if (score > eraCap) {
    return { error: "score exceeds era cap" };
  }

  let duration_ms = null;
  if (raw.duration_ms != null && raw.duration_ms !== "") {
    const ms = Math.floor(Number(raw.duration_ms));
    if (!Number.isFinite(ms) || ms < 0 || ms > 1000 * 60 * 60 * 8) {
      return { error: "invalid duration" };
    }
    duration_ms = ms;
    const minMs = Math.floor((score / MAX_SCORE_PER_SEC) * 1000);
    if (duration_ms < minMs) {
      return { error: "implausible pace" };
    }
  }

  return { name, score, era, difficulty, duration_ms };
}

function mapRow(row) {
  return {
    name: row.player_name || row.name,
    score: Number(row.score) || 0,
    era: Number(row.era_reached != null ? row.era_reached : row.era) || 1,
    difficulty: DIFFICULTIES.includes(row.difficulty) ? row.difficulty : "medium",
    at: Number(row.at) || 0,
  };
}

export async function listScores(sql) {
  await ensureSchema(sql);
  const rows = await sql`
    SELECT player_name, score, era_reached, difficulty,
      (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS at
    FROM player_runs
    ORDER BY score DESC, created_at ASC
    LIMIT 10
  `;
  return rows.map(mapRow);
}

export async function saveScore(sql, body) {
  await ensureSchema(sql);
  const entry = cleanEntry(body);
  if (entry.error) return entry;

  const hourCount = await sql`
    SELECT COUNT(*)::int AS n FROM player_runs
    WHERE player_name = ${entry.name}
      AND created_at > now() - interval '1 hour'
  `;
  if ((hourCount[0]?.n || 0) >= MAX_POSTS_PER_HOUR) {
    return { error: "too many posts" };
  }

  const dup = await sql`
    SELECT id FROM player_runs
    WHERE player_name = ${entry.name} AND score = ${entry.score}
      AND created_at > now() - interval '20 seconds'
    LIMIT 1
  `;
  if (!dup.length) {
    await sql`
      INSERT INTO player_runs (player_name, score, era_reached, difficulty, duration_ms)
      VALUES (${entry.name}, ${entry.score}, ${entry.era}, ${entry.difficulty}, ${entry.duration_ms})
    `;
    await sql`
      DELETE FROM player_runs
      WHERE id IN (
        SELECT id FROM player_runs
        ORDER BY score DESC, created_at ASC
        OFFSET 200
      )
    `;
  }
  return { saved: true, rows: await listScores(sql) };
}
