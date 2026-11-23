import { z } from "zod";
const text = z.string().max(20000);
const lines = z.array(text).max(100);
export const resourceSchema = z.object({
  id: z.string(),
  name: text,
  section: z.enum([
    "brand",
    "design",
    "characters",
    "claims",
    "production",
    "sources",
  ]),
  text: text.optional(),
  image: z.string().startsWith("data:image/").max(16000000).optional(),
  source: text.optional(),
  reviewed: z.boolean().default(false),
});
export const directionSchema = z.object({
  approach: text,
  story: text,
  visuals: text,
  pacing: text,
  audio: text,
  medium: z.enum(["generated", "filmed", "mixed"]),
  notes: text,
  approved: z.boolean().default(false),
});
export const inspirationSchema = z.object({
  id: z.string(),
  name: text,
  type: z.enum([
    "image/png",
    "image/jpeg",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]),
  data: z.string().startsWith("data:").max(16000000),
  frames: z
    .array(z.string().startsWith("data:image/jpeg;base64,").max(500000))
    .max(8),
  duration: z.number().optional(),
  borrow: z.array(z.string()).max(6),
  notes: text,
  analysis: text,
  approved: z.boolean(),
  analysisSource: z.enum(["ai", "manual"]).optional(),
});
export type Direction = z.infer<typeof directionSchema>;
export type Inspiration = z.infer<typeof inspirationSchema>;
export type BrandResource = z.infer<typeof resourceSchema>;
export const contextSchema = z.object({
  version: z.literal(1),
  brand: text,
  design: text,
  characters: text,
  claims: text,
  production: text,
  sources: text,
  resources: z.array(resourceSchema).max(30).optional(),
});
export type BrandContext = z.infer<typeof contextSchema>;
export const briefSchema = z.object({
  idea: text,
  sourceText: text,
  series: text,
  character: text,
  audience: text,
  cta: text,
  target: z.number().int().min(1).max(180),
  angle: text.optional(),
  requirements: text.optional(),
  calendarId: z.string().optional(),
  outputLanguage: z.enum(["pl", "en"]).optional(),
});
export const shotSchema = z.object({
  id: z.string().min(1).max(100),
  title: text,
  action: text,
  framing: text,
  environment: text,
  continuity: text,
  referenceIds: z.array(z.string()).max(50).optional(),
  references: lines,
  imagePrompt: text,
  motionPrompt: text,
  generationSeconds: z.number().min(1).max(120),
  editSeconds: z.number().min(0.1).max(120),
  dialogue: text,
  sound: text,
  subtitle: text,
  edit: text,
  checks: lines,
});
export const slideSchema = z.object({
  id: z.string().min(1).max(100),
  layout: z.enum(["cover", "text", "image", "cta"]),
  headline: text,
  body: text,
  imagePrompt: text,
  referenceIds: z.array(z.string()).max(50).optional(),
  references: lines,
  alt: text,
  imageId: z.string().optional(),
  cropX: z.number().min(0).max(100).default(50),
  cropY: z.number().min(0).max(100).default(50),
  zoom: z.number().min(1).max(3).default(1),
});
const common = {
  version: z.literal(1),
  title: z.string().min(1).max(300),
  caption: text,
  cta: text,
  notes: text,
  missingAssets: lines,
  reviewNotes: lines,
};
export const reelPackageSchema = z.object({
  ...common,
  kind: z.literal("reel"),
  hook: text,
  objective: text,
  shots: z.array(shotSchema).min(1).max(30),
  assembly: text,
  music: text,
  endCard: text,
});
export const carouselPackageSchema = z.object({
  ...common,
  kind: z.literal("carousel"),
  slides: z.array(slideSchema).min(1).max(20),
});
export const packageSchema = z
  .discriminatedUnion("kind", [reelPackageSchema, carouselPackageSchema])
  .superRefine((p, ctx) => {
    const items = p.kind === "reel" ? p.shots : p.slides;
    const ids = new Set<string>();
    items.forEach((item, i) => {
      if (ids.has(item.id))
        ctx.addIssue({
          code: "custom",
          message: "Powtórzone ID",
          path: [p.kind === "reel" ? "shots" : "slides", i, "id"],
        });
      ids.add(item.id);
    });
  });
