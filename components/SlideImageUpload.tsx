"use client";
import { useState } from "react";
import type { Project } from "@/lib/schema";
import { imageAsset } from "@/lib/export";
import { useLanguage } from "./LanguageProvider";
export default function SlideImageUpload({
  slideId,
  projectId,
  assetCount,
  change,
}: {
  slideId: string;
  projectId: string;
  assetCount: number;
  change: (fn: (p: Project) => Project) => void;
}) {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="inline-image-upload">
      <label className="field">
        <span>
          {en
            ? "Upload the generated image for this slide"
            : "Wczytaj wygenerowany obraz tego slajdu"}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            setError("");
            try {
              if (assetCount >= 50)
                throw Error(
                  en
                    ? "Maximum 50 project images."
                    : "Maksymalnie 50 obrazów w projekcie.",
                );
              const asset = await imageAsset(file);
              change((p) => {
                if (p.id !== projectId || p.assets.length >= 50) return p;
                return {
                  ...p,
                  assets: [...p.assets, asset],
                  package:
                    p.package?.kind === "carousel"
                      ? {
                          ...p.package,
                          slides: p.package.slides.map((s) =>
                            s.id === slideId ? { ...s, imageId: asset.id } : s,
                          ),
                        }
                      : p.package,
                };
              });
            } catch (err) {
              setError(String(err));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
