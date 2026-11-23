"use client";
import { useLanguage, LanguageSwitch } from "./LanguageProvider";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  Layers,
  Plus,
  BookOpen,
  FolderOpen,
  Upload,
  Download,
  Copy,
  Check,
  X,
  Film,
  ChevronLeft,
  ChevronRight,
  Trash2,
  LogOut,
  HelpCircle,
  FileText,
  ImagePlus,
  RefreshCw,
  Search,
  Clock3,
  ClipboardPaste,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  PackageCheck,
} from "lucide-react";
import {
  defaultContext,
  contextLabels,
  calendarUrl,
  canvaUrl,
  localizeContext,
} from "@/lib/context";
import { newProject, example } from "@/lib/examples";
import {
  parseAnswer,
  parseRevision,
  applyRevision,
  type Project,
  type ProductionPackage,
  type Shot,
  type Slide,
} from "@/lib/schema";
import { buildPrompt, revisionPrompt } from "@/lib/prompt";
import {
  loadProjects,
  saveProject,
  removeProject,
  loadContext,
  saveContext,
} from "@/lib/storage";
import { download, markdown, backupBlob, restoreBackup } from "@/lib/export";
import { slideBlob } from "@/lib/slides";
import SlidePreview from "./SlidePreview";
import Assets from "./Assets";
import BriefStep from "./BriefStep";
import DirectionStep from "./DirectionStep";
import BrandLibrary from "./BrandLibrary";
import ProductionAssets from "./ProductionAssets";
import SlideImageUpload from "./SlideImageUpload";
import PackageActions from "./PackageActions";
import Calendar from "./Calendar";
import ItemProduction from "./ItemProduction";
import { projectFromIdea } from "@/lib/calendar";
import { Field, ListField } from "./Fields";
type Tab = "brief" | "direction" | "create" | "finish";
type Revision = {
  id: string;
  instruction: string;
  candidate: Shot | Slide | null;
};
export default function Studio() {
  const { t, locale } = useLanguage();
  const [view, setView] = useState<"studio" | "calendar">("studio");
  const words = (en: string, pl: string) => (locale === "en" ? en : pl);
  const [projects, setProjects] = useState<Project[]>([]);
  const [current, setCurrent] = useState<Project | null>(null);
  const [context, setContext] = useState(() =>
    localizeContext(defaultContext, locale),
  );
  const [tab, setTab] = useState<Tab>("brief");
  const [panel, setPanel] = useState<
    "context" | "help" | "import" | "prompt" | "revision" | null
  >(null);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [status, setStatus] = useState(t("Wczytywanie…"));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingPackage, setPendingPackage] =
    useState<ProductionPackage | null>(null);
  const contextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revisionProject = useRef<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const latest = useRef<Project | null>(null);
  const saves = useRef(Promise.resolve());
  const queueSave = useCallback((p: Project) => {
    const task = saves.current.catch(() => {}).then(() => saveProject(p));
    saves.current = task;
    return task;
  }, []);
  useEffect(() => {
    Promise.all([loadProjects(), loadContext()])
      .then(([p, c]) => {
        setProjects(p);
        if (c) setContext(c);
        setStatus(t("Zapis lokalny"));
      })
      .catch(() => {
        setStatus(t("Błąd pamięci"));
        setError(
          t(
            "Nie można otworzyć pamięci przeglądarki. Eksportuj kopię przed zamknięciem.",
          ),
        );
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    latest.current = current;
    if (!current || !ready) return;
    setStatus(t("Zapisywanie…"));
    let live = true;
    const timer = setTimeout(() => {
      queueSave(current)
        .then(() => {
          if (live) setStatus(t("Zapisano na urządzeniu"));
        })
        .catch(() => {
          if (live) {
            setStatus(t("Błąd zapisu"));
            setError(
              t(
                "Nie udało się zapisać. Pobierz kopię projektu przed zamknięciem.",
              ),
            );
          }
        });
    }, 500);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [current, ready, queueSave]);
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (latest.current && status === t("Zapisywanie…")) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [status]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector<HTMLElement>(".modal");
    const first = modal?.querySelector<HTMLElement>(
      "button, input, textarea, select, a[href]",
    );
    first?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") setPanel(null);
      if (e.key === "Tab" && modal) {
        const items = Array.from(
          modal.querySelectorAll<HTMLElement>(
            "button:not([disabled]), input, textarea, select, a[href]",
          ),
        );
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [panel]);
  const notify = (s: string) => setNotice(s);
  const copy = async (s: string) => {
    try {
      await navigator.clipboard.writeText(s);
      notify(t("Skopiowano do schowka"));
    } catch {
      setError(t("Schowek niedostępny. Zaznacz tekst i skopiuj ręcznie."));
    }
  };
  const change = (fn: (p: Project) => Project) =>
    setCurrent((p) => {
      if (!p) return p;
      const next = { ...fn(p), updatedAt: new Date().toISOString() };
      setProjects((list) => [next, ...list.filter((x) => x.id !== next.id)]);
      return next;
    });
  const flush = async () => {
    if (latest.current) await queueSave(latest.current);
    await saves.current;
  };
  const open = async (p: Project) => {
    try {
      await flush();
    } catch {
      setError(
        t(
          "Poprzedni projekt nie został zapisany. Pobierz jego kopię przed przejściem dalej.",
        ),
      );
      return;
    }
    setCurrent(p);
    setProjects((list) => [p, ...list.filter((x) => x.id !== p.id)]);
    setTab(p.package ? "create" : "brief");
    setError("");
    setPanel(null);
    setRevision(null);
  };
  const home = async () => {
    try {
      await flush();
      setCurrent(null);
      setView("studio");
    } catch {
      setError(
        t("Nie udało się zapisać projektu. Pobierz kopię przed wyjściem."),
      );
    }
  };
  const pkg = current?.package;
  const displayedContext = localizeContext(current?.context ?? context, locale);
  useEffect(() => {
    setContext((c) => localizeContext(c, locale));
  }, [locale]);
  const logout = () =>
    run(async () => {
      await flush();
      const res = await fetch("/api/session", { method: "DELETE" });
      if (!res.ok) throw new Error(t("Nie udało się wylogować."));
      window.location.href = "/login";
    });
  const setPackage = (fn: (p: ProductionPackage) => ProductionPackage) =>
    change((p) => ({ ...p, package: p.package ? fn(p.package) : null }));
  const updateShot = (id: string, patch: Partial<Shot>) =>
    setPackage((p) =>
      p.kind === "reel"
        ? {
            ...p,
            shots: p.shots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
          }
        : p,
    );
  const updateSlide = (id: string, patch: Partial<Slide>) =>
    setPackage((p) =>
      p.kind === "carousel"
        ? {
            ...p,
            slides: p.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
          }
        : p,
    );
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("Operacja nie powiodła się."),
      );
    } finally {
      setBusy(false);
    }
  };
  const backup = () =>
    current &&
    run(async () => {
      download(
        await backupBlob(current, locale),
        `${current.title.slice(0, 70)}.olaser.zip`,
      );
      notify(t("Pobrano przenośną kopię projektu"));
    });
  const selected =
    revision && pkg
      ? (pkg.kind === "reel" ? pkg.shots : pkg.slides).find(
          (s) => s.id === revision.id,
        )
      : null;
  const startRevision = (id: string) => {
    setRevision({ id, instruction: "", candidate: null });
    revisionProject.current = current?.id ?? null;
    change((p) => ({ ...p, revisionDraft: "" }));
    setPanel("revision");
  };
  const allImages = () => current?.assets ?? [];
  const exportSlides = () =>
    current &&
    pkg?.kind === "carousel" &&
    run(async () => {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const [i, s] of pkg.slides.entries()) {
        try {
          zip.file(
            `slide-${String(i + 1).padStart(2, "0")}.png`,
            await slideBlob(
              s,
              i,
              pkg.slides.length,
              current.assets.find((a) => a.id === s.imageId),
              current.brief.outputLanguage ?? "pl",
            ),
          );
        } catch (e) {
          throw new Error(
            `Slajd ${i + 1}: ${e instanceof Error ? e.message : t("Błąd eksportu")}`,
          );
        }
      }
      zip.file("caption.txt", pkg.caption);
      zip.file("production-package.md", markdown(current, locale));
      zip.file(
        "alt-text.txt",
        pkg.slides.map((s, i) => `${i + 1}. ${s.alt}`).join("\n"),
      );
      download(
        await zip.generateAsync({ type: "blob" }),
        `${current.title.slice(0, 70)}-slides.zip`,
      );
      notify(t("Pobrano slajdy 1080 × 1350"));
    });
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand-button"
          onClick={() => void home()}
          aria-label={t("O’Laser Studio — start")}
        >
          <span className="wordmark">
            O’LASER<span>STUDIO</span>
          </span>
        </button>
        <div className="workspace-tag">{t("WARSZTAT KREATYWNY")}</div>
        <nav>
          <button
            className={
              !current && view === "studio" ? "nav-item active" : "nav-item"
            }
            onClick={() => void home()}
          >
            <FolderOpen size={19} /> {t("Twoje studio")}{" "}
          </button>
          <button
            className={
              !current && view === "calendar" ? "nav-item active" : "nav-item"
            }
            onClick={() =>
              void run(async () => {
                await flush();
                setCurrent(null);
                setView("calendar");
              })
            }
          >
            <Layers size={19} />
            {words("Calendar", "Kalendarz")}
          </button>
        </nav>
        <div className="nav-divider" />
        <button className="nav-item" onClick={() => setPanel("context")}>
          <BookOpen size={19} />{" "}
          {words("Brand Library", "Biblioteka marki")}{" "}
        </button>
        <button className="nav-item" onClick={() => setPanel("help")}>
          <HelpCircle size={19} /> {t("Jak to działa")}{" "}
        </button>
        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="tiny-dot" />
            <span>
              {" "}
              {t("Twoje pomysły, u Ciebie.")}{" "}
              <small>{t("Zapis lokalny w przeglądarce")}</small>
            </span>
          </div>
          <div className="profile">
            <div className="avatar">R</div>
            <div>
              {" "}
              {t("Przestrzeń Rafała")}
              <small>{t("O’Laser · prywatne studio")}</small>
            </div>
            <button
              className="icon-button"
              aria-label={t("Wyloguj")}
              onClick={() => void logout()}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            Studio <span>/</span>{" "}
            {current
              ? current.kind === "reel"
                ? "Reels Studio"
                : "Carousel Studio"
              : t("Przegląd")}
          </span>
          <div className="topbar-right">
            <LanguageSwitch />
            <span className="save-state">
              <span className="tiny-dot" />
              {t(status)}
            </span>
            <span className="private-label">{t("PRYWATNA PRZESTRZEŃ")}</span>
            <button
              className="icon-button mobile-logout"
              aria-label={t("Wyloguj")}
              onClick={() => void logout()}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main>
          {error && (
            <div className="error-banner" role="alert">
              <span>{t(error)}</span>
              <button
                aria-label={t("Zamknij komunikat")}
                onClick={() => setError("")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <Check size={17} />
              {t(notice)}
            </div>
          )}
          {!current && view === "calendar" ? (
            <Calendar
              onSelect={(idea) =>
                void open(
                  projectFromIdea(
                    idea,
                    localizeContext(context, locale),
                    locale,
                  ),
                )
              }
            />
          ) : !current ? (
            <div className="dashboard">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {t("OD POMYSŁU DO PUBLIKACJI")}
                  </span>
                  <h1>
                    {" "}
                    {t("Cześć, Rafał.")} <br /> {t("Co dziś")}{" "}
                    <em>{t("tworzymy?")}</em>
                  </h1>
                  <p>{t("Twoja strategia już istnieje. Nadajmy jej formę.")}</p>
                </div>
                <button
                  className="button subtle"
                  disabled={!ready || busy}
                  onClick={() => uploadRef.current?.click()}
                >
                  <Upload size={16} /> {t("Wczytaj kopię")}{" "}
                </button>
              </div>
              <div className="calendar-start panel">
                <div>
                  <span className="eyebrow">
                    {words("START FROM YOUR PLAN", "ZACZNIJ OD SWOJEGO PLANU")}
                  </span>
                  <h3>
                    {words(
                      "Your next idea is already in the calendar.",
                      "Twój kolejny pomysł jest już w kalendarzu.",
                    )}
                  </h3>
                  <p>
                    {words(
                      "Choose it and we’ll fill the brief. Or start a new reel or carousel below.",
                      "Wybierz go, a uzupełnimy brief. Możesz też zacząć nowy reel lub karuzelę poniżej.",
                    )}
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setView("calendar")}
                >
                  {words("Choose from calendar", "Wybierz z kalendarza")}{" "}
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="create-grid">
                <button
                  className="create-card reel-card"
                  disabled={!ready}
                  onClick={() =>
                    void open(
                      newProject(
                        "reel",
                        localizeContext(context, locale),
                        locale,
                      ),
                    )
                  }
                >
                  <div className="card-top">
                    <span className="format-pill">{t("Nowy reel")}</span>
                    <Clapperboard size={26} />
                  </div>
                  <div className="reel-visual">
                    <div className="visual-frame">
                      <span>06:50</span>
                      <div className="frame-line" />
                      <small>{t("PLAN BYŁ PROSTY.")}</small>
                    </div>
                    <div className="visual-orbit" />
                    <span className="visual-side">SCRIPT / SHOTS / MOTION</span>
                  </div>
                  <div className="create-card-bottom">
                    <div>
                      <h2>{t("Pomysł w ruch.")}</h2>
                      <p>
                        {" "}
                        {t("Scenariusz, ujęcia i prompty.")} <br />{" "}
                        {t("Wszystko, czego potrzebuje Twój reel.")}{" "}
                      </p>
                    </div>
                    <span className="round-plus">
                      <Plus size={23} />
                    </span>
                  </div>
                </button>
                <button
                  className="create-card carousel-card"
                  disabled={!ready}
                  onClick={() =>
                    void open(
                      newProject(
                        "carousel",
                        localizeContext(context, locale),
                        locale,
                      ),
                    )
                  }
                >
                  <div className="card-top">
                    <span className="format-pill">{t("Nowa karuzela")}</span>
                    <Layers size={26} />
                  </div>
                  <div className="carousel-visual">
                    <div className="mini-slide back-slide">O’LASER</div>
                    <div className="mini-slide front-slide">
                      <small>O’LASER</small>
                      <span>
                        {" "}
                        {t("Wiedza")} <br />
                        {t("w dobrym")} <br />
                        <em>{t("świetle.")}</em>
                      </span>
                      <i>01 / 06</i>
                    </div>
                  </div>
                  <div className="create-card-bottom">
                    <div>
                      <h2>{t("Myśl po myśli.")}</h2>
                      <p>
                        {" "}
                        {t("Treść, obrazy i gotowe slajdy.")} <br />{" "}
                        {t("Spójne z marką, gotowe do eksportu.")}{" "}
                      </p>
                    </div>
                    <span className="round-plus">
                      <Plus size={23} />
                    </span>
                  </div>
                </button>
              </div>
              <div className="workflow-strip">
                <span className="eyebrow">{t("PROSTY PROCES")}</span>
                <span>
                  <b>1</b>
                  {words("Choose an idea", "Wybierz pomysł")}{" "}
                </span>
                <ChevronRight size={14} />
                <span>
                  <b>2</b>
                  {words("Set creative direction", "Ustal kierunek")}{" "}
                </span>
                <ChevronRight size={14} />
                <span>
                  <b>3</b>
                  {words("Prepare your prompts", "Przygotuj prompty")}{" "}
                </span>
                <ChevronRight size={14} />
                <span>
                  <b>4</b>
                  {t("Twórz i eksportuj")}{" "}
                </span>
              </div>
              <section>
                <div className="section-heading">
                  <div>
                    <h2>{t("Zobacz, jak to działa.")}</h2>
                    <p>
                      {" "}
                      {t(
                        "Dwa prawdziwe pomysły z Twojego kalendarza. Rozpisane na produkcję.",
                      )}{" "}
                    </p>
                  </div>
                  <span className="small-label">
                    {t("PAKIETY PRZYKŁADOWE")}
                  </span>
                </div>
                <div className="example-grid">
                  <button
                    className="example-card"
                    disabled={!ready}
                    onClick={() =>
                      void open(
                        example(
                          "reel",
                          localizeContext(context, locale),
                          locale,
                        ),
                      )
                    }
                  >
                    <span className="example-icon">
                      <Film size={24} />
                    </span>
                    <div>
                      <span className="eyebrow">
                        {" "}
                        {t("REEL · ANTAGONISTA · KASIA")}{" "}
                      </span>
                      <h3>{t("Wtorek, 6:50. Plan był prosty.")}</h3>
                      <p>{t("5 ujęć · scenariusz · prompty · montaż")}</p>
                    </div>
                    <ChevronRight size={19} />
                  </button>
                  <button
                    className="example-card"
                    disabled={!ready}
                    onClick={() =>
                      void open(
                        example(
                          "carousel",
                          localizeContext(context, locale),
                          locale,
                        ),
                      )
                    }
                  >
                    <span className="example-icon cream">
                      <Layers size={24} />
                    </span>
                    <div>
                      <span className="eyebrow">
                        {" "}
                        {t("KARUZELA · EDUKACJA · MARTA")}{" "}
                      </span>
                      <h3>{t("Jak to działa — w 6 slajdach")}</h3>
                      <p>{t("6 slajdów · edytowalna treść · eksport PNG")}</p>
                    </div>
                    <ChevronRight size={19} />
                  </button>
                </div>
                <p className="source-note">
                  {" "}
                  {t(
                    "Briefy potwierdzone w kalendarzu. Pakiety to szkice do akceptacji, nie opublikowane materiały.",
                  )}{" "}
                </p>
              </section>
              <section className="projects-section">
                <div className="section-heading">
                  <div>
                    <h2>{t("Na Twoim stole.")}</h2>
                    <p>{t("Wróć do rozpoczętych projektów.")}</p>
                  </div>
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label={t("Szukaj projektu")}
                      placeholder={t("Szukaj projektu…")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                </div>
                {projects.filter((p) =>
                  p.title.toLowerCase().includes(search.toLowerCase()),
                ).length ? (
                  <div className="project-list">
                    {projects
                      .filter((p) =>
                        p.title.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((p) => (
                        <div className="project-row" key={p.id}>
                          <button onClick={() => void open(p)}>
                            {p.kind === "reel" ? (
                              <Clapperboard size={20} />
                            ) : (
                              <Layers size={20} />
                            )}
                            <span>
                              {p.title}
                              <small>
                                {p.package
                                  ? t("Pakiet do edycji")
                                  : t("Brief w przygotowaniu")}{" "}
                                ·{" "}
                                {new Date(p.updatedAt).toLocaleDateString(
                                  "pl-PL",
                                )}
                              </small>
                            </span>
                          </button>
                          <button
                            className="icon-button"
                            aria-label={t(`Usuń ${p.title}`)}
                            onClick={() => {
                              if (
                                confirm(t("Usunąć projekt z tego urządzenia?"))
                              )
                                void run(async () => {
                                  await removeProject(p.id);
                                  setProjects((ps) =>
                                    ps.filter((x) => x.id !== p.id),
                                  );
                                });
                            }}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FolderOpen size={24} />
                    <p>
                      {search
                        ? t("Nie znaleziono projektu.")
                        : t("Tu pojawi się Twój pierwszy projekt.")}
                    </p>
                    <small>
                      {" "}
                      {t(
                        "Zapis automatyczny. Kopie do pobrania w każdym projekcie.",
                      )}{" "}
                    </small>
                  </div>
                )}
              </section>
              <footer className="page-footer">
                <span>O’LASER STUDIO</span>
                <span>{t("Mniej przeklejania. Więcej tworzenia.")}</span>
              </footer>
            </div>
          ) : (
            <div className="editor">
              <div className="editor-heading">
                <div>
                  <button className="back-link" onClick={() => void home()}>
                    <ChevronLeft size={15} /> {t("Wszystkie projekty")}{" "}
                  </button>
                  <span className="eyebrow">
                    {current.kind === "reel"
                      ? "REELS STUDIO"
                      : "CAROUSEL STUDIO"}
                  </span>
                  <input
                    className="title-input"
                    aria-label={t("Tytuł projektu")}
                    value={current.title}
                    onChange={(e) =>
                      change((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                  <p>
                    {current.kind === "reel"
                      ? t("Od briefu do ostatniego cięcia.")
                      : t("Jedna historia. Slajd po slajdzie.")}
                  </p>
                </div>
                <div className="button-row">
                  <button
                    className="button subtle"
                    disabled={busy}
                    onClick={() => void backup()}
                  >
                    <Download size={16} /> {t("Kopia projektu")}{" "}
                  </button>
                  {pkg && (
                    <button
                      className="button primary"
                      onClick={() =>
                        download(
                          markdown(current, locale),
                          `${current.title.slice(0, 70)}.md`,
                        )
                      }
                    >
                      <FileText size={16} /> {t("Pobierz pakiet")}{" "}
                    </button>
                  )}
                </div>
              </div>
              <div
                className="editor-tabs"
                role="tablist"
                aria-label={t("Etapy produkcji")}
              >
                {(
                  [
                    ["brief", words("Idea", "Pomysł"), FileText],
                    [
                      "direction",
                      words("Creative direction", "Kierunek kreatywny"),
                      ImagePlus,
                    ],
                    [
                      "create",
                      words("Production package", "Pakiet produkcyjny"),
                      Clapperboard,
                    ],
                    [
                      "finish",
                      words("Create & export", "Twórz i eksportuj"),
                      PackageCheck,
                    ],
                  ] as const
                ).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    className={tab === id ? "selected" : ""}
                    disabled={id === "finish" && !pkg}
                    onClick={() => setTab(id)}
                  >
                    <Icon size={17} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="workflow-next">
                <span>
                  {words(
                    "Idea → Creative direction → Production package → Create & export",
                    "Pomysł → Kierunek → Pakiet → Eksport",
                  )}
                </span>
                <button
                  className="button subtle"
                  disabled={tab === "finish" || (tab === "create" && !pkg)}
                  onClick={() =>
                    setTab(
                      tab === "brief"
                        ? "direction"
                        : tab === "direction"
                          ? "create"
                          : "finish",
                    )
                  }
                >
                  {words("Next step", "Następny krok")}{" "}
                  <ChevronRight size={16} />
                </button>
              </div>
              {pkg &&
                ((pkg.kind === "reel" &&
                  Math.abs(
                    pkg.shots.reduce((n, s) => n + s.editSeconds, 0) -
                      current.brief.target,
                  ) > 0.1) ||
                  (pkg.kind === "carousel" &&
                    pkg.slides.length !== current.brief.target)) && (
                  <div className="info-banner">
                    {" "}
                    {t("Pakiet ma")}{" "}
                    {pkg.kind === "reel"
                      ? t(
                          `${pkg.shots.reduce((n, s) => n + s.editSeconds, 0)} sekund`,
                        )
                      : t(`${pkg.slides.length} slajdów`)}{" "}
                    {t(", a brief zakłada")} {current.brief.target}
                    {t(". Sprawdź długość lub zaktualizuj brief.")}{" "}
                  </div>
                )}
              {tab === "brief" && (
                <BriefStep
                  project={current}
                  change={change}
                  next={() => setTab("direction")}
                  library={() => setPanel("context")}
                />
              )}
              {tab === "direction" && (
                <DirectionStep
                  key={current.id}
                  project={current}
                  change={change}
                  next={() => setTab("create")}
                  copy={copy}
                />
              )}
              {tab === "create" && (
                <PackageActions
                  key={current.id}
                  project={current}
                  editDirection={() => setTab("direction")}
                  manual={() => setPanel("prompt")}
                  paste={() => {
                    setPendingPackage(null);
                    setPanel("import");
                  }}
                  apply={(candidate) =>
                    change((p) =>
                      p.id === current.id
                        ? { ...p, package: candidate, title: candidate.title }
                        : p,
                    )
                  }
                />
              )}
              {pkg &&
                tab === "create" &&
                (pkg.kind === "reel" ? (
                  <section className="panel">
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">{t("GŁOS I RYTM")}</span>
                        <h2>{t("Historia zaczyna się tutaj.")}</h2>
                      </div>
                      <span className="pill">
                        <Clock3 size={14} />
                        {pkg.shots.reduce((n, s) => n + s.editSeconds, 0)}{" "}
                        {t("s montażu")}{" "}
                      </span>
                    </div>
                    <Field
                      label={t("Cel kreatywny")}
                      value={pkg.objective}
                      multiline
                      onChange={(v) =>
                        setPackage((p) =>
                          p.kind === "reel" ? { ...p, objective: v } : p,
                        )
                      }
                    />
                    <Field
                      label="Hook"
                      value={pkg.hook}
                      onChange={(v) =>
                        setPackage((p) =>
                          p.kind === "reel" ? { ...p, hook: v } : p,
                        )
                      }
                    />
                  </section>
                ) : (
                  <section>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">1080 × 1350 · 4:5</span>
                        <h2>{t("Twoja historia w slajdach.")}</h2>
                      </div>
                      <div className="button-row">
                        <button
                          className="button subtle"
                          disabled={pkg.slides.length >= 20}
                          onClick={() =>
                            setPackage((p) =>
                              p.kind === "carousel"
                                ? {
                                    ...p,
                                    slides: [
                                      ...p.slides,
                                      {
                                        id: crypto.randomUUID(),
                                        layout: "text",
                                        headline: t("Nowa myśl"),
                                        body: "",
                                        imagePrompt: "",
                                        references: [],
                                        alt: "",
                                        cropX: 50,
                                        cropY: 50,
                                        zoom: 1,
                                      },
                                    ],
                                  }
                                : p,
                            )
                          }
                        >
                          <Plus size={16} /> {t("Dodaj slajd")}{" "}
                        </button>
                        <button
                          className="button primary"
                          disabled={busy}
                          onClick={() => void exportSlides()}
                        >
                          <Download size={16} />
                          {busy ? t("Eksportowanie…") : t("Eksportuj slajdy")}
                        </button>
                      </div>
                    </div>
                    <div className="slides-list">
                      {pkg.slides.map((s, i) => (
                        <article className="slide-editor panel" key={s.id}>
                          <div className="slide-visual-col">
                            <SlidePreview
                              language={current.brief.outputLanguage ?? "pl"}
                              slide={s}
                              index={i}
                              total={pkg.slides.length}
                              asset={current.assets.find(
                                (a) => a.id === s.imageId,
                              )}
                            />
                            <button
                              className="button subtle"
                              disabled={busy}
                              onClick={() =>
                                void run(async () =>
                                  download(
                                    await slideBlob(
                                      s,
                                      i,
                                      pkg.slides.length,
                                      current.assets.find(
                                        (a) => a.id === s.imageId,
                                      ),
                                      current.brief.outputLanguage ?? "pl",
                                    ),
                                    `slide-${i + 1}.png`,
                                  ),
                                )
                              }
                            >
                              <Download size={15} /> {t("PNG tego slajdu")}{" "}
                            </button>
                          </div>
                          <div className="slide-fields">
                            <div className="section-heading">
                              <h3>
                                {t("Slajd")} {String(i + 1).padStart(2, "0")}
                              </h3>
                              <div className="button-row">
                                <button
                                  className="icon-button"
                                  aria-label={t(
                                    `Przesuń slajd ${i + 1} w górę`,
                                  )}
                                  disabled={i === 0}
                                  onClick={() =>
                                    setPackage((p) => {
                                      if (p.kind !== "carousel") return p;
                                      const slides = [...p.slides];
                                      [slides[i - 1], slides[i]] = [
                                        slides[i],
                                        slides[i - 1],
                                      ];
                                      return { ...p, slides };
                                    })
                                  }
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={t(`Przesuń slajd ${i + 1} w dół`)}
                                  disabled={i === pkg.slides.length - 1}
                                  onClick={() =>
                                    setPackage((p) => {
                                      if (p.kind !== "carousel") return p;
                                      const slides = [...p.slides];
                                      [slides[i + 1], slides[i]] = [
                                        slides[i],
                                        slides[i + 1],
                                      ];
                                      return { ...p, slides };
                                    })
                                  }
                                >
                                  <ArrowDown size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={t(`Usuń slajd ${i + 1}`)}
                                  disabled={pkg.slides.length === 1}
                                  onClick={() => {
                                    if (confirm(t("Usunąć ten slajd?")))
                                      setPackage((p) =>
                                        p.kind === "carousel"
                                          ? {
                                              ...p,
                                              slides: p.slides.filter(
                                                (x) => x.id !== s.id,
                                              ),
                                            }
                                          : p,
                                      );
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <label className="field">
                              <span>{t("Układ")}</span>
                              <select
                                value={s.layout}
                                onChange={(e) =>
                                  updateSlide(s.id, {
                                    layout: e.target.value as Slide["layout"],
                                  })
                                }
                              >
                                <option value="cover">{t("Okładka")}</option>
                                <option value="text">{t("Tekst")}</option>
                                <option value="image">
                                  {t("Obraz + tekst")}
                                </option>
                                <option value="cta">
                                  {t("Zakończenie / CTA")}
                                </option>
                              </select>
                            </label>
                            <Field
                              label={t("Nagłówek")}
                              value={s.headline}
                              multiline
                              rows={2}
                              onChange={(v) =>
                                updateSlide(s.id, { headline: v })
                              }
                            />
                            <Field
                              label={t("Treść")}
                              value={s.body}
                              multiline
                              onChange={(v) => updateSlide(s.id, { body: v })}
                            />
                            <Field
                              label={t("Tekst alternatywny")}
                              value={s.alt}
                              multiline
                              rows={2}
                              onChange={(v) => updateSlide(s.id, { alt: v })}
                            />
                            {s.layout === "image" || s.imagePrompt.trim() ? (
                              <ItemProduction
                                project={current}
                                item={s}
                                assets={current.assets}
                                onChange={(patch) => updateSlide(s.id, patch)}
                                copy={copy}
                              />
                            ) : (
                              <small className="no-image-note">
                                {words(
                                  "This layout uses branded typography. Choose Image + text to add a generated image.",
                                  "Ten układ korzysta z typografii marki. Wybierz Obraz + tekst, aby dodać wygenerowany obraz.",
                                )}
                              </small>
                            )}
                            {s.layout === "image" && (
                              <>
                                <SlideImageUpload
                                  projectId={current.id}
                                  assetCount={current.assets.length}
                                  slideId={s.id}
                                  change={change}
                                />
                                <label className="field">
                                  <span>
                                    {t("Obraz z materiałów projektu")}
                                  </span>
                                  <select
                                    value={s.imageId ?? ""}
                                    onChange={(e) =>
                                      updateSlide(s.id, {
                                        imageId: e.target.value || undefined,
                                      })
                                    }
                                  >
                                    <option value="">
                                      {t("Wybierz obraz…")}
                                    </option>
                                    {allImages().map((a) => (
                                      <option key={a.id} value={a.id}>
                                        {a.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                {(["cropX", "cropY", "zoom"] as const).map(
                                  (k) => (
                                    <label className="field" key={k}>
                                      <span>
                                        {k === "zoom"
                                          ? t("Powiększenie")
                                          : k === "cropX"
                                            ? t("Kadr poziomy")
                                            : t("Kadr pionowy")}
                                      </span>
                                      <input
                                        aria-label={t(`${k} ${i + 1}`)}
                                        type="range"
                                        min={k === "zoom" ? 1 : 0}
                                        max={k === "zoom" ? 3 : 100}
                                        step={k === "zoom" ? 0.05 : 1}
                                        value={s[k]}
                                        onChange={(e) =>
                                          updateSlide(s.id, {
                                            [k]: Number(e.target.value),
                                          })
                                        }
                                      />
                                    </label>
                                  ),
                                )}
                              </>
                            )}
                            <button
                              className="button subtle"
                              onClick={() => startRevision(s.id)}
                            >
                              <RefreshCw size={15} />{" "}
                              {t("Przygotuj poprawkę w ChatGPT")}{" "}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              {pkg &&
                tab === "create" &&
                (pkg.kind === "reel" ? (
                  <section className="shots-list">
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">{t("PLAN ZDJĘCIOWY")}</span>
                        <h2>{t("Każde ujęcie ma swoje zadanie.")}</h2>
                      </div>
                      <button
                        className="button subtle"
                        disabled={pkg.shots.length >= 30}
                        onClick={() =>
                          setPackage((p) =>
                            p.kind === "reel"
                              ? {
                                  ...p,
                                  shots: [
                                    ...p.shots,
                                    {
                                      id: crypto.randomUUID(),
                                      title: t("Nowe ujęcie"),
                                      action: "",
                                      framing: "",
                                      environment: "",
                                      continuity: "",
                                      references: [],
                                      imagePrompt: "",
                                      motionPrompt: "",
                                      generationSeconds: 5,
                                      editSeconds: 3,
                                      dialogue: "",
                                      sound: "",
                                      subtitle: "",
                                      edit: "",
                                      checks: [],
                                    },
                                  ],
                                }
                              : p,
                          )
                        }
                      >
                        <Plus size={16} /> {t("Dodaj ujęcie")}{" "}
                      </button>
                    </div>
                    {pkg.shots.map((s, i) => (
                      <details
                        className="panel shot-card"
                        key={s.id}
                        open={i === 0}
                      >
                        <summary className="shot-summary">
                          <span>
                            {String(i + 1).padStart(2, "0")} · {s.title}
                          </span>
                          <small>{s.editSeconds}s · Higgsfield</small>
                        </summary>
                        <div className="shot-heading">
                          <span className="scene-index">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <Field
                            label={t("Nazwa ujęcia")}
                            value={s.title}
                            onChange={(v) => updateShot(s.id, { title: v })}
                          />
                          <button
                            className="button subtle"
                            onClick={() => startRevision(s.id)}
                          >
                            <RefreshCw size={15} /> {t("Popraw ujęcie")}{" "}
                          </button>
                          <button
                            className="icon-button"
                            disabled={i === 0}
                            aria-label={t(`Przesuń ujęcie ${i + 1} w górę`)}
                            onClick={() =>
                              setPackage((p) => {
                                if (p.kind !== "reel") return p;
                                const shots = [...p.shots];
                                [shots[i - 1], shots[i]] = [
                                  shots[i],
                                  shots[i - 1],
                                ];
                                return { ...p, shots };
                              })
                            }
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            className="icon-button"
                            disabled={pkg.shots.length === 1}
                            aria-label={t(`Usuń ujęcie ${i + 1}`)}
                            onClick={() => {
                              if (confirm(t("Usunąć ujęcie?")))
                                setPackage((p) =>
                                  p.kind === "reel"
                                    ? {
                                        ...p,
                                        shots: p.shots.filter(
                                          (x) => x.id !== s.id,
                                        ),
                                      }
                                    : p,
                                );
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <Field
                          label={t("Dialog / voiceover")}
                          value={s.dialogue}
                          multiline
                          onChange={(v) => updateShot(s.id, { dialogue: v })}
                        />
                        <Field
                          label={t("Napisy")}
                          value={s.subtitle}
                          multiline
                          onChange={(v) => updateShot(s.id, { subtitle: v })}
                        />
                        <ItemProduction
                          project={current}
                          item={s}
                          assets={current.assets}
                          onChange={(patch) => updateShot(s.id, patch)}
                          copy={copy}
                        />
                        <div className="two-col">
                          {(
                            [
                              ["action", t("Akcja")],
                              ["framing", t("Kadr i kamera")],
                              ["environment", t("Miejsce i światło")],
                              ["continuity", t("Ciągłość")],
                              ["sound", t("Dźwięk")],
                              ["edit", t("Instrukcja montażu")],
                            ] as const
                          ).map(([k, label]) => (
                            <Field
                              key={k}
                              label={label}
                              value={s[k]}
                              multiline
                              onChange={(v) => updateShot(s.id, { [k]: v })}
                            />
                          ))}
                          <Field
                            label={t("Sugerowany czas generacji (s)")}
                            type="number"
                            value={s.generationSeconds}
                            onChange={(v) =>
                              updateShot(s.id, {
                                generationSeconds: Math.max(
                                  1,
                                  Math.min(120, Number(v) || 1),
                                ),
                              })
                            }
                          />
                          <Field
                            label={t("Czas w montażu (s)")}
                            type="number"
                            value={s.editSeconds}
                            onChange={(v) =>
                              updateShot(s.id, {
                                editSeconds: Math.max(
                                  0.1,
                                  Math.min(120, Number(v) || 1),
                                ),
                              })
                            }
                          />
                          <ListField
                            label={t("Kontrola jakości")}
                            value={s.checks}
                            onChange={(v) => updateShot(s.id, { checks: v })}
                          />
                        </div>
                      </details>
                    ))}
                  </section>
                ) : null)}

              {pkg && tab === "finish" && (
                <>
                  <ProductionAssets
                    project={current}
                    change={change}
                    run={run}
                    notify={notify}
                  />
                  <section className="panel">
                    <span className="eyebrow">{t("OSTATNIE SZLIFY")}</span>
                    <h2>{t("Gotowe do następnego kroku.")}</h2>
                    {pkg.kind === "reel" && (
                      <>
                        <Field
                          label={t("Kolejność i instrukcje montażu")}
                          value={pkg.assembly}
                          multiline
                          rows={5}
                          onChange={(v) =>
                            setPackage((p) =>
                              p.kind === "reel" ? { ...p, assembly: v } : p,
                            )
                          }
                        />
                        <Field
                          label={t("Muzyka / licencja")}
                          value={pkg.music}
                          multiline
                          onChange={(v) =>
                            setPackage((p) =>
                              p.kind === "reel" ? { ...p, music: v } : p,
                            )
                          }
                        />
                        <Field
                          label={t("Plansza końcowa")}
                          value={pkg.endCard}
                          onChange={(v) =>
                            setPackage((p) =>
                              p.kind === "reel" ? { ...p, endCard: v } : p,
                            )
                          }
                        />
                      </>
                    )}
                    <Field
                      label={t("Opis publikacji")}
                      value={pkg.caption}
                      multiline
                      rows={6}
                      onChange={(v) =>
                        setPackage((p) => ({ ...p, caption: v }))
                      }
                    />
                    <button
                      className="button subtle"
                      onClick={() => void copy(pkg.caption)}
                    >
                      <Copy size={15} /> {t("Kopiuj opis")}{" "}
                    </button>
                    <Field
                      label="CTA"
                      value={pkg.cta}
                      onChange={(v) => setPackage((p) => ({ ...p, cta: v }))}
                    />
                    <ListField
                      label={t("Brakujące materiały")}
                      value={pkg.missingAssets}
                      onChange={(v) =>
                        setPackage((p) => ({ ...p, missingAssets: v }))
                      }
                    />
                    <ListField
                      label={t("Do akceptacji przed publikacją")}
                      value={pkg.reviewNotes}
                      onChange={(v) =>
                        setPackage((p) => ({ ...p, reviewNotes: v }))
                      }
                    />
                    <Field
                      label={t("Notatki i źródła")}
                      value={pkg.notes}
                      multiline
                      rows={5}
                      onChange={(v) => setPackage((p) => ({ ...p, notes: v }))}
                    />
                    <div className="button-row">
                      <button
                        className="button primary"
                        onClick={() =>
                          download(
                            markdown(current, locale),
                            `${current.title.slice(0, 70)}.md`,
                          )
                        }
                      >
                        <Download size={16} /> {t("Pakiet Markdown")}{" "}
                      </button>
                      {pkg.kind === "carousel" && (
                        <button
                          className="button primary"
                          disabled={busy}
                          onClick={() => void exportSlides()}
                        >
                          <Layers size={16} /> {t("Slajdy PNG + opis")}{" "}
                        </button>
                      )}
                      <button
                        className="button subtle"
                        onClick={() => {
                          setPendingPackage(null);
                          setPanel("import");
                        }}
                      >
                        <ClipboardPaste size={16} />{" "}
                        {t("Wczytaj nowy pakiet")}{" "}
                      </button>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}
        </main>
      </div>
      <input
        ref={uploadRef}
        hidden
        type="file"
        accept=".zip"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file)
            void run(async () => {
              const p = await restoreBackup(await file.arrayBuffer());
              p.id = crypto.randomUUID();
              p.title = `${p.title} · ${locale === "en" ? "copy" : "kopia"}`;
              p.updatedAt = new Date().toISOString();
              await open(p);
              notify(t("Przywrócono projekt jako nową kopię"));
            });
          e.target.value = "";
        }}
      />
      {panel && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPanel(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              panel === "context"
                ? words("Brand Library", "Biblioteka marki")
                : panel === "help"
                  ? t("Jak to działa")
                  : panel === "prompt"
                    ? t("Prompt do ChatGPT")
                    : panel === "revision"
                      ? t("Poprawka elementu")
                      : t("Wczytaj odpowiedź")
            }
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">O’LASER STUDIO</span>
                <h2>
                  {panel === "context"
                    ? words("Brand Library", "Biblioteka marki")
                    : panel === "help"
                      ? t("Od pomysłu do produkcji")
                      : panel === "prompt"
                        ? t("Twój prompt do ChatGPT")
                        : panel === "revision"
                          ? t("Popraw jeden element")
                          : t("Wklej odpowiedź ChatGPT")}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label={t("Zamknij okno")}
                onClick={() => setPanel(null)}
              >
                <X size={22} />
              </button>
            </div>
            {panel === "context" && (
              <>
                <div className="source-buttons">
                  <a href={calendarUrl} target="_blank" rel="noreferrer">
                    {words("Calendar source", "Źródło kalendarza")} ↗
                  </a>
                  <a href={canvaUrl} target="_blank" rel="noreferrer">
                    Canva ↗
                  </a>
                </div>
                <BrandLibrary
                  context={displayedContext}
                  project={current}
                  onChange={(next) => {
                    if (current)
                      change((p) => ({
                        ...p,
                        context: next,
                        direction: p.direction
                          ? { ...p.direction, approved: false }
                          : undefined,
                      }));
                    else {
                      setContext(next);
                      if (contextTimer.current)
                        clearTimeout(contextTimer.current);
                      contextTimer.current = setTimeout(
                        () =>
                          void saveContext(next).catch(() =>
                            setError(
                              words(
                                "Could not save Brand Library. Download a backup.",
                                "Nie udało się zapisać biblioteki marki. Pobierz kopię.",
                              ),
                            ),
                          ),
                        350,
                      );
                    }
                  }}
                  addResource={(r) => {
                    if (!r.image) return;
                    change((p) =>
                      p.assets.some((a) => a.id === r.id)
                        ? p
                        : {
                            ...p,
                            assets: [
                              ...p.assets,
                              {
                                id: r.id,
                                name: r.name,
                                type: r.image!.startsWith("data:image/png")
                                  ? "image/png"
                                  : r.image!.startsWith("data:image/webp")
                                    ? "image/webp"
                                    : "image/jpeg",
                                data: r.image!,
                              },
                            ],
                          },
                    );
                  }}
                />
                {current && (
                  <button
                    className="button subtle"
                    onClick={() => {
                      if (
                        confirm(
                          words(
                            "Replace this project's context with the current shared Brand Library? Your package edits will stay.",
                            "Zastąpić kontekst projektu aktualną wspólną biblioteką marki? Zmiany pakietu pozostaną.",
                          ),
                        )
                      )
                        change((p) => ({
                          ...p,
                          context: structuredClone(context),
                          direction: p.direction
                            ? { ...p.direction, approved: false }
                            : undefined,
                        }));
                    }}
                  >
                    {words(
                      "Refresh from shared Brand Library",
                      "Odśwież ze wspólnej biblioteki marki",
                    )}
                  </button>
                )}
              </>
            )}
            {panel === "help" && (
              <div className="help-content">
                <p>
                  {" "}
                  {t(
                    "Studio zamienia pomysł i kierunek kreatywny w edytowalny pakiet produkcyjny. AI może pomóc przygotować propozycję, ale Ty zatwierdzasz treść i materiały.",
                  )}{" "}
                </p>
                {[
                  [
                    words("Idea", "Pomysł"),
                    words(
                      "Choose a calendar row to fill the brief automatically, or start New Reel / New Carousel from Your Studio.",
                      "Wybierz wiersz kalendarza, aby uzupełnić brief automatycznie, albo rozpocznij Nowy reel / Nową karuzelę w Twoim studio.",
                    ),
                  ],
                  [
                    words("Creative direction", "Kierunek kreatywny"),
                    words(
                      "Review the series starting point, add your own instructions and optionally analyze inspiration. Approve the direction before generating a package.",
                      "Sprawdź punkt wyjścia serii, dodaj własne wskazówki i opcjonalnie przeanalizuj inspirację. Zatwierdź kierunek przed generowaniem pakietu.",
                    ),
                  ],
                  [
                    words("Production package", "Pakiet produkcyjny"),
                    words(
                      "Generate a package with configured AI, or use the manual ChatGPT handoff. Review the proposal before applying it. Copy complete image and motion prompts beside each item; attach their named references in the destination tool.",
                      "Wygeneruj pakiet ze skonfigurowanym AI albo użyj ręcznego przekazania do ChatGPT. Sprawdź propozycję przed zastosowaniem. Kopiuj pełne prompty przy elementach i dołącz wskazane referencje w docelowym narzędziu.",
                    ),
                  ],
                  [
                    words("Create & export", "Twórz i eksportuj"),
                    words(
                      "Review the caption, CTA, missing assets and assembly instructions. Export slides as PNGs or the production package as Markdown, and save a portable ZIP backup.",
                      "Sprawdź opis, CTA, brakujące materiały i instrukcje montażu. Eksportuj slajdy do PNG lub pakiet do Markdown i zapisz przenośną kopię ZIP.",
                    ),
                  ],
                ].map(([h, p], i) => (
                  <div className="help-step" key={h}>
                    <span>{i + 1}</span>
                    <div>
                      <h3>{h}</h3>
                      <p>{p}</p>
                    </div>
                  </div>
                ))}
                <div className="info-banner">
                  {" "}
                  {t(
                    "Projekty i pliki pozostają w tej przeglądarce. Pobieraj kopie ZIP. Opcjonalne AI wysyła odpowiedni kontekst i wybrane próbki obrazów do dostawcy tylko po kliknięciu; korzysta z płatnych kredytów. Studio nie publikuje postów ani nie generuje płatnych obrazów lub wideo.",
                  )}{" "}
                </div>
              </div>
            )}
            {panel === "prompt" && current && (
              <>
                <p>
                  {" "}
                  {t(
                    "Skopiuj cały prompt do ChatGPT. Potem wróć z odpowiedzią JSON.",
                  )}{" "}
                </p>
                <textarea
                  className="code-text"
                  aria-label={t("Gotowy prompt")}
                  readOnly
                  value={buildPrompt(current, locale)}
                  rows={16}
                />
                <div className="button-row">
                  <button
                    className="button primary"
                    onClick={() => void copy(buildPrompt(current, locale))}
                  >
                    <Copy size={16} /> {t("Kopiuj cały prompt")}{" "}
                  </button>
                  <a
                    className="button subtle"
                    href="https://chatgpt.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {" "}
                    {t("Otwórz ChatGPT")} <ExternalLink size={15} />
                  </a>
                  <button
                    className="button subtle"
                    onClick={() => {
                      setPendingPackage(null);
                      setPanel("import");
                    }}
                  >
                    {" "}
                    {t("Mam już odpowiedź")}{" "}
                  </button>
                </div>
              </>
            )}
            {panel === "import" && current && (
              <>
                <p>
                  {" "}
                  {t(
                    "Wklej całą odpowiedź. Możesz zostawić znaczniki bloku JSON. Sprawdzimy strukturę przed importem.",
                  )}{" "}
                </p>
                <Field
                  label={t("Odpowiedź JSON")}
                  value={current.importDraft}
                  multiline
                  rows={15}
                  onChange={(v) => {
                    change((p) => ({ ...p, importDraft: v }));
                    setPendingPackage(null);
                  }}
                />
                <button
                  className="button primary"
                  onClick={() => {
                    try {
                      setPendingPackage(
                        parseAnswer(current.importDraft, current.kind),
                      );
                      setError("");
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : t("Błąd importu"),
                      );
                    }
                  }}
                >
                  {" "}
                  {t("Sprawdź odpowiedź")}{" "}
                </button>
                {pendingPackage && (
                  <div className="import-confirm">
                    <Check size={20} />
                    <div>
                      <h3>{t("Pakiet jest poprawny.")}</h3>
                      <p>
                        {pendingPackage.title} ·{" "}
                        {pendingPackage.kind === "reel"
                          ? t(`${pendingPackage.shots.length} ujęć`)
                          : t(`${pendingPackage.slides.length} slajdów`)}
                      </p>
                      {current.package && (
                        <p>
                          {" "}
                          {t(
                            "Wczytanie zastąpi obecną treść pakietu. Załączniki pozostaną. Pobierz kopię projektu, jeśli chcesz zachować poprzednią wersję.",
                          )}{" "}
                        </p>
                      )}
                      <button
                        className="button primary"
                        onClick={() => {
                          change((p) => ({
                            ...p,
                            package: pendingPackage,
                            title: pendingPackage.title,
                          }));
                          setTab("create");
                          setPendingPackage(null);
                          setPanel(null);
                          notify(t("Pakiet gotowy do edycji"));
                        }}
                      >
                        {" "}
                        {t("Wczytaj do edytora")}{" "}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {panel === "revision" && current && revision && selected && (
              <>
                <Field
                  label={t("Co zmienić?")}
                  value={revision.instruction}
                  multiline
                  onChange={(v) =>
                    setRevision({
                      ...revision,
                      instruction: v,
                      candidate: null,
                    })
                  }
                />
                <button
                  className="button subtle"
                  disabled={!revision.instruction.trim()}
                  onClick={() =>
                    void copy(
                      revisionPrompt(
                        current,
                        selected,
                        revision.instruction,
                        locale,
                      ),
                    )
                  }
                >
                  <Copy size={16} /> {t("Kopiuj prompt poprawki")}{" "}
                </button>
                <Field
                  label={t("Odpowiedź JSON pojedynczego elementu")}
                  value={current.revisionDraft}
                  multiline
                  rows={9}
                  onChange={(v) => {
                    change((p) => ({ ...p, revisionDraft: v }));
                    setRevision({ ...revision, candidate: null });
                  }}
                />
                <button
                  className="button primary"
                  onClick={() => {
                    try {
                      setRevision({
                        ...revision,
                        candidate: parseRevision(
                          current.revisionDraft,
                          current.kind,
                          revision.id,
                        ),
                      });
                      setError("");
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : t("Błąd poprawki"),
                      );
                    }
                  }}
                >
                  {" "}
                  {t("Porównaj zmianę")}{" "}
                </button>
                {revision.candidate && (
                  <>
                    <div className="revision-compare">
                      <div>
                        <h3>{t("Obecna wersja")}</h3>
                        <pre>{JSON.stringify(selected, null, 2)}</pre>
                      </div>
                      <div>
                        <h3>{t("Proponowana wersja")}</h3>
                        <pre>{JSON.stringify(revision.candidate, null, 2)}</pre>
                      </div>
                    </div>
                    <p>
                      {" "}
                      {t("Zmiana dotyczy tylko elementu")} {revision.id}
                      {t(". Przypisany obraz i kadrowanie pozostaną.")}{" "}
                    </p>
                    <button
                      className="button primary"
                      onClick={() => {
                        if (current.id !== revisionProject.current) {
                          setError(
                            t("Projekt zmienił się. Otwórz poprawkę ponownie."),
                          );
                          return;
                        }
                        change((p) => applyRevision(p, revision.candidate!));
                        setPanel(null);
                        notify(t("Zastosowano poprawkę jednego elementu"));
                      }}
                    >
                      {" "}
                      {t("Zastosuj zmianę")}{" "}
                    </button>
                  </>
                )}
              </>
            )}
            {error && (
              <div className="error-banner" role="alert">
                {t(error)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
