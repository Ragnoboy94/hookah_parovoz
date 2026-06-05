import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sendTelegramTest } from "@/lib/telegram";

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendTelegramTest();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
