"use client";
import { useLanguage } from "./LanguageProvider";
import { useRef } from "react";
import { Upload, Trash2, ImagePlus } from "lucide-react";
import type { Project } from "@/lib/schema";
import { imageAsset } from "@/lib/export";
export default function Assets({
  current,
  change,
  run,
  notify,
}: {
  current: Project;
  change: (fn: (p: Project) => Project) => void;
  run: (fn: () => Promise<void>) => Promise<void>;
  notify: (message: string) => void;
}) {
  const { t } = useLanguage();
  const assetUploadRef = useRef<HTMLInputElement>(null);
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("REFERENCJE I OBRAZY")}</span>
          <h2>{t("Materiały tego projektu.")}</h2>
          <p>{t("PNG, JPG lub WebP · do 10 MB na plik · maks. 50 plików.")}</p>
        </div>
        <div>
          <button
            className="button subtle upload-button"
            onClick={() => assetUploadRef.current?.click()}
          >
            <Upload size={16} /> {t("Dodaj obrazy")}{" "}
          </button>
          <input
            ref={assetUploadRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              void run(async () => {
                if ((current?.assets.length ?? 0) + files.length > 50)
                  throw new Error(t("Maksymalnie 50 plików na projekt."));
                const assets = await Promise.all(files.map(imageAsset));
                change((p) => ({ ...p, assets: [...p.assets, ...assets] }));
                notify(t("Dodano materiały"));
              });
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {current?.assets.length ? (
        <div className="asset-grid">
          {current.assets.map((a) => (
            <div className="asset-card" key={a.id}>
              {/* Local user-controlled raster image. */}
              <img src={a.data} alt={a.name} />
              <span>{a.name}</span>
              <button
                className="icon-button"
                aria-label={t(`Usuń plik ${a.name}`)}
                onClick={() => {
                  if (
                    confirm(
                      t(
                        "Usunąć obraz? Slajdy korzystające z niego będą wymagały nowego obrazu.",
                      ),
                    )
                  )
                    change((p) => ({
                      ...p,
                      assets: p.assets.filter((x) => x.id !== a.id),
                      package:
                        p.package?.kind === "carousel"
                          ? {
                              ...p.package,
                              slides: p.package.slides.map((s) =>
                                s.imageId === a.id
                                  ? { ...s, imageId: undefined }
                                  : s,
                              ),
                            }
                          : p.package,
                    }));
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ImagePlus size={26} />
          <p>{t("Dodaj zatwierdzone referencje lub obrazy.")}</p>
          <small>
            {t("Nie zastępuj brakujących postaci przypadkową twarzą.")}
          </small>
        </div>
      )}
    </section>
  );
}
