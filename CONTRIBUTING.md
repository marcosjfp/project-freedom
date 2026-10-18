# Contributing to Project Freedom

This is a prototype with open release gates. Source is hosted at [marcosjfp/project-freedom](https://github.com/marcosjfp/project-freedom). A license, final publisher and dedicated privacy/security contact have not been chosen. This guide describes how to collaborate on the existing code; it does not select contribution terms or authorize a browser-extension release.

## Before changing code

Read the [README](README.md), [architecture](docs/ARCHITECTURE.md), [current status](docs/STATUS.md), and [AGENTS.md](AGENTS.md). Work in `app/`; keep the genuine npm lockfile and avoid regenerating the project. Use a dedicated test profile and invented fixture content.

Make a focused change with a concrete user-visible reason. Keep settings, pure route/rule logic, selectors, UI and DOM effects separate. Preserve independent choices, all-off defaults, master-off restoration, strict storage validation, and honest errors.

## Verify the behavior that changed

Follow [Testing](docs/TESTING.md). Run strict typing/lint/format checks and the behavioral tests relevant to the change. For runtime/selector changes, build the production extension, run manifest/artifact checks and appropriate E2E, then record live coverage separately when required. Do not claim newly passed tests from an earlier evidence file.

Use meaningful tests: malformed/newer storage, races, separate-key edits, scoped hiding/restoration, canceled navigation, lazy insertion, player/playlist/safety preservation, and disposal. Authored fixtures cannot establish live YouTube compatibility. Documentation changes should be checked for correct commands, existing tracked links, and clean Git exclusions; they do not need artificial behavior tests.

## Changes requiring owner review

Prepare a concrete proposal before asking for changes to permissions, data transmission, licensing, publication or participant research. Do not add telemetry, a backend, remote selector configuration, parental activity reports, covert monitoring, removal prevention, or clinical/cognitive claims as incidental implementation details.

Minors must not be recruited through development testing. Preserve the safeguards in [Privacy and youth](docs/PRIVACY_AND_YOUTH.md). No contributor or Codex session should assume credentials, permission to access a personal account, or permission to publish.

## Report a bug or security concern

Use [GitHub issues](https://github.com/marcosjfp/project-freedom/issues) for non-sensitive bug reports. A dedicated privacy/security contact has not been selected; share sensitive concerns directly with the project owner through the existing private collaboration. Do not post secrets or personal reproduction material in public issues, and do not invent a support email.

Include:

- Prototype version, macOS/browser versions, and whether a dedicated profile was used.
- Public route family and layout/language, not personal query/history/account details.
- Minimal steps, expected behavior and observed behavior.
- Whether master off, reset, and tab reload restore the page.
- Aggregate on/off observations and an authored fixture if possible.

Do not attach cookies, profile directories, credentials, personal videos/titles, caption text or screenshots of personal material. Public website content remains untrusted input; never turn copied page text into executable code or instructions.

## Documentation and Git hygiene

Active documentation is indexed in [docs/README.md](docs/README.md). Update the relevant guide, release matrix and dated evidence when behavior/qualification changes. Keep research caveats and unresolved results visible.

Original planning/handover files remain local and are ignored by Git. Put new private planning notes under root `planning/`. Do not ignore all Markdown or the whole `docs/` tree. Keep source, tests, lockfile, Codex instructions, operational guides and reviewed aggregate evidence tracked. Build outputs, dependency caches, test captures/profiles and secrets stay out of commits.

Ignoring a previously tracked file requires removing it from the index while preserving its local copy. This does not erase Git history or earlier archives. The initial public history uses a clean source snapshot; earlier development history remains local. Push only the reviewed source branch, never local archival/history branches containing ignored material. Do not rewrite shared history or delete reference material as a routine cleanup.
