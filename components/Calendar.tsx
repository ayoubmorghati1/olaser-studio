"use client";
import { Fragment, useEffect, useState } from "react";
import {
  calendarSnapshot,
  parseCalendar,
  type CalendarIdea,
} from "@/lib/calendar";
import { calendarUrl } from "@/lib/context";
import { useLanguage } from "./LanguageProvider";
export default function Calendar({
  onSelect,
}: {
  onSelect: (idea: CalendarIdea) => void;
}) {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [ideas, setIdeas] = useState(calendarSnapshot.ideas);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [character, setCharacter] = useState("all");
  const [series, setSeries] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [source, setSource] = useState(calendarSnapshot.retrievedAt);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);
  async function refresh(signal?: AbortSignal) {
    setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/calendar", { signal });
      if (!response.ok)
        throw new Error(
          en
            ? "Refresh failed. Showing the saved calendar snapshot."
            : "Odświeżanie nie powiodło się. Wyświetlono zapisaną kopię kalendarza.",
        );
      const data = await response.json();
      if (signal?.aborted) return;
      setIdeas(data.ideas);
      setSource(data.retrievedAt);
      setLive(true);
    } catch (error) {
      if (!signal?.aborted)
        setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (!signal?.aborted) setRefreshing(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, []);
  const filtered = ideas.filter(
    (i) =>
      (kind === "all" || i.kind === kind) &&
      (character === "all" || i.character === character) &&
      (series === "all" || i.series === series) &&
      `${i.title} ${i.character} ${i.series}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const characters = [
    ...new Set(ideas.map((i) => i.character).filter(Boolean)),
  ].sort();
  const allSeries = [
    ...new Set(ideas.map((i) => i.series).filter(Boolean)),
  ].sort();
  const clearFilters = () => {
    setQuery("");
    setKind("all");
    setCharacter("all");
    setSeries("all");
    setSelectedId(null);
  };
  const hasFilters =
    query !== "" || kind !== "all" || character !== "all" || series !== "all";
  return (
    <section className="dashboard">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            O’LASER · {en ? "CONTENT CALENDAR" : "KALENDARZ TREŚCI"}
          </span>
          <h1>{en ? "Choose an idea." : "Wybierz pomysł."}</h1>
          <p>
            {en
              ? "Scan your plan, preview a brief, then start creating."
              : "Przejrzyj plan, sprawdź brief i rozpocznij tworzenie."}
          </p>
        </div>
        <a
          className="button subtle"
          href={calendarUrl}
          target="_blank"
          rel="noreferrer"
        >
          {en ? "Open source calendar" : "Otwórz kalendarz źródłowy"}
        </a>
      </div>
      <div className="info-banner">
        {live
          ? en
            ? `Connected to Google calendar sheet · refreshed ${new Date(source).toLocaleString("en-GB")}. Projects keep their own copy of the brief.`
            : `Połączono z arkuszem Google · odświeżono ${new Date(source).toLocaleString("pl-PL")}. Projekty zachowują własną kopię briefu.`
          : en
            ? `Saved source snapshot · ${source}. Refresh reads the original calendar without changing it.`
            : `Zapisana kopia źródła · ${source}. Odświeżanie odczytuje oryginalny kalendarz bez wprowadzania zmian.`}
      </div>
      <div className="button-row calendar-filters">
        <button
          className="button primary"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          {refreshing
            ? en
              ? "Refreshing…"
              : "Odświeżanie…"
            : en
              ? "Refresh calendar"
              : "Odśwież kalendarz"}
        </button>
        <input
          aria-label={en ? "Search calendar" : "Szukaj w kalendarzu"}
          placeholder={
            en
              ? "Search ideas, characters, series…"
              : "Szukaj pomysłów, postaci, serii…"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label={en ? "Format" : "Format"}
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="all">
            {en ? "All formats" : "Wszystkie formaty"}
          </option>
          <option value="reel">Reel</option>
          <option value="carousel">Carousel</option>
        </select>
        <select
          aria-label={en ? "Character" : "Postać"}
          value={character}
          onChange={(e) => {
            setCharacter(e.target.value);
            setSelectedId(null);
          }}
        >
          <option value="all">
            {en ? "All characters" : "Wszystkie postacie"}
          </option>
          {characters.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          aria-label={en ? "Series" : "Seria"}
          value={series}
          onChange={(e) => {
            setSeries(e.target.value);
            setSelectedId(null);
          }}
        >
          <option value="all">{en ? "All series" : "Wszystkie serie"}</option>
          {allSeries.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <label className="button subtle">
          {en ? "Refresh from CSV" : "Odśwież z CSV"}
          <input
            hidden
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                if (file.size > 2000000)
                  throw Error(
                    en
                      ? "CSV must be under 2 MB"
                      : "CSV musi mieć mniej niż 2 MB",
                  );
                setIdeas(parseCalendar(await file.text()));
                clearFilters();
                setSource(file.name);
                setLive(false);
                setError("");
              } catch (err) {
                setError(String(err));
              }
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      <div className="calendar-results">
        <p role="status">
          {en
            ? `${filtered.length} of ${ideas.length} ideas`
            : `${filtered.length} z ${ideas.length} pomysłów`}{" "}
          <span>
            ·{" "}
            {en
              ? "Source copy stays in its original language"
              : "Treść źródłowa zachowuje język oryginału"}
          </span>
        </p>
        {hasFilters && (
          <button className="text-button" onClick={clearFilters}>
            {en ? "Clear filters" : "Wyczyść filtry"}
          </button>
        )}
      </div>
      <div className="calendar-table-wrap">
        <table className="calendar-table">
          <caption className="sr-only">
            {en
              ? "Content calendar — preview an idea before starting a project"
              : "Kalendarz treści — sprawdź pomysł przed rozpoczęciem projektu"}
          </caption>
          <thead>
            <tr>
              {(en
                ? ["Date", "Idea", "Format", "Character", "Series", "Action"]
                : ["Data", "Pomysł", "Format", "Postać", "Seria", "Działanie"]
              ).map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((idea) => {
              const expanded = selectedId === idea.id;
              const previewId = `calendar-preview-${idea.id}`;
              const toggle = () => setSelectedId(expanded ? null : idea.id);
              return (
                <Fragment key={idea.id}>
                  <tr
                    className={
                      expanded ? "calendar-row is-selected" : "calendar-row"
                    }
                    onClick={toggle}
                  >
                    <td
                      data-label={en ? "Date" : "Data"}
                      className="calendar-date"
                    >
                      <time dateTime={idea.date}>
                        {idea.date &&
                        !Number.isNaN(Date.parse(`${idea.date}T12:00:00Z`))
                          ? new Intl.DateTimeFormat(en ? "en-GB" : "pl-PL", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              timeZone: "UTC",
                            }).format(new Date(`${idea.date}T12:00:00Z`))
                          : idea.date || "—"}
                      </time>
                    </td>
                    <th scope="row" className="calendar-title">
                      <button
                        aria-expanded={expanded}
                        aria-controls={previewId}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle();
                        }}
                      >
                        <span className="calendar-id">#{idea.id}</span>
                        {idea.title}
                      </button>
                    </th>
                    <td data-label={en ? "Format" : "Format"}>
                      <span className={`calendar-format ${idea.kind}`}>
                        {idea.kind === "reel"
                          ? "Reel"
                          : en
                            ? "Carousel"
                            : "Karuzela"}
                      </span>
                    </td>
                    <td data-label={en ? "Character" : "Postać"}>
                      {idea.character || "—"}
                    </td>
                    <td data-label={en ? "Series" : "Seria"}>
                      {idea.series || "—"}
                    </td>
                    <td className="calendar-action">
                      <button
                        className="text-button"
                        aria-expanded={expanded}
                        aria-controls={previewId}
                        aria-label={`${en ? "Preview idea" : "Podgląd pomysłu"} #${idea.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle();
                        }}
                      >
                        {expanded
                          ? en
                            ? "Close ↑"
                            : "Zamknij ↑"
                          : en
                            ? "Preview →"
                            : "Podgląd →"}
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="calendar-preview-row" id={previewId}>
                      <td colSpan={6}>
                        <section
                          className="calendar-preview"
                          aria-label={en ? "Brief preview" : "Podgląd briefu"}
                        >
                          <div className="calendar-preview-heading">
                            <div>
                              <span className="eyebrow">
                                {en ? "BRIEF PREVIEW" : "PODGLĄD BRIEFU"} · #
                                {idea.id}
                              </span>
                              <h2>{idea.title}</h2>
                            </div>
                            <button
                              className="button primary"
                              onClick={() => onSelect(idea)}
                            >
                              {en ? "Start project →" : "Rozpocznij projekt →"}
                            </button>
                          </div>
                          <dl>
                            <div>
                              <dt>{en ? "Hook / angle" : "Hook / kierunek"}</dt>
                              <dd>
                                {idea.angle ||
                                  (en
                                    ? "Not specified in the calendar"
                                    : "Nie określono w kalendarzu")}
                              </dd>
                            </div>
                            <div>
                              <dt>CTA</dt>
                              <dd>
                                {idea.cta ||
                                  (en
                                    ? "Not specified in the calendar"
                                    : "Nie określono w kalendarzu")}
                              </dd>
                            </div>
                            <div>
                              <dt>
                                {en
                                  ? "Required assets and consents"
                                  : "Wymagane materiały i zgody"}
                              </dt>
                              <dd>
                                {idea.requirements ||
                                  (en
                                    ? "Not specified — check before production"
                                    : "Nie określono — sprawdź przed produkcją")}
                              </dd>
                            </div>
                            {idea.notes && (
                              <div>
                                <dt>
                                  {en
                                    ? "Calendar notes"
                                    : "Notatki z kalendarza"}
                                </dt>
                                <dd>{idea.notes}</dd>
                              </div>
                            )}
                          </dl>
                          <p className="calendar-preview-note">
                            {en
                              ? "Source brief, awaiting production review. Starting creates an editable project with this information filled in."
                              : "Brief źródłowy, do weryfikacji przed produkcją. Rozpoczęcie tworzy edytowalny projekt z uzupełnionymi danymi."}
                          </p>
                        </section>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty-state">
            <h3>
              {en
                ? "No ideas match these filters."
                : "Brak pomysłów pasujących do filtrów."}
            </h3>
            <p>
              {en
                ? "Try a different search or clear the filters to see your full calendar."
                : "Zmień wyszukiwanie lub wyczyść filtry, aby zobaczyć cały kalendarz."}
            </p>
            <button className="button subtle" onClick={clearFilters}>
              {en ? "Clear filters" : "Wyczyść filtry"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
