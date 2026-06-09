import path from "path";

export const TABLE_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "tables",
);

export const TABLE_IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function tableImageUrl(tableId: string, ext: string): string {
  return `/uploads/tables/${tableId}.${ext}`;
}

export function isSafeUploadFilename(filename: string): boolean {
  return (
    Boolean(filename) &&
    !filename.includes("..") &&
    !filename.includes("/") &&
    !filename.includes("\\")
  );
}
