import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getLogsFn } from "@/lib/fn";
import type { LogEntry } from "@/lib/types";

function fmtTs(ts: number) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(ts));
  } catch {
    return "";
  }
}

export function LogsView() {
  const [rows, setRows] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function load(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getLogsFn();
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить логи");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(true), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [rows.length]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Журнал</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Логи</h1>
          <p className="mt-1 text-sm text-muted">
            Те же записи, что и в канале логов Discord: перезапуски, наказания, озвучка и звуки.
          </p>
        </div>
        <Button variant="secondary" size="sm" disabled={refreshing} onClick={() => void load(true)}>
          {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Обновить
        </Button>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Загружаю логи
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Записей пока нет.</p>
        ) : (
          <ul className="max-h-[65vh] divide-y divide-border overflow-y-auto">
            {rows.map((r, i) => (
              <li key={`${r.ts}-${i}`} className="px-4 py-3 sm:px-5">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{r.text}</p>
                <p className="mt-1 font-mono text-[11px] text-subtle">{fmtTs(r.ts)} МСК</p>
              </li>
            ))}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>
    </div>
  );
}
