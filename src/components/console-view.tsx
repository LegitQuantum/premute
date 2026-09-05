import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, SquareTerminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { consoleExecFn } from "@/lib/fn";

type Line = { kind: "cmd" | "out" | "err" | "info"; text: string };

const HISTORY_LIMIT = 200;

export function ConsoleView() {
  const [lines, setLines] = useState<Line[]>([
    { kind: "info", text: "Консоль сервера (root). Команды выполняются в /root/premute." },
  ]);
  const [cmd, setCmd] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function append(line: Line) {
    setLines((prev) => {
      const next = [...prev, line];
      return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
    });
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }

  async function run(raw: string) {
    const command = raw.trim();
    if (!command || busy) return;
    setBusy(true);
    setCmd("");
    append({ kind: "cmd", text: `$ ${command}` });
    setHistory((prev) => [...prev, command].slice(-50));
    setHistoryIdx(null);
    try {
      const res = await consoleExecFn({ data: { cmd: command } });
      if (res.stdout.trim()) append({ kind: "out", text: res.stdout.replace(/\n$/, "") });
      if (res.stderr.trim()) append({ kind: "err", text: res.stderr.replace(/\n$/, "") });
      if (res.code !== 0) append({ kind: "info", text: `код выхода: ${res.code}` });
    } catch (e) {
      append({ kind: "err", text: e instanceof Error ? e.message : "Ошибка выполнения" });
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void run(cmd);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setCmd(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === null) return;
      const idx = historyIdx + 1;
      if (idx >= history.length) {
        setHistoryIdx(null);
        setCmd("");
      } else {
        setHistoryIdx(idx);
        setCmd(history[idx]);
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Сервер</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Консоль</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Произвольные shell-команды на VPS от root. Доступ есть только у корневых владельцев бота.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setLines([{ kind: "info", text: "Вывод очищен." }])}
        >
          <Trash2 />
          Очистить
        </Button>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        <div className="flex items-center gap-2 border-b border-border bg-elevated/60 px-4 py-2 text-xs text-muted">
          <SquareTerminal className="size-3.5 text-accent" />
          root@vps — /root/premute
        </div>
        <div ref={scrollRef} className="max-h-[55vh] overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
          {lines.map((l, i) => (
            <pre
              key={i}
              className={
                l.kind === "cmd"
                  ? "whitespace-pre-wrap break-words text-accent"
                  : l.kind === "err"
                    ? "whitespace-pre-wrap break-words text-danger"
                    : l.kind === "info"
                      ? "whitespace-pre-wrap break-words text-subtle"
                      : "whitespace-pre-wrap break-words text-fg"
              }
            >
              {l.text}
            </pre>
          ))}
          {busy ? (
            <p className="flex items-center gap-2 text-subtle">
              <Loader2 className="size-3.5 animate-spin" />
              выполняю…
            </p>
          ) : null}
        </div>
        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border px-4 py-3">
          <span className="font-mono text-sm text-accent">$</span>
          <Input
            className="h-9 flex-1 border-0 bg-transparent font-mono text-[13px] focus-visible:ring-0"
            placeholder="Команда, например pm2 list"
            value={cmd}
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <Button type="submit" size="sm" disabled={busy || !cmd.trim()}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            Выполнить
          </Button>
        </form>
      </div>
    </div>
  );
}
