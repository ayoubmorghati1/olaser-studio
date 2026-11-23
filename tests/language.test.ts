import { test } from "node:test";
import assert from "node:assert/strict";
import { translate, english } from "../lib/translations";
import {
  defaultContext,
  englishContext,
  localizeContext,
} from "../lib/context";
import { newProject, example } from "../lib/examples";
import { buildPrompt, revisionPrompt } from "../lib/prompt";
import { projectSchema } from "../lib/schema";
import { markdown } from "../lib/export";
test("UI dictionary translates both ways, including statuses and errors", () => {
  for (const [pl, en] of Object.entries(english)) {
    assert.equal(translate(pl, "en"), en);
    assert.equal(translate(en, "pl"), pl);
  }
  assert.equal(translate("custom title", "en"), "custom title");
});
test("Dynamic accessibility labels and counts retain identifiers", () => {
  assert.equal(translate("Przesuń slajd 3 w górę", "en"), "Move slide 3 up");
  assert.equal(translate("Usuń My project", "en"), "Delete My project");
  assert.equal(translate("5 ujęć", "en"), "5 shots");
  assert.equal(
    translate("shots.0.id: Powtórzone ID", "en"),
    "shots.0.id: Duplicate ID",
  );
});
test("Built-in context localizes without translating custom documents", () => {
  assert.deepEqual(localizeContext(defaultContext, "en"), englishContext);
  const custom = {
    ...defaultContext,
    brand: "User-authored Polish or English notes",
  };
  assert.equal(localizeContext(custom, "en").brand, custom.brand);
  assert.deepEqual(localizeContext(englishContext, "pl"), defaultContext);
});
test("English UI does not force English production content", () => {
  const p = newProject("reel", englishContext, "en");
  assert.equal(p.title, "New reel");
  assert.equal(p.brief.outputLanguage, "pl");
  assert.ok(buildPrompt(p, "en").includes("in Polish"));
  p.brief.outputLanguage = "en";
  assert.ok(buildPrompt(p, "en").includes("in English"));
  assert.ok(
    buildPrompt(p, "en").includes(
      "Image and motion prompts must always be in English",
    ),
  );
});
test("Old backups remain valid without a language field", () => {
  const p = example("carousel");
  delete p.brief.outputLanguage;
  assert.doesNotThrow(() => projectSchema.parse(p));
});
test("English export translates headings but preserves authored copy", () => {
  const p = example("reel");
  const body = markdown(p, "en");
  assert.ok(body.includes("## Source brief"));
  assert.ok(body.includes("## Shot 1"));
  assert.ok(body.includes("Plan był prosty."));
  if (p.package?.kind === "reel")
    assert.ok(
      revisionPrompt(p, p.package.shots[0], "Shorten it", "en").includes(
        "Preserve the item",
      ),
    );
});

test("New English examples translate package copy without changing the original brief", () => {
  for (const kind of ["reel", "carousel"] as const) {
    const p = example(kind, englishContext, "en");
    assert.equal(p.brief.outputLanguage, "en");
    assert.match(p.brief.sourceText, /Kalendarz/);
    if (p.package?.kind === "reel") {
      assert.equal(
        p.package.shots[0].dialogue,
        "Tuesday. 6:50. The plan was simple.",
      );
      assert.equal(p.package.cta, "Message PACHY");
    } else if (p.package?.kind === "carousel") {
      assert.equal(
        p.package.slides[0].headline,
        "How does laser\nhair removal work?",
      );
      assert.match(p.package.slides[0].alt, /^Slide 1:/);
    }
    assert.doesNotThrow(() => projectSchema.parse(p));
  }
});
