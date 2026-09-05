import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type {
  DiscordClaim,
  GuildMember,
  LogEntry,
  RosterPayload,
  StaffListItem,
  StaffProfile,
  StatsPayload,
} from "@/lib/types";

export const getMe = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { displayName?: string | null; email?: string | null; image?: string | null }) => d)
  .handler(async ({ context, data }): Promise<StaffProfile> => {
    const { upsertStaff } = await import("./server/staff");
    return upsertStaff(context.userId, data ?? {});
  });

export const bindDiscord = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { discordId: string }) => d)
  .handler(async ({ context, data }): Promise<DiscordClaim> => {
    const { requestDiscordClaim, getStaff } = await import("./server/staff");
    const me = await getStaff(context.userId);
    const name = me?.displayName || me?.email || "пользователь панели";
    return requestDiscordClaim(context.userId, data.discordId, name);
  });

export const pollDiscordClaim = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { claimId: string }) => d)
  .handler(async ({ context, data }): Promise<{ claim: DiscordClaim; profile?: StaffProfile }> => {
    const { pollDiscordClaim: poll } = await import("./server/staff");
    return poll(context.userId, data.claimId);
  });

export const listStaffFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StaffListItem[]> => {
    const { getStaff, listStaff } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canAdmin) throw new Error("Недостаточно прав.");
    return listStaff();
  });

export const setStaffPerms = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      userId: string;
      canStats?: boolean;
      canModeration?: boolean;
      canVoice?: boolean;
      canMods?: boolean;
      canLogs?: boolean;
      canPower?: boolean;
      isOwner?: boolean;
      isBotOwner?: boolean;
      setRoot?: boolean;
      tag?: string | null;
    }) => d,
  )
  .handler(async ({ context, data }): Promise<StaffListItem> => {
    const { getStaff, updateStaffPermissions, writeLog } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me) throw new Error("Профиль не найден.");
    const updated = await updateStaffPermissions(me, data.userId, {
      canStats: data.canStats,
      canModeration: data.canModeration,
      canVoice: data.canVoice,
      canMods: data.canMods,
      canLogs: data.canLogs,
      canPower: data.canPower,
      isOwner: data.isOwner,
      isBotOwner: data.isBotOwner,
      setRoot: data.setRoot,
      tag: data.tag,
    });
    await writeLog(context.userId, "set_perms", JSON.stringify(data));
    return updated;
  });

export const getStatsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { refresh?: boolean } | undefined) => d ?? {})
  .handler(async ({ context, data }): Promise<StatsPayload> => {
    const { getStaff } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canStats) throw new Error("Нет доступа к статистике.");
    const { loadStats } = await import("./server/stats");
    const { attachLastMonthTop } = await import("./server/tops");
    const stats = await loadStats({ refresh: Boolean(data?.refresh) });
    return attachLastMonthTop(stats);
  });

export const searchMembersFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { query: string }) => d)
  .handler(async ({ context, data }): Promise<GuildMember[]> => {
    const { getStaff } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canModeration) throw new Error("Нет доступа к модерированию.");
    const { searchMembers } = await import("./server/discord");
    return searchMembers(data.query);
  });

