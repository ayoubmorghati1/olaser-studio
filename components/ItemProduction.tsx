"use client";
import type { Asset, Shot, Slide, Project } from "@/lib/schema";
import { useLanguage } from "./LanguageProvider";
import { itemPrompt } from "@/lib/item-prompt";
import { Field, ListField } from "./Fields";
export default function ItemProduction({
  item,
  project,
  assets,
  onChange,
  copy,
}: {
  item: Shot | Slide;
  project: Project;
  assets: Asset[];
  onChange: (patch: Partial<Shot & Slide>) => void;
  copy: (s: string) => Promise<void>;
}) {
  const { t, locale } = useLanguage();
  const en = locale === "en";
  const reel = "motionPrompt" in item;
  const filmed = reel && project.direction?.medium === "filmed";
  const ids = item.referenceIds ?? [];
  return (
    <div className="item-production">
      <span className="eyebrow">
        {filmed
          ? en
            ? "FILM THIS SHOT"
            : "NAGRAJ TO UJĘCIE"
          : reel
            ? "HIGGSFIELD"
            : en
              ? "CHATGPT · IMAGE"
              : "CHATGPT · OBRAZ"}
      </span>
      <p>
        {filmed
          ? en
            ? "Use the action, framing and sound instructions below to film this shot. AI generation is not required."
            : "Nagraj ujęcie według instrukcji akcji, kadru i dźwięku poniżej. Generacja AI nie jest wymagana."
          : reel
            ? en
              ? "Create the reference frame, then animate it in Higgsfield. Attach the selected references there."
              : "Utwórz klatkę referencyjną, a następnie animuj ją w Higgsfield. Dołącz tam wybrane referencje."
            : en
              ? "Generate the image in ChatGPT, then upload it in Create & export and select it for this slide. The studio adds the typography."
              : "Wygeneruj obraz w ChatGPT, wczytaj go w kroku Twórz i eksportuj i wybierz dla tego slajdu. Studio doda typografię."}
      </p>
      {!filmed && (
        <>
          <Field
            label={t("Prompt obrazu (EN)")}
            value={item.imagePrompt}
            multiline
            onChange={(v) => onChange({ imagePrompt: v })}
          />
          <div className="button-row">
            <button
              className="button subtle"
              onClick={() => void copy(itemPrompt(project, item, "image"))}
            >
              {en ? "Copy image prompt" : "Kopiuj prompt obrazu"}
            </button>
            <a
              className="button subtle"
              href={reel ? "https://higgsfield.ai/" : "https://chatgpt.com/"}
              target="_blank"
              rel="noreferrer"
            >
              {en ? "Open" : "Otwórz"} {reel ? "Higgsfield" : "ChatGPT"} ↗
            </a>
          </div>
          {reel && (
            <>
              <Field
                label={t("Prompt ruchu (EN)")}
                value={item.motionPrompt}
                multiline
                onChange={(v) => onChange({ motionPrompt: v })}
              />
              <button
                className="button subtle"
                onClick={() => void copy(itemPrompt(project, item, "motion"))}
              >
                {en ? "Copy motion prompt" : "Kopiuj prompt ruchu"}
              </button>
              <small>
                {en
                  ? "Durations and model settings are suggestions. Verify them in Higgsfield; copying does not start generation."
                  : "Czasy i ustawienia modelu są sugestiami. Sprawdź je w Higgsfield; kopiowanie nie uruchamia generacji."}
              </small>
            </>
          )}
        </>
      )}
      <h4>{en ? "Attach these references" : "Dołącz te referencje"}</h4>
      {assets.length ? (
        <div className="reference-picker">
          {assets.map((a) => (
            <label
              key={a.id}
              className={
                ids.includes(a.id)
                  ? "reference-option selected"
                  : "reference-option"
              }
            >
              <input
                type="checkbox"
                checked={ids.includes(a.id)}
                onChange={(e) =>
                  onChange({
                    referenceIds: e.target.checked
                      ? [...ids, a.id]
                      : ids.filter((id) => id !== a.id),
                  })
                }
              />
              <img src={a.data} alt="" />
              <span>{a.name}</span>
            </label>
          ))}
        </div>
      ) : (
        <p>
          {en
            ? "Upload production images in Create & export to assign them here."
            : "Wczytaj materiały w kroku Twórz i eksportuj, aby przypisać je tutaj."}
        </p>
      )}
      <ListField
        label={
          en
            ? "Additional reference requirements"
            : "Dodatkowe wymagania referencji"
        }
        value={item.references}
        onChange={(v) => onChange({ references: v })}
      />
      {ids.some((id) => !assets.some((a) => a.id === id)) && (
        <p role="alert">
          {en
            ? "An assigned reference is missing. Choose a replacement."
            : "Brakuje przypisanej referencji. Wybierz zamiennik."}
        </p>
      )}
    </div>
  );
}
