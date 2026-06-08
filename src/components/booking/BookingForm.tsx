"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TableCard } from "@/components/booking/TableCard";
import type {
  BookingAvailability,
  SiteContent,
  Table,
} from "@/lib/types";

interface BookingFormProps {
  content: SiteContent;
  businessDate: string;
  businessDateLabel: string;
}

type Step = "time" | "table" | "details" | "done";

export function BookingForm({
  content,
  businessDate,
  businessDateLabel,
}: BookingFormProps) {
  const [step, setStep] = useState<Step>("time");
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guests, setGuests] = useState(2);
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/tables")
      .then((r) => r.json())
      .then((data: Table[]) => setTables(data.filter((t) => t.enabled)));
  }, []);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/bookings/availability?date=${businessDate}`);
    const data = (await res.json()) as BookingAvailability;
    setAvailability(data);
    setLoading(false);
    if (data.closed) {
      setError(data.closedReason ?? "Нет свободных слотов на сегодня");
    }
  }, [businessDate]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const availableTables = useMemo(() => {
    if (!availability || !selectedTime) return [];
    const slot = availability.slots.find((s) => s.time === selectedTime);
    if (!slot) return [];
    return tables.filter((t) => slot.availableTableIds.includes(t.id));
  }, [availability, selectedTime, tables]);

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  async function handleSubmit() {
    if (!selectedTableId || !selectedTime) return;

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: selectedTableId,
        date: businessDate,
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

  const durationHours = content.booking.durationMinutes / 60;
  const steps: Step[] = ["time", "table", "details"];

  return (
    <div className="max-w-2xl mx-auto">
      {step !== "done" && (
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                steps.indexOf(step) >= i ? "bg-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      )}

      {step === "time" && (
        <div className="space-y-4 animate-fade-up">
          <div>
            <p className="text-muted text-sm mb-1">Бронь на сегодня</p>
            <h2 className="font-display text-2xl font-semibold capitalize">
              {businessDateLabel}
            </h2>
          </div>
          <p className="text-muted text-sm">
            {durationHours} ч · слоты каждые {content.booking.intervalMinutes} мин
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

          <div className="grid sm:grid-cols-2 gap-4">
            {availableTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                compact
                primaryColor={content.theme.primaryColor}
                onSelect={() => {
                  setSelectedTableId(table.id);
                  setGuests(Math.min(guests, table.seats));
                  setStep("details");
                }}
              />
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

          <TableCard
            table={selectedTable}
            zoomableImage
            primaryColor={content.theme.primaryColor}
          />

          <div className="glass-card rounded-xl p-5 text-sm space-y-1">
            <p>
              <span className="text-muted">Дата: </span>
              {businessDateLabel}
            </p>
            <p>
              <span className="text-muted">Время: </span>
              {selectedTime} ({durationHours} ч)
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
            <a
              href={`tel:${content.phone.replace(/[^\d+]/g, "")}`}
              className="text-foreground underline"
            >
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
