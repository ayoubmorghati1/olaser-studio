import { test } from "node:test";
import assert from "node:assert/strict";
import { example, newProject } from "../lib/examples";
import {
  parseAnswer,
  parseRevision,
  applyRevision,
  projectSchema,
} from "../lib/schema";
import { buildPrompt, revisionPrompt } from "../lib/prompt";
import { backupBlob, restoreBackup, markdown } from "../lib/export";
import { configured, issueSession, validSession } from "../lib/auth";
for (const kind of ["reel", "carousel"] as const) {
  test(`${kind}: JSON and fenced answer round trip`, () => {
    const p = example(kind);
    for (const raw of [
      JSON.stringify(p.package),
      "```json\n" + JSON.stringify(p.package) + "\n```",
    ])
      assert.deepEqual(parseAnswer(raw, kind), p.package);
  });
  test(`${kind}: portable backup includes context and assets`, async () => {
    const p = example(kind);
    p.assets = [
      {
        id: "test-image",
        name: "ref.png",
        type: "image/png",
        data: "data:image/png;base64,iVBORw0KGgo=",
      },
    ];
    const restored = await restoreBackup(
      await (await backupBlob(p)).arrayBuffer(),
    );
    assert.deepEqual(restored, p);
    assert.ok(markdown(p).includes(p.brief.sourceText));
  });
  test(`${kind}: scoped revision changes one item only`, () => {
    const p = example(kind),
      pkg = p.package!;
    const items = pkg.kind === "reel" ? pkg.shots : pkg.slides;
    const selected = items[0];
    const changed = {
      ...selected,
      ...("title" in selected
        ? { title: "Nowa nazwa" }
        : { headline: "Nowy nagłówek" }),
    };
    const parsed = parseRevision(JSON.stringify(changed), kind, selected.id);
    const result = applyRevision(p, parsed).package!;
    const resultItems = result.kind === "reel" ? result.shots : result.slides;
    assert.deepEqual(resultItems[0], changed);
    assert.deepEqual(resultItems.slice(1), items.slice(1));
    assert.throws(() =>
      parseRevision(
        JSON.stringify({ ...changed, id: "wrong" }),
        kind,
        selected.id,
      ),
    );
  });
  test(`${kind}: contextual prompt requests correct format`, () => {
    const p = newProject(kind);
    p.brief.idea = "Test nowego pomysłu";
    const prompt = buildPrompt(p);
    assert.ok(prompt.includes("Test nowego pomysłu"));
    assert.ok(prompt.includes(p.context.claims));
    assert.ok(prompt.includes("JSON"));
    assert.ok(prompt.includes(kind));
  });
}
test("Reject malformed, wrong-format, missing-field and duplicate-ID packages", () => {
  const p = example("reel").package!;
  assert.throws(() => parseAnswer("{oops", "reel"));
  assert.throws(() => parseAnswer(JSON.stringify(p), "carousel"));
  assert.throws(() => parseAnswer("{}", "reel"));
  if (p.kind === "reel")
    assert.throws(() =>
      parseAnswer(
        JSON.stringify({ ...p, shots: [p.shots[0], p.shots[0]] }),
        "reel",
      ),
    );
});
test("Revision preserves uploaded image and crop", () => {
  const p = example("carousel");
  if (p.package?.kind !== "carousel") return;
  Object.assign(p.package.slides[0], {
    imageId: "image-1",
    cropX: 12,
    cropY: 37,
    zoom: 1.5,
  });
  const result = applyRevision(p, {
    ...p.package.slides[0],
    imageId: undefined,
    cropX: 50,
    headline: "Nowe",
  });
  if (result.package?.kind !== "carousel") return;
  assert.equal(result.package.slides[0].imageId, "image-1");
  assert.equal(result.package.slides[0].cropX, 12);
  assert.equal(result.package.slides[0].zoom, 1.5);
});
test("Project kind and version are validated", () => {
  const p = example("reel");
  assert.throws(() => projectSchema.parse({ ...p, kind: "carousel" }));
  assert.throws(() => projectSchema.parse({ ...p, version: 2 }));
});
test("New project context is an independent snapshot", () => {
  const p = newProject("reel"),
    q = newProject("reel");
  p.context.brand = "Changed";
  assert.notEqual(p.context.brand, q.context.brand);
});
test("Unknown revision target rejected", () => {
  const p = example("reel");
  if (p.package?.kind !== "reel") return;
  const shot = p.package.shots[0];
  assert.throws(() => applyRevision(p, { ...shot, id: "absent" }));
  assert.ok(revisionPrompt(p, shot, "Krócej").includes("shot-1"));
});
test("Session fails closed, validates signatures and revokes after rotation", () => {
  const pass = process.env.STUDIO_PASSWORD,
    secret = process.env.SESSION_SECRET;
  try {
    delete process.env.STUDIO_PASSWORD;
    delete process.env.SESSION_SECRET;
    assert.equal(configured(), false);
    assert.equal(validSession("bad"), false);
    assert.throws(issueSession);
    process.env.STUDIO_PASSWORD = "long-test-password";
    process.env.SESSION_SECRET = "a".repeat(48);
    const token = issueSession();
    assert.equal(validSession(token), true);
    assert.equal(validSession(token + "x"), false);
    assert.equal(validSession("0.abc.123"), false);
    process.env.STUDIO_PASSWORD = "rotated";
    assert.equal(validSession(token), false);
  } finally {
    if (pass) process.env.STUDIO_PASSWORD = pass;
    else delete process.env.STUDIO_PASSWORD;
    if (secret) process.env.SESSION_SECRET = secret;
    else delete process.env.SESSION_SECRET;
  }
});
