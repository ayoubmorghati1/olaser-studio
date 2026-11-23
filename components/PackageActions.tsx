"use client";
import { useEffect, useRef, useState } from "react";
import type { Project, ProductionPackage } from "@/lib/schema";
import { requestCreative } from "@/lib/creative-client";
import { useLanguage } from "./LanguageProvider";
export default function PackageActions({
  project: p,
  manual,
  paste,
  editDirection,
  apply,
}: {
  project: Project;
  manual: () => void;
  paste: () => void;
  editDirection: () => void;
  apply: (pkg: ProductionPackage) => void;
}) {
  const { locale } = useLanguage();
  const en = locale === "en";
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [candidate, setCandidate] = useState<ProductionPackage | null>(null);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    fetch("/api/creative")
      .then((r) => r.json())
      .then((d) => {
        if (live.current) setEnabled(d.enabled === true);
      })
      .catch(() => {});
    return () => {
      live.current = false;
    };
  }, []);
  return (
    <section className="panel package-actions">
      <span className="eyebrow">
        {en ? "YOUR PRODUCTION PACKAGE" : "TWÓJ PAKIET PRODUKCYJNY"}
      </span>
      <h2>
        {p.package
          ? en
            ? "Review the prompts beside every shot or slide."
            : "Sprawdź prompty przy każdym ujęciu lub slajdzie."
          : en
            ? "Turn the direction into ready-to-use prompts."
            : "Zamień kierunek w gotowe prompty."}
      </h2>
      <p>
        {p.kind === "reel"
          ? en
            ? "Frame prompts, motion prompts, dialogue and assembly instructions. Use Higgsfield for generated clips; filmed footage follows the chosen direction."
            : "Prompty klatek, prompty ruchu, dialog i instrukcje montażu. Higgsfield służy do generowanych klipów; nagrania realizuj zgodnie z wybranym kierunkiem."
          : en
            ? "Slide story, copy, layouts and ChatGPT image prompts. The studio renders the final typography at 1080 × 1350."
            : "Narracja slajdów, teksty, układy i prompty obrazów do ChatGPT. Studio renderuje końcową typografię w 1080 × 1350."}
      </p>
      {!p.direction?.approved && (
        <div className="info-banner">
          {en
            ? "Review and approve Creative direction before preparing a new package. Existing packages remain editable."
            : "Sprawdź i zatwierdź Kierunek kreatywny przed przygotowaniem nowego pakietu. Istniejące pakiety pozostają edytowalne."}
          <button className="text-button" onClick={editDirection}>
            {en ? "Review direction →" : "Sprawdź kierunek →"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      <div className="button-row">
        <button
          className="button primary"
          disabled={!enabled || !p.direction?.approved || busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const result = await requestCreative("package", p, locale);
              if (live.current && result.package) setCandidate(result.package);
            } catch (err) {
              if (live.current)
                setError(err instanceof Error ? err.message : String(err));
            } finally {
              if (live.current) setBusy(false);
            }
          }}
        >
          {busy
            ? en
              ? "Preparing package…"
              : "Przygotowuję pakiet…"
            : en
              ? "Prepare with AI"
              : "Przygotuj z AI"}
        </button>
        <button
          className="button subtle"
          disabled={!p.direction?.approved || busy}
          onClick={manual}
        >
          {en ? "Use ChatGPT manually" : "Użyj ChatGPT ręcznie"}
        </button>
        <button className="button subtle" disabled={busy} onClick={paste}>
          {en ? "Paste package answer" : "Wklej odpowiedź pakietu"}
        </button>
      </div>
      <p className="caption-note">
        {enabled
          ? en
            ? "Built-in AI uses metered credits on click. A generated proposal is shown before replacing your package."
            : "Wbudowane AI korzysta z płatnych kredytów po kliknięciu. Propozycja pojawi się przed zastąpieniem pakietu."
          : en
            ? "Built-in AI is not configured. Manual ChatGPT generation remains available after approving the direction."
            : "Wbudowane AI nie jest skonfigurowane. Generowanie ręczne w ChatGPT jest dostępne po zatwierdzeniu kierunku."}
      </p>
      {candidate && (
        <div className="candidate-panel">
          <h3>{candidate.title}</h3>
          <p>
            {en
              ? "Proposal — not applied yet. Review before replacing your existing edits."
              : "Propozycja — jeszcze nie zastosowano. Sprawdź przed zastąpieniem obecnych zmian."}
          </p>
          <ol>
            {(candidate.kind === "reel"
              ? candidate.shots
              : candidate.slides
            ).map((s) => (
              <li key={s.id}>
                {"title" in s ? s.title : s.headline}
                <p>{"dialogue" in s ? s.dialogue : s.body}</p>
              </li>
            ))}
          </ol>
          <p>{candidate.caption}</p>
          <div className="button-row">
            <button
              className="button primary"
              onClick={() => {
                apply(candidate);
                setCandidate(null);
              }}
            >
              {en ? "Use this package" : "Użyj tego pakietu"}
            </button>
            <button
              className="button subtle"
              onClick={() => setCandidate(null)}
            >
              {en ? "Discard proposal" : "Odrzuć propozycję"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
