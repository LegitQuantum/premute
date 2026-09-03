import { useEffect, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { listStaffFn, setStaffPerms } from "@/lib/fn";
import type { StaffListItem, StaffProfile } from "@/lib/types";

export function AdminView({ me }: { me: StaffProfile }) {
  const [rows, setRows] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setRows(await listStaffFn());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить список");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function patch(userId: string, next: Partial<StaffListItem>) {
    try {
      const updated = await setStaffPerms({
        data: {
          userId,
          canStats: next.canStats,
          canModeration: next.canModeration,
          canVoice: next.canVoice,
          canMods: next.canMods,
          isOwner: next.isOwner,
          isBotOwner: next.isBotOwner,
          tag: next.tag,
        },
      });
      setRows((prev) => prev.map((r) => (r.userId === userId ? updated : r)));
      toast.success("Права обновлены");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не сохранено");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Загружаю пользователей
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Админ панель</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Доступ к вкладкам</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Выдавайте статистику, модерирование, озвучивание, теги у аватарки и управление составом модераторов.
          {me.caps.canGrantOwner
            ? " «Владелец» — все вкладки сайта. «Владелец бота» — команды Discord. Оба переключателя только у вас."
            : " Назначать владельцев сайта и бота может только корневой владелец."}
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Пока никто не входил.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((u) => {
              const locked = u.isRoot && u.userId !== me.userId;
              return (
                <li key={u.userId} className="grid gap-4 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    {u.image ? (
                      <img src={u.image} alt="" className="size-10 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-10 place-items-center rounded-full bg-elevated text-sm font-medium">
                        {(u.displayName || u.email || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{u.displayName || u.email || "Без имени"}</p>
                        {u.isRoot ? (
                          <Badge tone="gold">
                            <Shield className="mr-1 size-3" />
                            корень
                          </Badge>
                        ) : u.isOwner ? (
                          <Badge tone="accent">владелец</Badge>
                        ) : null}
                        {u.isBotOwner && !u.isRoot ? <Badge tone="gold">бот</Badge> : null}
                        {u.tag ? <Badge>{u.tag}</Badge> : null}
                      </div>
                      <p className="truncate text-xs text-subtle">
                        {u.email || "—"}
                        {u.discordId ? ` · Discord ${u.discordId}` : " · Discord не привязан"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <Toggle
                      label="Статистика"
                      checked={u.isRoot || u.isOwner || u.canStats}
                      disabled={locked || u.isRoot || u.isOwner}
                      onChange={(v) => void patch(u.userId, { ...u, canStats: v })}
                    />
                    <Toggle
                      label="Модерация"
                      checked={u.isRoot || u.isOwner || u.canModeration}
                      disabled={locked || u.isRoot || u.isOwner}
                      onChange={(v) => void patch(u.userId, { ...u, canModeration: v })}
                    />
                    <Toggle
                      label="Озвучка"
                      checked={u.isRoot || u.isOwner || u.canVoice}
                      disabled={locked || u.isRoot || u.isOwner}
                      onChange={(v) => void patch(u.userId, { ...u, canVoice: v })}
                    />
                    <Toggle
                      label="Модераторы"
                      checked={u.isRoot || u.isOwner || u.canMods}
                      disabled={locked || u.isRoot || u.isOwner}
                      onChange={(v) => void patch(u.userId, { ...u, canMods: v })}
                    />
                    {me.caps.canGrantOwner ? (
                      <>
                        <Toggle
                          label="Владелец"
                          checked={u.isRoot || u.isOwner}
                          disabled={locked || u.isRoot}
                          onChange={(v) => void patch(u.userId, { ...u, isOwner: v })}
                        />
                        <Toggle
                          label="Владелец бота"
                          checked={u.isRoot || u.isBotOwner}
                          disabled={locked || u.isRoot}
                          onChange={(v) => void patch(u.userId, { ...u, isBotOwner: v })}
                        />
                      </>
                    ) : null}
                    {me.caps.isOwner ? (
                      <TagField
                        value={u.tag}
                        disabled={locked}
                        onSave={(tag) => void patch(u.userId, { ...u, tag })}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function TagField({
  value,
  disabled,
  onSave,
}: {
  value: string | null;
  disabled?: boolean;
  onSave: (tag: string | null) => void;
}) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => {
    setText(value ?? "");
  }, [value]);
  return (
    <label className="grid gap-1 text-xs text-muted">
      Тег
      <Input
        className="h-8 w-36"
        maxLength={24}
        disabled={disabled}
        placeholder="например CURATOR"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const next = text.trim() || null;
          if (next !== (value || null)) onSave(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
      {label}
    </label>
  );
}
