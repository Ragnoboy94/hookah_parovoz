"use client";

import { useMemo, useState } from "react";
import type { Booking, SiteContent, Table } from "@/lib/types";
import { getBookingEndTime, isBookingActiveAt } from "@/lib/booking";

interface TodayPanelProps {
  content: SiteContent;
  tables: Table[];
  bookings: Booking[];
  today: string;
  nowMinutes: number;
  onRefresh: () => void;
  onMessage: (text: string) => void;
}

export function TodayPanel({
  content,
  tables,
  bookings,
  today,
  nowMinutes,
  onRefresh,
  onMessage,
}: TodayPanelProps) {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [guestTime, setGuestTime] = useState("");
  const [blockNote, setBlockNote] = useState("Гости за столом");
  const [submitting, setSubmitting] = useState(false);

  const todayBookings = useMemo(
    () => bookings.filter((b) => b.date === today && b.status !== "cancelled"),
    [bookings, today],
  );

  const tableStates = useMemo(() => {
    return tables
      .filter((t) => t.enabled)
      .map((table) => {
        const active = todayBookings.find(
          (b) =>
            b.tableId === table.id && isBookingActiveAt(b, nowMinutes),
        );
        const upcoming = todayBookings
          .filter((b) => b.tableId === table.id)
          .sort((a, b) => a.time.localeCompare(b.time));

        return { table, active, upcoming };
      });
  }, [tables, todayBookings, nowMinutes]);

  async function blockNow(tableId: string, untilClose: boolean) {
    setSubmitting(true);
    const res = await fetch("/api/bookings/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "block_now",
        tableId,
        untilClose,
        note: blockNote,
      }),
    });
    setSubmitting(false);

    if (res.ok) {
      onMessage(untilClose ? "Стол занят до закрытия" : "Стол заблокирован");
      onRefresh();
    } else {
      const data = (await res.json()) as { error?: string };
      onMessage(data.error ?? "Ошибка");
    }
  }

  async function releaseBooking(id: string) {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cancelled" }),
    });
    if (res.ok) {
      onMessage("Стол освобождён");
      onRefresh();
    }
  }

  async function createGuestBooking() {
    if (!selectedTable || !guestTime || !guestName.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/bookings/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "guest",
        tableId: selectedTable,
        date: today,
        time: guestTime,
        guestName,
        guestPhone,
        guests,
        status: "confirmed",
      }),
    });
    setSubmitting(false);

    if (res.ok) {
      onMessage("Бронь создана");
      setShowGuestForm(false);
      setGuestName("");
      setGuestPhone("");
      setGuestTime("");
      onRefresh();
    } else {
      const data = (await res.json()) as { error?: string };
      onMessage(data.error ?? "Ошибка");
    }
  }

  const selected = tables.find((t) => t.id === selectedTable);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold mb-2">Зал сегодня</h2>
        <p className="text-muted text-sm">
          Быстро занять стол для гостей без брони или освободить место
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {tableStates.map(({ table, active, upcoming }) => (
          <div
            key={table.id}
            className={`glass-card rounded-2xl p-5 border-2 transition-colors ${
              active
                ? active.kind === "block"
                  ? "border-amber-500/50"
                  : "border-primary/50"
                : "border-transparent"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-medium text-lg">{table.name}</p>
                <p className="text-muted text-sm">{table.seats} мест</p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  active
                    ? active.kind === "block"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-primary/20 text-green-400"
                    : "bg-white/5 text-muted"
                }`}
              >
                {active
                  ? active.kind === "block"
                    ? "Занят"
                    : active.status === "pending"
                      ? "Бронь"
                      : "Гости"
                  : "Свободен"}
              </span>
            </div>

            {active ? (
              <div className="space-y-3">
                <p className="text-sm">
                  {active.guestName} · {active.time} —{" "}
                  {getBookingEndTime(active.time, active.durationMinutes)}
                </p>
                {active.note && (
                  <p className="text-muted text-xs">{active.note}</p>
                )}
                {active.kind === "guest" && active.guestPhone !== "—" && (
                  <a
                    href={`tel:${active.guestPhone.replace(/[^\d+]/g, "")}`}
                    className="text-sm hover:underline block"
                  >
                    {active.guestPhone}
                  </a>
                )}
                <button
                  onClick={() => releaseBooking(active.id)}
                  className="btn-ghost text-sm py-2 px-4 text-red-400 w-full"
                >
                  Освободить стол
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  disabled={submitting}
                  onClick={() => blockNow(table.id, false)}
                  className="btn-primary text-sm py-2 px-4 w-full"
                >
                  Занять сейчас ({content.booking.durationMinutes / 60} ч)
                </button>
                <button
                  disabled={submitting}
                  onClick={() => blockNow(table.id, true)}
                  className="btn-ghost text-sm py-2 px-4 w-full"
                >
                  Занять до закрытия
                </button>
                <button
                  onClick={() => {
                    setSelectedTable(table.id);
                    setShowGuestForm(true);
                  }}
                  className="btn-ghost text-sm py-2 px-4 w-full"
                >
                  Бронь за гостя
                </button>
              </div>
            )}

            {upcoming.length > 0 && !active && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-xs text-muted mb-2">Дальше сегодня:</p>
                {upcoming.slice(0, 2).map((b) => (
                  <p key={b.id} className="text-xs text-muted">
                    {b.time} · {b.guestName}
                    {b.kind === "block" ? " (блок)" : ""}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4 max-w-md">
        <label className="block space-y-2">
          <span className="text-sm text-muted">
            Заметка при быстрой блокировке
          </span>
          <input
            className="input-field"
            value={blockNote}
            onChange={(e) => setBlockNote(e.target.value)}
            placeholder="Гости за столом"
          />
        </label>
      </div>

      {showGuestForm && selected && (
        <div className="glass-card rounded-2xl p-6 max-w-md space-y-4">
          <h3 className="font-display text-lg font-semibold">
            Бронь за гостя · {selected.name}
          </h3>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Время</span>
            <input
              type="time"
              className="input-field"
              value={guestTime}
              onChange={(e) => setGuestTime(e.target.value.slice(0, 5))}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Имя</span>
            <input
              className="input-field"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Телефон</span>
            <input
              className="input-field"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Гостей</span>
            <input
              type="number"
              className="input-field"
              min={1}
              max={selected.seats}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            />
          </label>

          <div className="flex gap-3">
            <button
              onClick={createGuestBooking}
              disabled={submitting || !guestName.trim() || !guestTime}
              className="btn-primary flex-1"
            >
              Создать бронь
            </button>
            <button
              onClick={() => setShowGuestForm(false)}
              className="btn-ghost"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
