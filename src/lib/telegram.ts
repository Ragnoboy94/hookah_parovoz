import { getContent } from "./content";
import type { Booking, SiteContent, Table } from "./types";
import { getBookingEndTime } from "./booking";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function getChatId(content: SiteContent): string | undefined {
  const fromEnv = process.env.TELEGRAM_CHAT_ID;
  if (fromEnv?.trim()) return fromEnv.trim();
  if (content.telegram?.chatId?.trim()) return content.telegram.chatId.trim();
  return undefined;
}

export async function sendTelegramMessage(
  text: string,
  options?: { force?: boolean },
): Promise<boolean> {
  const token = getBotToken();
  const content = await getContent();
  const chatId = getChatId(content);

  if (!token || !chatId) {
    return false;
  }

  if (!options?.force && !content.telegram?.enabled) {
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

function formatBookingDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export async function notifyBookingCreated(
  booking: Booking,
  table: Table | undefined,
  venueTitle: string,
): Promise<void> {
  const content = await getContent();
  const telegram = content.telegram;

  if (!telegram?.enabled) return;

  const isBlock = booking.kind === "block";
  const isOnline = booking.source === "online";

  if (isBlock && !telegram.notifyOnBlock) return;
  if (!isBlock && isOnline && !telegram.notifyOnOnlineBooking) return;
  if (!isBlock && !isOnline && !telegram.notifyOnAdminBooking) return;

  const tableName = escapeHtml(table?.name ?? booking.tableId);
  const endTime = getBookingEndTime(booking.time, booking.durationMinutes);

  if (isBlock) {
    const note = booking.note
      ? `\n💬 ${escapeHtml(booking.note)}`
      : "";
    await sendTelegramMessage(
      `🔒 <b>Стол заблокирован</b> · ${escapeHtml(venueTitle)}\n` +
        `🪑 ${tableName}\n` +
        `📅 ${formatBookingDate(booking.date)}, ${booking.time} — ${endTime}${note}`,
    );
    return;
  }

  const statusLabel =
    booking.status === "confirmed"
      ? "подтверждено"
      : "ожидает подтверждения";
  const sourceLabel = isOnline ? "с сайта" : "админом";

  await sendTelegramMessage(
    `🆕 <b>Новая бронь</b> · ${escapeHtml(venueTitle)} (${sourceLabel})\n` +
      `👤 ${escapeHtml(booking.guestName)}\n` +
      `📞 ${escapeHtml(booking.guestPhone || "—")}\n` +
      `📅 ${formatBookingDate(booking.date)}, ${booking.time} — ${endTime}\n` +
      `🪑 ${tableName} · ${booking.guests} гост.\n` +
      `Статус: ${statusLabel}`,
  );
}

export async function sendTelegramTest(): Promise<{ ok: boolean; error?: string }> {
  const token = getBotToken();
  const content = await getContent();
  const chatId = getChatId(content);

  if (!token) {
    return { ok: false, error: "Не задан TELEGRAM_BOT_TOKEN в .env" };
  }
  if (!chatId) {
    return { ok: false, error: "Не задан Chat ID" };
  }

  const ok = await sendTelegramMessage(
    `✅ <b>Тест</b> · ${escapeHtml(content.title)}\nБот подключён, уведомления работают.`,
    { force: true },
  );

  return ok ? { ok: true } : { ok: false, error: "Telegram API вернул ошибку" };
}
