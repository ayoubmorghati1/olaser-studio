"use client";
import { useEffect, useRef, useState } from "react";
import type { Project, Direction, Inspiration } from "@/lib/schema";
import {
  startingDirection,
  directionPrompt,
  inspirationPrompt,
  analysisInput,
} from "@/lib/direction";
import { readInspiration } from "@/lib/inspiration";
import { requestCreative } from "@/lib/creative-client";
import { useLanguage } from "./LanguageProvider";
import { Field } from "./Fields";
export default function DirectionStep({
  project: p,
  change,
  next,
  copy,
}: {
  project: Project;
  change: (fn: (p: Project) => Project) => void;
  next: () => void;
  copy: (text: string) => Promise<void>;
}) {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [ai, setAI] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [candidate, setCandidate] = useState<Direction | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    fetch("/api/creative")
      .then((r) => r.json())
      .then((data) => {
        if (live.current) setAI(data.enabled === true);
      })
      .catch(() => {});
    return () => {
      live.current = false;
    };
  }, []);
  const d = p.direction ?? startingDirection(p, locale);
  const update = (patch: Partial<Direction>) =>
    change((x) => ({
      ...x,
      direction: {
        ...(x.direction ?? startingDirection(x, locale)),
        ...patch,
        approved: false,
      },
    }));
  const updateInspiration = (id: string, patch: Partial<Inspiration>) =>
    change((x) => ({
      ...x,
      direction: x.direction ? { ...x.direction, approved: false } : undefined,
      inspirations: (x.inspirations ?? []).map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      ),
    }));
  const perform = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      if (live.current)
        setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (live.current) setBusy(false);
    }
  };
  return (
    <section className="direction-step">
      <div className="panel">
        <span className="eyebrow">
          {en ? "CREATIVE DIRECTION" : "KIERUNEK KREATYWNY"}
        </span>
        <h2>
          {en
            ? "How should this post come to life?"
            : "Jak ten post ma wyglądać?"}
        </h2>
        <p>
          {en
            ? "Start with the series suggestion, add your own ideas, or ask AI. Inspiration is optional. Approve the direction before preparing the prompts."
            : "Zacznij od sugestii serii, dodaj własne pomysły lub zapytaj AI. Inspiracja jest opcjonalna. Zatwierdź kierunek przed przygotowaniem promptów."}
        </p>
        <div className="info-banner">
          {ai
            ? en
              ? "AI is configured. Suggestions and analysis use metered credits only when you click. Your brief and relevant context are sent to the configured AI provider."
              : "AI jest skonfigurowane. Sugestie i analiza zużywają płatne kredyty tylko po kliknięciu. Brief i odpowiedni kontekst trafiają do skonfigurowanego dostawcy AI."
            : en
              ? "Built-in AI is not configured. You can edit the series starting point and use the manual ChatGPT prompts below."
              : "Wbudowane AI nie jest skonfigurowane. Możesz edytować punkt wyjścia serii i skorzystać z ręcznych promptów do ChatGPT poniżej."}
        </div>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <fieldset disabled={busy} className="plain-fieldset">
          <div className="button-row">
            <button
              className="button subtle"
              onClick={() => {
                if (
                  confirm(
                    en
                      ? "Replace the current direction with the series starting point?"
                      : "Zastąpić obecny kierunek punktem wyjścia serii?",
                  )
                )
                  change((x) => ({
                    ...x,
                    direction: startingDirection(x, locale),
                  }));
              }}
            >
              {en ? "Use series starting point" : "Użyj punktu wyjścia serii"}
            </button>
            <button
              className="button primary"
              disabled={!ai || busy}
              onClick={() =>
                void perform(async () => {
                  const result = await requestCreative(
                    "direction",
                    { ...p, direction: d },
                    locale,
                  );
                  if (live.current && result.direction)
                    setCandidate(result.direction);
                })
              }
            >
              {busy
                ? en
                  ? "Working…"
                  : "Pracuję…"
                : en
                  ? "Suggest with AI"
                  : "Zaproponuj z AI"}
            </button>
          </div>
          <Field
            label={
              en
                ? "Your idea / extra instructions (optional)"
                : "Twój pomysł / dodatkowe wskazówki (opcjonalnie)"
            }
            value={d.notes}
            multiline
            onChange={(notes) => update({ notes })}
          />
          <div className="two-col">
            <Field
              label={en ? "Approach" : "Podejście"}
              value={d.approach}
              onChange={(approach) => update({ approach })}
            />
            <label className="field">
              <span>
                {en ? "How visuals are produced" : "Jak powstają materiały"}
              </span>
              <select
                value={d.medium}
                onChange={(e) =>
                  update({ medium: e.target.value as Direction["medium"] })
                }
              >
                <option value="generated">
                  {en ? "AI-generated visuals" : "Materiały generowane AI"}
                </option>
                <option value="filmed">
                  {en ? "Filmed footage" : "Nagrane materiały"}
                </option>
                <option value="mixed">{en ? "Mixed" : "Mieszane"}</option>
              </select>
            </label>
            <Field
              label={
                p.kind === "reel"
                  ? en
                    ? "Story and hook"
                    : "Historia i hook"
                  : en
                    ? "Slide narrative and cover hook"
                    : "Narracja slajdów i hook okładki"
              }
              value={d.story}
              multiline
              onChange={(story) => update({ story })}
            />
            <Field
              label={
                p.kind === "reel"
                  ? en
                    ? "Look, setting and framing"
                    : "Wygląd, miejsce i kadry"
                  : en
                    ? "Layouts, hierarchy and image style"
                    : "Układy, hierarchia i styl obrazów"
              }
              value={d.visuals}
              multiline
              onChange={(visuals) => update({ visuals })}
            />
            <Field
              label={
                p.kind === "reel"
                  ? en
                    ? "Pacing"
                    : "Tempo"
                  : en
                    ? "Slide count and text density"
                    : "Liczba slajdów i gęstość tekstu"
              }
              value={d.pacing}
              onChange={(pacing) => update({ pacing })}
            />
            {p.kind === "reel" && (
              <Field
                label={
                  en ? "Voice, dialogue and sound" : "Głos, dialog i dźwięk"
                }
                value={d.audio}
                multiline
                onChange={(audio) => update({ audio })}
              />
            )}
          </div>
          <details className="source-details">
            <summary>
              {en
                ? "Use ChatGPT manually for a direction suggestion"
                : "Uzyskaj sugestię kierunku ręcznie w ChatGPT"}
            </summary>
            <p>
              {en
                ? "Copy this prompt, run it in ChatGPT and edit the direction above with the result."
                : "Skopiuj prompt, uruchom go w ChatGPT i uzupełnij powyższy kierunek wynikiem."}
            </p>
            <button
              className="button subtle"
              onClick={() =>
                void copy(directionPrompt({ ...p, direction: d }, locale))
              }
            >
              {en ? "Copy direction prompt" : "Kopiuj prompt kierunku"}
            </button>
          </details>
        </fieldset>
      </div>
      {candidate && (
        <section className="panel candidate-panel">
          <span className="eyebrow">
            {en
              ? "AI PROPOSAL — NOT APPLIED"
              : "PROPOZYCJA AI — NIE ZASTOSOWANO"}
          </span>
          <h3>{candidate.approach}</h3>
          <dl>
            {(
              [
                "story",
                "visuals",
                "pacing",
                "audio",
                "medium",
                "notes",
              ] as const
            ).map((key) => (
              <div key={key}>
                <dt>
                  {
                    {
                      story: en ? "Story" : "Historia",
                      visuals: en ? "Visuals" : "Obrazy",
                      pacing: en ? "Pacing" : "Tempo",
                      audio: en ? "Audio" : "Dźwięk",
                      medium: en ? "Production" : "Produkcja",
                      notes: en ? "Notes" : "Notatki",
                    }[key]
                  }
                </dt>
                <dd>{candidate[key]}</dd>
              </div>
            ))}
          </dl>
          <div className="button-row">
            <button
              className="button primary"
              onClick={() => {
                change((x) => ({
                  ...x,
                  direction: { ...candidate, approved: false },
                }));
                setCandidate(null);
              }}
            >
              {en ? "Use this proposal" : "Użyj tej propozycji"}
            </button>
            <button
              className="button subtle"
              onClick={() => setCandidate(null)}
            >
              {en ? "Keep my direction" : "Zachowaj mój kierunek"}
            </button>
          </div>
        </section>
      )}
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {en ? "OPTIONAL INSPIRATION" : "OPCJONALNA INSPIRACJA"}
            </span>
            <h2>{en ? "Have something in mind?" : "Masz przykład?"}</h2>
            <p>
              {en
                ? "Add a reel or carousel screenshots. These are inspiration, not the files you will generate. Up to 8 files, 10 MB each."
                : "Dodaj reel lub zrzuty karuzeli. To inspiracje, nie materiały, które wygenerujesz. Do 8 plików po 10 MB."}
            </p>
          </div>
          <button
            disabled={busy}
            className="button subtle"
            onClick={() => fileRef.current?.click()}
          >
            {en ? "Add inspiration" : "Dodaj inspirację"}
          </button>
        </div>
        <input
          ref={fileRef}
          hidden
          multiple
          type="file"
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void perform(async () => {
              if ((p.inspirations?.length ?? 0) + files.length > 8)
                throw Error(
                  en
                    ? "Maximum 8 inspiration files."
                    : "Maksymalnie 8 plików inspiracji.",
                );
              const items: Inspiration[] = [];
              for (const f of files) items.push(await readInspiration(f));
              if (live.current)
                change((x) => ({
                  ...x,
                  inspirations: [...(x.inspirations ?? []), ...items],
                }));
            });
          }}
        />
        {!p.inspirations?.length && (
          <div className="empty-state">
            <p>
              {en
                ? "No reference needed to start. Your idea and brand context are enough."
                : "Nie potrzebujesz referencji na start. Wystarczy pomysł i kontekst marki."}
            </p>
          </div>
        )}
        {(p.inspirations ?? []).map((i, index) => (
          <article className="inspiration-card" key={i.id}>
            <div className="section-heading">
              <h3>{i.name}</h3>
              <div className="button-row">
                <button
                  className="text-button"
                  disabled={busy || index === 0}
                  aria-label={`${en ? "Move inspiration up" : "Przesuń inspirację w górę"}: ${i.name}`}
                  onClick={() =>
                    change((x) => {
                      const list = [...(x.inspirations ?? [])];
                      if (index < 1) return x;
                      [list[index - 1], list[index]] = [
                        list[index],
                        list[index - 1],
                      ];
                      return {
                        ...x,
                        inspirations: list.map((a) => ({
                          ...a,
                          approved: false,
                        })),
                        direction: x.direction
                          ? { ...x.direction, approved: false }
                          : undefined,
                      };
                    })
                  }
                >
                  {en ? "Move up" : "W górę"}
                </button>
                <button
                  className="text-button"
                  disabled={busy || index === (p.inspirations?.length ?? 0) - 1}
                  aria-label={`${en ? "Move inspiration down" : "Przesuń inspirację w dół"}: ${i.name}`}
                  onClick={() =>
                    change((x) => {
                      const list = [...(x.inspirations ?? [])];
                      if (index >= list.length - 1) return x;
                      [list[index + 1], list[index]] = [
                        list[index],
                        list[index + 1],
                      ];
                      return {
                        ...x,
                        inspirations: list.map((a) => ({
                          ...a,
                          approved: false,
                        })),
                        direction: x.direction
                          ? { ...x.direction, approved: false }
                          : undefined,
                      };
                    })
                  }
                >
                  {en ? "Move down" : "W dół"}
                </button>
              </div>
              <button
                disabled={busy}
                className="text-button"
                onClick={() =>
                  change((x) => ({
                    ...x,
                    inspirations: (x.inspirations ?? []).filter(
                      (a) => a.id !== i.id,
                    ),
                    direction: x.direction
                      ? { ...x.direction, approved: false }
                      : undefined,
                  }))
                }
              >
                {en ? "Remove" : "Usuń"}
              </button>
            </div>
            {i.type.startsWith("video/") ? (
              <video controls preload="metadata" src={i.data} />
            ) : (
              <img src={i.data} alt={i.name} />
            )}
            <p className="caption-note">
              {i.type.startsWith("video/")
                ? en
                  ? `Video analysis uses ${i.frames.length} sampled frames; audio, exact pacing and full motion are not analyzed.`
                  : `Analiza wideo korzysta z ${i.frames.length} próbek klatek; dźwięk, dokładne tempo i pełny ruch nie są analizowane.`
                : en
                  ? "For a carousel, upload slides in their intended order."
                  : "W przypadku karuzeli dodaj slajdy w ich kolejności."}
            </p>
            <fieldset disabled={busy} className="plain-fieldset">
              <h4>
                {en ? "What do you like about it?" : "Co Ci się w tym podoba?"}
              </h4>
              <div className="choice-chips">
                {[
                  ["story", en ? "Storytelling" : "Narracja"],
                  ["pacing", en ? "Pacing" : "Tempo"],
                  ["camera", en ? "Framing / camera" : "Kadry / kamera"],
                  ["style", en ? "Visual style" : "Styl wizualny"],
                  ["layout", en ? "Slide layout" : "Układ slajdów"],
                ].map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={i.borrow.includes(key)}
                      onChange={(e) =>
                        updateInspiration(i.id, {
                          borrow: e.target.checked
                            ? [...i.borrow, key]
                            : i.borrow.filter((k) => k !== key),
                          approved: false,
                          analysis: "",
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
              <Field
                label={
                  en
                    ? "What to borrow / avoid (optional)"
                    : "Co wykorzystać / pominąć (opcjonalnie)"
                }
                value={i.notes}
                multiline
                onChange={(notes) =>
                  updateInspiration(i.id, { notes, approved: false })
                }
              />
              <div className="button-row">
                <button
                  className="button primary"
                  disabled={!ai || busy}
                  onClick={() =>
                    void perform(async () => {
                      const result = await requestCreative(
                        "analysis",
                        p,
                        locale,
                        analysisInput(p, i),
                      );
                      if (live.current && result.analysis)
                        updateInspiration(i.id, {
                          analysis: result.analysis,
                          analysisSource: "ai",
                          approved: false,
                        });
                    })
                  }
                >
                  {en
                    ? p.kind === "carousel" &&
                      (p.inspirations ?? []).filter((a) =>
                        a.type.startsWith("image/"),
                      ).length > 1
                      ? "Analyze ordered carousel with AI"
                      : "Analyze inspiration with AI"
                    : p.kind === "carousel" &&
                        i.type.startsWith("image/") &&
                        (p.inspirations ?? []).filter((a) =>
                          a.type.startsWith("image/"),
                        ).length > 1
                      ? "Przeanalizuj uporządkowaną karuzelę z AI"
                      : "Przeanalizuj inspirację z AI"}
                </button>
                <button
                  className="button subtle"
                  onClick={() =>
                    void copy(
                      inspirationPrompt(analysisInput(p, i), p.kind, locale),
                    )
                  }
                >
                  {en ? "Copy analysis prompt" : "Kopiuj prompt analizy"}
                </button>
              </div>
              <small>
                {en
                  ? "For manual analysis, attach this original file in ChatGPT yourself, then paste the interpretation below. Copying the prompt does not transfer the media."
                  : "Przy analizie ręcznej dołącz oryginalny plik w ChatGPT, a interpretację wklej poniżej. Kopiowanie promptu nie przenosi pliku."}
              </small>
              <Field
                label={
                  en
                    ? "Editable interpretation — observations and what to borrow"
                    : "Edytowalna interpretacja — obserwacje i co wykorzystać"
                }
                value={i.analysis}
                multiline
                rows={5}
                onChange={(analysis) =>
                  updateInspiration(i.id, {
                    analysis,
                    analysisSource: "manual",
                    approved: false,
                  })
                }
              />
              <label className="approval-check">
                <input
                  type="checkbox"
                  disabled={!i.analysis.trim()}
                  checked={i.approved}
                  onChange={(e) =>
                    updateInspiration(i.id, { approved: e.target.checked })
                  }
                />
                {en
                  ? "Use this reviewed interpretation in my direction and prompts"
                  : "Użyj tej sprawdzonej interpretacji w kierunku i promptach"}
              </label>
            </fieldset>
          </article>
        ))}
      </section>
      <section className="panel direction-approval">
        <label className="approval-check">
          <input
            type="checkbox"
            checked={d.approved}
            onChange={(e) =>
              change((x) => ({
                ...x,
                direction: {
                  ...(x.direction ?? startingDirection(x, locale)),
                  approved: e.target.checked,
                },
              }))
            }
          />
          {en
            ? "This is the direction I want to produce."
            : "To jest kierunek, który chcę zrealizować."}
        </label>
        <button
          className="button primary"
          disabled={!d.approved || busy}
          onClick={next}
        >
          {en
            ? "Prepare production package →"
            : "Przygotuj pakiet produkcyjny →"}
        </button>
      </section>
    </section>
  );
}
