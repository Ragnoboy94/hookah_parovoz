import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createBookingRecord,
  formatDateInput,
  getLocalNow,
  minutesUntilClose,
  roundTimeToInterval,
} from "@/lib/booking";
import {
  getActiveBookingsForDate,
  getBookings,
  saveBookings,
} from "@/lib/bookings-store";
import { getContent } from "@/lib/content";
import { getTables } from "@/lib/tables";
import { notifyBookingCreated } from "@/lib/telegram";
import type { BookingKind, BookingStatus } from "@/lib/types";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: "block" | "guest" | "block_now";
      tableId?: string;
      date?: string;
      time?: string;
      durationMinutes?: number;
      untilClose?: boolean;
      guestName?: string;
      guestPhone?: string;
      guests?: number;
      status?: BookingStatus;
      note?: string;
    };

    const content = await getContent();
    const [tables, allBookings] = await Promise.all([
      getTables(),
      getBookings(),
    ]);

    const today = formatDateInput(new Date(), content.timezone);
    const localNow = getLocalNow(content.timezone);

    let tableId = body.tableId;
    let date = body.date ?? today;
    let time = body.time;
    let durationMinutes =
      body.durationMinutes ?? content.booking.durationMinutes;
    let kind: BookingKind = "guest";
    let guestName = body.guestName?.trim() ?? "";
    let guestPhone = body.guestPhone?.trim() ?? "";
    let guests = body.guests ?? 1;
    let status: BookingStatus = body.status ?? "confirmed";
    let note = body.note;

    if (body.action === "block_now") {
      if (!tableId) {
        return NextResponse.json({ error: "Выберите столик" }, { status: 400 });
      }

      kind = "block";
      date = today;
      time = roundTimeToInterval(localNow, content.booking.intervalMinutes);
      durationMinutes = body.untilClose
        ? minutesUntilClose(date, time, content)
        : durationMinutes;
      guestName = "Занято";
      guestPhone = "—";
      guests = 1;
      status = "confirmed";
      note = body.note?.trim() || "Гости за столом";
    } else if (body.action === "block") {
      kind = "block";
      guestName = body.guestName?.trim() || "Занято";
      guestPhone = "—";
      guests = 1;
      status = "confirmed";
      if (!time) {
        return NextResponse.json({ error: "Укажите время" }, { status: 400 });
      }
    } else {
      kind = "guest";
      if (!guestName) {
        return NextResponse.json({ error: "Укажите имя гостя" }, { status: 400 });
      }
      if (!time) {
        return NextResponse.json({ error: "Укажите время" }, { status: 400 });
      }
      status = body.status ?? "confirmed";
    }

    if (!tableId || !date || !time) {
      return NextResponse.json({ error: "Заполните столик, дату и время" }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Некорректная дата или время" }, { status: 400 });
    }

    const table = tables.find((t) => t.id === tableId);
    if (!table) {
      return NextResponse.json({ error: "Столик не найден" }, { status: 404 });
    }

    if (kind === "guest" && guests > table.seats) {
      return NextResponse.json(
        { error: `Максимум ${table.seats} гостей` },
        { status: 400 },
      );
    }

    const dayBookings = allBookings.filter(
      (b) => b.date === date && b.status !== "cancelled",
    );

    const result = await createBookingRecord(
      {
        tableId,
        date,
        time,
        durationMinutes,
        guestName,
        guestPhone,
        guests,
        status,
        kind,
        source: "admin",
        note,
      },
      dayBookings,
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    allBookings.push(result.booking);
    await saveBookings(allBookings);

    await notifyBookingCreated(result.booking, table, content.title);

    return NextResponse.json({ ok: true, booking: result.booking });
  } catch {
    return NextResponse.json({ error: "Ошибка создания" }, { status: 400 });
  }
}
