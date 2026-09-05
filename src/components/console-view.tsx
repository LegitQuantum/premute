import { useRef, useState, type KeyboardEvent } from "react";
import { SquareTerminal, XSquare } from "lucide-react";
import { consoleExecFn, consoleStopFn } from "@/lib/fn";

type Entry = { kind: "cmd" | "out" | "err" | "sys"; text: string };

const MAX_LINES = 2000;

function prettyPath(p: string): string {
  return p === "/root" ? "~" : p.startsWith("/root/") ? `~/${p.slice(6)}` : p;
}

export function ConsoleView() {
  const [entries, setEntries] = useState<Entry[]>([
    {
      kind: "sys",
      text:
        "Консоль сервера (root). Доступ есть только у корневых владельцев бота.\nВвод — как в обычном терминале: стрелки ↑/↓ — история, Ctrl+C — прервать команду, clear — очистить экран.",
    },
  ]);
  const [cmd, setCmd] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState("/root/premute");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function append(e: Entry) {
    setEntries((prev) => {
      let next = [...prev, e];
      if (next.length > MAX_LINES) next = next.slice(next.length - MAX_LINES);
      return next;
    });
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }

  async function interrupt() {
    if (!busy) return;
    try {
      await consoleStopFn({ data: {} });
    } catch {
      void 0; // бот мог уже завершить команду сам — необязательная остановка
    }
  }

  async function run(raw: string) {
    const command = raw.trim();
    if (!command || busy) return;
    if (command === "clear") {
      setEntries((prev) => prev.slice(0, 5));
      setCmd("");
      return;
    }
    if (command === "exit" || command === "logout") {
      append({ kind: "sys", text: "Это веб-консоль — закрывать нечего. Можешь почистить экран командой clear." });
      setCmd("");
      return;
    }
    setBusy(true);
    setCmd("");
    append({ kind: "cmd", text: `${prettyPath(pwd)}# ${command}` });
    setHistory((prev) => [...prev, command].slice(-50));
    setHistoryIdx(null);
    try {
      const res = await consoleExecFn({ data: { cmd: command } });
      setPwd(res.cwd);
      if (res.stdout.trim()) append({ kind: "out", text: res.stdout.replace(/\s+$/, "") });
      if (res.stderr.trim()) append({ kind: "err", text: res.stderr.replace(/\s+$/, "") });
      if (res.code !== 0) append({ kind: "sys", text: `[код выхода: ${res.code}]` });
    } catch (e) {
      append({ kind: "err", text: e instanceof Error ? e.message : "Ошибка выполнения" });
    } finally {
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void run(cmd);
    } else if (e.key === "ArrowUp") {
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
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries((prev) => prev.slice(0, 5));
    } else if (e.key === "c" && e.ctrlKey) {
      void interrupt();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:py-8" onClick={() => inputRef.current?.focus()}>
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Сервер</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Консоль</h1>
        </div>
        {busy ? (
          <button
            type="button"
            onClick={() => void interrupt()}
            className="inline-flex items-center gap-2 rounded-md bg-danger/15 px-3 py-1.5 text-xs font-medium text-danger ring-1 ring-danger/30 transition hover:bg-danger/25"
          >
            <XSquare className="size-4" />
            Ctrl+C — прервать
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-md bg-surface px-3 py-1.5 text-xs text-muted ring-1 ring-border">
            <SquareTerminal className="size-4" />
            root@vps
          </span>
        )}
      </header>

      <div
        className="overflow-hidden rounded-lg border border-border bg-[#0a0e14] shadow-[var(--shadow-panel)]"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-neutral-400">
          <span className="size-2.5 rounded-full bg-[#ff5f56]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-2 hidden font-mono sm:inline">root@vps — {prettyPath(pwd)}</span>
          <span className="ml-auto font-mono">Ctrl+C прервать · ↑↓ история</span>
        </div>

        <div ref={scrollRef} className="h-[60vh] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
          {entries.map((l, i) => (
            <pre
              key={i}
              className={
                l.kind === "cmd"
                  ? "whitespace-pre-wrap break-words text-emerald-400"
                  : l.kind === "err"
                    ? "whitespace-pre-wrap break-words text-red-400"
                    : l.kind === "sys"
                      ? "whitespace-pre-wrap break-words text-neutral-500"
                      : "whitespace-pre-wrap break-words text-neutral-100"
              }
            >
              {l.text}
            </pre>
          ))}
          <div className="flex items-center gap-2">
            <span className="shrink-0 select-none text-emerald-400">{prettyPath(pwd)}#</span>
            <input
              ref={inputRef}
              className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-neutral-100 caret-emerald-400 outline-none placeholder:text-neutral-600"
              placeholder={busy ? "выполняется…" : "введите команду…"}
              value={cmd}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={busy}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
}