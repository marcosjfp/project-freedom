# Current project status

**Prototype:** 0.0.4. **Last recorded full qualification:** 18 October 2026.
**Release decision:** blocked pending specific live/manual results and owner decisions.

The implemented application is usable as a local developer build. It has three independent opt-in YouTube presentation controls, a master switch, shared popup/options, validated local persistence, live updates, explicit reset and reversible page effects. Source is hosted at [marcosjfp/project-freedom](https://github.com/marcosjfp/project-freedom). No later feature phase or browser-store release has started; public source hosting does not close the release gates.

## Recorded qualification

| Area                                           | Result / boundary                                                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript, lint, formatting, production build | Passed in the 18 October run                                                                                                             |
| Unit/DOM                                       | 50 cases passed                                                                                                                          |
| Manifest contract                              | Nine cases passed                                                                                                                        |
| Controlled production-extension browser tests  | Seven cases passed; 66 regression cases in total                                                                                         |
| Production manifest/artifact/ZIP               | Exact reviewed manifest, eight-file inventory, resource/API guardrails and archive byte comparison passed                                |
| Installed Chrome                               | Native options-tab 2.0 zoom, action-popup keyboard/scrolling, same-profile saved choices after debug reload, master off and reset passed |
| Advisory audit                                 | Zero reported vulnerabilities in the recorded full audit; dependencies were unchanged                                                    |
| Live captions                                  | Unverified: the platform supplied an empty subtitle response even with master off and no stylesheet; on sample was also empty            |

The [full aggregate record](evidence/2026-10-18-qualification.json) preserves observations and limitations. Documentation updates do not imply the tests were rerun. Current automated count/coverage lives in the tests; do not distort them to match a historical number.

Recorded environment: arm64 macOS 27.0.1, Node 24.14.1, npm 11.11.0, bundled Chromium 156.0.8078.4 and installed Chrome 155.0.8059.85. Locked stack at qualification included WXT 0.21.4, React/React DOM 19.3.1, TypeScript 5.9.3, Vitest 5.0.5 and Playwright 1.64.1. The lockfile is authoritative for dependency resolution.

## Live observations from 17 October

Public signed-out testing observed modern search Shorts shelf and watch-card hide/restore, selected-video playback/fullscreen, home → results → watch same-document navigation and back/forward, explicit playlist selection/next/previous, direct Shorts playback/return, and one actual Spanish search layout at 800 × 900. The ordinary result cards sampled remained available. Normal cookie rejection was exercised through the website controls.

These are dated layout-specific observations, not a blanket browser/language/account guarantee. See the [earlier aggregate evidence](evidence/2026-10-17-live-checks.json). Clean signed-out home had zero recommendation tiles; it could not qualify populated-home behavior.

## Open compatibility and human checks

- Actual populated-home hiding/restoration and ordinary signed-in subscription feeds in an authorized profile.
- Visible captions on a live main video with available subtitle data, compared off/on. The controlled PCM/WebVTT preservation test passes but does not close this gap.
- VoiceOver listening, including understandable labels/states/status/reset/focus.
- Physical Chrome Load unpacked/toolbar workflow and popup scaling. Native browser-API checks do not stand in for those observations.
- Account/age/region safety/consent variants remain unverified unless legitimately observed. They must not be bypassed for testing.

The current linkless Shorts guide is intentionally unsupported and stays visible. Other browsers, mobile/native apps and additional site layouts require their own evidence. Full criterion assessments are in [RELEASE_MATRIX.md](RELEASE_MATRIX.md); practical steps are in [MANUAL_RELEASE_CHECKS.md](MANUAL_RELEASE_CHECKS.md).

## Owner decisions before distribution

The source repository is public on GitHub, with [issues](https://github.com/marcosjfp/project-freedom/issues) for non-sensitive bug reports. Final publisher/ongoing maintainer, license/copyright, branding, dedicated support/privacy contact and policy URL, audience/countries, supported browser/OS scope, browser-extension distribution, update process and relevant youth/privacy review remain open. Store assets/disclosures depend on those decisions. The [privacy notice](PRIVACY_NOTICE_DRAFT.md) remains a draft. Do not invent identity, licensing terms or approvals.

## Next work

Finish the specific qualification gaps, document the results, and resolve owner decisions before calling a build release-ready. Keep unknown structures available and permissions/data handling unchanged unless separately authorized. Autoplay, Conscious Access, other platforms and learning features remain future proposals, not implemented or newly authorized work.

## Evidence and source provenance

The tracked JSON records are copies of dated local qualification evidence, with aggregate public/synthetic observations and no personal account data. Original phase reports/plans and handover exports are archived locally through `.gitignore`; a fresh checkout uses these operational guides and retained evidence instead. Names of original phase files inside evidence describe its provenance, not prerequisites.

The original uploaded research text was unavailable and the retrieved initial conversation was partial. No complete research migration or scientific benefit for this extension is claimed. Reliability evidence here concerns interface behavior and release readiness, not treatment or cognitive effectiveness.
