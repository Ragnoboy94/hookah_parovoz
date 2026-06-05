import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getContent, saveContent } from "@/lib/content";
import { sendTelegramTest } from "@/lib/telegram";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let chatId: string | undefined;
  let saveChatId = false;

  try {
    const body = (await request.json()) as {
      chatId?: string;
      saveChatId?: boolean;
    };
    chatId = body.chatId;
    saveChatId = body.saveChatId ?? false;
  } catch {
    // body optional for backwards compatibility
  }

  if (saveChatId && chatId?.trim()) {
    const content = await getContent();
    await saveContent({
      ...content,
      telegram: {
        enabled: content.telegram?.enabled ?? false,
        chatId: chatId.trim(),
        notifyOnOnlineBooking:
          content.telegram?.notifyOnOnlineBooking ?? true,
        notifyOnAdminBooking: content.telegram?.notifyOnAdminBooking ?? true,
        notifyOnBlock: content.telegram?.notifyOnBlock ?? false,
      },
    });
  }

  const result = await sendTelegramTest(chatId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
