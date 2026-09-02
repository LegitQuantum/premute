import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Send, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listVoiceFn, playSoundFn, sayFn } from "@/lib/fn";
import { SOUNDS } from "@/lib/constants";
import type { VoiceChannel } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VoiceView() {
  const [channels, setChannels] = useState<VoiceChannel[]>([]);
  const [channelId, setChannelId] = useState<string>("");
  const [text, setText] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void listVoiceFn()
      .then((rows) => {
        setChannels(rows);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Каналы недоступны"));
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function preview(src: string, id: string) {
    audioRef.current?.pause();
    if (playing === id) {
      setPlaying(null);
      return;
    }
    const a = new Audio(src);
    audioRef.current = a;
    a.onended = () => setPlaying(null);
    void a.play();
    setPlaying(id);
  }

  async function sendSound(file: string) {
    setBusy(file);
    try {
      await playSoundFn({ data: { file, channelId: channelId || undefined } });
      toast.success("Бот произносит звук в войсе");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось отправить");
    } finally {
      setBusy(null);
    }
  }

  async function sendSay() {
    const t = text.trim();
    if (!t) return;
    setBusy("say");
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ru&client=tw-ob&q=${encodeURIComponent(t.slice(0, 190))}`;
      preview(url, "say-preview");
      await sayFn({ data: { text: t, channelId: channelId || undefined } });
      toast.success("Бот озвучивает текст в войсе");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось озвучить");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Озвучивание</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Голос бота</h1>
        <p className="mt-1 text-sm text-muted">
          Те же звуки, что у !eye / !koza1 / !koza2 / !svin, и тот же TTS, что у !say. Бот произнесёт
          их в выбранном голосовом канале — не файлом в чат.
        </p>
      </header>

      <div className="mb-6">
        <Label htmlFor="vc">Голосовой канал</Label>
        <select
          id="vc"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="mt-2 flex h-11 w-full rounded-sm border border-border bg-elevated px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <option value="">Текущий канал, где сидит бот</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SOUNDS.map((s) => {
          const src = `/sounds/${s.file}`;
          const isPlay = playing === s.id;
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-md border border-border bg-surface p-4"
            >
              <button
                type="button"
                onClick={() => preview(src, s.id)}
                className={cn(
                  "grid size-11 place-items-center rounded-sm border border-border bg-elevated text-fg transition-colors",
                  isPlay && "border-accent text-accent",
                )}
                aria-label={isPlay ? "Пауза" : "Слушать"}
              >
                {isPlay ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.label}</p>
                <p className="font-mono text-xs text-subtle">{s.file}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy === s.file}
                onClick={() => void sendSound(s.file)}
              >
                {busy === s.file ? <Loader2 className="animate-spin" /> : <Send />}
                В Discord
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-panel)] sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Volume2 className="size-4 text-accent" />
          Свой текст
        </div>
        <Textarea
          placeholder="Произнести — тот же голос, что у команды !say…"
          value={text}
          maxLength={190}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-subtle">{text.length}/190</span>
          <Button disabled={busy === "say" || !text.trim()} onClick={() => void sendSay()}>
            {busy === "say" ? <Loader2 className="animate-spin" /> : <Send />}
            Озвучить
          </Button>
        </div>
      </div>
    </div>
  );
}
