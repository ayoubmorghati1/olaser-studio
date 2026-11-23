import source from "./calendar-source.json";
import type { Project, BrandContext } from "./schema";
import { newProject } from "./examples";
import type { Locale } from "./translations";
export type CalendarIdea = {
  id: string;
  date: string;
  kind: Project["kind"];
  title: string;
  character: string;
  series: string;
  angle: string;
  cta: string;
  requirements: string;
  notes: string;
  sourceText: string;
};
// RFC 4180 fields: quoted commas, escaped quotes and embedded newlines.
export function csvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(cell.replace(/\r$/, ""));
      cell = "";
      if (c === "\n") {
        rows.push(row);
        row = [];
      }
    } else cell += c;
  }
  if (quoted) throw new Error("Invalid CSV: unclosed quote");
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}
export function parseCalendar(csv: string): CalendarIdea[] {
  const rows = csvRows(csv.split("\f")[0].replace(/^\uFEFF/, ""));
  const header = rows.shift() ?? [];
  const column = (name: string) => header.indexOf(name);
  for (const name of ["#", "Format", "Working title (PL)"])
    if (column(name) < 0)
      throw new Error("Calendar CSV requires: #, Format, Working title (PL)");
  const ideas = rows.flatMap((row) => {
    const get = (name: string) => row[column(name)]?.trim() ?? "";
    const format = get("Format").toLowerCase();
    if (!["reel", "carousel"].includes(format) || !get("Working title (PL)"))
      return [];
    return [
      {
        id: get("#"),
        date: get("Date").slice(0, 10),
        kind: format as Project["kind"],
        title: get("Working title (PL)"),
        character: get("Host / people"),
        series: get("Series"),
        angle: get("Hook / angle (EN)"),
        cta: get("CTA"),
        requirements: get("Assets / consents needed"),
        notes: get("Notes"),
        sourceText: header
          .map((key, i) => (key ? `${key}: ${row[i] ?? ""}` : ""))
          .filter(Boolean)
          .join("\n"),
      },
    ];
  });
  if (!ideas.length) throw new Error("No Reel or Carousel ideas found");
  if (new Set(ideas.map((i) => i.id)).size !== ideas.length)
    throw new Error("Calendar IDs must be unique");
  return ideas;
}
export const calendarSnapshot = {
  ideas: parseCalendar(source.content),
  retrievedAt: source.retrievedAt,
};
export function projectFromIdea(
  idea: CalendarIdea,
  context: BrandContext,
  locale: Locale,
): Project {
  const p = newProject(idea.kind, context, locale);
  return {
    ...p,
    title: idea.title,
    brief: {
      ...p.brief,
      idea: idea.title,
      sourceText: idea.sourceText,
      series: idea.series,
      character: idea.character,
      cta: idea.cta,
      angle: idea.angle,
      requirements: idea.requirements,
      calendarId: idea.id,
      outputLanguage: "pl",
    },
  };
}
