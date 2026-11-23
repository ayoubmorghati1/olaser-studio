import { getVercelOidcTokenSync } from "@vercel/oidc";
import { z } from "zod";
import {
  projectSchema,
  inspirationSchema,
  directionSchema,
  reelPackageSchema,
  carouselPackageSchema,
  packageSchema,
} from "./schema";
import { directionPrompt, inspirationPrompt } from "./direction";
import { buildPrompt } from "./prompt";
import { cookieName, validSession } from "./auth";
import { generateText, Output, type UserContent } from "ai";
import type { NextRequest } from "next/server";
export function aiConfiguration(readOidc = getVercelOidcTokenSync) {
  let hasCredential = !!process.env.AI_GATEWAY_API_KEY;
  if (!hasCredential)
    try {
      hasCredential = !!readOidc();
    } catch {}
  return {
    enabled:
      process.env.STUDIO_AI_ENABLED === "true" &&
      !!process.env.AI_GATEWAY_MODEL &&
      hasCredential,
    model: process.env.AI_GATEWAY_MODEL ?? null,
  };
}
const requestSchema = z.object({
  action: z.enum(["direction", "analysis", "package"]),
  project: projectSchema,
  locale: z.enum(["en", "pl"]),
  inspiration: inspirationSchema.optional(),
});
export type CreativeRequest = z.infer<typeof requestSchema>;
export async function generateCreative(input: CreativeRequest) {
  const model = process.env.AI_GATEWAY_MODEL!;
  const options = {
    model,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(90000),
    experimental_telemetry: { isEnabled: false },
  };
  if (input.action === "analysis") {
    if (!input.inspiration?.frames.length)
      throw Error("No visual frames supplied");
    const content: UserContent = [
      {
        type: "text",
        text: inspirationPrompt(
          input.inspiration,
          input.project.kind,
          input.locale,
        ),
      },
      ...input.inspiration.frames.map((image) => ({
        type: "image" as const,
        image,
      })),
    ];
    const result = await generateText({
      ...options,
      maxOutputTokens: 1800,
      messages: [{ role: "user", content }],
    });
    return { analysis: result.text };
  }
  if (input.action === "direction") {
    const result = await generateText({
      ...options,
      maxOutputTokens: 2500,
      output: Output.object({ schema: directionSchema }),
      prompt: directionPrompt(input.project, input.locale),
    });
    return { direction: { ...result.output, approved: false } };
  }
  if (!input.project.direction?.approved)
    throw Error("Approve creative direction before generating a package");
  const result = await generateText({
    ...options,
    maxOutputTokens: 14000,
    output: Output.object({
      schema:
        input.project.kind === "reel"
          ? reelPackageSchema
          : carouselPackageSchema,
    }),
    prompt: buildPrompt(input.project, input.locale),
  });
  return { package: packageSchema.parse(result.output) };
}
// A short in-flight lock and rolling cap limit accidental repeated clicks. Gateway budgets remain the durable spending control.
const calls = new Map<
  string,
  { start: number; count: number; busy: boolean }
>();
export async function handleCreative(
  req: NextRequest,
  generate = generateCreative,
) {
  const token = req.cookies.get(cookieName)?.value;
  if (!validSession(token))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (req.method === "GET")
    return Response.json(aiConfiguration(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  const origin = req.headers.get("origin");
  let same = false;
  try {
    same = new URL(origin ?? "").host === req.headers.get("host");
  } catch {}
  if (!same) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!aiConfiguration().enabled)
    return Response.json(
      {
        error:
          "AI is not configured. Use the manual ChatGPT handoff or configure AI Gateway on the server.",
      },
      { status: 503 },
    );
  const raw = await req.text();
  if (raw.length > 3800000)
    return Response.json(
      { error: "Reference payload is too large. Use fewer or smaller images." },
      { status: 413 },
    );
  let input: CreativeRequest;
  try {
    input = requestSchema.parse(JSON.parse(raw));
  } catch {
    return Response.json(
      { error: "Invalid project or inspiration data." },
      { status: 400 },
    );
  }
  if (input.action === "package" && !input.project.direction?.approved)
    return Response.json(
      { error: "Review and approve Creative direction first." },
      { status: 400 },
    );
  if (input.action === "analysis" && !input.inspiration?.frames.length)
    return Response.json(
      { error: "Upload an image or a decodable short video first." },
      { status: 400 },
    );
  const key = token!.slice(-64);
  const now = Date.now();
  for (const [id, state] of calls)
    if (now - state.start > 3600000) calls.delete(id);
  const state = calls.get(key) ?? { start: now, count: 0, busy: false };
  if (state.busy || state.count >= 20)
    return Response.json(
      {
        error:
          "Another request is running or the hourly limit was reached. Please try later.",
      },
      { status: 429 },
    );
  state.busy = true;
  state.count++;
  calls.set(key, state);
  try {
    return Response.json(await generate(input), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "AI could not complete this request. Check AI Gateway credentials, credits and model access, or use the manual handoff. Your edits have been kept.",
      },
      { status: 502 },
    );
  } finally {
    state.busy = false;
  }
}
