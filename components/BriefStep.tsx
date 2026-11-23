"use client";
import type { Project, Brief } from "@/lib/schema";
import { seriesRecipes, characterProfiles, recipeFor } from "@/lib/direction";
import { useLanguage } from "./LanguageProvider";
import { Field } from "./Fields";
export default function BriefStep({
  project: p,
  change,
  next,
  library,
}: {
  project: Project;
  change: (fn: (p: Project) => Project) => void;
  next: () => void;
  library: () => void;
}) {
  const { locale } = useLanguage();
  const en = locale === "en";
  const patch = (v: Partial<Brief>) =>
    change((p) => ({
      ...p,
      title: v.idea ?? p.title,
      brief: { ...p.brief, ...v },
      direction: p.direction ? { ...p.direction, approved: false } : undefined,
    }));
  const recipe = recipeFor(p);
  const series = [
    ...new Set(
      [p.brief.series, ...seriesRecipes.map((r) => r.id)].filter(Boolean),
    ),
  ];
  const characters = [
    ...new Set(
      [
        p.brief.character,
        ...characterProfiles.map((c) => c.name),
        "Client (real)",
      ].filter(Boolean),
    ),
  ];
  return (
    <section className="panel idea-step">
      <span className="eyebrow">
        {en ? "YOUR IDEA, WITH CONTEXT" : "TWÓJ POMYSŁ Z KONTEKSTEM"}
      </span>
      <h2>{en ? "What are we making?" : "Co tworzymy?"}</h2>
      <p>
        {en
          ? "Calendar details and brand defaults are already here. Adjust only what this post needs."
          : "Dane kalendarza i ustawienia marki są już tutaj. Zmień tylko to, czego potrzebuje ten post."}
      </p>
      <Field
        label={en ? "Idea / message" : "Pomysł / przekaz"}
        value={p.brief.idea}
        multiline
        onChange={(idea) => patch({ idea })}
      />
      <div className="brief-summary">
        <span>{p.kind === "reel" ? "Reel" : "Carousel"}</span>
        <span>
          {p.brief.series || (en ? "No series selected" : "Nie wybrano serii")}
        </span>
        <span>
          {p.brief.character || (en ? "No character" : "Bez postaci")}
        </span>
        <span>{p.brief.outputLanguage === "en" ? "English" : "Polski"}</span>
        <span>
          {p.brief.target} {p.kind === "reel" ? "s" : en ? "slides" : "slajdów"}
        </span>
      </div>
      {recipe && (
        <div className="recipe-note">
          <b>{en ? "Series recipe" : "Przepis serii"}</b>
          <p>{en ? recipe.en : recipe.pl}</p>
        </div>
      )}
      <div className="two-col">
        <Field
          label="CTA"
          value={p.brief.cta}
          onChange={(cta) => patch({ cta })}
        />
        <Field
          label={
            p.kind === "reel"
              ? en
                ? "Length in seconds"
                : "Długość w sekundach"
              : en
                ? "Number of slides"
                : "Liczba slajdów"
          }
          type="number"
          value={p.brief.target}
          onChange={(value) =>
            patch({
              target: Math.max(
                1,
                Math.min(p.kind === "reel" ? 180 : 20, Number(value) || 1),
              ),
            })
          }
        />
      </div>
      <details className="source-details">
        <summary>
          {en ? "Change inherited settings" : "Zmień odziedziczone ustawienia"}
        </summary>
        <div className="two-col">
          <label className="field">
            <span>{en ? "Series" : "Seria"}</span>
            <select
              value={p.brief.series}
              onChange={(e) => patch({ series: e.target.value })}
            >
              <option value="">
                {en ? "One-off post" : "Post poza serią"}
              </option>
              {series.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{en ? "Character" : "Postać"}</span>
            <select
              value={p.brief.character}
              onChange={(e) => patch({ character: e.target.value })}
            >
              <option value="">{en ? "No character" : "Bez postaci"}</option>
              {characters.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{en ? "Content language" : "Język treści"}</span>
            <select
              value={p.brief.outputLanguage ?? "pl"}
              onChange={(e) =>
                patch({ outputLanguage: e.target.value as "en" | "pl" })
              }
            >
              <option value="pl">Polski</option>
              <option value="en">English</option>
            </select>
          </label>
          <Field
            label={
              en
                ? "Audience override (optional)"
                : "Inni odbiorcy (opcjonalnie)"
            }
            value={p.brief.audience}
            onChange={(audience) => patch({ audience })}
          />
        </div>
        <Field
          label={en ? "Calendar angle" : "Kierunek z kalendarza"}
          value={p.brief.angle ?? ""}
          multiline
          onChange={(angle) => patch({ angle })}
        />
      </details>
      <details className="source-details">
        <summary>
          {en ? "Original calendar entry" : "Oryginalny wpis z kalendarza"}
        </summary>
        <pre className="source-copy">
          {p.brief.sourceText ||
            (en
              ? "Custom idea — no calendar row."
              : "Własny pomysł — brak wiersza kalendarza.")}
        </pre>
      </details>
      <div className="context-used">
        <b>
          {en ? "Context used automatically" : "Kontekst używany automatycznie"}
        </b>
        <p>
          {en
            ? "Brand voice · visual direction · character rules · approved claims · series recipe. Existing projects keep their own snapshot."
            : "Głos marki · kierunek wizualny · zasady postaci · zatwierdzone twierdzenia · przepis serii. Projekty zachowują własną kopię."}
        </p>
        <button className="text-button" onClick={library}>
          {en ? "Review Brand Library" : "Sprawdź bibliotekę marki"}
        </button>
      </div>
      <div className="button-row">
        <button
          className="button primary"
          disabled={!p.brief.idea.trim()}
          onClick={next}
        >
          {en ? "Next: creative direction →" : "Dalej: kierunek kreatywny →"}
        </button>
      </div>
    </section>
  );
}
