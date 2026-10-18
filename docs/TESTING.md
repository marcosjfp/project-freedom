# Testing and qualification

Commands run from `app/` and exercise the existing production extension unless stated otherwise. Install the committed dependencies first with `npm ci`. Build before checks that read `.output/chrome-mv3`.

## Routine checks

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

`compile` is an alias for the TypeScript check. Vitest discovers unit/DOM cases independently of Playwright. The last recorded qualification passed **50 unit/DOM cases in five files** and **nine manifest-contract cases**; counts are evidence for that snapshot, not a target to preserve artificially.

The suite covers strict decoding, all-off defaults, per-key persistence, asynchronous read/watch races, concurrent views, failure states, explicit reset, unknown newer schemas, route classification, scoped CSS and lifecycle cleanup. Manifest tests reject unreviewed metadata/capabilities rather than checking only a short permission subset.

## Controlled extension browser tests

Install Playwright's matching Chromium once per required version:

```bash
npx playwright install chromium
npm run test:e2e
```

The current seven tests cover:

| Test file under `app/tests/e2e/` | Behavior                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `settings.spec.ts`               | Actual settings pages, live changes, retained selections, same-profile restart, reset and unrelated storage                                                  |
| `youtube.spec.ts`                | Compiled content script, scoped hide/restore, routes/history, canceled navigation, late insertion, safety/player/playlist preservation, top-frame/host scope |
| `captions.spec.ts`               | Real generated PCM playback, native WebVTT cues and visible authored subtitle overlay through master off/on                                                  |
| `accessibility.spec.ts`          | Axe in multiple settings states, keyboard operation/focus/reset, narrow reflow and doubled text                                                              |
| `privacy.spec.ts`                | Controlled network/storage observation, offline controls and reset                                                                                           |
| `performance.spec.ts`            | Ten transitions, 1,000 inserted cards, quiet interval and listener counters                                                                                  |
| `lifecycle.spec.ts`              | Browser-manager disable/re-enable and the documented affected-tab reload                                                                                     |

The harness launches Playwright Chromium in disposable persistent profiles, loads the actual built extension, and discovers its ID without requiring a worker. It serves authored fixtures at `https://www.youtube.com/*` through test interception. This matches the production scope without introducing test hosts, permissions or bridges into shipped code.

Results are written to `app/test-results/qualification-results.json`. Synthetic screenshots and performance traces stay under ignored test output. Profiles are removed after the run. Do not commit recordings, traces or screenshots of personal accounts.

The media fixture is an authored host-player model. It demonstrates preservation under our CSS, not that the current YouTube caption service/player works. Original fixture buttons are inert synthetic controls; their click success alone is not actual playback evidence.

### Managed workspace browser cache

In the workspace used for the recorded qualification, the browser was downloaded outside the repository. Use this only if that cache still exists:

```bash
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/project-freedom-browser-cache npm run test:e2e
```

A normal macOS checkout can use Playwright's default cache and the ordinary commands above. Do not commit this machine-specific cache path as a required application setting.

## Installed Chrome checks

With desktop Google Chrome installed and production output built:

```bash
npm run check:chrome
```

This optional harness launches headless installed Chrome in a temporary profile and uses browser-level CDP debug loading. It checks fresh defaults, actual 2.0 browser zoom in the options tab, the native action popup's keyboard/scrolling behavior, persistence after debug reloading in the same profile, master off and reset.

It saves aggregate metadata and synthetic extension-UI screenshots under ignored `app/.output/`. The debugging flags/APIs are test-only; they do not add runtime permissions. An unsupported Chrome API is a limitation to report, not a reason to silently substitute another browser. The debug build is loaded explicitly each launch; that does not prove a person's manual installation workflow.

## Optional live caption smoke

```bash
npm run check:live-captions
```

This is a separate network-dependent probe of one public video in installed Chrome, signed out in a disposable profile. It uses normal consent/player controls, waits for main playback, and samples actual nonempty visible subtitle segments with the master off and on.

- **Exit 0:** captions rendered in both samples for that sampled context.
- **Exit 2:** unverified, including unavailable/empty caption data or an incomplete probe. This does not by itself demonstrate an extension defect.

Aggregate playback/rule state, response status and byte counts go to `.output/live-caption-qualification.json`. No subtitle text, request tokens, cookies or account content are saved. Never bypass safety, advertising or access controls to obtain a pass.

The 18 October 2026 probe returned HTTP 200 with zero subtitle body bytes, and captions did not render in either state. The off baseline had no owned stylesheet/watch marker and the main video was playing. Live rendering remains unverified; the reason for the platform response is not established.

## Production artifact and archive verification

After the final build/package step:

```bash
npm run zip
npm run check:manifest
npm run check:artifact
npm run check:package
```

`check:artifact` compares the whole manifest, enforces the reviewed eight-file production inventory, checks local HTML/CSS resources, scans parsed JavaScript for common network/execution calls, and writes file hashes to `.output/phase3-artifact-audit.json`. The historical prefix is a script output filename, not a planning file tracked by Git.

`check:package` uses Python 3's standard library to reject unsafe/duplicate archive paths, check CRCs and exact file lists, and compare bytes/hashes to the audited output. Keep the audit aligned with the most recent ZIP build. Neither check replaces source/dependency review; static matching cannot prove absence of every possible capability or data flow.

Use `npm audit` when dependencies change or advisory freshness matters. A clean advisory result is a dated observation, not a universal security guarantee.

## Human and live compatibility work

[Remaining checks](MANUAL_RELEASE_CHECKS.md) explains VoiceOver listening, physical Chrome interaction, actual popup scaling, authorized populated feeds, and caption comparisons in a context with available data. Separate ordinary signed-out cookie-flow evidence from unobserved age/account/region variants. Never request credentials or retain private histories to qualify a route.

Axe and keyboard checks do not establish VoiceOver comprehension or complete WCAG conformance. Root-text scaling is not native browser zoom. Page performance counters include fixture/harness work; listener/heap snapshots do not rule out every leak. Controlled network captures do not describe all browser/platform traffic.

## Record a new result

Update [STATUS.md](STATUS.md), the [release matrix](RELEASE_MATRIX.md), and a dated aggregate record under `docs/evidence/` after a meaningful qualification run. Preserve prior dates and failures. Include:

```text
Date / prototype version / source commit:
OS, browser version and profile mode:
Commands actually run and outcomes:
Controlled fixture observations:
Live routes, layouts, languages and interactions actually checked:
Human accessibility observations:
Storage/network/performance scope and measurements:
Failed or unverified checks and limitations:
Archive identity and inspected contents, if packaged:
Release verdict and remaining owner decisions:
```

Do not call the prototype v0.1 ready while required release gates remain open. Documentation-only work should validate commands, links and Git exclusions; it does not need invented implementation tests or a redundant full browser run.
