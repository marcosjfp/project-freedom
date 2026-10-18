# v0.1 release evidence matrix

**Assessed build:** prototype 0.0.4, updated 18 October 2026.
**Decision: blocked from release.** A local developer ZIP may be produced,
but it is not a qualified v0.1 candidate. Passing controlled tests does not
resolve unperformed live or assistive-technology checks. See [current status](STATUS.md),
[dated qualification evidence](evidence/2026-10-18-qualification.json),
[earlier live observations](evidence/2026-10-17-live-checks.json), and
[remaining human checks](MANUAL_RELEASE_CHECKS.md). The recorded full run passed
66 regression cases and installed-Chrome checks; live captions remain unverified.

## Functional requirements

| ID | Requirement | Assessment |
|---|---|---|
| F01 | Transparent onboarding | Popup/options explain choices, local storage, site scope, reversal, and limitations; automated UI checks pass |
| F02 | Master control | Passed in controlled extension tests; successful change restores open fixture tabs and retains choices |
| F03 | Home recommendations | Controlled hide/restore passes; populated live home remains unverified |
| F04 | Shorts discovery | Controlled shelves/navigation and modern live shelf checks pass; current linkless guide is intentionally unsupported |
| F05 | Watch recommendations | Controlled preservation and live card hide/restore pass; explicit live playlist selection/next/previous now pass; caption rendering is tracked separately |
| F06 | Independent persistence | Unit and real extension settings/restart tests pass |
| F07 | Live propagation | Multi-tab and popup/options changes pass on the production extension with controlled pages |
| F08 | Recovery | Master off/reset, unknown schema, read/write errors, owned-key cleanup and unrelated-key preservation pass at the applicable test levels |
| F09 | Dynamic navigation | Production fixture initial load, SPA, canceled navigation, back/forward, reload, and late insertion pass; live coverage separately recorded |
| F10 | Local runtime | Controlled network/storage test and source/artifact review pass within their documented scope; no universal privacy guarantee |
| F11 | Accessible controls | Keyboard/focus, axe, root-text reflow, native Chrome popup and actual options-tab 200% zoom pass; VoiceOver remains unverified |
| F12 | Honest status | UI describes preferences and unsupported layouts without claiming detection coverage or health benefits |

## Acceptance criteria

| ID | Evidence | Verdict / open work |
|---|---|---|
| AC01 | Fresh isolated production extension: all off, storage empty, site unchanged | Passed controlled and installed Chrome debug-loaded profile; physical installation/toolbar click remains manual |
| AC02 | Synthetic populated home hides cards/sections and preserves search/safety | Partial: real populated home not available in clean signed-out profile |
| AC03 | CSS/markers removed; page-owned inline display preserved | Passed controlled and corresponding live shelf/card restoration |
| AC04 | Modern live search shelf hide/restore; fixtures preserve individual Shorts links and unknown menu | Partial: current linkless navigation intentionally stays visible; direct Shorts playback/return now verified |
| AC05 | Fixture player/playlist preservation; prior live play/pause/fullscreen/watch hiding and playlist selection/next/previous | Partial: new actual PCM/WebVTT fixture preserves visible subtitles and playback across off/on; live subtitle responses were empty even with master off and no stylesheet, so live rendering remains unverified |
| AC06 | Live settings propagation to controlled tab; measured master-off latency in dated qualification evidence | Passed controlled under one-second target; browser throttling outside active-tab scope not generalized |
| AC07 | Independent flags, concurrent different-key views, retained selections | Passed unit and production extension tests |
| AC08 | Same persistent browser profile fully closed/reopened, choices retained | Passed bundled Chromium and installed Chrome profiles; Chrome debug build explicitly reloaded on each launch with the same ID/storage |
| AC09 | Real compiled script with native history/commit events, canceled navigation, delayed insertion | Passed controlled; live home/search/watch same-document transitions and back/forward now verified; signed-in subscriptions remain separate |
| AC10 | Missing/malformed/read-error/newer-format cases | Passed unit/DOM and applicable real-browser newer-format checks |
| AC11 | Disable before owned-key removal, explicit reset, sentinel retained | Passed unit and production extension tests |
| AC12 | Axe scans, keyboard/reset/focus, 320px reflow and doubled text | Partial: actual Chrome options-tab 200% zoom and native-popup keyboard/scrolling pass; VoiceOver and physical toolbar workflow remain manual |
| AC13 | Repeated actual WXT entrypoint/invalidation, controller teardown, browser disable/re-enable plus tab reload | Passed applicable automated lifecycle checks; tab reload remains documented for browser-level changes |
| AC14 | Exact whole-manifest comparison, negative capability tests, file/resource/API-call scan, ZIP comparison | Passed local production checks; static scans are limited and do not replace review |
| AC15 | Controlled CDP/network observation, offline controls, exact local keys/reset, empty sync/session/other extension storage | Passed controlled plus source review; browser/store/platform traffic distinguished |
| AC16 | Ten transitions, 1,000 inserted cards, CDP counters/trace, quiet interval, stable DOM listener count | Passed reference fixture targets with attribution limits; live-site performance not guaranteed |

## Release blockers

- Finish populated home/signed-in feed and actual caption rendering in a
  context supplying subtitle data; the autonomous off/on diagnostic is complete
  and did not establish an extension defect. Other account/age/region safety
  variants remain unverified unless legitimately observed. Live navigation, playlist
  controls, direct Shorts and the sampled Spanish layout now have evidence.
- Complete macOS VoiceOver and physical Chrome installation/toolbar checks.
  Native options-tab browser zoom and native-popup behavior were tested through
  Chrome debugging APIs, with that scope clearly recorded.
- Resolve publisher/maintainer, license/copyright, name, supported audience and
  regions, contact/privacy URL, store assets/disclosures, and any required
  youth/privacy review. No defaults have been invented for these decisions.

This matrix assesses interface reliability and release readiness. It supplies
no evidence of medical, neurological, educational, or cognitive effectiveness.
