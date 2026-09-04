import { useState } from "react";
import { Loader2, Power, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { botPowerFn } from "@/lib/fn";

export function PowerView() {
  const [busy, setBusy] = useState<"restart" | "shutdown" | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function run(action: "restart" | "shutdown") {
    setBusy(action);
    try {
      await botPowerFn({ data: { action } });
      if (action === "restart") {
        toast.success("Перезапуск отправлен — бот вернётся через несколько секунд");
      } else {
        toast.success("Выключение отправлено — бот остановлен");
      }
      setConfirming(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось выполнить");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Управление</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Питание</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          То же управление, что у панели !powerb в Discord. Все действия записываются в лог-канал.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-panel)]">
          <div className="flex items-center gap-2 text-sm font-medium">
            <RotateCw className="size-4 text-accent" />
            Перезапуск
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Бот уйдёт в рестарт и вернётся через несколько секунд.
          </p>
          <Button
            className="mt-4 w-full"
            disabled={busy !== null}
            onClick={() => void run("restart")}
          >
            {busy === "restart" ? <Loader2 className="animate-spin" /> : <RotateCw />}
            Перезапустить
          </Button>
        </div>

        <div className="rounded-lg border border-danger/40 bg-surface p-5 shadow-[var(--shadow-panel)]">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Power className="size-4 text-danger" />
            Выключение
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Бот остановится и <span className="text-danger">не включится сам</span> — включение
            только вручную на сервере.
          </p>
          {confirming ? (
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="danger"
                className="w-full"
                disabled={busy !== null}
                onClick={() => void run("shutdown")}
              >
                {busy === "shutdown" ? <Loader2 className="animate-spin" /> : <Power />}
                Подтвердить выключение
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                disabled={busy !== null}
                onClick={() => setConfirming(false)}
              >
                Отмена
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              className="mt-4 w-full"
              disabled={busy !== null}
              onClick={() => setConfirming(true)}
            >
              <Power />
              Выключить
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
