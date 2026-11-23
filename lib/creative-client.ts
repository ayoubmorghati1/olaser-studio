import type {
  Project,
  Inspiration,
  Direction,
  ProductionPackage,
} from "./schema";
export type AIResult = {
  direction?: Direction;
  analysis?: string;
  package?: ProductionPackage;
};
export function creativePayload(p: Project) {
  return {
    ...p,
    productionFiles: [],
    assets: p.assets.map((a) => ({ ...a, data: "data:image/png;base64," })),
    context: {
      ...p.context,
      resources: p.context.resources?.map(({ image, ...r }) => r),
    },
    inspirations: p.inspirations?.map((i) => ({
      ...i,
      data: "data:",
      frames: [],
    })),
  };
}
export async function requestCreative(
  action: "direction" | "analysis" | "package",
  p: Project,
  locale: "en" | "pl",
  inspiration?: Inspiration,
): Promise<AIResult> {
  const response = await fetch("/api/creative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      project: creativePayload(p),
      locale,
      inspiration: inspiration ? { ...inspiration, data: "data:" } : undefined,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "AI request failed");
  return data;
}
