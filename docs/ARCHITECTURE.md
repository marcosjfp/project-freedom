# Architecture and maintenance contracts

## Runtime boundaries

Project Freedom is a desktop Chrome Manifest V3 extension built with WXT, React and strict TypeScript. React is used in the popup/options pages; page controls use small DOM/CSS modules. There is no service worker, backend, runtime AI dependency, remote configuration, or message bridge from the website to extension APIs.

| Area                          | Source                                                             | Responsibility                                                             |
| ----------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Popup / options               | `app/entrypoints/popup/`, `app/entrypoints/options/`               | Mount settings views; options opens in a full tab                          |
| Shared UI                     | `app/components/`, `app/hooks/useSettings.ts`, `app/assets/ui.css` | Semantic controls, status/errors, reset confirmation, subscriptions        |
| Settings schema               | `app/features/settings/schema.ts`                                  | Owned keys, all-off defaults, strict runtime decoding, effective flags     |
| Settings repository / adapter | `app/features/settings/repository.ts`, `browser-repository.ts`     | Local persistence, subscriptions, races, errors, per-key writes and reset  |
| Route classification          | `app/features/youtube/routes.ts`                                   | Exact origin and supported path families                                   |
| Selectors and rules           | `app/features/youtube/selectors.ts`, `rules.ts`                    | Fixed dated structural selectors, pure rule derivation, guarded stylesheet |
| Page controller               | `app/features/youtube/controller.ts`                               | Own stylesheet/markers, react to settings/route, restore and dispose       |
| Content entrypoint            | `app/entrypoints/youtube.content.ts`                               | WXT lifecycle and committed navigation notifications                       |
| Build / verification          | `app/wxt.config.ts`, `app/scripts/`                                | Production output and manifest/artifact/archive contracts                  |

## Settings and storage

Only these five keys belong to the extension. An empty fresh profile is represented by defaults in memory; reading it does not initialize storage automatically.

| Key                                   | Accepted value / default     | Meaning                    |
| ------------------------------------- | ---------------------------- | -------------------------- |
| `pf.schemaVersion`                    | Integer `1` when initialized | Preference format          |
| `pf.enabled`                          | Boolean; default `false`     | Master choice              |
| `pf.youtube.hideHomeRecommendations`  | Boolean; default `false`     | Home rule selection        |
| `pf.youtube.hideShortsDiscovery`      | Boolean; default `false`     | Shorts discovery selection |
| `pf.youtube.hideWatchRecommendations` | Boolean; default `false`     | Watch rule selection       |

A rule is effective only when the repository is ready with a supported format, the master is enabled, the feature is selected, and the route permits that rule. Values such as the string `"true"` are not boolean true. Missing/malformed booleans stay off. Nonempty owned data without the supported schema is not silently treated as a valid format.

The adapter uses extension `storage.local`, not page `localStorage` or extension sync. It subscribes before the initial read and reconciles updates arriving during that read. Different preference edits write separate keys to avoid unrelated stale-object overwrites. Same-key concurrent edits converge on persisted values; there is no promise of a cross-window transaction.

Read failures and unsupported schemas leave page changes off and expose an honest UI state. Failed writes do not produce an optimistic saved state. Unknown newer data is not automatically erased/downgraded. An explicit reset disables the master before removing the five owned keys, preserving unrelated storage.

## Page flow and lifecycle

1. WXT injects the content script in the isolated world, top frame only, at `document_idle`.
2. The controller subscribes to the shared repository and derives rules from a coherent snapshot and the current URL.
3. Active rules set owned `data-project-freedom-*` root attributes and one `project-freedom-youtube-style` stylesheet containing fixed CSS.
4. Settings changes update the root attributes. CSS matches late-inserted supported elements without an application-level observer or recurring full-page scan.
5. The entrypoint refreshes from the committed `location.href` on WXT location changes, history/page events, Navigation API entry changes, YouTube navigation completion and visibility changes. It does not trust a precommit target from a canceled navigation.
6. Master off, unsupported routes, or unavailable settings remove owned effects. WXT invalidation unsubscribes/disposes. Repeated initialization replaces the prior controller for that document.

The controller restores saved values of markers it touched, removes its own style, and does not rewrite page-owned inline display declarations or delete platform nodes. Cleanup does not promise control over another extension's changes. Browser-level disable/update can leave previously injected styles until a tab reload; the extension's master switch provides normal live reversal.

## Route and selector rules

The exact origin is `https://www.youtube.com`. Supported paths are `/`, `/results`, `/watch`, `/feed/subscriptions`, and a direct `/shorts/<id>` path. Query strings do not determine health, interests, or content quality. A YouTube content script may run on an unsupported route, but no presentation rule is applied there.

Home hiding is scoped to the home browse/grid. Shorts hiding targets recognized shelves and href-based guide entries on supported routes. Watch hiding is scoped to suggestion cards under the related-results structure. Guards preserve known dialog, form/input, player and playlist containers; mixed/unknown structures fail open rather than trigger a broad fallback.

Selectors are structural and centralized with a live-inspection date and limitations. The current linkless Shorts guide has no verified safe discriminator and remains visible. Do not hide a generic grid, all video links, or a localized label to broaden coverage.

When changing selectors, inspect a current public layout in an isolated profile, record the date/layout/browser, add or adapt a representative authored fixture, check visibility/restoration and preserved controls, and update the support status. A selector count is not proof of correct behavior.

## Production permissions and resources

The generated production manifest has:

- Manifest V3 and API permission exactly `storage`.
- One content-script match: `https://www.youtube.com/*`.
- `all_frames: false`, `world: ISOLATED`, `run_at: document_idle`.
- Popup and options pages, with options opening in a tab.
- No worker, additional `host_permissions`, remote executable code, or debug entrypoint.

Do not add `tabs`, `history`, `cookies`, `scripting`, network interception, broad host patterns, or a test message bridge to make qualification easier. Native test harnesses may use browser debugging APIs/flags only in disposable test profiles; these are absent from runtime bundles/permissions.

Executable code and styles are bundled locally. The current artifact contract expects eight files and four JavaScript bundles; keep this an intentional reviewed contract rather than assuming every future build must have that shape forever. See [Testing](TESTING.md).

## Privacy, science and future scope

The runtime reads the route transiently but does not retain URLs, queries, content, activity or identity. The only persistent data is the local preference contract above. Presentation changes do not disable platform requests/tracking. [Privacy/security/youth safeguards](PRIVACY_AND_YOUTH.md) and the [notice draft](PRIVACY_NOTICE_DRAFT.md) set the working boundaries.

Intentional-use benefits are a product hypothesis. No medical, neurological, educational or cognitive effect has been demonstrated for this extension. Future platforms, autoplay, Conscious Access, learning features, additional permissions and data processing need separate scoped work. They are not implemented promises or inherited publication/research authorization.
