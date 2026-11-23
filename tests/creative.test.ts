import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { newProject, example } from "../lib/examples";
import {
  startingDirection,
  approvedInspiration,
  directionPrompt,
} from "../lib/direction";
import { buildPrompt, revisionPrompt } from "../lib/prompt";
import { backupBlob, restoreBackup } from "../lib/export";
import { projectSchema } from "../lib/schema";
import { creativePayload } from "../lib/creative-client";
import { handleCreative, aiConfiguration } from "../lib/creative-api";
import { issueSession, cookieName } from "../lib/auth";
import { itemPrompt } from "../lib/item-prompt";
const image = "data:image/png;base64,aGVsbG8=";
const inspiration = () => ({
  id: "inspo-1",
  name: "Pacing reference",
  type: "video/mp4" as const,
  data: "data:video/mp4;base64,aGVsbG8=",
  frames: ["data:image/jpeg;base64,aGVsbG8="],
  borrow: ["camera"],
  notes: "borrow close-ups",
  analysis: "OBSERVED: static framing. SUGGESTED: restrained close-ups.",
  approved: false,
  analysisSource: "manual" as const,
});
test("old projects remain compatible; series defaults are suggestions and preserve source decisions", () => {
  const p = newProject("reel");
  projectSchema.parse(p);
  p.brief.series = "Antagonista";
  p.brief.character = "Kasia";
  const d = startingDirection(p, "en");
  assert.equal(d.approved, false);
  assert.match(d.approach, /Character/);
  p.brief.series = "Pierwsza sesja";
  assert.equal(startingDirection(p, "en").medium, "filmed");
  assert.equal(p.direction, undefined);
});
test("only reviewed inspiration and text resources enter package prompts; binary media never enters text prompts", () => {
  const p = example("reel");
  const i = inspiration();
  p.inspirations = [i];
  p.context.resources = [
    {
      id: "reviewed",
      name: "design.md",
      section: "design",
      text: "REVIEWED_STYLE",
      reviewed: true,
    },
    {
      id: "unreviewed",
      name: "draft.txt",
      section: "brand",
      text: "UNREVIEWED_CLAIM",
      reviewed: false,
    },
    {
      id: "ref",
      name: "Kasia.png",
      section: "characters",
      image,
      reviewed: true,
    },
  ];
  p.direction = {
    ...startingDirection(p, "en"),
    notes: "CREATIVE_NOTE",
    approved: true,
  };
  let prompt = buildPrompt(p, "en");
  assert.ok(!prompt.includes(i.analysis));
  assert.match(prompt, /REVIEWED_STYLE/);
  assert.ok(!prompt.includes("UNREVIEWED_CLAIM"));
  assert.ok(!prompt.includes(image));
  i.approved = true;
  prompt = buildPrompt(p, "en");
  assert.match(prompt, /OBSERVED/);
  assert.match(prompt, /CREATIVE_NOTE/);
  assert.equal(approvedInspiration(p).length, 1);
  assert.ok(!directionPrompt(p, "en").includes("UNREVIEWED_CLAIM"));
  if (p.package?.kind === "reel")
    assert.ok(
      !revisionPrompt(p, p.package.shots[0], "change", "en").includes(image),
    );
});
test("ZIP round trip preserves inspiration originals, sampled frames, brand resources, direction, clips and approval records", async () => {
  const p = example("reel");
  p.direction = startingDirection(p, "en");
  p.inspirations = [inspiration()];
  p.context.resources = [
    {
      id: "resource-1",
      name: "Kasia.png",
      image,
      section: "characters",
      reviewed: true,
      source: "Approved reference record",
    },
  ];
  p.productionFiles = [
    {
      id: "result-1",
      itemId: "shot-1",
      name: "clip.mp4",
      type: "video/mp4",
      data: "data:video/mp4;base64,aGVsbG8=",
    },
  ];
  p.assetApprovals = {
    "requirement:client footage": {
      status: "available",
      evidence: "Consent pending",
    },
  };
  const restored = await restoreBackup(
    await (await backupBlob(p, "en")).arrayBuffer(),
  );
  assert.deepEqual(restored, p);
});
test("AI transport omits original assets, clips and brand image bytes while preserving approved analysis", () => {
  const p = example("reel");
  p.assets = [{ id: "ref-1", name: "ref.png", type: "image/png", data: image }];
  p.context.resources = [
    {
      id: "ref-2",
      name: "brand.png",
      section: "design",
      image,
      reviewed: true,
    },
  ];
  p.inspirations = [{ ...inspiration(), approved: true }];
  p.productionFiles = [
    {
      id: "output-1",
      itemId: "shot-1",
      name: "output.mp4",
      type: "video/mp4",
      data: "data:video/mp4;base64,aGVsbG8=",
    },
  ];
  const payload = creativePayload(p);
  projectSchema.parse(payload);
  const raw = JSON.stringify(payload);
  assert.ok(!raw.includes("aGVsbG8="));
  assert.ok(raw.includes("OBSERVED"));
});
test("item prompts bind references and production constraints to the selected shot", () => {
  const p = example("reel");
  if (p.package?.kind !== "reel") throw Error();
  p.assets = [
    { id: "ref-1", name: "Approved Kasia.png", type: "image/png", data: image },
  ];
  const s = p.package.shots[0];
  s.referenceIds = ["ref-1"];
  assert.match(itemPrompt(p, s, "image"), /Approved Kasia.png/);
  assert.match(
    itemPrompt(p, s, "motion"),
    /editing instruction, not a generation setting/,
  );
  assert.match(itemPrompt(p, s, "image"), /9:16/);
});
test("creative API authenticates, checks origin, fails closed when unconfigured and returns mocked results without a paid call", async () => {
  process.env.STUDIO_PASSWORD = "test-studio";
  process.env.SESSION_SECRET = "x".repeat(48);
  process.env.AI_GATEWAY_MODEL = "google/gemini-3-flash";
  process.env.AI_GATEWAY_API_KEY = "test-only-not-a-real-key";
  process.env.STUDIO_AI_ENABLED = "true";
  const token = issueSession();
  const p = newProject("reel");
  p.brief.idea = "Test idea";
  const req = (origin = "http://localhost:3000", cookie = token) =>
    new NextRequest("http://localhost:3000/api/creative", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin,
        cookie: `${cookieName}=${cookie}`,
      },
      body: JSON.stringify({
        action: "direction",
        project: creativePayload(p),
        locale: "en",
      }),
    });
  let calls = 0;
  const mock = async () => {
    calls++;
    return { direction: startingDirection(p, "en") };
  };
  assert.equal(
    (await handleCreative(req("http://localhost:3000", ""), mock)).status,
    401,
  );
  assert.equal(
    (await handleCreative(req("http://evil.test"), mock)).status,
    403,
  );
  process.env.STUDIO_AI_ENABLED = "false";
  assert.equal((await handleCreative(req(), mock)).status, 503);
  process.env.STUDIO_AI_ENABLED = "true";
  const res = await handleCreative(req(), mock);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).direction.approved, false);
  assert.equal(calls, 1);
  for (const key of [
    "STUDIO_PASSWORD",
    "SESSION_SECRET",
    "AI_GATEWAY_MODEL",
    "AI_GATEWAY_API_KEY",
    "STUDIO_AI_ENABLED",
  ])
    delete process.env[key];
});

test("AI capability detection accepts request-scoped OIDC without exposing the token", () => {
  process.env.STUDIO_AI_ENABLED = "true";
  process.env.AI_GATEWAY_MODEL = "google/gemini-3-flash";
  const result = aiConfiguration(() => "request-scoped-secret");
  assert.equal(result.enabled, true);
  assert.ok(!JSON.stringify(result).includes("request-scoped-secret"));
  assert.equal(
    aiConfiguration(() => {
      throw Error("Missing OIDC");
    }).enabled,
    false,
  );
  delete process.env.STUDIO_AI_ENABLED;
  delete process.env.AI_GATEWAY_MODEL;
});
