# Development and local installation

## Requirements

Use Node **24.x** (`.nvmrc`, `app/package.json`) and npm. The declared package manager is npm **11.11.0**; install from `app/package-lock.json` using `npm ci`. Baseline qualification used Node 24.14.1 on an arm64 Mac running macOS 27.0.1. These are tested versions, not a guarantee for every OS/browser combination.

Desktop Chrome is needed to load the extension manually. The optional native checks use installed Google Chrome and version-dependent debugging APIs; qualification used 155.0.8059.85. Controlled browser tests use Playwright's matching Chromium download. Python 3, standard library only, is required for `check:package`.

No backend, runtime API key, database, account service or environment file needs setup. Network access is needed to install dependencies/browsers and for optional live checks.

## Open in VS Code

Open the repository root or `project-freedom.code-workspace`, rather than opening the ZIP itself. The workspace includes `app/`; `.vscode/tasks.json` runs npm commands with that working directory. Review extension recommendations before installing anything. Codex reads [AGENTS.md](../AGENTS.md); the application already exists and should not be regenerated.

## Install and build

From the repository root:

```bash
cd app
npm ci
npm run typecheck
npm run build
```

`npm ci` prepares WXT's generated type/configuration directory through the package's postinstall script. Keep the genuine lockfile tracked; do not hand-edit it or replace dependency resolution with a guessed lockfile.

Production output is `app/.output/chrome-mv3` relative to the repository root. Build configuration lives in `app/wxt.config.ts` and the entrypoints; generated manifests and bundles are not source files.

## Load in Chrome

1. Use a separate testing profile. Open `chrome://extensions`.
2. Enable **Developer mode**, choose **Load unpacked**, and select the production output directory.
3. Confirm version 0.0.4, open a new YouTube tab and use the extension popup.
4. Select the feature(s), then enable the master. All defaults are off.
5. After rebuilding, reload the extension and affected site tabs.

For the complete user behavior and restoration limits, read the [project README](../README.md). Testing your own authorized account is optional and must not export credentials or personal activity.

## Development mode

From `app/`:

```bash
npm run dev
```

Load the development directory printed by WXT, normally `.output/chrome-mv3-dev`. The development server remains running until stopped. Browser startup is disabled intentionally; load the directory manually. Do not load production output and expect development reload behavior.

Development tooling can add local connections/capabilities for reloading. Qualify the production build separately. The optional `web-ext` launcher was removed after a development-only vulnerability was found; do not reinstall it merely to avoid manual loading.

## Commands

Every command below runs from `app/`.

| Command                       | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| `npm ci`                      | Install the committed dependency graph and prepare WXT            |
| `npm run dev`                 | Start development mode; browser loading remains manual            |
| `npm run build`               | Generate the production Chrome MV3 directory                      |
| `npm run typecheck`           | Strict TypeScript check; `compile` is an equivalent alias         |
| `npm run lint`                | ESLint for application and test/tool code                         |
| `npm run format:check`        | Check formatting                                                  |
| `npm run format`              | Apply formatting; review the resulting diff                       |
| `npm run test` / `test:watch` | Unit/DOM suite, once or in watch mode                             |
| `npm run test:manifest`       | Positive/negative manifest contract tests                         |
| `npm run check:manifest`      | Compare the built manifest to the reviewed contract               |
| `npm run check:artifact`      | Check production file/resource/API contract and emit hashes       |
| `npm run test:e2e`            | Run controlled production-extension tests in Chromium             |
| `npm run check:chrome`        | Optional installed-Chrome native UI/zoom/persistence check        |
| `npm run check:live-captions` | Optional public-video caption comparison; exit 2 means unverified |
| `npm run zip`                 | Build/package a local extension ZIP                               |
| `npm run check:package`       | Compare archive paths, CRCs and bytes to the audited build        |

Use the ordered workflows in [Testing](TESTING.md); browser and artifact checks require a production build. Run dependency mutations/installations separately from tests that consume `node_modules`.

## Package locally

After the relevant tests pass:

```bash
npm run zip
npm run check:manifest
npm run check:artifact
npm run check:package
```

The current output is `.output/project-freedom-0.0.4-chrome.zip`. The artifact audit must run after the final build/ZIP step so the verifier compares the archive to the current output. A locally created ZIP is not a publication or a qualified release.

When changing version or entrypoints, review the package/manifest/artifact contracts rather than weakening their allowlists to obtain a pass. Runtime changes require new evidence; documentation-only changes do not require a prototype version bump.

## Dependency changes

Inspect the installed versions and actual requirement before adding/upgrading anything. Keep runtime dependencies small, review the lockfile diff, run the relevant checks and advisory audit, and record any material limitation. Test tools remain development dependencies. An audit reports known advisories at the time of the check; a clean result is not proof of security.

## Troubleshooting

| Symptom                                          | Check                                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `npm` cannot find the app scripts                | Run commands inside `app/`                                                                                     |
| Node engine mismatch                             | Switch to Node 24.x; check `.nvmrc`                                                                            |
| Missing WXT-generated types                      | Complete `npm ci`; do not create `.wxt` files by hand                                                          |
| No browser launches from development             | Expected: open Chrome and load the printed development directory                                               |
| A selected feature appears inactive              | The feature and master must both be on; confirm the exact supported host/route                                 |
| Changes do not appear after a build              | Reload the correct extension directory and affected YouTube tabs                                               |
| Unknown/new saved format                         | Rules fail open; inspect the explanation, then explicitly reset only if appropriate                            |
| Styles remain after browser-level disable/update | Reload the affected tab; master off is the normal reversible control                                           |
| Playwright executable is missing                 | Install the matching browser with `npx playwright install chromium`                                            |
| Native Chrome probe is unavailable               | Confirm Chrome is installed and supports the required debug APIs; do not relabel a different browser as Chrome |
| Live-caption probe exits 2                       | Read its aggregate report; it is unverified, not a controlled-suite failure or demonstrated product defect     |

Never solve a missing browser/test capability by broadening production permissions. The [architecture contract](ARCHITECTURE.md) and [privacy safeguards](PRIVACY_AND_YOUTH.md) apply to development too.
