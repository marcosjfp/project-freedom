# Project Freedom

**Choose which parts of YouTube you see. Keep control of when to change them.**

Project Freedom is a desktop browser extension that lets you hide selected YouTube discovery sections using independent, reversible controls. Your preferences stay in your browser profile. There is no account, backend, telemetry, cloud sync, or runtime AI service.

**Status: prototype 0.0.4, under local qualification. This is not a release-ready v0.1.** The latest recorded checks passed 66 regression cases plus native Chrome checks; live captions, populated feeds, some manual accessibility checks, and publisher decisions remain open. See [current status](docs/STATUS.md) and the [release matrix](docs/RELEASE_MATRIX.md).

[Get started](#get-started-on-macos) · [Documentation](docs/README.md) · [Architecture](docs/ARCHITECTURE.md) · [Testing](docs/TESTING.md) · [Contributing](CONTRIBUTING.md)

[GitHub repository](https://github.com/marcosjfp/project-freedom) · [Report a bug](https://github.com/marcosjfp/project-freedom/issues)

## Why this project exists

Opening a service for a specific purpose can lead to more browsing than intended. Project Freedom explores a small, practical intervention: let people choose which discovery surfaces appear while keeping deliberate access to content available.

The wider mission includes young people's autonomy and well-being. Current development uses isolated profiles and synthetic or public content. The prototype does not diagnose addiction, repair dopamine systems, or claim improvements in attention, intelligence, mental health, or learning. Those outcomes have not been demonstrated for this extension. Youth-facing distribution and participant research require separate review.

## What you can control

| Control                        | Behavior                                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hide home recommendations**  | Hides supported recommendation cards and sections on the homepage.                                                                                 |
| **Hide Shorts discovery**      | Hides supported Shorts shelves and identifiable discovery navigation entries. Individual search results and direct Shorts links remain accessible. |
| **Hide watch recommendations** | Hides supported recommendation cards beside or below the selected video.                                                                           |
| **Enable selected controls**   | Applies your selected features. Turning it off restores our display changes and preserves your choices.                                            |
| **Reset preferences**          | After confirmation, disables the controls and removes the five owned preference keys.                                                              |

**Every switch starts off.** Selecting a feature alone does not activate it; enable the master control too. Popup and full settings views share the same preferences, and changes propagate to supported open tabs.

The design preserves search, subscriptions, chosen videos, players, playlists, comments, and consent/safety controls. Actual compatibility varies by layout and is recorded in the [release matrix](docs/RELEASE_MATRIX.md), rather than inferred from that design goal.

### Scope and limitations

- Initial target: desktop Chrome on macOS, top-level `https://www.youtube.com/*` pages.
- Supported route families: home, results, watch, subscriptions, and direct Shorts. Unknown routes/layouts remain available.
- A current Shorts guide entry without a reliable link stays visible. We do not hide it using a guessed English label or its position.
- Populated home and signed-in subscription feeds still need an authorized live check.
- Live caption rendering remains unverified: the sampled platform returned empty subtitle data even with the master off. Controlled media/caption preservation passes.
- Other Chromium browsers, Firefox, Safari, mobile browsers, and native apps are not qualified targets.
- Hiding sections changes presentation. It does not change YouTube's recommendation model, stop platform tracking, block ads, control autoplay, or filter content for safety.

## Get started on macOS

You need **Node.js 24.x**, npm, and desktop Google Chrome. The repository pins the Node major in [`.nvmrc`](.nvmrc), declares npm 11.11.0 in [`app/package.json`](app/package.json), and commits a genuine dependency lockfile. Python 3 is needed only for the ZIP verifier.

Open this folder in VS Code, or open [`project-freedom.code-workspace`](project-freedom.code-workspace). Run the following from the repository root:

```bash
cd app
npm ci
npm run typecheck
npm run build
```

Then load the production build:

1. Use a separate Chrome testing profile and open `chrome://extensions`.
2. Enable **Developer mode**, choose **Load unpacked**, and select `app/.output/chrome-mv3` from this repository.
3. Open a fresh desktop YouTube tab. Open the extension from Chrome's extensions menu; pin it if useful.
4. Select a feature and turn on **Enable selected controls**. Use **Settings & privacy** for the full settings tab.
5. Turn the master off to restore our changes. Use **Reset preferences** to clear the saved choices.

After rebuilding, reload the extension in Chrome and reload affected YouTube tabs. Browser-level disable/update can leave a previously injected stylesheet until the tab reloads; the extension's own master switch restores its changes without a reload after the preference saves.

There is no extension-runtime API key or environment file to configure. An account used by your development assistant is separate from this extension.

### Develop

From `app/`:

```bash
npm run dev
```

WXT prints the development output directory, normally `.output/chrome-mv3-dev`. Load that directory manually in your test profile. Automatic browser launching is intentionally disabled. Development output can include local reloading behavior and is not the production artifact.

See [development and troubleshooting](docs/DEVELOPMENT.md) for build modes, VS Code tasks, dependency changes, and packaging.

## Verify changes

All npm commands run from `app/`:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:manifest
npm run build
npm run check:manifest
npm run check:artifact
```

For production-extension browser tests, install the matching Playwright Chromium once, then run:

```bash
npx playwright install chromium
npm run test:e2e
```

The controlled browser suite serves authored fixtures at the exact matched origin in isolated temporary profiles. It does not navigate your personal account or establish compatibility with every current YouTube layout.

Optional installed-Chrome checks are separate:

```bash
npm run check:chrome
npm run check:live-captions
```

`check:chrome` exercises the native popup, actual options-tab browser zoom, persistence, and reset through test-only debugging APIs. `check:live-captions` visits one public video and compares actual rendered text with master off/on; **exit 2 means unverified**. It is network-dependent and is not part of the passing controlled regression suite.

For coverage, results, test artifacts, privacy boundaries, and commands for this managed workspace, read [testing](docs/TESTING.md).

### Make a local extension ZIP

From `app/`, after verification:

```bash
npm run zip
npm run check:manifest
npm run check:artifact
npm run check:package
```

For version 0.0.4 the archive is `.output/project-freedom-0.0.4-chrome.zip`. The Python verifier checks file paths, duplicates, CRCs, and exact contents against the audited build. Packaging does not publish the extension or close its release gates. Build output and archives are ignored by Git.

## How it works

The extension uses **WXT, React, strict TypeScript, and Manifest V3**. React powers the popup/options views; a small isolated content script handles page changes. Shared settings code validates values at runtime and writes individual local preference keys. Pure route/rule functions determine which fixed CSS rules apply.

The controller owns one stylesheet and a small set of root attributes. CSS handles newly inserted matching content without a recurring page scan. Navigation and saved-setting changes update those attributes; cleanup removes our effects. There is no service worker, page-to-extension bridge, or remote selector configuration.

```text
project-freedom/
├── README.md                     Project overview and quick start
├── AGENTS.md                     Working instructions for Codex
├── CONTRIBUTING.md               Change and reporting guidelines
├── .vscode/                      Editor recommendations and tasks
├── project-freedom.code-workspace
├── app/
│   ├── entrypoints/              Popup, options, YouTube content script
│   ├── components/               Shared settings UI
│   ├── features/settings/        Schema, storage adapter, repository
│   ├── features/youtube/         Routes, selectors, rules, controller
│   ├── hooks/                    React settings subscription
│   ├── assets/                   Bundled UI styles
│   ├── scripts/                  Manifest, artifact, package, Chrome checks
│   └── tests/                    Unit, DOM, fixtures, browser tests
└── docs/                         Development, architecture, privacy, evidence
```

[Architecture and storage contract](docs/ARCHITECTURE.md) explains the boundaries, route behavior, failure handling, and selector-maintenance rules.

## Privacy and permissions

Production requests the **`storage` API permission** and declares one isolated, top-frame content script for **`https://www.youtube.com/*`**. That content-script match is website access; it is not permission to read every site. The manifest has no background worker or additional `host_permissions` declaration.

Only the schema version, master choice, and three feature choices are saved in extension local storage. The extension reads the current route in memory to choose rules; it does not save browsing history, searches, titles, page content, ages, identities, or usage events. Preferences are not an encrypted vault and can be accessible to someone controlling the device/profile.

YouTube still receives its own requests and applies its own data practices. Development servers, package downloads, browser updates, user-opened links, and optional live smoke tests are separate from production runtime behavior.

Read the [implementation-based privacy notice draft](docs/PRIVACY_NOTICE_DRAFT.md) and [privacy/security/youth safeguards](docs/PRIVACY_AND_YOUTH.md). Publisher/contact details and distribution review are still pending; these documents do not assert legal compliance.

## Documentation and project status

Start with the [documentation index](docs/README.md). The latest recorded qualification is dated **18 October 2026**: 50 unit/DOM tests, 9 manifest tests, and 7 controlled browser tests passed, plus installed Chrome checks. These are dated observations, not results automatically regenerated by this README change.

[Current status](docs/STATUS.md) lists tested environments, known gaps, and the next work. [Remaining human checks](docs/MANUAL_RELEASE_CHECKS.md) provides practical steps for VoiceOver, physical Chrome interaction, populated feeds/captions, and owner decisions. Source is hosted in the public GitHub repository above; no browser-store release has been submitted.

Original planning briefs, phase reports, prompts, handover manifests, reference exports, and old screenshots are local archival material excluded through [`.gitignore`](.gitignore). The active documentation and aggregate qualification evidence remain tracked. A fresh checkout does not need the planning files. GitHub publication starts from a clean source snapshot; prior development history is retained locally rather than uploaded. Local historical branches and previously created ZIPs can still contain archival material.

The original uploaded research text was unavailable during the handover. The documentation does not claim to include that text, a complete prior conversation, or verified scientific evidence for this prototype's effectiveness.

## Contributing, support, and licensing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing behavior, permissions, storage, or data handling. Use [GitHub issues](https://github.com/marcosjfp/project-freedom/issues) for non-sensitive bug reports, including versions, steps, expected/actual behavior, and aggregate observations. Use invented fixture content rather than personal histories, cookies, or account screenshots. A dedicated privacy/security contact has not yet been selected; do not publish sensitive reports in issues.

Open-source development is the intended direction. **No license, copyright attribution, final publisher, or browser-extension distribution channel has been selected.** Public source hosting does not select license terms or qualify the prototype for release. Those decisions remain with the project owner before an extension release.
