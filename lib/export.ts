import JSZip from "jszip";
import type { Locale } from "./translations";
import { projectSchema, type Project, type Asset } from "./schema";
export function download(
  data: Blob | string,
  name: string,
  type = "text/plain;charset=utf-8",
) {
  const blob = typeof data === "string" ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function markdown(p: Project, locale: Locale = "pl") {
  const pkg = p.package;
  const referenceNames = (ids: string[] = []) =>
    ids
      .map(
        (id) => p.assets.find((a) => a.id === id)?.name ?? `[missing: ${id}]`,
      )
      .join(", ");
  const h = (pl: string, en: string) => (locale === "en" ? en : pl);
  let body = `# ${p.title}\n\n## ${h("Brief źródłowy", "Source brief")}\n${p.brief.sourceText}\n\n${JSON.stringify(p.brief, null, 2)}\n\n`;
  if (p.direction)
    body += `## ${h("Kierunek kreatywny", "Creative direction")}\n${Object.entries(
      p.direction,
    )
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n")}\n\n`;
  for (const i of p.inspirations ?? [])
    body += `## ${h("Inspiracja", "Inspiration")}: ${i.name}\n${i.approved ? h("Sprawdzona interpretacja", "Reviewed interpretation") : h("Nie zatwierdzono — nie stosować", "Not approved — do not apply")}\n${i.analysis}\n\n`;
  if (p.context.resources?.length)
    body += `## ${h("Zasoby marki", "Brand resources")}\n${p.context.resources.map((r) => `- ${r.name} · ${r.section} · ${r.reviewed ? "reviewed" : "not reviewed"} · ${r.source ?? ""}`).join("\n")}\n\n`;
  if (p.assetApprovals)
    body += `## ${h("Materiały i dowody akceptacji", "Assets and approval records")}\n${Object.entries(
      p.assetApprovals,
    )
      .map(([key, record]) => `- ${key}: ${record.status}; ${record.evidence}`)
      .join("\n")}\n\n`;
  if (pkg) {
    body += `## ${h("Opis publikacji", "Caption")}\n${pkg.caption}\n\nCTA: ${pkg.cta}\n\n`;
    if (pkg.kind === "reel") {
      body += `## ${h("Cel", "Objective")}\n${pkg.objective}\n\n## Hook\n${pkg.hook}\n\n`;
      for (const [i, s] of pkg.shots.entries())
        body += `## ${h("Ujęcie", "Shot")} ${i + 1}: ${s.title}\nID: ${s.id}\n${h("Załączone referencje", "Assigned references")}: ${referenceNames(s.referenceIds)}\n\n${Object.entries(
          s,
        )
          .filter(([k]) => !["id", "title"].includes(k))
          .map(
            ([k, v]) =>
              `### ${k}\n${Array.isArray(v) ? v.map((x) => `- ${x}`).join("\n") : v}`,
          )
          .join("\n\n")}\n\n`;
      body += `## ${h("Montaż", "Editing")}\n${pkg.assembly}\n\n## ${h("Muzyka", "Music")}\n${pkg.music}\n\n## ${h("Plansza końcowa", "End card")}\n${pkg.endCard}\n\n`;
    } else
      body += pkg.slides
        .map(
          (s, i) =>
            `## ${h("Slajd", "Slide")} ${i + 1}\n${s.headline}\n\n${s.body}\n\nPrompt: ${s.imagePrompt}\n${h("Referencje", "References")}: ${s.references.join(", ")}\n${h("Załączone referencje", "Assigned references")}: ${referenceNames(s.referenceIds)}\nAlt: ${s.alt}`,
        )
        .join("\n\n");
    body += `\n\n## ${h("Brakujące materiały", "Missing assets")}\n${pkg.missingAssets.map((x) => `- [ ] ${x}`).join("\n")}\n\n## ${h("Do akceptacji", "Approval needed")}\n${pkg.reviewNotes.join("\n")}\n\n## ${h("Notatki", "Notes")}\n${pkg.notes}`;
  }
  return (
    body +
    `\n\n## ${h("Kontekst", "Context")}\n${Object.entries(p.context)
      .filter(([k, v]) => k !== "version" && typeof v === "string")
      .map(([k, v]) => `### ${k}\n${v}`)
      .join("\n\n")}`
  );
}
export async function backupBlob(p: Project, locale: Locale = "pl") {
  projectSchema.parse(p);
  const zip = new JSZip();
  const put = (path: string, data: string) => {
    zip.file(path, data.split(",")[1], { base64: true });
    return path;
  };
  const resources = p.context.resources?.map(({ image, ...r }) =>
    image
      ? {
          ...r,
          imageFile: put(`resources/${r.id}.image`, image),
          imageType: image.slice(5, image.indexOf(";")),
        }
      : r,
  );
  const inspirations = p.inspirations?.map(({ data, frames, ...i }) => ({
    ...i,
    data: "",
    file: put(`inspiration/${i.id}.media`, data),
    frames: [],
    frameFiles: frames.map((f, n) => put(`inspiration/${i.id}-${n}.jpg`, f)),
  }));
  const productionFiles = p.productionFiles?.map(({ data, ...f }) => ({
    ...f,
    data: "",
    file: put(`results/${f.id}.media`, data),
  }));
  const context = { ...p.context, ...(resources ? { resources } : {}) };
  zip.file(
    "project.json",
    JSON.stringify(
      {
        ...p,
        ...(productionFiles ? { productionFiles } : {}),
        context,
        ...(inspirations ? { inspirations } : {}),
        assets: p.assets.map(({ data, ...a }) => ({
          ...a,
          data: "",
          file: put(`assets/${a.id}.${a.type.split("/")[1]}`, data),
        })),
      },
      null,
      2,
    ),
  );
  zip.file("production-package.md", markdown(p, locale));
  zip.file("context.json", JSON.stringify(context, null, 2));
  zip.file("brief.json", JSON.stringify(p.brief, null, 2));
  return zip.generateAsync({ type: "blob" });
}
export async function restoreBackup(buffer: ArrayBuffer): Promise<Project> {
  if (buffer.byteLength > 100 * 1024 * 1024)
    throw new Error("Kopia jest za duża (maks. 100 MB).");
  const zip = await JSZip.loadAsync(buffer);
  const f = zip.file("project.json");
  if (!f) throw new Error("Brak project.json w kopii.");
  const raw = await f.async("string");
  if (raw.length > 2000000) throw new Error("Nieprawidłowy rozmiar projektu.");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.assets) || data.assets.length > 50)
    throw new Error("Nieprawidłowa lista plików.");
  data.assets = await Promise.all(
    data.assets.map(async (a: Asset & { file: string }) => {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(a.type) ||
        !/^[a-zA-Z0-9-]+$/.test(a.id)
      )
        throw new Error("Nieprawidłowy plik obrazu.");
      const path = `assets/${a.id}.${a.type.split("/")[1]}`;
      if (a.file !== path) throw new Error("Nieprawidłowa ścieżka pliku.");
      const asset = zip.file(path);
      if (!asset) throw new Error(`Brak pliku: ${a.name}`);
      const bytes = await asset.async("uint8array");
      if (bytes.byteLength > 10 * 1024 * 1024)
        throw new Error("Obraz przekracza 10 MB.");
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        data: `data:${a.type};base64,${await asset.async("base64")}`,
      };
    }),
  );
  let totalBytes = data.assets.reduce(
    (sum: number, a: Asset) => sum + a.data.length * 0.75,
    0,
  );
  if (totalBytes > 100 * 1024 * 1024)
    throw Error("Backup attachments exceed size limits");
  const read = async (path: string, type: string) => {
    const file = zip.file(path);
    if (!file) throw Error(`Missing attachment: ${path}`);
    const bytes = await file.async("uint8array");
    totalBytes += bytes.byteLength;
    if (bytes.byteLength > 10 * 1024 * 1024 || totalBytes > 100 * 1024 * 1024)
      throw Error("Backup attachments exceed size limits");
    return `data:${type};base64,${await file.async("base64")}`;
  };
  if (data.productionFiles) {
    if (
      !Array.isArray(data.productionFiles) ||
      data.productionFiles.length > 30
    )
      throw Error("Invalid production files");
    for (const f of data.productionFiles) {
      if (
        !/^[a-zA-Z0-9-]+$/.test(f.id) ||
        f.file !== `results/${f.id}.media` ||
        !["video/mp4", "video/webm", "video/quicktime"].includes(f.type)
      )
        throw Error("Invalid clip attachment");
      f.data = await read(f.file, f.type);
    }
  }
  if (data.inspirations) {
    if (!Array.isArray(data.inspirations) || data.inspirations.length > 8)
      throw Error("Invalid inspiration list");
    for (const i of data.inspirations) {
      if (
        !/^[a-zA-Z0-9-]+$/.test(i.id) ||
        i.file !== `inspiration/${i.id}.media` ||
        ![
          "image/png",
          "image/jpeg",
          "image/webp",
          "video/mp4",
          "video/webm",
          "video/quicktime",
        ].includes(i.type) ||
        !Array.isArray(i.frameFiles) ||
        i.frameFiles.length > 8
      )
        throw Error("Invalid inspiration attachment");
      i.data = await read(i.file, i.type);
      i.frames = [];
      for (let n = 0; n < i.frameFiles.length; n++) {
        if (i.frameFiles[n] !== `inspiration/${i.id}-${n}.jpg`)
          throw Error("Invalid frame path");
        i.frames.push(await read(i.frameFiles[n], "image/jpeg"));
      }
    }
  }
  if (data.context?.resources) {
    if (
      !Array.isArray(data.context.resources) ||
      data.context.resources.length > 30
    )
      throw Error("Invalid resources");
    for (const r of data.context.resources) {
      if (r.imageFile) {
        if (
          !/^[a-zA-Z0-9-]+$/.test(r.id) ||
          r.imageFile !== `resources/${r.id}.image` ||
          !["image/png", "image/jpeg", "image/webp"].includes(r.imageType)
        )
          throw Error("Invalid brand image");
        r.image = await read(r.imageFile, r.imageType);
      }
    }
  }
  return projectSchema.parse(data);
}
export async function imageAsset(file: File): Promise<Asset> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Wybierz PNG, JPG lub WebP.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Maksymalny rozmiar obrazu to 10 MB.");
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await createImageBitmap(file);
  if (img.width * img.height > 40000000) {
    img.close();
    throw new Error("Obraz ma zbyt dużą rozdzielczość (maks. 40 MP).");
  }
  img.close();
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type as Asset["type"],
    data,
  };
}
