import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/booking";
import { getActiveBookingsForDate } from "@/lib/bookings-store";
import { getContent } from "@/lib/content";
import { getTables } from "@/lib/tables";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const [content, tables, bookings] = await Promise.all([
    getContent(),
    getTables(),
    getActiveBookingsForDate(date),
  ]);

  if (!content.booking.enabled) {
    return NextResponse.json({
      date,
      slots: [],
      closed: true,
      closedReason: "Бронирование временно отключено",
    });
  }

  const availability = getAvailability(date, content, tables, bookings);
  return NextResponse.json(availability);
}
