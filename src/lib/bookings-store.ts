import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { Booking } from "./types";

const BOOKINGS_PATH = path.join(process.cwd(), "data", "bookings.json");

function normalizeBooking(booking: Booking): Booking {
  return {
    ...booking,
    kind: booking.kind ?? "guest",
    source: booking.source ?? "online",
    guestPhone: booking.guestPhone ?? "",
  };
}

export async function getBookings(): Promise<Booking[]> {
  const raw = await readFile(BOOKINGS_PATH, "utf-8");
  const bookings = JSON.parse(raw) as Booking[];
  return bookings.map(normalizeBooking);
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  await writeFile(BOOKINGS_PATH, JSON.stringify(bookings, null, 2), "utf-8");
}

export async function getActiveBookingsForDate(date: string): Promise<Booking[]> {
  const bookings = await getBookings();
  return bookings.filter(
    (b) => b.date === date && b.status !== "cancelled",
  );
}
