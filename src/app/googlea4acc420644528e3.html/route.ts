import { NextResponse } from "next/server";

const BODY = "google-site-verification: googlea4acc420644528e3.html";

export async function GET() {
  return new NextResponse(BODY, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
