# Project Freedom — privacy notice draft

**Implementation reviewed:** local prototype 0.0.4, 17 October 2026.
**Status:** draft for review. Publisher identity, contact route, intended
countries/audience, and public policy location have not been chosen. This
notice is not ready for publication or a claim of legal compliance.

## What the extension does

Project Freedom lets you choose whether to hide certain YouTube discovery
sections in a supported desktop browser. Every choice starts off. You can
change it or turn the master switch off at any time. It does not diagnose
addiction, treat health conditions, or guarantee safer browsing.

## What it accesses

On top-level pages at `https://www.youtube.com/*`, the extension reads the
current route and checks page structure to apply fixed display rules.
These checks happen on your device. It does not save or send the page URL,
search query, video titles, watch history, or page content.

The route is read as a browser URL in memory, so it can include query text.
The code classifies the origin/path; it does not inspect that text to infer
your interests or health. The extension does not request access to browser
history, cookies, passwords, microphone, camera, or other websites. It does
not operate inside embedded video frames or native mobile apps.

## What is saved

Only these preferences are saved in extension local storage in this browser
profile:

| Preference | Stored key |
|---|---|
| Preference format version | `pf.schemaVersion` |
| Master choice | `pf.enabled` |
| Hide home recommendations | `pf.youtube.hideHomeRecommendations` |
| Hide Shorts discovery | `pf.youtube.hideShortsDiscovery` |
| Hide watch recommendations | `pf.youtube.hideWatchRecommendations` |

Preferences are not synced by the extension. They remain until reset or
removal. There are no accounts, age/name/school forms, activity logs, health
profiles, scores, parent reports, or usage analytics. Your browser/device
administrator and profile backups may still have access to local files;
this storage is not an encrypted vault.

## Sharing and network activity

The extension has no backend, advertising, data sale, analytics, remote
selector downloads, or runtime uploads. Its executable code and styles are
bundled locally. Controlled production-build tests observed only the
synthetic page's expected navigation and no extension-initiated HTTP(S) or
WebSocket requests while operating online/offline controls.

That is scoped test evidence, not a guarantee about all software on your
device. YouTube still receives its own page requests and follows its own
data practices. Hiding a section does not prevent its retrieval, platform
tracking, advertisements, autoplay, or player recommendations. Browser and
store update traffic, development tooling, and links you choose to open are
separate from the extension's operation.

## Your controls

- **Enable selected controls off:** removes our display changes and keeps
  your individual selections. Other extensions or YouTube may also alter
  the page.
- **Reset preferences:** after your confirmation, disables the controls and
  removes the five preference keys above. It does not erase YouTube history
  or change the website's account settings.
- **Disable/remove in your browser:** stops future operation. Reload open
  YouTube tabs to remove any previously injected display changes. Removal
  normally clears extension local storage; browser/profile backups are
  outside this extension's control.

An unsupported saved format or storage read error leaves the website
unchanged. Unrecognized page sections stay available. Some Shorts menu
entries and other layouts remain unsupported; this is explained in the
prototype's coverage report.

## Young users and changes

The prototype uses the same privacy defaults for everyone and does not
collect age. No covert monitoring, remote parental management, or removal
prevention is implemented. Public or child-facing distribution requires the
separate audience, child-rights, privacy, and legal review described in
`PRIVACY_AND_YOUTH.md`.

Before publication, assign a responsible publisher and contact route,
complete the relevant review, and replace this draft status with accurate
publication details. Future changes to permissions or data handling require
review and updated information before release. This draft does not grant
permission to add data collection.
