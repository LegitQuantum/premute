import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
      />
      <path
        fill="currentColor"
        d="M12 22c2.7 0 4.96-.9 6.62-2.35l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.06v2.58A10 10 0 0 0 12 22Z"
        opacity=".85"
      />
      <path
        fill="currentColor"
        d="M6.42 13.99A6.01 6.01 0 0 1 6.1 12c0-.69.12-1.36.32-1.99V7.43H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.57l3.36-2.58Z"
        opacity=".7"
      />
      <path
        fill="currentColor"
        d="M12 5.96c1.47 0 2.78.5 3.82 1.5l2.86-2.86C16.95 2.97 14.7 2 12 2A10 10 0 0 0 3.06 7.43l3.36 2.58C7.2 7.72 9.4 5.96 12 5.96Z"
        opacity=".55"
      />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.9 2H22l-6.84 7.82L23 22h-6.5l-5.1-6.66L5.7 22H2.6l7.32-8.37L1 2h6.66l4.6 6.1L18.9 2Zm-1.14 18.04h1.8L6.33 3.86H4.4l13.36 16.18Z"
      />
    </svg>
  );
}

export function LoginScreen() {
  return (
    <main className="relative grid min-h-dvh place-items-center bg-bg px-4 py-10 text-fg">
      <div className="login-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-panel)] sm:p-8">
        <div className="absolute inset-y-3 left-0 w-1 rounded-full bg-accent" aria-hidden="true" />
        <div className="mb-6 flex items-center gap-3 pl-2">
          <span className="grid size-11 place-items-center rounded-sm border border-accent/40 bg-elevated text-lg font-semibold">
            P
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">PremuteBOT</p>
            <p className="text-sm text-muted">Панель управления</p>
          </div>
        </div>
        <h1 className="pl-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Приветствую в панели управления бота PremuteBOT
        </h1>
        <p className="mt-3 pl-2 text-sm leading-relaxed text-muted">
          Войдите через Google или X. После входа привяжите Discord ID — владелец выдаст вкладки
          статистики, модерации и озвучки.
        </p>
        {authEnabled ? (
          <div className="mt-7 grid gap-3 pl-2">
            {GROK_PROVIDERS.map((p) => {
              const isGoogle = p.idp === "google";
              return (
                <Button
                  key={p.providerId}
                  type="button"
                  size="lg"
                  variant={isGoogle ? "default" : "secondary"}
                  className={
                    isGoogle
                      ? "h-12 w-full bg-fg text-bg hover:bg-fg/90"
                      : "h-12 w-full"
                  }
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  {isGoogle ? <GoogleMark /> : <XMark />}
                  Продолжить с {p.label}
                </Button>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 pl-2 text-sm text-muted">Вход отключён.</p>
        )}
      </div>
    </main>
  );
}
