import { type ReactNode } from "react";
import { BarChart3, Shield, ShieldCheck, Users, Volume2 } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";
import type { Caps } from "@/lib/types";

export type Tab = "home" | "stats" | "moderation" | "voice" | "mods" | "admin";

export function PanelShell({
  caps,
  tab,
  onTab,
  children,
}: {
  caps: Caps;
  tab: Tab;
  onTab: (t: Tab) => void;
  children: ReactNode;
}) {
  const items: { id: Tab; label: string; icon: typeof BarChart3; show: boolean }[] = [
    { id: "stats", label: "Статистика", icon: BarChart3, show: caps.canStats },
    { id: "moderation", label: "Модерирование", icon: ShieldCheck, show: caps.canModeration },
    { id: "voice", label: "Озвучивание", icon: Volume2, show: caps.canVoice },
    { id: "mods", label: "Модераторы", icon: Users, show: caps.canMods },
    { id: "admin", label: "Админ панель", icon: Shield, show: caps.canAdmin },
  ];

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => onTab("home")}
            className="flex items-center gap-3 self-start"
          >
            <span className="grid size-9 place-items-center rounded-sm border border-accent/40 bg-elevated font-semibold tracking-tight">
              P
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold leading-none">PremuteBOT</span>
              <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-subtle">
                control panel
              </span>
            </span>
          </button>

          <nav className="flex flex-1 flex-wrap items-center gap-1 sm:justify-center">
            {items
              .filter((i) => i.show)
              .map((i) => {
                const Icon = i.icon;
                const active = tab === i.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => onTab(i.id)}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-elevated text-fg"
                        : "text-muted hover:bg-elevated/70 hover:text-fg",
                    )}
                  >
                    <Icon className="size-4" />
                    {i.label}
                  </button>
                );
              })}
          </nav>

          <div className="flex items-center justify-end [&_button]:h-11 [&_button]:rounded-sm [&_button]:border [&_button]:border-border [&_button]:bg-elevated [&_button]:px-3 [&_button]:text-xs [&_button]:text-muted">
            <UserButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function HomeHero() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-6 grid size-12 place-items-center rounded-sm border border-accent/40 bg-elevated text-lg font-semibold">
        P
      </span>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Приветствую в панели управления бота PremuteBOT
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Вкладки сверху — статистика модераторов FEAR, наказания на сервере и озвучка.
      </p>
    </section>
  );
}
