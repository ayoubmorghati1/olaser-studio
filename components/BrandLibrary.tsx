"use client";
import { useRef, useState } from "react";
import type { BrandContext, BrandResource, Project } from "@/lib/schema";
import { contextLabels } from "@/lib/context";
import { characterProfiles, seriesRecipes } from "@/lib/direction";
import { download, imageAsset } from "@/lib/export";
import { Field } from "./Fields";
import { useLanguage } from "./LanguageProvider";
type Section = keyof typeof contextLabels;
export default function BrandLibrary({
  context: c,
  onChange,
  project,
  addResource,
}: {
  context: BrandContext;
  onChange: (c: BrandContext) => void;
  project?: Project | null;
  addResource?: (r: BrandResource) => void;
}) {
  const { locale, t } = useLanguage();
  const en = locale === "en";
  const [section, setSection] = useState<Section>("design");
  const [error, setError] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const resources = c.resources ?? [];
  const updateResource = (id: string, patch: Partial<BrandResource>) =>
    onChange({
      ...c,
      resources: resources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  return (
    <div className="brand-library">
      <p>
        {project
          ? en
            ? "This project uses its own saved context snapshot. Changes here affect this project."
            : "Ten projekt korzysta z własnej zapisanej kopii kontekstu. Zmiany tutaj dotyczą tego projektu."
          : en
            ? "Reusable context for new projects. Review the actual files and rules once, then use them throughout production."
            : "Wspólny kontekst nowych projektów. Sprawdź pliki i zasady raz, a następnie korzystaj z nich podczas produkcji."}
      </p>
      <div
        className="library-tabs"
        role="tablist"
        aria-label={en ? "Brand Library sections" : "Sekcje biblioteki marki"}
      >
        {Object.entries(contextLabels).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={section === key}
            className={section === key ? "selected" : ""}
            onClick={() => setSection(key as Section)}
          >
            {key === "production"
              ? en
                ? "Series & production"
                : "Serie i produkcja"
              : t(label)}
          </button>
        ))}
      </div>
      <section className="library-overview">
        <h3>
          {section === "production"
            ? en
              ? "Series & production"
              : "Serie i produkcja"
            : t(contextLabels[section])}
        </h3>
        {section === "design" && (
          <>
            <div className="brand-swatches">
              <div style={{ background: "#430102", color: "#eadfc2" }}>
                Burgundy <small>#430102</small>
              </div>
              <div style={{ background: "#eadfc2", color: "#430102" }}>
                Cream <small>#EADFC2</small>
              </div>
              <div style={{ background: "#c1914f", color: "#430102" }}>
                Gold <small>#C1914F</small>
              </div>
            </div>
            <p className="caption-note">
              {en
                ? "Palette from the supplied brief, awaiting source verification. Export typography uses bundled Montserrat."
                : "Paleta z dostarczonego briefu, do weryfikacji w źródłach. Eksport korzysta z dołączonej czcionki Montserrat."}
            </p>
            <div className="design-sample">
              <span>O’LASER</span>
              <h3>
                {en
                  ? "One thought. Clearly told."
                  : "Jedna myśl. Jasny przekaz."}
              </h3>
              <small>
                {en
                  ? "Typography and layout demonstration"
                  : "Demonstracja typografii i układu"}
              </small>
            </div>
          </>
        )}
        {section === "characters" && (
          <div className="library-cards">
            {characterProfiles.map((person) => (
              <article key={person.name}>
                <h4>{person.name}</h4>
                <p>{en ? person.en : person.pl}</p>
                <small>
                  {resources.some(
                    (r) =>
                      r.section === "characters" &&
                      r.image &&
                      r.reviewed &&
                      r.name.toLowerCase().includes(person.name.toLowerCase()),
                  )
                    ? en
                      ? "Reviewed reference available below"
                      : "Sprawdzona referencja poniżej"
                    : en
                      ? "Approved appearance reference still needed"
                      : "Potrzebna zatwierdzona referencja wyglądu"}
                </small>
              </article>
            ))}
          </div>
        )}
        {section === "production" && (
          <div className="library-cards">
            {seriesRecipes.map((recipe) => (
              <article key={recipe.id}>
                <h4>{recipe.id}</h4>
                <p>{en ? recipe.en : recipe.pl}</p>
              </article>
            ))}
          </div>
        )}
        <div className="readable-context">{c[section]}</div>
        <details className="source-details">
          <summary>
            {en ? "Edit underlying Markdown" : "Edytuj źródłowy Markdown"}
          </summary>
          <Field
            label={`${section}.md`}
            value={c[section]}
            multiline
            rows={10}
            onChange={(text) => onChange({ ...c, [section]: text })}
          />
        </details>
        <button
          className="button subtle"
          onClick={() => download(c[section], `${section}.md`)}
        >
          {en ? "Download" : "Pobierz"} {section}.md
        </button>
      </section>
      <section className="library-resources">
        <div className="section-heading">
          <div>
            <h3>{en ? "Files and resources" : "Pliki i zasoby"}</h3>
            <p>
              {en
                ? "Upload Markdown/text documents or raster images. Only reviewed text is included in prompts. Images must be attached in the destination tool; uploading does not analyze them."
                : "Wczytaj dokumenty Markdown/tekstowe lub obrazy. Tylko sprawdzony tekst trafia do promptów. Obrazy trzeba dołączyć w docelowym narzędziu; wczytanie nie oznacza analizy."}
            </p>
          </div>
          <button
            className="button primary"
            onClick={() => upload.current?.click()}
          >
            {en ? "Add resource" : "Dodaj zasób"}
          </button>
        </div>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <input
          ref={upload}
          type="file"
          hidden
          accept=".md,.txt,image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              if (resources.length >= 30)
                throw Error(
                  en ? "Maximum 30 resources." : "Maksymalnie 30 zasobów.",
                );
              let r: BrandResource = {
                id: crypto.randomUUID(),
                name: file.name,
                section,
                reviewed: false,
                source: "",
              };
              if (file.type.startsWith("image/")) {
                const asset = await imageAsset(file);
                r = { ...r, image: asset.data };
              } else {
                if (file.size > 50000)
                  throw Error(
                    en
                      ? "Text file must be under 50 KB."
                      : "Plik tekstowy musi mieć mniej niż 50 KB.",
                  );
                const text = await file.text();
                if (text.length > 20000)
                  throw Error(
                    en
                      ? "Text must be under 20,000 characters."
                      : "Tekst musi mieć mniej niż 20 000 znaków.",
                  );
                r = { ...r, text };
              }
              onChange({ ...c, resources: [...resources, r] });
              setError("");
            } catch (err) {
              setError(String(err));
            }
          }}
        />
        <div className="resource-list">
          {resources
            .filter((r) => r.section === section)
            .map((r) => (
              <article className="resource-card" key={r.id}>
                {r.image && <img src={r.image} alt={r.name} />}
                <div>
                  <h4>{r.name}</h4>
                  <Field
                    label={
                      en
                        ? "Source link / approval record"
                        : "Link źródłowy / zapis akceptacji"
                    }
                    value={r.source ?? ""}
                    onChange={(source) => updateResource(r.id, { source })}
                  />
                  {r.text !== undefined && (
                    <details>
                      <summary>
                        {en ? "Review extracted text" : "Sprawdź tekst"}
                      </summary>
                      <Field
                        label={
                          en
                            ? "Text included when reviewed"
                            : "Tekst uwzględniany po sprawdzeniu"
                        }
                        value={r.text}
                        multiline
                        rows={6}
                        onChange={(text) =>
                          updateResource(r.id, { text, reviewed: false })
                        }
                      />
                    </details>
                  )}
                  <label className="approval-check">
                    <input
                      type="checkbox"
                      checked={r.reviewed}
                      onChange={(e) =>
                        updateResource(r.id, { reviewed: e.target.checked })
                      }
                    />
                    {en
                      ? "Reviewed for use as brand context"
                      : "Sprawdzone do użycia jako kontekst marki"}
                  </label>
                  {project && r.image && addResource && (
                    <button
                      className="button subtle"
                      disabled={
                        !r.reviewed || project.assets.some((a) => a.id === r.id)
                      }
                      onClick={() => addResource(r)}
                    >
                      {project.assets.some((a) => a.id === r.id)
                        ? en
                          ? "Available in project"
                          : "Dostępne w projekcie"
                        : en
                          ? "Use reference in this project"
                          : "Użyj referencji w tym projekcie"}
                    </button>
                  )}
                  <button
                    className="text-button"
                    onClick={() => {
                      if (
                        confirm(
                          en
                            ? "Remove this resource from this context?"
                            : "Usunąć zasób z tego kontekstu?",
                        )
                      )
                        onChange({
                          ...c,
                          resources: resources.filter((x) => x.id !== r.id),
                        });
                    }}
                  >
                    {en ? "Remove" : "Usuń"}
                  </button>
                </div>
              </article>
            ))}
        </div>
        {!resources.some((r) => r.section === section) && (
          <p className="caption-note">
            {en
              ? "No source files attached to this section yet. Missing resources are not assumed to exist."
              : "Nie dołączono jeszcze plików źródłowych do tej sekcji. Brakujące zasoby nie są uznawane za dostępne."}
          </p>
        )}
      </section>
    </div>
  );
}
