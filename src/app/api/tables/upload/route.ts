import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getTables, saveTables } from "@/lib/tables";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "tables");
const MAX_SIZE = 5 * 1024 * 1024;

function resolveImageExt(file: File): "jpg" | "png" | "webp" | null {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime === "image/png" || name.endsWith(".png")) return "png";
  if (mime === "image/webp" || name.endsWith(".webp")) return "webp";
  if (
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/pjpeg" ||
    mime === "" ||
    mime === "application/octet-stream" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  ) {
    if (name.endsWith(".png") || name.endsWith(".webp")) return null;
    return "jpg";
  }

  return null;
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const tableId = form.get("tableId");

    if (!(file instanceof File) || typeof tableId !== "string" || !tableId.trim()) {
      return NextResponse.json({ error: "Нужны tableId и файл" }, { status: 400 });
    }

    const ext = resolveImageExt(file);
    if (!ext) {
      return NextResponse.json(
        { error: "Только JPG, PNG или WebP (не HEIC)" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Максимум 5 МБ" }, { status: 400 });
    }

    const tables = await getTables();
    if (!tables.some((t) => t.id === tableId)) {
      return NextResponse.json({ error: "Столик не найден" }, { status: 404 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${tableId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    const imagePath = `/uploads/tables/${filename}`;
    const updated = tables.map((t) =>
      t.id === tableId ? { ...t, image: imagePath } : t,
    );
    await saveTables(updated);

    return NextResponse.json({ ok: true, image: imagePath });
  } catch {
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
