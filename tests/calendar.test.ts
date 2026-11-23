import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCalendar,
  calendarSnapshot,
  projectFromIdea,
  csvRows,
} from "../lib/calendar";
import { defaultContext } from "../lib/context";
import { projectSchema, applyRevision } from "../lib/schema";
import { example } from "../lib/examples";
import { buildPrompt } from "../lib/prompt";
import { backupBlob, restoreBackup, markdown } from "../lib/export";
test("calendar handles quoted commas, quotes, CRLF and multiline cells", () => {
  assert.deepEqual(csvRows('a,b\r\n"one, two","say ""hi""\nnext"'), [
    ["a", "b"],
    ["one, two", 'say "hi"\nnext'],
  ]);
  assert.throws(() => csvRows('"unfinished'));
  assert.throws(() => parseCalendar("a,b\n1,2"));
});
test("real calendar maps source fields into an independent editable brief", () => {
  assert.equal(calendarSnapshot.ideas.length, 107);
  const idea = calendarSnapshot.ideas.find((i) => i.id === "3")!;
  assert.equal(idea.kind, "reel");
  const p = projectFromIdea(idea, defaultContext, "en");
  assert.match(p.brief.idea, /6:50/);
  assert.equal(p.brief.character, idea.character);
  assert.equal(p.brief.cta, idea.cta);
  assert.equal(p.brief.angle, idea.angle);
  assert.equal(p.brief.requirements, idea.requirements);
  assert.equal(p.brief.outputLanguage, "pl");
  projectSchema.parse(p);
  p.brief.idea = "edited";
  assert.notEqual(idea.title, p.brief.idea);
});
for (const kind of ["reel", "carousel"] as const)
  test(`${kind}: reference assignments survive revision and backup`, async () => {
    const p = example(kind);
    p.assets = [
      {
        id: "approved-image",
        name: "Approved character.png",
        type: "image/png",
        data: "data:image/png;base64,aGVsbG8=",
      },
    ];
    const pkg = p.package!;
    const item = pkg.kind === "reel" ? pkg.shots[0] : pkg.slides[0];
    item.referenceIds = ["approved-image"];
    const revised = applyRevision(p, {
      ...item,
      referenceIds: [],
      imagePrompt: "Changed prompt",
    });
    const saved = await restoreBackup(
      await (await backupBlob(revised)).arrayBuffer(),
    );
    const result =
      saved.package!.kind === "reel"
        ? saved.package!.shots[0]
        : saved.package!.slides[0];
    assert.deepEqual(result.referenceIds, ["approved-image"]);
    assert.match(markdown(saved, "en"), /Approved character.png/);
    assert.match(buildPrompt(saved, "en"), /uploadedReferences/);
  });
