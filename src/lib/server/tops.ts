import { getSql } from "@/lib/db";
import { MSK_OFFSET_SEC } from "./config";
import type { StatsPayload } from "@/lib/types";

const TOP_RANKS = new Set([1, 2]);

export function monthKeyMsk(now = new Date()): string {
  const msk = new Date(now.getTime() + MSK_OFFSET_SEC * 1000);
  return `${msk.getUTCFullYear()}-${String(msk.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function prevMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isFirstDayMsk(now = new Date()): boolean {
  const msk = new Date(now.getTime() + MSK_OFFSET_SEC * 1000);
  return msk.getUTCDate() === 1;
}

function currentChampion(payload: StatsPayload) {
  return payload.moderators
    .filter((m) => TOP_RANKS.has(Number(m.rank ?? 0)))
    .slice()
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "ru"))[0] ?? null;
}

export async function attachLastMonthTop(payload: StatsPayload): Promise<StatsPayload> {
  try {
    const sql = await getSql();
    await sql.query(`
      create table if not exists tops_champions (
        month_key text primary key,
        name text not null,
        rank int,
        total int not null,
        steamid text,
        saved_at timestamptz not null default now()
      )
    `);
    const key = monthKeyMsk();
    const cur = currentChampion(payload);
    if (cur) {
      await sql.query(
        `insert into tops_champions (month_key, name, rank, total, steamid)
         values ($1, $2, $3, $4, $5)
         on conflict (month_key) do update set
           name = excluded.name,
           rank = excluded.rank,
           total = excluded.total,
           steamid = excluded.steamid,
           saved_at = now()`,
        [key, cur.name, cur.rank, cur.total, cur.steamid],
      );
    }
    const prev = prevMonthKey(key);
    const rows = await sql.query<{ name: string; rank: number | null; total: number; steamid: string | null }>(
      "select name, rank, total, steamid from tops_champions where month_key = $1",
      [prev],
    );
    const row = rows[0];
    return {
      ...payload,
      isMonthFirst: isFirstDayMsk(),
      lastMonthTop: row
        ? { name: row.name, rank: row.rank, total: Number(row.total), steamid: row.steamid }
        : null,
    };
  } catch (e) {
    console.error("[tops] champion:", e instanceof Error ? e.message : e);
    return { ...payload, isMonthFirst: isFirstDayMsk(), lastMonthTop: payload.lastMonthTop ?? null };
  }
}
