import type {
  Booking,
  BookingAvailability,
  BookingKind,
  BookingSource,
  BookingStatus,
  SiteContent,
  SlotAvailability,
  Table,
} from "./types";

export interface CreateBookingInput {
  tableId: string;
  date: string;
  time: string;
  durationMinutes: number;
  guestName: string;
  guestPhone: string;
  guests: number;
  status: BookingStatus;
  kind: BookingKind;
  source: BookingSource;
  note?: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const min = total % 60;
  const displayH = h >= 24 ? h - 24 : h;
  return `${String(displayH).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function hourToMinutes(hour: number): number {
  return hour * 60;
}

export function getWeekdayIndex(dateStr: string, timezone: string): number {
  const local = new Date(
    new Date(`${dateStr}T12:00:00Z`).toLocaleString("en-US", {
      timeZone: timezone,
    }),
  );
  const jsDay = local.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function formatDateInput(date: Date, timezone: string): string {
  return date.toLocaleDateString("sv-SE", { timeZone: timezone });
}

export function addDays(dateStr: string, days: number, timezone: string): string {
  const base = new Date(`${dateStr}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return formatDateInput(base, timezone);
}

/** Calendar date for the current business shift (before midnightHour counts as previous day). */
export function getBookingBusinessDate(
  content: SiteContent,
  now = new Date(),
): string {
  const local = getLocalNow(content.timezone);
  const calendarToday = formatDateInput(now, content.timezone);

  if (local.getHours() < content.schedule.midnightHour) {
    return addDays(calendarToday, -1, content.timezone);
  }

  return calendarToday;
}

/**
 * Continuous minutes on the overnight shift (open → close past midnight).
 * Slot times like 01:00 are after midnight and sit after 23:00 on the timeline.
 */
function slotOnShiftTimeline(time: string, openHour: number): number {
  const minutes = timeToMinutes(time);
  const openMin = hourToMinutes(openHour);

  if (minutes < openMin) {
    return minutes + 24 * 60;
  }

  return minutes;
}

/** Current moment on the same shift timeline. */
function nowOnShiftTimeline(
  local: Date,
  openHour: number,
  midnightHour: number,
): number {
  const minutes = local.getHours() * 60 + local.getMinutes();
  const openMin = hourToMinutes(openHour);

  if (local.getHours() < midnightHour) {
    return minutes + 24 * 60;
  }

  if (minutes < openMin) {
    return openMin - 1;
  }

  return minutes;
}

function bookingRangeMinutes(
  time: string,
  durationMinutes: number,
): [number, number] {
  const start = timeToMinutes(time);
  let end = start + durationMinutes;
  if (end <= start) {
    end += 24 * 60;
  }
  return [start, end];
}

function rangesOverlap(
  a: [number, number],
  b: [number, number],
): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

export function isTableAvailable(
  tableId: string,
  date: string,
  time: string,
  durationMinutes: number,
  bookings: Booking[],
): boolean {
  const range = bookingRangeMinutes(time, durationMinutes);

  return !bookings.some((booking) => {
    if (booking.tableId !== tableId || booking.status === "cancelled") {
      return false;
    }
    if (booking.date !== date) {
      return false;
    }
    return rangesOverlap(range, bookingRangeMinutes(booking.time, booking.durationMinutes));
  });
}

function generateSlotTimes(
  openHour: number,
  closeHour: number,
  intervalMinutes: number,
  durationMinutes: number,
): string[] {
  const openMin = hourToMinutes(openHour);
  const closeMin = hourToMinutes(closeHour);
  const slots: string[] = [];

  for (let t = openMin; t + durationMinutes <= closeMin; t += intervalMinutes) {
    slots.push(minutesToTime(t));
  }

  return slots;
}

