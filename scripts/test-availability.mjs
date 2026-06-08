import { readFileSync } from "fs";

const content = JSON.parse(readFileSync("data/content.json", "utf8"));

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
function hourToMinutes(hour) {
  return hour * 60;
}
function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const min = total % 60;
  const displayH = h >= 24 ? h - 24 : h;
  return `${String(displayH).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
function getLocalNow(timezone) {
  return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
}
function formatDateInput(date, timezone) {
  return date.toLocaleDateString("sv-SE", { timeZone: timezone });
}
function addDays(dateStr, days, timezone) {
  const base = new Date(`${dateStr}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return formatDateInput(base, timezone);
}
function getWeekdayIndex(dateStr, timezone) {
  const local = new Date(
    new Date(`${dateStr}T12:00:00Z`).toLocaleString("en-US", { timeZone: timezone }),
  );
  const jsDay = local.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}
function getBookingBusinessDate(content, now = new Date()) {
  const local = getLocalNow(content.timezone);
  const calendarToday = formatDateInput(now, content.timezone);
  if (local.getHours() < content.schedule.midnightHour) {
    return addDays(calendarToday, -1, content.timezone);
  }
  return calendarToday;
}
function slotOnShiftTimeline(time, openHour) {
  const minutes = timeToMinutes(time);
  const openMin = hourToMinutes(openHour);
  if (minutes < openMin) return minutes + 24 * 60;
  return minutes;
}
function nowOnShiftTimeline(local, openHour, midnightHour) {
  const minutes = local.getHours() * 60 + local.getMinutes();
  const openMin = hourToMinutes(openHour);
  if (local.getHours() < midnightHour) return minutes + 24 * 60;
  if (minutes < openMin) return openMin - 1;
  return minutes;
}
function generateSlotTimes(openHour, closeHour, intervalMinutes, durationMinutes) {
  const openMin = hourToMinutes(openHour);
  const closeMin = hourToMinutes(closeHour);
  const slots = [];
  for (let t = openMin; t + durationMinutes <= closeMin; t += intervalMinutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

const now = new Date();
const date = getBookingBusinessDate(content, now);
const dayIndex = getWeekdayIndex(date, content.timezone);
const daySchedule = content.schedule.days[dayIndex];
const slotTimes = generateSlotTimes(
  daySchedule.open,
  daySchedule.close,
  content.booking.intervalMinutes,
  content.booking.durationMinutes,
);
const localNow = getLocalNow(content.timezone);
const nowOnShift = nowOnShiftTimeline(
  localNow,
  daySchedule.open,
  content.schedule.midnightHour,
);

const visible = slotTimes.filter((time) => {
  const slotOnShift = slotOnShiftTimeline(time, daySchedule.open);
  return slotOnShift > nowOnShift;
});

console.log({
  date,
  daySchedule,
  localTime: `${localNow.getHours()}:${String(localNow.getMinutes()).padStart(2, "0")}`,
  nowOnShift,
  totalSlots: slotTimes.length,
  visibleSlots: visible.length,
  first: visible[0],
  last: visible[visible.length - 1],
});

if (visible.length === 0 && localNow.getHours() < daySchedule.open) {
  console.error("FAIL: should have slots before open");
  process.exit(1);
}

console.log("OK");
