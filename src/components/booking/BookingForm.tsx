"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BookingAvailability,
  SiteContent,
  Table,
} from "@/lib/types";

interface BookingFormProps {
  content: SiteContent;
}

type Step = "date" | "time" | "table" | "details" | "done";

export function BookingForm({ content }: BookingFormProps) {
  const [step, setStep] = useState<Step>("date");
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dateOptions = useMemo(() => {
    const options: string[] = [];
    const today = new Date();
    for (let i = 0; i <= content.booking.maxAdvanceDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      options.push(
        d.toLocaleDateString("sv-SE", { timeZone: content.timezone }),
      );
    }
    return options;
  }, [content.booking.maxAdvanceDays, content.timezone]);

  useEffect(() => {
    fetch("/api/tables")
      .then((r) => r.json())
      .then((data: Table[]) => setTables(data.filter((t) => t.enabled)));
  }, []);

  const loadAvailability = useCallback(async (date: string) => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/bookings/availability?date=${date}`);
    const data = (await res.json()) as BookingAvailability;
    setAvailability(data);
    setLoading(false);
    if (data.closed) {
      setError(data.closedReason ?? "Нет свободных слотов");
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAvailability(selectedDate);
    }
  }, [selectedDate, loadAvailability]);

  const availableTables = useMemo(() => {
    if (!availability || !selectedTime) return [];
    const slot = availability.slots.find((s) => s.time === selectedTime);
    if (!slot) return [];
    return tables.filter((t) => slot.availableTableIds.includes(t.id));
  }, [availability, selectedTime, tables]);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  async function handleSubmit() {
    if (!selectedTableId || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: selectedTableId,
        date: selectedDate,
        time: selectedTime,
        guestName,
        guestPhone,
        guests,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Ошибка бронирования");
      return;
    }

    setStep("done");
  }

  function formatDateLabel(dateStr: string): string {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: content.timezone,
    });
  }

  const durationHours = content.booking.durationMinutes / 60;

  return (
    <div className="max-w-xl mx-auto">
      {step !== "done" && (
        <div className="flex gap-2 mb-8">
          {(["date", "time", "table", "details"] as const).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                ["date", "time", "table", "details"].indexOf(step) >= i
                  ? "bg-primary"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      )}

      {step === "date" && (
        <div className="space-y-4 animate-fade-up">
          <h2 className="font-display text-2xl font-semibold">Выберите дату</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {dateOptions.map((date) => (
              <button
                key={date}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTime("");
                  setSelectedTableId("");
                  setStep("time");
                }}
                className={`glass-card rounded-xl p-4 text-left transition-all hover:scale-[1.02] ${
                  selectedDate === date ? "ring-2 ring-primary" : ""
                }`}
              >
                <span className="text-sm text-muted block capitalize">
                  {new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
                    weekday: "short",
                    timeZone: content.timezone,
                  })}
                </span>
                <span className="font-medium">
                  {new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    timeZone: content.timezone,
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "time" && (
        <div className="space-y-4 animate-fade-up">
          <button
            onClick={() => setStep("date")}
            className="text-muted text-sm hover:text-foreground"
          >
            ← Назад
          </button>
          <h2 className="font-display text-2xl font-semibold capitalize">
            {formatDateLabel(selectedDate)}
          </h2>
          <p className="text-muted text-sm">
            Бронь на {durationHours} ч · слоты каждые {content.booking.intervalMinutes} мин
          </p>

          {loading && <p className="text-muted">Загрузка слотов…</p>}

          {!loading && availability && !availability.closed && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availability.slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => {
                    setSelectedTime(slot.time);
                    setSelectedTableId("");
                    setStep("table");
                  }}
                  className="glass-card rounded-lg py-3 text-center font-medium hover:ring-2 hover:ring-primary transition-all"
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {step === "table" && (
        <div className="space-y-4 animate-fade-up">
          <button
            onClick={() => setStep("time")}
            className="text-muted text-sm hover:text-foreground"
          >
            ← Назад
          </button>
          <h2 className="font-display text-2xl font-semibold">
            {selectedTime} · выберите столик
          </h2>

          <div className="space-y-3">
            {availableTables.map((table) => (
              <button
                key={table.id}
                onClick={() => {
                  setSelectedTableId(table.id);
                  setGuests(Math.min(guests, table.seats));
                  setStep("details");
                }}
                className="glass-card rounded-xl p-5 w-full text-left flex justify-between items-center hover:ring-2 hover:ring-primary transition-all"
              >
                <div>
                  <p className="font-medium text-lg">{table.name}</p>
                  <p className="text-muted text-sm">до {table.seats} гостей</p>
                </div>
                <span className="text-primary text-2xl">→</span>
              </button>
            ))}
          </div>

          {availableTables.length === 0 && (
            <p className="text-muted">Нет свободных столиков на это время</p>
          )}
        </div>
      )}

      {step === "details" && selectedTable && (
        <div className="space-y-4 animate-fade-up">
          <button
            onClick={() => setStep("table")}
            className="text-muted text-sm hover:text-foreground"
          >
            ← Назад
          </button>
          <h2 className="font-display text-2xl font-semibold">Ваши данные</h2>

          <div className="glass-card rounded-xl p-5 text-sm space-y-1">
            <p>
              <span className="text-muted">Дата: </span>
              {formatDateLabel(selectedDate)}
            </p>
            <p>
              <span className="text-muted">Время: </span>
              {selectedTime} ({durationHours} ч)
            </p>
            <p>
              <span className="text-muted">Столик: </span>
              {selectedTable.name}
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Имя</span>
            <input
              className="input-field"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Как к вам обращаться"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Телефон</span>
            <input
              className="input-field"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="+7 (___) ___-__-__"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Гостей</span>
            <input
              className="input-field"
              type="number"
              min={1}
              max={selectedTable.seats}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            />
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !guestName.trim() || !guestPhone.trim()}
            className="btn-primary w-full"
          >
            {submitting ? "Отправка…" : "Забронировать"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="text-center space-y-6 animate-fade-up py-8">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl"
            style={{ background: `${content.theme.primaryColor}30` }}
          >
            ✓
          </div>
          <h2 className="font-display text-3xl font-semibold">Заявка отправлена</h2>
          <p className="text-muted max-w-sm mx-auto">
            Мы получили вашу бронь и свяжемся для подтверждения. Также можете
            позвонить:{" "}
            <a href={`tel:${content.phone.replace(/[^\d+]/g, "")}`} className="text-foreground underline">
              {content.phone}
            </a>
          </p>
          <a href="/" className="btn-ghost inline-flex">
            На главную
          </a>
        </div>
      )}
    </div>
  );
}
