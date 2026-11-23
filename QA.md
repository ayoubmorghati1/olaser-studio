# Verification — 20 November 2026

## Automated

15 passing Node tests cover both package formats, fenced JSON, malformed/missing/wrong-kind/duplicate-ID answers, version checks, context snapshots, ZIP round trips, stable revision targeting, retained slide image/crop settings, signed sessions, password rotation, CSRF origin checks, invalid passwords, HttpOnly cookies, logout and missing server configuration. TypeScript check passes. Next.js production build passes locally and on Vercel.

## Browser checks

- Local password login, server redirect, studio overview, and Polish UI.
- A fresh reel: entered brief, inspected contextual prompt and JSON schema, rejected malformed JSON while preserving input, imported fenced JSON, edited dialogue, and downloaded Markdown. Inspected the downloaded file to confirm it contains the edit.
- Refresh and reopen: edited dialogue persisted in IndexedDB.
- Carousel example: edited headline, prepared a scoped revision, reviewed before/after, and applied it to the selected slide.
- Exported ordered six-slide ZIP. Inspected all six PNG headers: exactly 1080 × 1350. Caption, Markdown, and alt text included. Visually inspected the exported cover.
- Deliberately oversized headline: preview warning and export rejection. Restored valid text.
- Uploaded a PNG, assigned it to the image layout, adjusted zoom, exported the slide and a project backup with the attached image. Missing image produces an export block.
- Mobile at 390 × 844: navigation and overview render without horizontal overflow (document width equals viewport width). Reset viewport afterward.
- Hosted preview opens the app's own private login without requiring a Vercel account. Password login succeeds; the dashboard renders with no browser-console errors.
- Restored the actual downloaded image-inclusive ZIP through the application restore function: one asset, linked image, and zoom 1.05 retained.

## Limits of verification

No paid generation or publishing was performed. The ChatGPT handoff was tested with representative schema-valid responses; an actual model conversation was not run. Browser quota exhaustion and actual mobile hardware were not simulated. Storage errors are handled with a visible warning and backup action. Treatment copy requires final approval; character assets and exact Canva element-style values remain unverified.

## Bilingual update

22 automated tests pass, including translation dictionaries, dynamic accessible names, localized default context, English example packages, content-language independence, English Markdown headings, and legacy backup compatibility. Browser checks confirmed English login errors, switching errors to Polish, English editor controls and reference documents, English carousel content/alt text and PNG ZIP export, preserved content when switching interface language, and remembered language after refresh.

Bilingual preview login and dashboard verified on Vercel. English mobile layout: viewport and document width both 390 px, document language en. Language preference persisted across refresh. English export inspected: six PNGs at 1080 × 1350 and English caption.

## Streamlined workflow update — 20 November 2026
- 26 automated tests pass, including actual calendar mapping, CSV quoting/multiline parsing, preserving reference assignments through scoped revisions, and ZIP restoration.
- Live source CSV verified read-only: 111 calendar rows, 107 supported Reel/Carousel ideas; four other-format entries are excluded.
- Browser verified automatic live refresh, search and selecting row #3; title, series, character, CTA and angle fill correctly while source copy stays Polish in the English UI.
- Uploaded a test raster, assigned its thumbnail to a shot and verified copying its inline motion prompt. The link targets Higgsfield; no paid generation was run.
- Sidebar keeps Your Studio, Calendar, Brand Context and How It Works. Project tabs are Idea, References, Create and Finish; references work before a package exists.
- Browser rechecked carousel export after consolidation: six ordered PNG files, all exactly 1080 × 1350. English/Polish mobile layout checked at 390 × 844 with document scroll width exactly 390 px.

## Calendar table update — 22 November 2026
- Calendar defaults to a compact six-column table; rows expand inline to show the source hook, CTA, required assets/consents and notes before starting a project.
- Browser verified combined character/series filters (Kasia + Antagonista yields 12 ideas), search, no-results recovery, keyboard preview and starting row #3 with correct prefilled fields.
- English and Polish labels verified. Mobile at 390 × 844 uses stacked rows with no horizontal overflow (document width 390 px).
- All 26 existing regression tests and production build pass. No generation or publishing of creative content was performed.

## Direction-first workflow — 22 November 2026
This update supersedes earlier notes describing a manual-only app.
- 32 automated tests pass. New coverage includes inherited recipe defaults, reviewed-only inspiration/resources, binary-free text prompts, context/direction/clip/inspiration ZIP restoration, scoped item prompts and authenticated AI API behavior using a stubbed provider.
- Browser verified inherited brief summary, optional settings, image inspiration upload, manual interpretation review and direction approval. The assembled manual prompt contained the approved interpretation and custom instructions without original image bytes.
- Browser verified a Markdown resource upload and explicit review in Brand Library.
- Created a tiny synthetic MP4 with a temporary FFmpeg utility outside the app; browser upload decoded it and extracted all six frames. No external reference video or audio was sent to a provider during QA.
- Browser verified direct image upload to a carousel image slide and successful ordered PNG export.
- Preview configuration selects google/gemini-3-flash with STUDIO_AI_ENABLED=true and automatic Vercel OIDC. No API key was created, no budget was changed, and no paid live model request was run. Model access/credits and actual model response quality remain unverified by this QA run.
- Video inspiration analysis is limited to sampled visual frames; audio, precise timing, transitions and continuous motion are not analyzed. Markdown/text resource import is supported; arbitrary PDF/Office extraction is not implemented.
- Hosted verification caught an overly strict capability check that only looked for an environment OIDC token. Fixed it to use the official Vercel helper, which reads request-scoped authentication too. Added a regression test; 33 tests now pass. Project settings confirm OIDC is enabled. No provider request is needed for this capability check.
- Final hosted preview verified password access and configured/enabled AI controls after the official OIDC capability fix. Provider generation was not invoked. This confirms configuration detection, not available credits or model response quality.

## Production release — 23 November 2026
- Released tested source from preview dpl_EzbR9Tp7zB9xs9HZxeYTAL3Ezh7Z with production environment configuration.
- Final deployment dpl_F3RzDDs88zuQShanNq62KMf5XGKd assigned to https://olaser-studio.vercel.app/.
- Browser verified password sign-in, latest four-stage workflow, persisted project and enabled AI capability controls (no paid generation invoked).
- Updated delivery guide, starter-kit links and email draft to the production URL.
- Screenshot: output/qa/production-release.png.