export const moderateFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      action: "ban" | "kick" | "mute" | "unmute" | "warn";
      targetId: string;
      reason?: string;
      durationMs?: number;
    }) => d,
  )
  .handler(async ({ context, data }): Promise<{ ok: true; message: string }> => {
    const { getStaff, writeLog } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canModeration) throw new Error("Нет доступа к модерированию.");
    const actor = me.displayName || me.email || context.userId;
    const reason = (data.reason || "Без причины").slice(0, 300);
    const d = await import("./server/discord");
    const tag = `${actor}`;
    // В логах цель показываем как в Discord: ник на сервере (username).
    const target = await d.fetchGuildMember(data.targetId);
    const targetTag = target
      ? `**${target.nick || target.globalName || target.username}** (\`${target.username}\`)`
      : `\`${data.targetId}\``;
    if (data.action === "ban") {
      await d.banMember(data.targetId, reason, tag);
      await d.sendLog(`🔨 Бан — **${tag}** → ${targetTag} • ${reason}`);
    } else if (data.action === "kick") {
      await d.kickMember(data.targetId, reason, tag);
      await d.sendLog(`Кик — **${tag}** → ${targetTag} • ${reason}`);
    } else if (data.action === "mute") {
      await d.muteMember(data.targetId, data.durationMs || 10 * 60 * 1000, reason, tag);
      await d.sendLog(`Мут — **${tag}** → ${targetTag} • ${reason}`);
    } else if (data.action === "unmute") {
      await d.unmuteMember(data.targetId);
      await d.sendLog(`Размут — **${tag}** → ${targetTag}`);
    } else if (data.action === "warn") {
      await d.sendWarn(data.targetId, reason, tag);
    }
    await writeLog(context.userId, data.action, `${data.targetId} ${reason}`);
    const labels: Record<string, string> = {
      ban: "Пользователь забанен",
      kick: "Пользователь кикнут",
      mute: "Мут выдан",
      unmute: "Мут снят",
      warn: "Предупреждение отправлено",
    };
    return { ok: true, message: labels[data.action] };
  });

export const getLogsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LogEntry[]> => {
    const { getStaff } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canLogs) throw new Error("Нет доступа к логам.");
    const { fetchBotLogs } = await import("./server/discord");
    const rows = await fetchBotLogs();
    if (!rows) throw new Error("Бот недоступен — логи временно не получить.");
    return rows.map((r) => ({ ts: r.ts, text: r.text }));
  });

export const botPowerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { action: "restart" | "shutdown" }) => d)
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { getStaff, writeLog } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canPower) throw new Error("Нет доступа к управлению питанием.");
    const actor = me.displayName || me.email || context.userId;
    const { botPower } = await import("./server/discord");
    await botPower(data.action, actor);
    await writeLog(context.userId, "power", data.action);
    return { ok: true };
  });

export const consoleExecFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { cmd: string }) => d)
  .handler(async ({ context, data }): Promise<{ code: number; stdout: string; stderr: string; cwd: string }> => {
    const { getStaff, writeLog } = await import("./server/staff");
    const me = await getStaff(context.userId);
    // Консоль — только для корневых владельцев бота.
    if (!me?.caps.canConsole) throw new Error("Доступ к консоли есть только у корневых владельцев.");
    const cmd = data.cmd.trim().slice(0, 2000);
    if (!cmd) throw new Error("Пустая команда.");
    const actor = me.displayName || me.email || context.userId;
    const { botExec } = await import("./server/discord");
    const result = await botExec(cmd, actor);
    await writeLog(context.userId, "exec", cmd);
    return result;
  });

export const consoleStopFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((_d: unknown) => ({}))
  .handler(async ({ context, data: _data }): Promise<{ ok: true }> => {
    const { getStaff } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canConsole) throw new Error("Доступ к консоли есть только у корневых владельцев.");
    const { botExecStop } = await import("./server/discord");
    await botExecStop();
    return { ok: true };
  });

export const playSoundFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { file: string; channelId?: string }) => d)
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { getStaff, writeLog } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canVoice) throw new Error("Нет доступа к озвучиванию.");
    const allowed = new Set(["eye.mp3", "koza1.mp3", "koza2.mp3", "svin.mp3"]);
    if (!allowed.has(data.file)) throw new Error("Неизвестный звук.");
    const d = await import("./server/discord");
    const actor = me.displayName || me.email || context.userId;
    await d.playInVoice({
      op: "sound",
      file: data.file,
      channelId: data.channelId,
      actor,
    });
    await writeLog(context.userId, "sound", data.file);
    return { ok: true };
  });

