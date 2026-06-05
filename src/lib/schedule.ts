import type { DaySchedule, OpenStatus, SiteContent } from "./types";

const DAY_NAMES = [
  "понедельник",
  "вторник",
  "среду",
  "четверг",
  "пятницу",
  "субботу",
  "воскресенье",
];

function formatHour(hour: number): string {
  const h = hour >= 24 ? hour - 24 : hour;
  return `${String(h).padStart(2, "0")}:00`;
}

function getNowInTimezone(timezone: string): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone }),
  );
}

function getBusinessDayIndex(date: Date, midnightHour: number): number {
  const hour = date.getHours();
  const jsDay = date.getDay();
  const mondayBased = jsDay === 0 ? 6 : jsDay - 1;

  if (hour < midnightHour) {
    return mondayBased === 0 ? 6 : mondayBased - 1;
  }

  return mondayBased;
}

function isWithinHours(currentHour: number, day: DaySchedule): boolean {
  if (day.close > 24) {
    return currentHour >= day.open || currentHour < day.close - 24;
  }

  return currentHour >= day.open && currentHour < day.close;
}

export function getOpenStatus(content: SiteContent, now = new Date()): OpenStatus {
  const local = getNowInTimezone(content.timezone);
  const hour = local.getHours() + local.getMinutes() / 60;
  const dayIndex = getBusinessDayIndex(local, content.schedule.midnightHour);
  const today = content.schedule.days[dayIndex];

  if (!today) {
    return { isOpen: false, label: "Расписание не настроено" };
  }

  if (isWithinHours(hour, today)) {
    const closeHour = today.close > 24 ? today.close - 24 : today.close;
    return {
      isOpen: true,
      label: `Открыто · Закроется в ${formatHour(closeHour)}`,
    };
  }

  const openHour = today.open;
  if (hour < today.open) {
    return {
      isOpen: false,
      label: `Сейчас закрыто · Откроется в ${formatHour(openHour)}`,
    };
  }

  const nextDayIndex = (dayIndex + 1) % 7;
  const nextDay = content.schedule.days[nextDayIndex];
  const nextOpen = nextDay?.open ?? today.open;

  return {
    isOpen: false,
    label: `Сейчас закрыто · Откроется в ${formatHour(nextOpen)}`,
    nextChange: DAY_NAMES[nextDayIndex],
  };
}

export function formatScheduleLine(day: DaySchedule): string {
  const open = formatHour(day.open);
  const close = formatHour(day.close);
  return `${open} — ${close}`;
}

export const WEEKDAY_LABELS = [
  "Пн",
  "Вт",
  "Ср",
  "Чт",
  "Пт",
  "Сб",
  "Вс",
];
