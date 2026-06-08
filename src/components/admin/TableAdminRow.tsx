"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Table } from "@/lib/types";

interface TableAdminRowProps {
  table: Table;
  onChange: (table: Table) => void;
  onRemove: () => void;
  onImageUploaded: (image: string) => void;
}

export function TableAdminRow({
  table,
  onChange,
  onRemove,
  onImageUploaded,
}: TableAdminRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError("");

    const form = new FormData();
    form.append("tableId", table.id);
    form.append("file", file);

    try {
      const res = await fetch("/api/tables/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const data = (await res.json()) as { image?: string; error?: string };

      if (res.ok && data.image) {
        onImageUploaded(data.image);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      setUploadError(
        data.error ??
          (res.status === 401
            ? "Сессия истекла — войдите в админку снова"
            : "Не удалось загрузить фото"),
      );
    } catch {
      setUploadError("Ошибка сети при загрузке");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      <div className="flex gap-4 items-start">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-surface shrink-0">
          {table.image ? (
            <Image
              src={table.image}
              alt={table.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-2xl text-muted">
              🪑
            </div>
          )}
        </div>

        <div className="flex-1 grid sm:grid-cols-2 gap-3">
          <input
            className="input-field"
            placeholder="Название"
            value={table.name}
            onChange={(e) => onChange({ ...table, name: e.target.value })}
          />
          <input
            type="number"
            className="input-field"
            min={1}
            placeholder="Мест"
            value={table.seats}
            onChange={(e) =>
              onChange({ ...table, seats: Number(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-ghost text-sm py-2 px-4"
          >
            {uploading ? "Загрузка…" : table.image ? "Сменить фото" : "Добавить фото"}
          </button>
          {uploadError && (
            <span className="text-red-400 text-sm">{uploadError}</span>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={table.enabled}
              onChange={(e) => onChange({ ...table, enabled: e.target.checked })}
              className="accent-primary"
            />
            Включён
          </label>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400 text-sm hover:underline"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