export function getAvailability(
  date: string,
  content: SiteContent,
  tables: Table[],
  bookings: Booking[],
  now = new Date(),
): BookingAvailability {
  const enabledTables = tables.filter((t) => t.enabled);
  const dayIndex = getWeekdayIndex(date, content.timezone);
  const daySchedule = content.schedule.days[dayIndex];

  if (!daySchedule) {
    return {
      date,
      slots: [],
      closed: true,
      closedReason: "Расписание не настроено",
    };
  }

  const businessToday = getBookingBusinessDate(content, now);
  const calendarToday = formatDateInput(now, content.timezone);
  const maxDate = content.booking.onlyTodayOnline
    ? businessToday
    : addDays(calendarToday, content.booking.maxAdvanceDays, content.timezone);
  const minDate = content.booking.onlyTodayOnline ? businessToday : calendarToday;

  if (date < minDate || date > maxDate) {
    return {
      date,
      slots: [],
      closed: true,
      closedReason: content.booking.onlyTodayOnline
        ? "Онлайн-бронь только на текущую смену"
        : "Дата недоступна для бронирования",
    };
  }

  const slotTimes = generateSlotTimes(
    daySchedule.open,
    daySchedule.close,
    content.booking.intervalMinutes,
    content.booking.durationMinutes,
  );

  const localNow = getLocalNow(content.timezone);
  const onCurrentShift = date === businessToday;
  const nowOnShift = onCurrentShift
    ? nowOnShiftTimeline(
        localNow,
        daySchedule.open,
        content.schedule.midnightHour,
      )
    : -1;

  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const slots: SlotAvailability[] = [];

  for (const time of slotTimes) {
    const slotOnShift = slotOnShiftTimeline(time, daySchedule.open);

    if (onCurrentShift && slotOnShift <= nowOnShift) {
      continue;
    }

    const availableTableIds = enabledTables
      .filter((table) =>
        isTableAvailable(
          table.id,
          date,
          time,
          content.booking.durationMinutes,
          activeBookings,
        ),
      )
      .map((t) => t.id);

    if (availableTableIds.length > 0) {
      slots.push({ time, availableTableIds });
    }
  }

  return {
    date,
    slots,
    closed: slots.length === 0,
    closedReason: slots.length === 0 ? "Нет свободных слотов" : undefined,
  };
}

export function createBookingId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function getLocalNow(timezone: string): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone }),
  );
}

export function roundTimeToInterval(
  date: Date,
  intervalMinutes: number,
): string {
  const total = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.floor(total / intervalMinutes) * intervalMinutes;
  return minutesToTime(rounded);
}

export function minutesUntilClose(
  date: string,
  time: string,
  content: SiteContent,
): number {
  const dayIndex = getWeekdayIndex(date, content.timezone);
  const day = content.schedule.days[dayIndex];
  if (!day) return content.booking.durationMinutes;

  const closeMin = hourToMinutes(day.close);
  const startMin = timeToMinutes(time);
  const remaining = closeMin - startMin;

  if (remaining <= 0) return content.booking.durationMinutes;
  return Math.max(content.booking.durationMinutes, remaining);
}

export function getBookingEndTime(time: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(time) + durationMinutes);
}

export function isBookingActiveAt(
  booking: Booking,
  nowMinutes: number,
): boolean {
  if (booking.status === "cancelled") return false;
  const [start, end] = bookingRangeMinutes(
    booking.time,
    booking.durationMinutes,
  );
  return nowMinutes >= start && nowMinutes < end;
}

export async function createBookingRecord(
  input: CreateBookingInput,
  existingBookings: Booking[],
): Promise<{ ok: true; booking: Booking } | { ok: false; error: string }> {
  if (
    !isTableAvailable(
      input.tableId,
      input.date,
      input.time,
      input.durationMinutes,
      existingBookings,
    )
  ) {
    return { ok: false, error: "Столик занят в это время" };
  }

  const booking: Booking = {
    id: createBookingId(),
    tableId: input.tableId,
    date: input.date,
    time: input.time,
    durationMinutes: input.durationMinutes,
    guestName: input.guestName.trim(),
    guestPhone: input.guestPhone.trim(),
    guests: input.guests,
    status: input.status,
    kind: input.kind,
    source: input.source,
    note: input.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  return { ok: true, booking };
}
