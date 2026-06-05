import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createBookingRecord,
  getAvailability,
  isTableAvailable,
} from "@/lib/booking";
import {
  getActiveBookingsForDate,
  getBookings,
  saveBookings,
} from "@/lib/bookings-store";
import { getContent } from "@/lib/content";
import { getTables } from "@/lib/tables";
import { notifyBookingCreated } from "@/lib/telegram";
import type { BookingStatus } from "@/lib/types";

export async function GET(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const bookings = await getBookings();

  if (date) {
    return NextResponse.json(bookings.filter((b) => b.date === date));
  }

  return NextResponse.json(
    bookings.sort((a, b) => {
      const aKey = `${a.date}T${a.time}`;
      const bKey = `${b.date}T${b.time}`;
      return aKey.localeCompare(bKey);
    }),
  );
}

export async function POST(request: Request) {
  const content = await getContent();

  if (!content.booking.enabled) {
    return NextResponse.json(
      { error: "Бронирование отключено" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      tableId?: string;
      date?: string;
      time?: string;
      guestName?: string;
      guestPhone?: string;
      guests?: number;
    };

    const { tableId, date, time, guestName, guestPhone, guests } = body;

    if (
      !tableId ||
      !date ||
      !time ||
      !guestName?.trim() ||
      !guestPhone?.trim() ||
      !guests
    ) {
      return NextResponse.json(
        { error: "Заполните все поля" },
        { status: 400 },
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Некорректная дата или время" }, { status: 400 });
    }

    const [tables, bookings] = await Promise.all([
      getTables(),
      getActiveBookingsForDate(date),
    ]);

    const table = tables.find((t) => t.id === tableId && t.enabled);
    if (!table) {
      return NextResponse.json({ error: "Столик не найден" }, { status: 404 });
    }

    if (guests > table.seats) {
      return NextResponse.json(
        { error: `Максимум ${table.seats} гостей за этим столом` },
        { status: 400 },
      );
    }

    const availability = getAvailability(date, content, tables, bookings);
    const slot = availability.slots.find((s) => s.time === time);

    if (!slot || !slot.availableTableIds.includes(tableId)) {
      return NextResponse.json(
        { error: "Этот слот уже занят" },
        { status: 409 },
      );
    }

    if (
      !isTableAvailable(
        tableId,
        date,
        time,
        content.booking.durationMinutes,
        bookings,
      )
    ) {
      return NextResponse.json(
        { error: "Столик уже забронирован" },
        { status: 409 },
      );
    }

    const result = await createBookingRecord(
      {
        tableId,
        date,
        time,
        durationMinutes: content.booking.durationMinutes,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guests,
        status: "pending",
        kind: "guest",
        source: "online",
      },
      bookings,
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const allBookings = await getBookings();
    allBookings.push(result.booking);
    await saveBookings(allBookings);

    await notifyBookingCreated(result.booking, table, content.title);

    return NextResponse.json({ ok: true, booking: result.booking });
  } catch {
    return NextResponse.json({ error: "Ошибка бронирования" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = (await request.json()) as {
      id?: string;
      status?: BookingStatus;
    };

    if (!id || !status || !["pending", "confirmed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const bookings = await getBookings();
    const index = bookings.findIndex((b) => b.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    bookings[index] = { ...bookings[index], status };
    await saveBookings(bookings);

    return NextResponse.json({ ok: true, booking: bookings[index] });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
