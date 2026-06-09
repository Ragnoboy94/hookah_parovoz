import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  isSafeUploadFilename,
  TABLE_IMAGE_MIME,
  TABLE_UPLOAD_DIR,
} from "@/lib/uploads";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!isSafeUploadFilename(filename)) {
    return new NextResponse(null, { status: 404 });
  }

  const ext = path.extname(filename).slice(1).toLowerCase();
  const mime = TABLE_IMAGE_MIME[ext];
  if (!mime) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(TABLE_UPLOAD_DIR, filename));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
