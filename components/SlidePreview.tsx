"use client";
import { useLanguage } from "./LanguageProvider";
import { useEffect, useRef, useState } from "react";
import { drawSlide } from "@/lib/slides";
import type { Slide, Asset } from "@/lib/schema";
export default function SlidePreview({
  slide,
  index,
  total,
  asset,
  onStatus,
  language = "pl",
}: {
  slide: Slide;
  index: number;
  total: number;
  asset?: Asset;
  language?: "en" | "pl";
  onStatus?: (id: string, blocked: boolean) => void;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLCanvasElement>(null);
  const [problem, setProblem] = useState("");
  useEffect(() => {
    let live = true;
    async function render() {
      try {
        const buffer = document.createElement("canvas");
        const blocked = await drawSlide(
          buffer,
          slide,
          index,
          total,
          asset,
          language,
        );
        if (live) {
          const canvas = ref.current!;
          canvas.width = buffer.width;
          canvas.height = buffer.height;
          canvas.getContext("2d")?.drawImage(buffer, 0, 0);
          setProblem(
            blocked
              ? t(
                  "Tekst nie mieści się lub brakuje obrazu. Eksport zablokowany.",
                )
              : "",
          );
          onStatus?.(slide.id, blocked);
        }
      } catch (e) {
        if (live) {
          setProblem(e instanceof Error ? e.message : t("Błąd podglądu"));
          onStatus?.(slide.id, true);
        }
      }
    }
    void render();
    return () => {
      live = false;
    };
  }, [slide, index, total, asset, onStatus, t, language]);
  return (
    <div className="slide-preview">
      <canvas
        ref={ref}
        role="img"
        aria-label={slide.alt || `${slide.headline}. ${slide.body}`}
      />
      {problem && (
        <p className="error" role="alert">
          {t(problem)}
        </p>
      )}
    </div>
  );
}
