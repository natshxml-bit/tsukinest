"use client";
// features/chapter/components/PageViewer.tsx
// Renders either horizontal (single page) or vertical (scroll) reading modes.

import { ImageIcon } from "lucide-react";
import { fixUrl } from "@/features/chapter/utils/reader.utils";
import type { ChapterImage, FitMode, ReadMode } from "@/features/chapter/types";

interface PageViewerProps {
  images: ChapterImage[];
  mode: ReadMode;
  fit: FitMode;
  page: number;
  brokenImages: Set<number>;
  imgLoaded: boolean;
  onSetImgLoaded: (v: boolean) => void;
  onImageError: (index: number) => void;
  onToggleUI: () => void;
}

export function PageViewer({
  images,
  mode,
  fit,
  page,
  brokenImages,
  imgLoaded,
  onSetImgLoaded,
  onImageError,
  onToggleUI,
}: PageViewerProps) {
  if (mode === "horizontal") {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {!brokenImages.has(page) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={page}
            src={fixUrl(images[page]?.url)}
            alt={`Halaman ${page + 1}`}
            className={`${
              fit === "height"
                ? "h-screen w-auto max-w-none"
                : fit === "width"
                ? "w-full h-auto"
                : "max-w-full max-h-screen"
            } object-contain transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            draggable={false}
            referrerPolicy="no-referrer"
            decoding="async"
            onLoad={() => onSetImgLoaded(true)}
            onError={() => onImageError(page)}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/30">
            <ImageIcon className="w-10 h-10" />
            <span className="text-sm font-medium">Halaman {page + 1} — Gagal dimuat</span>
          </div>
        )}
      </div>
    );
  }

  // Vertical scroll mode
  return (
    <>
      {images.map((img, i) =>
        brokenImages.has(i) ? (
          <div
            key={i}
            className="w-full h-64 flex flex-col items-center justify-center text-white/20 text-sm border-y border-white/[0.03] gap-2"
          >
            <ImageIcon className="w-6 h-6" />
            <span>Halaman {i + 1} — Gagal dimuat</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={fixUrl(img.url)}
            alt={img.alt || `Halaman ${i + 1}`}
            onClick={onToggleUI}
            className={`${
              fit === "width" ? "w-full" : "max-w-full"
            } h-auto bg-[#080808] block select-none cursor-pointer`}
            loading={i < 2 ? "eager" : "lazy"}
            referrerPolicy="no-referrer"
            decoding="async"
            draggable={false}
            onError={() => onImageError(i)}
          />
        )
      )}
    </>
  );
}
