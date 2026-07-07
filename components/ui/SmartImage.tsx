"use client";

import { useState, memo } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { getOriginalUrl } from "@/utils/image";

// --- SISTEM CACHE KITSU ---
const kitsuCache = new Map<string, Promise<string | null>>();

async function fetchKitsuCover(title: string): Promise<string | null> {
  if (!title) return null;
  
  // Bersihkan judul dari simbol/karakter pengganggu pencarian Kitsu
  const cleanTitle = title.split(/[-–—~,|:]/)[0].replace(/[★☆]/g, " ").trim();
  const cacheKey = cleanTitle.toLowerCase();
  
  if (!cacheKey) return null;
  if (kitsuCache.has(cacheKey)) return kitsuCache.get(cacheKey)!;

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(cleanTitle)}`, {
        headers: {
          "Accept": "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json"
        }
      });

      if (!res.ok) return null;

      const json = await res.json();
      const attributes = json?.data?.[0]?.attributes;
      
      return attributes?.posterImage?.large || attributes?.posterImage?.original || null;
    } catch (error) {
      console.error("Kitsu fetch error:", error);
      return null;
    }
  })();

  kitsuCache.set(cacheKey, fetchPromise);
  return fetchPromise;
}

interface SmartImageProps {
  src: string;
  alt: string;
  title: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  unoptimized?: boolean;
  style?: React.CSSProperties;
  [key: string]: any;
}

const SmartImage = memo(function SmartImage(props: SmartImageProps) {
  const {
    src,
    alt,
    title,
    fill,
    className = "",
    priority,
    sizes,
    loading,
    decoding,
    unoptimized, 
    style,
    ...sisaProps
  } = props;

  // Menggunakan State Machine untuk mengontrol alur fallback secara sinkron
  const [prevSrc, setPrevSrc] = useState(src);
  const [imgSrc, setImgSrc] = useState(src || "/no-image.png");
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState<"proxy" | "original" | "kitsu" | "failed">(
    src && src.includes("wsrv.nl") ? "proxy" : "original"
  );

  // Derived State: Jika props src utama berubah (pindah komik/halaman), reset total statenya
  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgSrc(src || "/no-image.png");
    setLoaded(false);
    setAttempt(src && src.includes("wsrv.nl") ? "proxy" : "original");
  }

  const handleError = () => {
    setLoaded(false);

    // Langkah 1: Jika link wsrv.nl 404, preteli ambil URL aslinya
    if (attempt === "proxy" && imgSrc.includes("wsrv.nl")) {
      const original = getOriginalUrl(imgSrc);
      if (original && original !== imgSrc) {
        setAttempt("original");
        setImgSrc(original);
        return;
      }
    }

    // Langkah 2: Jika URL asli jebol juga, tembak Kitsu API pake Promise biar gak ngeblock thread
    if (attempt !== "kitsu" && attempt !== "failed" && title) {
      setAttempt("kitsu");
      
      fetchKitsuCover(title)
        .then((kitsuUrl) => {
          if (kitsuUrl) {
            setImgSrc(kitsuUrl);
          } else {
            setAttempt("failed");
            setImgSrc("/no-image.png");
          }
        })
        .catch(() => {
          setAttempt("failed");
          setImgSrc("/no-image.png");
        });
      return;
    }

    // Langkah 3: Semua lini gagal total, kunci di status failed dan pasang placeholder dasar
    setAttempt("failed");
    setImgSrc("/no-image.png");
  };

  if (!imgSrc || imgSrc === "/no-image.png" || attempt === "failed") {
    return (
      <div
        className={cn(
          "bg-[#181818] flex flex-col items-center justify-center text-center p-4 border border-neutral-800/50 selection:bg-transparent",
          fill ? "absolute inset-0 w-full h-full" : "w-full h-full min-h-[180px]",
          className
        )}
        style={style}
      >
        <ImageIcon className="text-neutral-600 w-8 h-8 mb-2 shrink-0 opacity-70 animate-pulse" />
        <span className="text-[10px] text-neutral-500 font-medium line-clamp-2 px-1 leading-snug max-w-[130px]">
          {alt || title || "No Image"}
        </span>
      </div>
    );
  }

  const cleanedImgProps = { ...sisaProps };
  const customPropsList = ["unoptimized", "title", "fill", "priority"];
  customPropsList.forEach((key) => delete cleanedImgProps[key]);

  return (
    <img
      src={imgSrc}
      alt={alt || title}
      sizes={sizes}
      loading={loading}
      decoding={decoding}
      style={style}
      onLoad={() => setLoaded(true)}
      onError={handleError}
      className={cn(
        fill ? "absolute inset-0 w-full h-full object-cover" : "",
        "transition-opacity duration-300 ease-in-out text-transparent", // <-- AMAN DARI TEKS BOCOR
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      {...(priority ? ({ fetchPriority: "high" } as any) : {})}
      {...cleanedImgProps}
    />
  );
});

export default SmartImage;
