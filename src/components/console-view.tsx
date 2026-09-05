import { useState } from "react";
import { CheckCircle2, Download, Terminal, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const HOST = "64.188.66.194";
const USER = "root";

function batContent(): string {
  return [
    "@echo off",
    "chcp 65001 >nul",
    "title Premute SSH - 64.188.66.194",
    "echo.",
    "where ssh >nul 2>nul",
    "if errorlevel 1 (",
    "  echo [Ошибка] OpenSSH не найден на этом ПК.",
    "  echo Открой: Параметры - Приложения - Дополнительные компоненты -",
    "  echo добавить компонент OpenSSH Client, затем запусти файл снова.",
    "  pause",
    "  exit /b",
    ")",
    "echo Подключение к серверу premute (64.188.66.194)...",
    "echo.",
    "echo Введи пароль root, когда появится запрос.",
    "echo.",
    `ssh -t ${USER}@${HOST}`,
    "echo.",
    "echo Сеанс завершён. Окно можно закрыть.",
    "pause",
  ].join("\r\n");
}

export function ConsoleView() {
  const [saved, setSaved] = useState(false);

  function downloadBat() {
    const blob = new Blob([batContent()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "premute-ssh.bat";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Сервер</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Консоль</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Открывай настоящий CMD на своём ПК и подключайся к серверу premute одним файлом. Только для корневых
          владельцев.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-panel)]">
        <div className="flex items-center gap-3 border-b border-border bg-elevated/60 px-5 py-4">
          <div className="flex size-10 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Terminal className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Терминал на ПК</p>
            <p className="text-xs text-muted">
              Скачай файл, запусти двойным кликом — откроется CMD и подключится к {USER}@{HOST}
            </p>
          </div>
          <Button onClick={downloadBat}>
            <Download />
            Скачать .bat
          </Button>
        </div>

        {saved ? (
          <div className="flex items-start gap-2 border-b border-border px-5 py-3 text-sm text-muted">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
            Файл premute-ssh.bat скачан. Запусти его двойным кликом.
          </div>
        ) : null}

        <ol className="space-y-0 px-5 py-4">
          {[
            ["Нажми «Скачать .bat»", "Файл premute-ssh.bat появится в папке «Загрузки»."],
            [
              "Запусти файл",
              "Двойной клик. Windows может показать «Защита компьютера» — нажми Подробнее → Выполнить в любом случае. Это ожидаемо: файл делаем мы сами, но без подписи разработчика.",
            ],
            ["Введи пароль", "CMD откроется и спросит пароль root — введи его (при вводе не отображается)."],
            ["Готово", "Ты в консоли сервера. Чтобы выйти — набери exit и Enter."],
          ].map(([title, text], i) => (
            <li key={i} className="flex gap-3 px-1 py-3 first:pt-1 last:pb-1">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-0.5 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex items-start gap-2 border-t border-border px-5 py-3 text-sm text-muted">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <span>
            Пароль в файл не вшивается и никуда не отправляется — ты вводишь его сам при подключении. Не скачивай и не
            открывай .bat-файлы неизвестного происхождения.
          </span>
        </div>
      </div>
    </div>
  );
}