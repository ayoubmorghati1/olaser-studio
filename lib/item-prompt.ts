import type { Project, Shot, Slide } from "./schema";
export function itemPrompt(
  p: Project,
  item: Shot | Slide,
  kind: "image" | "motion",
) {
  const refs = (item.referenceIds ?? []).map(
    (id) => p.assets.find((a) => a.id === id)?.name ?? `MISSING FILE (${id})`,
  );
  const referenceText = `Attached references to supply manually: ${refs.length ? refs.join(", ") : "none assigned"}. Additional requirements: ${item.references.join("; ") || "none"}. Do not invent the appearance of a named person. Preserve identities and object continuity from supplied references.`;
  if (kind === "motion" && "motionPrompt" in item)
    return `${item.motionPrompt}\n\nContinuity: ${item.continuity}\nAction: ${item.action}\nFraming: ${item.framing}\n${referenceText}\nSuggested generated clip length: ${item.generationSeconds}s; verify availability in the selected model. Intended edit length ${item.editSeconds}s is an editing instruction, not a generation setting. Voiceover and subtitles are added in editing unless a supported speaking model is explicitly chosen. No on-image lettering.`;
  return `${item.imagePrompt}\n\nVisual direction: ${p.direction?.visuals ?? ""}\nBrand design reference (apply the visual rules, not typography inside the generated image): ${p.context.design}\n${"environment" in item ? `Setting and light: ${item.environment}\nContinuity: ${item.continuity}\nFormat: vertical 9:16.` : "Format: vertical 4:5. Leave suitable negative space for the studio to add the slide typography."}\n${referenceText}\nNo lettering, captions, watermarks or invented logos inside the image.`;
}
