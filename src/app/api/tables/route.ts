import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getTables, saveTables } from "@/lib/tables";
import type { Table } from "@/lib/types";

export async function GET() {
  const tables = await getTables();
  return NextResponse.json(tables);
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tables = (await request.json()) as Table[];
    await saveTables(tables);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid tables" }, { status: 400 });
  }
}
