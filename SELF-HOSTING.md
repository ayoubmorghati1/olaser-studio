# Host your own O’Laser Studio

This repository contains the application, tests, source-calendar snapshot and bundled Montserrat files. It does not contain a running account, passwords, provider credentials or anyone’s browser drafts. You can run the manual ChatGPT workflow without enabling paid AI.

## Run locally

Use Node.js 22.13 or newer (Node.js 24 LTS is a suitable choice). The existing hosted build used Node.js 26. Install the exact locked dependency versions:

```sh
npm ci
cp .env.example .env.local
```

Edit `.env.local` with a new shared password and an independent session secret of at least 32 characters. Generate a secret locally with `openssl rand -hex 32`; do not commit or send it. Leave `STUDIO_AI_ENABLED=false` for the manual workflow.

```sh
npm run dev
```

Open http://127.0.0.1:3000 and sign in with your chosen password. Source content defaults to the supplied O’Laser calendar. Interface language and authored-content language are separate controls.

## Deploy to your Vercel account

1. Obtain private repository access or a source archive from the owner. Clone it or import a copy into your own GitHub account.
2. In your own Vercel account, import that repository as a new project. Select Next.js, use the repository root, `npm ci` for install and `npm run build` for build. The default Next.js output settings apply.
3. Set `STUDIO_PASSWORD` and `SESSION_SECRET` in the production environment before deployment. Store them as secrets. Use values you control; the original deployment’s password is not included.
4. Set `STUDIO_AI_ENABLED=false` initially. Deploy, open your assigned domain, confirm that signed-out users reach the password screen and verify sign-in.
5. Test a manual package import and a carousel export. Confirm a project survives refresh and that its ZIP backup restores correctly.
6. If using previews, configure their environment separately. Production settings do not automatically apply to previews. Redeploy after environment changes.

The existing `.vercel/project.json` is excluded: this source does not link your checkout to the original creator’s hosting project. Use your own assigned domain. Existing source-document links still depend on the source owners’ access settings.

## Optional built-in AI

The application uses Vercel AI Gateway via the AI SDK. For a Vercel deployment, enable the project’s OIDC support and automatic system environment variables if needed. Confirm AI Gateway access, credits and spending limits in your account. Set `AI_GATEWAY_MODEL` to an available model with image input and structured output support, then set `STUDIO_AI_ENABLED=true` and redeploy.

The sample model ID in `.env.example` is the one used during development; verify current availability and pricing before use. No provider call is needed to run the app in manual mode. Suggestions, inspiration analysis and package generation use metered credits when clicked. Set durable spending limits in the gateway; the app’s per-session in-memory guard is not a billing cap.

For external/local hosting, configure `AI_GATEWAY_API_KEY` as a server-only secret if enabling AI. Never use a `NEXT_PUBLIC_` prefix for credentials. Media generation in Higgsfield and ChatGPT remains external and uses your own accounts.

## Other Node.js hosts

This is a server application, not a static HTML export. It needs Next.js route handlers, server environment variables and HTTPS in production for secure cookies.

```sh
npm ci
npm run build
npm start
```

The included start command binds to `127.0.0.1`, appropriate behind a same-machine reverse proxy. A container/platform that requires listening on all interfaces should run `npx next start --hostname 0.0.0.0 --port 3000` instead, with its configured port. Terminate HTTPS at a suitable reverse proxy and configure the public host consistently. This host path is documented but has not been tested on every provider.

## Move existing drafts

Projects, images and context changes live in IndexedDB in the browser, not in the GitHub repository or a shared server database. Each domain/browser/device has separate storage.

Before switching domains, download a project backup ZIP for every project from the old studio. On the new domain use **Restore a backup**. Keep those backups securely. Changing domains does not migrate drafts automatically. Changing the session secret signs out existing users but does not erase local drafts.

## Checks and limitations

```sh
npm test
npm run typecheck
npm run build
```

Read README.md and QA.md for behavior and verification limits. Automated AI tests use a stub, not a paid live provider. No finished-video generation, automatic publishing, CRM, shared project storage or recurring blog agent is included. Brand colors, character references and clinical/offer wording have documented approval gaps.

Before importing external brand/client material, confirm the rights and applicable permissions. Bundled font licensing is in `public/fonts/LICENSE.txt`. This repository is private; sharing access or transferring ownership is a separate GitHub action.
