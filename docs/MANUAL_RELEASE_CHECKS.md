# Final checks requiring a person or owner input

**Updated: 18 October 2026. Build: local prototype 0.0.4. Release blocked.**
The [current status](STATUS.md) and [dated evidence](evidence/2026-10-18-qualification.json) record the autonomous work:
all 66 regression cases passed (50 unit/DOM, 9 manifest, 7 browser cases),
along with build, artifact/package comparison, advisory audit and installed
Chrome checks. Those checks do not need to be repeated manually.

Prototype 0.0.4 remains a local developer build. The [earlier live evidence](evidence/2026-10-17-live-checks.json)
records installed Chrome 155.0.8059.85, native options-tab 200% zoom,
actual action-popup keyboard/scrolling behavior, persistence and reset, live
search/watch SPA/back-forward, playlist selection/next/previous, direct Shorts
playback/return, and an actual Spanish search layout at 800 × 900.

`npm run check:chrome` repeats the installed-Chrome checks in a temporary
profile. It uses Chrome's documented debug-loading APIs, not the everyday
profile. The original Chromium regression results remain separately recorded.
The human checklist follows the separate technical evidence gap below.

## Technical evidence gap: live captions

The automated comparison is complete: captions did not render with master off
and the owned stylesheet absent, or with the watch rule on, during main
playback. The observed subtitle response had HTTP 200 but **zero body bytes**.
This does not establish an extension defect or a live-caption pass. Actual
rendering needs a context where the platform supplies captions. This is not
a missing owner approval; the probe can be repeated without a new decision
when the test context changes.

From `app/`, after building, with installed Chrome:

```bash
npm run check:live-captions
```

This optional network smoke uses a public video and a disposable signed-out
profile. It saves only aggregate metadata to ignored
`.output/live-caption-qualification.json`, not subtitle text, tokens or cookies.
Exit **2** means unverified; exit **0** requires actual nonempty visible captions
with master off and on. It stays separate from the passing controlled suite.
No access/ad/safety bypass is attempted. The new controlled test does pass
with real PCM playback, native WebVTT timing and a visible HTML subtitle overlay;
that authored fixture does not substitute for live YouTube.

## VoiceOver on the Mac

A person needs to listen to the real announcements. Automated axe, keyboard,
DOM, and browser APIs cannot establish whether the experience makes sense.

1. Enable VoiceOver and open the actual extension popup and full options tab.
2. Read the heading, checkbox names/states and descriptions. Toggle each choice
   with the keyboard and confirm the announced state matches the visible state.
3. Check the saving/error status, unsupported-format explanation, reset cancel/
   confirm, and returned focus. Confirm labels and focus remain understandable
   when scrolling and at browser zoom.
4. Report version/date and any confusing, missing, or duplicate announcements.
   Do not declare full WCAG conformance from a short smoke test.

## A populated home and signed-in feed

The clean signed-out home had zero recommendation tiles. A tester using an
account/profile they are authorized to use must check the populated home and
subscriptions. No credentials or personal account data are requested.

1. Confirm home recommendations hide/restore while search and navigation stay
   available. Empty home is an unverified result, not a pass.
2. Search and open a selected result; confirm no home hiding carries into the
   results. Open subscriptions and verify ordinary subscribed videos remain.
3. Check each feature independently, master off, reset, and same-profile restart.
   Record aggregate behavior only, without account names, histories or screenshots
   of personal material.

## Captions in another authorized context and wider variants

On a public video with an available caption track, wait for normal advertising
to finish or use the site's offered controls, then start the main video and
select captions. Confirm actual subtitle text is visible with the watch rule
on and compare with master off. A selected track, visible CC button, or HTTP
200 does not establish display. The isolated comparison described above was
empty in both states. Only record passed if actual subtitles render in both.
Use a profile you are authorized to use; no credentials or personal data need
to be shared. If both states are empty again, record unverified and the baseline.

The normal signed-out cookie reject flow has been used; other consent/age/
account/region dialogs remain separate checks. Never bypass access or safety
controls to obtain a pass. The linkless Shorts menu remains intentionally
unsupported. Additional languages/browsers/layouts need their own evidence.

## Physical Chrome interaction

The native Chrome action view was opened using the documented action API and
keyboard-tested through CDP. A person should still confirm Developer mode /
Load unpacked and a physical toolbar click in normal Chrome. At 200% browser
zoom, check the popup and options controls remain reachable and focus visible.
The automated native zoom result specifically covers the options tab; no
blanket claim is made about every browser UI scaling setting.

## Owner decisions before distribution — leave these to the end

Choose publisher/maintainer, license and copyright attribution, final name,
support/privacy contact and policy URL, supported audience/countries/browsers,
update process, and store disclosures/assets. Complete appropriate youth/
privacy review before child-facing distribution. These choices cannot be
completed honestly by guessing. The privacy notice remains a draft.

A compact owner reply can use:

```text
Publisher / ongoing maintainer:
Copyright owner and chosen license (or request a separate comparison):
Final public name (or keep the current working name):
Support / privacy contact and policy URL:
Initial audience, countries and supported browser/OS scope:
Source repository: public https://github.com/marcosjfp/project-freedom
Intended browser-extension distribution channel:
Who reviews privacy and youth suitability before distribution:
```

Return test results without account data:

```text
Date / macOS / Chrome / extension version:
Physical installation + toolbar + popup scaling: passed / failed / unverified
VoiceOver names/states/status/reset/focus: passed / failed / unverified
Populated home hide/restore: passed / failed / unverified
Search/subscriptions preserved: passed / failed / unverified
Captions visibly rendered master off AND on: passed / failed / unverified
Consent/safety variant actually observed and result:
Problem description, if any (no account details):
```

The original uploaded research text remains unavailable. Supplying it later
would enable source reconciliation; it is not required to run these checks.

Record each result as passed, failed, or unverified in the release matrix.
This checklist does not authorize a browser-extension release, participant research, or Phase 4 work. Public source hosting is separate from those decisions.
