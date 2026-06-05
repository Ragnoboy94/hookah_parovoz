"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TodayPanel } from "@/components/admin/TodayPanel";
import type { Booking, BookingStatus, SiteContent, Table } from "@/lib/types";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждено",
  cancelled: "Отменено",
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "text-amber-400",
  confirmed: "text-green-400",
  cancelled: "text-red-400",
};

function getTodayInTimezone(timezone: string): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: timezone });
}

function getNowMinutesInTimezone(timezone: string): number {
  const local = new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone }),
  );
  return local.getHours() * 60 + local.getMinutes();
}

export function BookingsAdmin() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [tab, setTab] = useState<"today" | "bookings" | "tables" | "settings">("today");
  const [message, setMessage] = useState("");
  const [testingTelegram, setTestingTelegram] = useState(false);

  const today = content ? getTodayInTimezone(content.timezone) : "";
  const nowMinutes = content ? getNowMinutesInTimezone(content.timezone) : 0;

  const loadAuth = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data = (await res.json()) as { authenticated: boolean };
    setAuthenticated(data.authenticated);
  }, []);

  const loadBookings = useCallback(async () => {
    const url = filterDate
      ? `/api/bookings?date=${filterDate}`
      : "/api/bookings";
    const res = await fetch(url);
    setBookings((await res.json()) as Booking[]);
  }, [filterDate]);

  const loadTables = useCallback(async () => {
    const res = await fetch("/api/tables");
    setTables((await res.json()) as Table[]);
  }, []);

  const loadContent = useCallback(async () => {
    const res = await fetch("/api/content");
    setContent((await res.json()) as SiteContent);
  }, []);

  const refresh = useCallback(() => {
    loadBookings();
    loadTables();
  }, [loadBookings, loadTables]);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (authenticated) {
      refresh();
      loadContent();
    }
  }, [authenticated, refresh, loadContent]);

  useEffect(() => {
    if (!authenticated || tab !== "today") return;
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [authenticated, tab, refresh]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setPassword("");
    } else {
      setLoginError("Неверный пароль");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
  }

  function showMessage(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }

  async function updateStatus(id: string, status: BookingStatus) {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      refresh();
      showMessage("Статус обновлён");
    }
  }

  async function saveTables() {
    const res = await fetch("/api/tables", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tables),
    });
    showMessage(res.ok ? "Столики сохранены" : "Ошибка сохранения");
  }

  async function saveContent() {
    if (!content) return;
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    showMessage(res.ok ? "Настройки сохранены" : "Ошибка сохранения");
  }

  async function testTelegram() {
    setTestingTelegram(true);
    const res = await fetch("/api/telegram/test", { method: "POST" });
    setTestingTelegram(false);
    if (res.ok) {
      showMessage("Тестовое сообщение отправлено");
    } else {
      const data = (await res.json()) as { error?: string };
      showMessage(data.error ?? "Ошибка отправки");
    }
  }

  function tableName(tableId: string): string {
    return tables.find((t) => t.id === tableId)?.name ?? tableId;
  }

  function formatDate(dateStr: string): string {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function kindLabel(booking: Booking): string | null {
    if (booking.kind === "block") return "Блок";
    if (booking.source === "admin") return "Админ";
    return null;
  }

  const upcoming = useMemo(
    () => bookings.filter((b) => b.status !== "cancelled"),
    [bookings],
  );

  const defaultTelegram = {
    enabled: false,
    chatId: "",
    notifyOnOnlineBooking: true,
    notifyOnAdminBooking: true,
    notifyOnBlock: false,
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Загрузка…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 smoke-bg">
        <form
          onSubmit={handleLogin}
          className="glass-card rounded-2xl p-8 w-full max-w-sm space-y-4"
        >
          <h1 className="font-display text-2xl font-bold text-center">
            Бронирования
          </h1>
          <input
            type="password"
            className="input-field"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {loginError && (
            <p className="text-red-400 text-sm text-center">{loginError}</p>
          )}
          <button type="submit" className="btn-primary w-full">
            Войти
          </button>
        </form>
      </div>
    );
  }

  const telegram = content?.telegram ?? defaultTelegram;

  return (
    <div className="min-h-screen smoke-bg">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="font-display text-xl font-bold">Бронирования</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <a href="/admin" className="btn-ghost text-sm py-2 px-4">
              Контент
            </a>
            <a href="/booking" className="btn-ghost text-sm py-2 px-4">
              Страница брони
            </a>
            <button onClick={handleLogout} className="btn-ghost text-sm py-2 px-4">
              Выйти
            </button>
          </div>
        </div>
        {message && (
          <p className="text-center text-sm pb-2 text-green-400">{message}</p>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          {(
            [
              ["today", "Сегодня"],
              ["bookings", "Заявки"],
              ["tables", "Столики"],
              ["settings", "Настройки"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "today" && content && (
          <TodayPanel
            content={content}
            tables={tables}
            bookings={bookings}
            today={today}
            nowMinutes={nowMinutes}
            onRefresh={refresh}
            onMessage={showMessage}
          />
        )}

        {tab === "bookings" && (
          <div className="space-y-6">
            <div className="flex gap-3 items-center flex-wrap">
              <input
                type="date"
                className="input-field w-auto"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <button
                onClick={() => setFilterDate("")}
                className="btn-ghost text-sm py-2 px-4"
              >
                Все даты
              </button>
              <button onClick={refresh} className="btn-ghost text-sm py-2 px-4">
                Обновить
              </button>
            </div>

            {upcoming.length === 0 && (
              <p className="text-muted text-center py-12">Заявок пока нет</p>
            )}

            <div className="space-y-3">
              {upcoming.map((booking) => {
                const extra = kindLabel(booking);
                return (
                  <div
                    key={booking.id}
                    className="glass-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="font-medium text-lg">{booking.guestName}</p>
                        <span
                          className={`text-xs font-medium ${STATUS_COLORS[booking.status]}`}
                        >
                          {STATUS_LABELS[booking.status]}
                        </span>
                        {extra && (
                          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-muted">
                            {extra}
                          </span>
                        )}
                      </div>
                      <p className="text-muted text-sm">
                        {formatDate(booking.date)} · {booking.time} ·{" "}
                        {tableName(booking.tableId)}
                        {booking.kind === "guest" && ` · ${booking.guests} гост.`}
                      </p>
                      {booking.note && (
                        <p className="text-muted text-xs mt-1">{booking.note}</p>
                      )}
                      {booking.guestPhone && booking.guestPhone !== "—" && (
                        <a
                          href={`tel:${booking.guestPhone.replace(/[^\d+]/g, "")}`}
                          className="text-sm mt-1 inline-block hover:underline"
                        >
                          {booking.guestPhone}
                        </a>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {booking.status === "pending" && booking.kind === "guest" && (
                        <>
                          <button
                            onClick={() => updateStatus(booking.id, "confirmed")}
                            className="btn-primary text-sm py-2 px-4"
                          >
                            Подтвердить
                          </button>
                          <button
                            onClick={() => updateStatus(booking.id, "cancelled")}
                            className="btn-ghost text-sm py-2 px-4 text-red-400"
                          >
                            Отменить
                          </button>
                        </>
                      )}
                      {(booking.status === "confirmed" ||
                        booking.kind === "block") && (
                        <button
                          onClick={() => updateStatus(booking.id, "cancelled")}
                          className="btn-ghost text-sm py-2 px-4 text-red-400"
                        >
                          {booking.kind === "block" ? "Освободить" : "Отменить"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "tables" && (
          <div className="space-y-4">
            {tables.map((table, index) => (
              <div
                key={table.id}
                className="glass-card rounded-xl p-4 grid sm:grid-cols-[1fr_80px_80px_auto] gap-3 items-center"
              >
                <input
                  className="input-field"
                  value={table.name}
                  onChange={(e) => {
                    const next = [...tables];
                    next[index] = { ...table, name: e.target.value };
                    setTables(next);
                  }}
                />
                <input
                  type="number"
                  className="input-field"
                  min={1}
                  value={table.seats}
                  onChange={(e) => {
                    const next = [...tables];
                    next[index] = { ...table, seats: Number(e.target.value) };
                    setTables(next);
                  }}
                  title="Мест"
                />
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={table.enabled}
                    onChange={(e) => {
                      const next = [...tables];
                      next[index] = { ...table, enabled: e.target.checked };
                      setTables(next);
                    }}
                    className="accent-primary"
                  />
                  Вкл
                </label>
                <button
                  onClick={() =>
                    setTables(tables.filter((_, i) => i !== index))
                  }
                  className="text-red-400 text-sm hover:underline"
                >
                  Удалить
                </button>
              </div>
            ))}

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setTables([
                    ...tables,
                    { id: uid(), name: "Новый стол", seats: 4, enabled: true },
                  ])
                }
                className="btn-ghost"
              >
                + Столик
              </button>
              <button onClick={saveTables} className="btn-primary">
                Сохранить столики
              </button>
            </div>
          </div>
        )}

        {tab === "settings" && content && (
          <div className="space-y-8 max-w-lg">
            <section className="space-y-6">
              <h2 className="font-display text-lg font-semibold">Бронирование</h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.booking.enabled}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      booking: { ...content.booking, enabled: e.target.checked },
                    })
                  }
                  className="accent-primary w-4 h-4"
                />
                <span>Бронирование на сайте включено</span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-muted">Длительность брони (мин)</span>
                <input
                  type="number"
                  className="input-field"
                  min={30}
                  step={15}
                  value={content.booking.durationMinutes}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      booking: {
                        ...content.booking,
                        durationMinutes: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-muted">Интервал слотов (мин)</span>
                <input
                  type="number"
                  className="input-field"
                  min={15}
                  step={15}
                  value={content.booking.intervalMinutes}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      booking: {
                        ...content.booking,
                        intervalMinutes: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-muted">Бронь на сколько дней вперёд</span>
                <input
                  type="number"
                  className="input-field"
                  min={1}
                  max={90}
                  value={content.booking.maxAdvanceDays}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      booking: {
                        ...content.booking,
                        maxAdvanceDays: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            </section>

            <section className="space-y-6 pt-6 border-t border-white/10">
              <h2 className="font-display text-lg font-semibold">Telegram</h2>
              <p className="text-muted text-sm">
                Создайте бота через{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  @BotFather
                </a>
                , добавьте токен в <code className="text-foreground">TELEGRAM_BOT_TOKEN</code> в
                .env, укажите Chat ID и нажмите «Тест».
              </p>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegram.enabled}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      telegram: { ...telegram, enabled: e.target.checked },
                    })
                  }
                  className="accent-primary w-4 h-4"
                />
                <span>Уведомления включены</span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-muted">Chat ID</span>
                <input
                  className="input-field"
                  value={telegram.chatId}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      telegram: { ...telegram, chatId: e.target.value },
                    })
                  }
                  placeholder="-1001234567890"
                />
              </label>

              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegram.notifyOnOnlineBooking}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        telegram: {
                          ...telegram,
                          notifyOnOnlineBooking: e.target.checked,
                        },
                      })
                    }
                    className="accent-primary"
                  />
                  <span>Заявки с сайта</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegram.notifyOnAdminBooking}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        telegram: {
                          ...telegram,
                          notifyOnAdminBooking: e.target.checked,
                        },
                      })
                    }
                    className="accent-primary"
                  />
                  <span>Брони, созданные админом</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegram.notifyOnBlock}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        telegram: {
                          ...telegram,
                          notifyOnBlock: e.target.checked,
                        },
                      })
                    }
                    className="accent-primary"
                  />
                  <span>Блокировки столов</span>
                </label>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button onClick={saveContent} className="btn-primary">
                  Сохранить
                </button>
                <button
                  onClick={testTelegram}
                  disabled={testingTelegram}
                  className="btn-ghost"
                >
                  {testingTelegram ? "Отправка…" : "Тест в Telegram"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
