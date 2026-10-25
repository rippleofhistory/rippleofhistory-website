import { DIFFICULTIES, ensureSchema } from "./leaderboard-core.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function cleanDeviceId(raw) {
  const id = String(raw || "").trim().toLowerCase();
  return UUID_RE.test(id) ? id : null;
}

export function cleanSave(body) {
  const raw = body && typeof body === "object" ? body : {};
  const device_id = cleanDeviceId(raw.device_id);
  if (!device_id) return { error: "invalid device" };
  const unlocked = Math.max(1, Math.min(6, Math.floor(Number(raw.unlocked) || 1)));
  const max_lives = Math.max(1, Math.min(5, Math.floor(Number(raw.max_lives) || 3)));
  const lives = Math.max(0, Math.min(max_lives, Math.floor(Number(raw.lives != null ? raw.lives : max_lives))));
  const insane_unlocked = raw.insane_unlocked === true || raw.insane_unlocked === "true" || raw.insane_unlocked === 1;
  const difficulty = DIFFICULTIES.includes(String(raw.difficulty || "").toLowerCase())
    ? String(raw.difficulty).toLowerCase()
    : "medium";
  return { device_id, unlocked, lives, max_lives, insane_unlocked, difficulty };
}

function mapSave(row) {
  if (!row) return null;
  return {
    device_id: row.device_id,
    unlocked: Number(row.unlocked) || 1,
    lives: Number(row.lives) || 0,
    max_lives: Number(row.max_lives) || 3,
    insane_unlocked: !!row.insane_unlocked,
    difficulty: DIFFICULTIES.includes(row.difficulty) ? row.difficulty : "medium",
    updated_at: row.updated_at ? Number(row.updated_at) : 0,
  };
}

export async function getSave(sql, deviceId) {
  await ensureSchema(sql);
  const id = cleanDeviceId(deviceId);
  if (!id) return { error: "invalid device" };
  const rows = await sql`
    SELECT device_id, unlocked, lives, max_lives, insane_unlocked, difficulty,
      (EXTRACT(EPOCH FROM updated_at) * 1000)::bigint AS updated_at
    FROM tether_saves
    WHERE device_id = ${id}::uuid
    LIMIT 1
  `;
  return { save: rows.length ? mapSave(rows[0]) : null };
}

export async function putSave(sql, body) {
  await ensureSchema(sql);
  const entry = cleanSave(body);
  if (entry.error) return entry;
  const rows = await sql`
    INSERT INTO tether_saves (device_id, unlocked, lives, max_lives, insane_unlocked, difficulty, updated_at)
    VALUES (
      ${entry.device_id}::uuid,
      ${entry.unlocked},
      ${entry.lives},
      ${entry.max_lives},
      ${entry.insane_unlocked},
      ${entry.difficulty},
      now()
    )
    ON CONFLICT (device_id) DO UPDATE SET
      unlocked = GREATEST(tether_saves.unlocked, EXCLUDED.unlocked),
      insane_unlocked = tether_saves.insane_unlocked OR EXCLUDED.insane_unlocked,
      max_lives = GREATEST(tether_saves.max_lives, EXCLUDED.max_lives),
      lives = CASE
        WHEN EXCLUDED.unlocked > tether_saves.unlocked THEN LEAST(EXCLUDED.lives, GREATEST(tether_saves.max_lives, EXCLUDED.max_lives))
        WHEN EXCLUDED.unlocked = tether_saves.unlocked THEN GREATEST(tether_saves.lives, EXCLUDED.lives)
        ELSE tether_saves.lives
      END,
      difficulty = EXCLUDED.difficulty,
      updated_at = now()
    RETURNING device_id, unlocked, lives, max_lives, insane_unlocked, difficulty,
      (EXTRACT(EPOCH FROM updated_at) * 1000)::bigint AS updated_at
  `;
  return { saved: true, save: mapSave(rows[0]) };
}