export const sayFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { text: string; channelId?: string }) => d)
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { getStaff, writeLog } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canVoice) throw new Error("Нет доступа к озвучиванию.");
    const text = data.text.trim().slice(0, 190);
    if (!text) throw new Error("Введите текст.");
    const d = await import("./server/discord");
    const actor = me.displayName || me.email || context.userId;
    await d.playInVoice({
      op: "say",
      text,
      channelId: data.channelId,
      actor,
    });
    await writeLog(context.userId, "say", text);
    return { ok: true };
  });

const STEAMID_RE = /^\d{17}$/;

export const listModsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<RosterPayload> => {
    const { getStaff } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canMods) throw new Error("Нет доступа к списку модераторов.");
    const { fetchBotRoster } = await import("./server/discord");
    const { readRoster, writeRoster, bundledRanks } = await import("./server/roster");
    const live = await fetchBotRoster();
    if (live?.moderators?.length) {
      await writeRoster(live.moderators);
      return {
        moderators: live.moderators,
        ranks: live.ranks.length ? live.ranks : bundledRanks(),
      };
    }
    return { moderators: await readRoster(), ranks: bundledRanks() };
  });

export const upsertModFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: { steamid: string; name?: string; rank?: number; discord?: string | null; create?: boolean }) => d,
  )
  .handler(async ({ context, data }): Promise<RosterPayload> => {
    const { getStaff, writeLog } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canMods) throw new Error("Нет доступа к управлению модераторами.");
    const steamid = String(data.steamid || "").trim();
    if (!STEAMID_RE.test(steamid)) throw new Error("SteamID64 — 17 цифр.");
    const rank = Number(data.rank ?? 1);
    if (!Number.isInteger(rank) || rank < 1 || rank > 5) throw new Error("Ранг должен быть от 1 до 5.");
    const name = (data.name || "").trim() || steamid;
    const discord = data.discord == null ? null : String(data.discord).replace(/^@/, "").trim();
    const actor = me.displayName || me.email || context.userId;
    const { mutateBotMod } = await import("./server/discord");
    const { upsertRosterMod, readRoster, bundledRanks } = await import("./server/roster");
    const op = data.create ? "mod_add" : "mod_edit";
    let live: RosterPayload;
    try {
      live = await mutateBotMod({ op, actor, steamid, name, rank, discord });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Бот не принял изменение.");
    }
    if (live.moderators.length) {
      const { writeRoster } = await import("./server/roster");
      await writeRoster(live.moderators);
      await writeLog(context.userId, op, `${steamid} ${name}`);
      return live;
    }
    await upsertRosterMod({ steamid, name, rank, discord });
    await writeLog(context.userId, op, `${steamid} ${name}`);
    return {
      moderators: await readRoster(),
      ranks: bundledRanks(),
      recounting: Boolean(data.create),
    };
  });

export const deleteModFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { steamid: string }) => d)
  .handler(async ({ context, data }): Promise<RosterPayload> => {
    const { getStaff, writeLog } = await import("./server/staff");
    const me = await getStaff(context.userId);
    if (!me?.caps.canMods) throw new Error("Нет доступа к управлению модераторами.");
    const steamid = String(data.steamid || "").trim();
    if (!STEAMID_RE.test(steamid)) throw new Error("SteamID64 — 17 цифр.");
    const actor = me.displayName || me.email || context.userId;
    const { mutateBotMod } = await import("./server/discord");
    const { deleteRosterMod, bundledRanks } = await import("./server/roster");
    let live: RosterPayload;
    try {
      live = await mutateBotMod({ op: "mod_del", actor, steamid });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Бот не принял удаление.");
    }
    if (live.moderators.length) {
      const { writeRoster } = await import("./server/roster");
      await writeRoster(live.moderators);
      await writeLog(context.userId, "mod_del", steamid);
      return live;
    }
    const remaining = await deleteRosterMod(steamid);
    await writeLog(context.userId, "mod_del", steamid);
    return { moderators: remaining, ranks: bundledRanks() };
  });
