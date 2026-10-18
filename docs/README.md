# Project Freedom documentation

These guides describe the existing prototype. They are maintained with the code and work without the original planning/handover files.

## Choose a starting point

| Goal                                                     | Read                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| Understand the project and try it                        | [Project README](../README.md)                                 |
| Set up macOS / VS Code and make a local build            | [Development](DEVELOPMENT.md)                                  |
| Understand modules, settings, navigation and permissions | [Architecture](ARCHITECTURE.md)                                |
| Run checks and interpret their limits                    | [Testing](TESTING.md)                                          |
| See what is implemented, tested and still open           | [Current status](STATUS.md)                                    |
| Assess every functional requirement/acceptance criterion | [Release matrix](RELEASE_MATRIX.md)                            |
| Complete checks requiring a person or owner              | [Remaining human/release checks](MANUAL_RELEASE_CHECKS.md)     |
| Review local data handling                               | [Privacy notice draft](PRIVACY_NOTICE_DRAFT.md)                |
| Review security threats and youth safeguards             | [Privacy, security and youth safeguards](PRIVACY_AND_YOUTH.md) |
| Make changes or report a problem                         | [Contributing](../CONTRIBUTING.md)                             |
| Give Codex working context                               | [AGENTS.md](../AGENTS.md)                                      |

## Evidence, not completion claims

The latest full qualification record is [18 October 2026, prototype 0.0.4](evidence/2026-10-18-qualification.json). Earlier additional live/native checks are recorded in [17 October evidence](evidence/2026-10-17-live-checks.json). These JSON files are retained aggregate observations copied from the original dated records; older filenames mentioned inside them identify their historical context.

The latest recorded run passed 66 regression cases and installed-Chrome checks. Live caption rendering remains unverified. The release matrix and status guide preserve the difference between controlled fixtures, live observations, and human checks. Editing documentation does not create a new test result.

## Documentation maintenance

Update the guide closest to a behavior change and link to it from here when adding a new topic. Keep commands aligned with `app/package.json`, the module map aligned with the source, and release claims tied to a dated result. Never replace an unverified observation with a pass just because a fixture passed.

The original PRD, phase plans/reports, generated handover records, private reference exports and old screenshots remain local archival material and are ignored by Git. Their useful implementation details have been carried into the tracked guides. New planning notes belong in the ignored root `planning/` directory. Do not add a blanket Markdown or `docs/` ignore rule.

For the exact exclusion rules see [`.gitignore`](../.gitignore). Local copies remain available, but ignored files are absent from a fresh checkout. Public GitHub history starts with a clean source snapshot. Earlier local development commits and exported archives can still contain historical material; they are preserved locally and must not be pushed with the source branch.
