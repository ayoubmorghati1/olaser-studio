"use client";
import type { Project } from "@/lib/schema";
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { Field } from "./Fields";
import Assets from "./Assets";
export default function ProductionAssets({
  project: p,
  change,
  run,
  notify,
}: {
  project: Project;
  change: (fn: (p: Project) => Project) => void;
  run: (fn: () => Promise<void>) => Promise<void>;
  notify: (text: string) => void;
}) {
  const [error, setError] = useState("");
  const { locale } = useLanguage();
  const en = locale === "en";
  const pkg = p.package;
  const items = pkg ? (pkg.kind === "reel" ? pkg.shots : pkg.slides) : [];
  const checklist = [
    ...new Set([
      ...(pkg?.missingAssets ?? []),
      ...(p.brief.requirements ? [p.brief.requirements] : []),
      ...items.flatMap((s) => s.references),
    ]),
  ];
  return (
    <section className="production-assets">
      <div className="panel">
        <span className="eyebrow">
          {en ? "PRODUCTION ASSETS" : "MATERIAŁY PRODUKCYJNE"}
        </span>
        <h2>
          {en ? "What this package needs." : "Czego potrzebuje ten pakiet."}
        </h2>
        <p>
          {en
            ? "This checklist comes from the production plan and source requirements. File availability and permission to use it are separate checks."
            : "Lista wynika z planu produkcji i wymagań źródłowych. Dostępność pliku i zgoda na jego użycie to osobne sprawy."}
        </p>
        {checklist.length ? (
          checklist.map((label, index) => {
            const key = `requirement:${label}`;
            const record = p.assetApprovals?.[key] ?? {
              status: "needed",
              evidence: "",
            };
            return (
              <div className="asset-requirement" key={key}>
                <h4>
                  {index + 1}. {label}
                </h4>
                <label className="field">
                  <span>{en ? "Status" : "Status"}</span>
                  <select
                    value={record.status}
                    onChange={(e) =>
                      change((x) => ({
                        ...x,
                        assetApprovals: {
                          ...x.assetApprovals,
                          [key]: {
                            ...record,
                            status: e.target.value as
                              "needed" | "available" | "approved",
                          },
                        },
                      }))
                    }
                  >
                    <option value="needed">
                      {en ? "Needed" : "Potrzebne"}
                    </option>
                    <option value="available">
                      {en
                        ? "File available — approval still to check"
                        : "Plik dostępny — akceptacja do sprawdzenia"}
                    </option>
                    <option value="approved">
                      {en
                        ? "Reviewed for this use"
                        : "Sprawdzone do tego użycia"}
                    </option>
                  </select>
                </label>
                <Field
                  label={
                    en
                      ? "File name / source / approval evidence"
                      : "Nazwa pliku / źródło / dowód akceptacji"
                  }
                  value={record.evidence}
                  multiline
                  onChange={(evidence) =>
                    change((x) =>
                      x.id !== p.id
                        ? x
                        : {
                            ...x,
                            assetApprovals: {
                              ...x.assetApprovals,
                              [key]: { ...record, evidence },
                            },
                          },
                    )
                  }
                />
                {record.status === "approved" && !record.evidence.trim() && (
                  <small>
                    {en
                      ? "Record where the approval or permission is documented. A status alone is not evidence of consent."
                      : "Zapisz, gdzie udokumentowano akceptację lub zgodę. Sam status nie jest dowodem zgody."}
                  </small>
                )}
              </div>
            );
          })
        ) : (
          <p>
            {en
              ? "No additional source requirements were listed. Check each shot or slide before creating it."
              : "Nie wskazano dodatkowych wymagań źródłowych. Sprawdź każde ujęcie lub slajd przed produkcją."}
          </p>
        )}
      </div>
      {pkg?.kind === "reel" && (
        <section className="panel">
          <h2>{en ? "Finished clips" : "Gotowe klipy"}</h2>
          <p>
            {en
              ? "Attach your generated or filmed clips to their shots. MP4, WebM or MOV, up to 10 MB each. These stay on this device and are included in ZIP backups."
              : "Dołącz wygenerowane lub nagrane klipy do ujęć. MP4, WebM lub MOV, do 10 MB każdy. Pozostają na tym urządzeniu i trafiają do kopii ZIP."}
          </p>
          {error && (
            <p role="alert" className="error-banner">
              {error}
            </p>
          )}
          {pkg.shots.map((shot) => {
            const result = p.productionFiles?.find((f) => f.itemId === shot.id);
            return (
              <article className="clip-result" key={shot.id}>
                <h3>{shot.title}</h3>
                {result && (
                  <>
                    <video controls preload="metadata" src={result.data} />
                    <p>{result.name}</p>
                    <a
                      className="button subtle"
                      href={result.data}
                      download={result.name}
                    >
                      {en ? "Download clip" : "Pobierz klip"}
                    </a>
                  </>
                )}
                <label className="field">
                  <span>
                    {result
                      ? en
                        ? "Replace clip"
                        : "Zastąp klip"
                      : en
                        ? "Attach clip"
                        : "Dołącz klip"}
                  </span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        if (
                          file.size > 10 * 1024 * 1024 ||
                          ![
                            "video/mp4",
                            "video/webm",
                            "video/quicktime",
                          ].includes(file.type)
                        )
                          throw Error(
                            en
                              ? "Use an MP4, WebM or MOV under 10 MB."
                              : "Wybierz MP4, WebM lub MOV poniżej 10 MB.",
                          );
                        const data = await new Promise<string>(
                          (resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () =>
                              resolve(String(reader.result));
                            reader.onerror = () =>
                              reject(Error("Could not read clip"));
                            reader.readAsDataURL(file);
                          },
                        );
                        change((x) => ({
                          ...x,
                          productionFiles: [
                            ...(x.productionFiles ?? []).filter(
                              (f) => f.itemId !== shot.id,
                            ),
                            {
                              id: crypto.randomUUID(),
                              itemId: shot.id,
                              name: file.name,
                              type: file.type as
                                "video/mp4" | "video/webm" | "video/quicktime",
                              data,
                            },
                          ],
                        }));
                        setError("");
                      } catch (err) {
                        setError(String(err));
                      }
                    }}
                  />
                </label>
              </article>
            );
          })}
        </section>
      )}
      <Assets current={p} change={change} run={run} notify={notify} />
    </section>
  );
}
