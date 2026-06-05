import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getContent, saveContent } from "@/lib/content";
import type { SiteContent } from "@/lib/types";

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SiteContent;
    await saveContent(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }
}
