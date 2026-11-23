# O’Laser Studio

Private bilingual production studio for Rafa. Next.js, TypeScript, bundled Montserrat and browser-local IndexedDB storage. The server checks a shared-password session; no accounts.

## Handover and independent hosting

The full application source is included. Deployment is separate from the original creator’s hosting account: use your own hosting project and, optionally, your own AI Gateway billing. There is no dependency on the creator’s API key. See [SELF-HOSTING.md](SELF-HOSTING.md) for setup, deployment and data migration.

## Workflow

1. **Idea:** choose a live calendar row or enter a custom idea. Series, character, audience and language are inherited and summarized. Overrides are secondary.
2. **Creative direction:** start from the series recipe, add instructions, optionally upload image/video inspiration. Review any interpretation and approve the direction.
3. **Production package:** request a structured AI proposal or use the manual ChatGPT handoff. Review before applying. Each shot or slide includes editable prompts, reference assignments and production instructions. Copying a prompt includes relevant visual context, reference filenames and generation/edit constraints.
4. **Create & export:** track needed assets and approval evidence, upload generated carousel images directly to slides, attach finished clips to shots, review captions/assembly and export PNG, Markdown or portable ZIP backups.

The Brand Library presents readable rules, a design demonstration, character profiles, series recipes, claims and sources. It accepts Markdown/text documents and PNG/JPG/WebP resources. Reviewed text is included in prompts. Reviewed images from the shared library are available to new projects; they still need attaching manually in the destination generator. Export typography remains the bundled font and layouts. The displayed palette is provisional until verified against original design elements.

## Development and configuration

`npm install`, then configure `.env.local` from `.env.example`, then `npm run dev`.

- `STUDIO_PASSWORD`: shared password.
- `SESSION_SECRET`: random secret of at least 32 characters. Sessions use an HTTP-only signed cookie and expire after seven days.
- `STUDIO_AI_ENABLED=true`: enables explicit-click AI calls only when model and credentials are configured.
- `AI_GATEWAY_MODEL`: exact model ID from the live AI Gateway catalog. The preview uses `google/gemini-3-flash`, selected for vision and structured output support.
- Vercel uses automatic `VERCEL_OIDC_TOKEN` authentication. External/local deployments can configure `AI_GATEWAY_API_KEY` securely. Never paste keys into the UI or commit them.

AI features use metered gateway credits only on user actions; there are no background model calls. Model requests disable retries and telemetry, limit output tokens, and use a session-scoped in-flight/rolling request guard. This in-memory guard is best effort across server instances; durable spend limits belong in AI Gateway budgets. No keys or budgets are created by the app. Credentials being configured does not prove account credit availability; provider failures preserve the project and offer the manual path.

## Inspiration analysis

Up to eight files, 10 MB each. Images are resized for analysis. Browser-decodable video up to 180 seconds is sampled into six JPEG frames locally. Only those frames go to visual analysis, not original video/audio. Analysis cannot establish exact timing, transitions, full motion or audio. Carousel screenshots can be reordered; combined image analysis uses their displayed order. Analysis is an editable interpretation and must be explicitly reviewed before influencing direction or prompts. Manual analysis requires attaching the original media in ChatGPT yourself.

The studio does not generate paid images/videos, publish posts, automatically import into Higgsfield or infer legal consent. Carousel imagery is created in ChatGPT; the studio typesets 1080 × 1350 slides. Higgsfield settings are suggestions until checked against the chosen model. Filmed production directions show filming instructions instead of required AI prompts.

## Saving, portability and verification

Projects and files stay in this browser/device. ZIP backups contain project/brief JSON, context snapshot, Markdown, project images, inspiration originals/frames, brand image resources, clip results and approval records. Old version-1 backups remain supported. Source calendar refresh is authenticated, read-only and uncached; failure preserves a dated snapshot. Calendar changes do not overwrite existing projects.

`npm test` covers validation, scoped revisions, backup restoration, source mapping, localization, prompt composition and authenticated AI handling with a stubbed provider. `npm run typecheck` and `npm run build` verify compilation. Browser QA covers both formats, inspiration uploads, Markdown resource review, manual prompts, exports and responsive layout. Live paid provider generation is not part of routine QA; see QA.md for what was actually checked.
