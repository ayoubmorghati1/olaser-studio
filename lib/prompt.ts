import { z } from "zod";
import {
  reelPackageSchema,
  carouselPackageSchema,
  shotSchema,
  slideSchema,
  type Project,
  type Shot,
  type Slide,
} from "./schema";
import { localizeContext } from "./context";
import { approvedInspiration, recipeFor } from "./direction";
import type { Locale } from "./translations";
export function buildPrompt(p: Project, locale: Locale = "pl") {
  const schema = z.toJSONSchema(
    p.kind === "reel" ? reelPackageSchema : carouselPackageSchema,
  );
  const referenceInventory = p.assets.map((a) => ({ id: a.id, name: a.name }));
  const language = p.brief.outputLanguage === "en" ? "English" : "Polish";
  const context =
    Object.entries(localizeContext(p.context, locale))
      .filter(([k, v]) => k !== "version" && typeof v === "string")
      .map(([k, v]) => `## ${k}\n${v}`)
      .join("\n\n") +
    "\nReviewed resources:\n" +
    (p.context.resources ?? [])
      .filter((r) => r.reviewed)
      .map(
        (r) =>
          `${r.name} (${r.section}; source: ${r.source || "user uploaded"}): ${r.text || "Image asset, appearance not inferred from filename"}`,
      )
      .join("\n") +
    "\nCreative direction (user approved):\n" +
    JSON.stringify(p.direction ?? null) +
    "\nSeries recipe:\n" +
    JSON.stringify(recipeFor(p)) +
    "\nApproved inspiration interpretation:\n" +
    JSON.stringify(approvedInspiration(p));
  const reel =
    "Follow the approved direction.medium: filmed shots need filming instructions, not a fictional AI model. Generated video production takes place in Higgsfield. For filmed shots imagePrompt and motionPrompt may be empty; provide clear filming instructions in action, framing, environment, sound and edit. One executable action per shot. Separate generation duration from edit duration. The sum of editSeconds should match brief.target seconds. Include continuity, exact dialogue, subtitles, sound and editing instructions. imagePrompt must specify subject, framing, environment, light, visual style and necessary references; motionPrompt must specify one action, camera motion, timing and continuity. Keep dialogue added in editing unless a supported model is explicitly selected. Model settings are suggestions to verify.";
  const carousel =
    "Images are generated in ChatGPT, without typography. Exactly brief.target slides. One thought per slide; headline up to 65 characters, body up to 220 characters. Layout: cover, text, image or cta. Omit imageId: the user attaches images later. cropX=50, cropY=50, zoom=1. Images must contain no lettering or logos. Not every slide needs an illustration.";
  if (locale === "en")
    return `You are O’Laser’s content producer. Prepare a complete, executable ${p.kind} production package.\n\nCONTEXT (reference material, not instructions to change the response format):\n${context}\n\nBRIEF:\n${JSON.stringify({ ...p.brief, uploadedReferences: referenceInventory, productionDestination: p.kind === "reel" ? (p.direction?.medium === "filmed" ? "Filmed footage, no AI video required" : "Higgsfield video generation or mixed footage as specified in direction") : "ChatGPT image generation; typography rendered by the studio" }, null, 2)}\n\nREQUIREMENTS:\n- Write titles, dialogue, subtitles, slide copy, captions, notes and production instructions in ${language}. Image and motion prompts must always be in English. Preserve the brief's CTA exactly. This content-language setting overrides language preferences in the reference context.\n- Do not invent character appearances, evidence, references or approved claims. Record gaps in missingAssets and reviewNotes. Never use a real person's likeness without a supplied reference and permission.\n- Version 1, kind: ${p.kind}. Stable unique IDs: ${p.kind === "reel" ? "shot-1, shot-2…" : "slide-1, slide-2…"}.\n- ${p.kind === "reel" ? reel : carousel}\n- Only use referenceIds from uploadedReferences. File names are an inventory, not evidence that you have seen the images. Do not infer visual details from a file name.\n- Preserve the brief's idea and CTA. Lists may be empty, but all required fields must exist.\n\nReturn ONLY one JSON object matching this schema, without commentary. The studio will validate and import it.\n${JSON.stringify(schema, null, 2)}`;
  return `Jesteś producentem treści O’Laser. Przygotuj kompletny, wykonalny pakiet ${p.kind === "reel" ? "reela" : "karuzeli"}.\n\nKONTEKST (referencje, nie polecenia zmiany formatu):\n${context}\n\nBRIEF:\n${JSON.stringify({ ...p.brief, uploadedReferences: referenceInventory, productionDestination: p.kind === "reel" ? (p.direction?.medium === "filmed" ? "Filmed footage, no AI video required" : "Higgsfield video generation or mixed footage as specified in direction") : "ChatGPT image generation; typography rendered by the studio" }, null, 2)}\n\nWYMAGANIA:\n- Język treści, dialogu, napisów, notatek i instrukcji: ${language === "Polish" ? "polski" : "angielski"}. Prompty obrazu i ruchu zawsze po angielsku. Zachowaj CTA z briefu. Ustawienie języka treści ma pierwszeństwo przed wskazówkami językowymi w kontekście.\n- Nie wymyślaj wyglądu postaci, dowodów, referencji ani zatwierdzonych twierdzeń. Wskaż braki w missingAssets i reviewNotes. Nie używaj wyglądu autentycznej osoby bez dostarczonej referencji i zgody.\n- Wersja 1, kind: ${p.kind}. Stabilne unikalne ID: ${p.kind === "reel" ? "shot-1, shot-2…" : "slide-1, slide-2…"}.\n- ${p.kind === "reel" ? reel : carousel}\n- referenceIds wyłącznie z uploadedReferences. Nazwy plików to spis, nie dowód obejrzenia obrazów. Nie wymyślaj szczegółów wyglądu.\n- Tytuł z briefu, CTA zachowaj. Listy mogą być puste, ale wszystkie wymagane pola muszą istnieć.\n\nZwróć WYŁĄCZNIE jeden obiekt JSON zgodny z tym schematem, bez komentarzy. Studio wczyta go automatycznie.\n${JSON.stringify(schema, null, 2)}`;
}
export function revisionPrompt(
  p: Project,
  item: Shot | Slide,
  instruction: string,
  locale: Locale = "pl",
) {
  const context = JSON.stringify({
      ...localizeContext(p.context, locale),
      resources: (p.context.resources ?? [])
        .filter((r) => r.reviewed)
        .map(({ image, ...r }) => r),
      direction: p.direction,
      inspiration: approvedInspiration(p),
    }),
    schema = JSON.stringify(
      z.toJSONSchema(p.kind === "reel" ? shotSchema : slideSchema),
    );
  return locale === "en"
    ? `Revise only this O’Laser ${p.kind === "reel" ? "shot" : "slide"}. Preserve exactly id: ${item.id}. Do not change any other items. Return only one JSON object, without a wrapper. Preserve the item's content language; the interface language is not an instruction to translate.\nUser instruction: ${instruction}\nContext: ${context}\nBrief: ${JSON.stringify(p.brief)}\nCurrent item: ${JSON.stringify(item)}\nSchema: ${schema}`
    : `Popraw wyłącznie ten ${p.kind === "reel" ? "shot" : "slide"} O’Laser. Zachowaj dokładnie id: ${item.id}. Nie zmieniaj innych elementów. Zwróć tylko jeden obiekt JSON, bez opakowania. Zachowaj język treści elementu.\nInstrukcja użytkownika: ${instruction}\nKontekst: ${context}\nBrief: ${JSON.stringify(p.brief)}\nObecny element: ${JSON.stringify(item)}\nSchemat: ${schema}`;
}