export type Shot = z.infer<typeof shotSchema>;
export type Slide = z.infer<typeof slideSchema>;
export type ProductionPackage = z.infer<typeof packageSchema>;
export const assetSchema = z.object({
  id: z.string(),
  name: text,
  type: z.enum(["image/png", "image/jpeg", "image/webp"]),
  data: z.string().startsWith("data:image/").max(16000000),
});
export const projectSchema = z
  .object({
    version: z.literal(1),
    id: z.string().min(1),
    kind: z.enum(["reel", "carousel"]),
    title: text,
    createdAt: text,
    updatedAt: text,
    brief: briefSchema,
    context: contextSchema,
    package: packageSchema.nullable(),
    assets: z.array(assetSchema).max(50),
    productionFiles: z
      .array(
        z.object({
          id: z.string(),
          itemId: z.string(),
          name: text,
          type: z.enum(["video/mp4", "video/webm", "video/quicktime"]),
          data: z.string().startsWith("data:video/").max(16000000),
        }),
      )
      .max(30)
      .optional(),
    direction: directionSchema.optional(),
    inspirations: z.array(inspirationSchema).max(8).optional(),
    assetApprovals: z
      .record(
        z.string(),
        z.object({
          status: z.enum(["needed", "available", "approved"]),
          evidence: text,
        }),
      )
      .optional(),
    importDraft: z.string().max(1000000),
    revisionDraft: z.string().max(1000000),
  })
  .superRefine((p, ctx) => {
    if (p.package && p.package.kind !== p.kind)
      ctx.addIssue({
        code: "custom",
        message: "Format projektu nie zgadza się z pakietem",
        path: ["package", "kind"],
      });
    const ids = p.assets.map((a) => a.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "Powtórzone ID pliku",
        path: ["assets"],
      });
  });
export type Project = z.infer<typeof projectSchema>;
export type ReelProject = Project & { kind: "reel" };
export type CarouselProject = Project & { kind: "carousel" };
export type Asset = z.infer<typeof assetSchema>;
export type Brief = z.infer<typeof briefSchema>;
export function parseAnswer(raw: string, kind: Project["kind"]) {
  const clean = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let value: unknown;
  try {
    value = JSON.parse(clean);
  } catch {
    throw new Error(
      "Niepoprawny JSON. Skopiuj całą odpowiedź, od { do }, bez dodatkowego komentarza.",
    );
  }
  const parsed = packageSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      parsed.error.issues
        .slice(0, 8)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("\n"),
    );
  if (parsed.data.kind !== kind)
    throw new Error("Odpowiedź ma inny format niż projekt.");
  return parsed.data;
}
export function parseRevision(
  raw: string,
  kind: Project["kind"],
  id: string,
): Shot | Slide {
  let value: unknown;
  try {
    value = JSON.parse(
      raw
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, ""),
    );
  } catch {
    throw new Error("Wklej pojedynczy obiekt JSON ujęcia lub slajdu.");
  }
  const result = (kind === "reel" ? shotSchema : slideSchema).safeParse(value);
  if (!result.success)
    throw new Error(
      result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("\n"),
    );
  if (result.data.id !== id)
    throw new Error(
      "ID odpowiedzi nie pasuje do wybranego elementu. Zachowaj oryginalne ID.",
    );
  return result.data;
}
export function applyRevision(project: Project, item: Shot | Slide): Project {
  if (!project.package) throw new Error("Brak pakietu");
  const pkg = project.package;
  const key = pkg.kind === "reel" ? "shots" : "slides";
  const items = pkg.kind === "reel" ? pkg.shots : pkg.slides;
  if (!items.some((x) => x.id === item.id))
    throw new Error("Nie znaleziono elementu");
  return projectSchema.parse({
    ...project,
    package: {
      ...pkg,
      [key]: items.map((x) =>
        x.id === item.id
          ? {
              ...item,
              ...(x.referenceIds ? { referenceIds: x.referenceIds } : {}),
              ...("imageId" in x
                ? {
                    imageId: x.imageId,
                    cropX: (x as Slide).cropX,
                    cropY: (x as Slide).cropY,
                    zoom: (x as Slide).zoom,
                  }
                : {}),
            }
          : x,
      ),
    },
    updatedAt: new Date().toISOString(),
  });
}
