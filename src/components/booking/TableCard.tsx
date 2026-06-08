"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageLightbox } from "@/components/booking/ImageLightbox";
import type { Table } from "@/lib/types";

interface TableCardProps {
  table: Table;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
  zoomableImage?: boolean;
  primaryColor?: string;
}

export function TableCard({
  table,
  selected,
  onSelect,
  compact,
  zoomableImage,
  primaryColor = "#0b5e02",
}: TableCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const imageClass = zoomableImage
    ? "w-full h-48 sm:h-56"
    : compact
      ? "w-full h-36"
      : "w-28 h-28 sm:w-32 sm:h-32";

  const imageContent = table.image ? (
    zoomableImage ? (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 group cursor-zoom-in"
          aria-label={`Увеличить фото: ${table.name}`}
        >
          <Image
            src={table.image}
            alt={table.name}
            fill
            className="object-cover transition-opacity group-hover:opacity-90"
            sizes="(max-width: 640px) 100vw, 640px"
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            Нажмите, чтобы увеличить
          </span>
        </button>
        {lightboxOpen && (
          <ImageLightbox
            src={table.image}
            alt={table.name}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </>
    ) : (
      <Image
        src={table.image}
        alt={table.name}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, 128px"
      />
    )
  ) : (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted"
      style={{
        background: `linear-gradient(145deg, ${primaryColor}22, transparent)`,
      }}
    >
      <span className="text-3xl opacity-60">🪑</span>
      <span className="text-xs">до {table.seats} мест</span>
    </div>
  );

  const imageBlock = (
    <div
      className={`relative overflow-hidden bg-surface shrink-0 ${
        zoomableImage ? "rounded-t-2xl" : "rounded-xl"
      } ${imageClass}`}
    >
      {imageContent}
    </div>
  );

  const infoBlock = (
    <div className={compact || zoomableImage ? "p-4 pt-3" : "flex-1 min-w-0"}>
      <p className="font-medium text-lg truncate">{table.name}</p>
      <p className="text-muted text-sm">до {table.seats} гостей</p>
    </div>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`glass-card rounded-2xl w-full text-left transition-all hover:ring-2 hover:ring-primary overflow-hidden ${
          compact ? "" : "p-4 flex items-center gap-4"
        } ${selected ? "ring-2 ring-primary" : ""}`}
      >
        {compact ? (
          <div className="flex flex-col">
            {imageBlock}
            {infoBlock}
          </div>
        ) : (
          <>
            {imageBlock}
            {infoBlock}
            <span className="text-primary text-2xl shrink-0 self-center">→</span>
          </>
        )}
      </button>
    );
  }

  if (zoomableImage) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        {imageBlock}
        {infoBlock}
      </div>
    );
  }

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden ${
        compact ? "" : "p-4 flex gap-4"
      }`}
    >
      {imageBlock}
      {infoBlock}
    </div>
  );
}
