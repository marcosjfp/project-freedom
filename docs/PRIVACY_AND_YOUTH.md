# Privacy, security, and young-user safeguards

This is an engineering design, not a completed compliance assessment. Local prototype work can proceed using synthetic content and adults. Public/youth deployment needs the reviews below based on the actual implementation and audience.

## Data inventory and retention

| Data | Needed? | Handling |
|---|---|---|
| Master/feature choices and schema version | Yes | Extension `storage.local`; persists until reset/removal; no expiry needed for a continuing preference |
| Current route and DOM structure | Transiently | Inspect on the matched page to select scoped rules; do not retain or transmit |
| Browser history, video titles, search queries | No | No collection, persistence, logging, or upload |
| Age/date of birth, name, school, health/diagnosis | No | No form, profile, scoring, or inference |
| Messages, comments, credentials, cookies | No | No inspection for product purposes or storage access |
| Usage events, session duration, identifiers | No | No analytics, local activity diary, or parent reports |
| Research feedback | Separate future activity | Separate protocol, minimum necessary fields, explicit retention/deletion plan |

Use local extension storage rather than page local storage or extension sync. Do not promise encryption or confidentiality against someone who controls the device/browser profile. The page itself still contacts YouTube; hiding UI does not stop platform requests, tracking, or advertisements. Browser/store update traffic and development-tool traffic are separate from extension runtime behavior.

Reset removes the extension's owned preferences after disabling interventions. Removing the extension generally clears its local storage; external backups/profile copies may exist outside its control. Do not advertise deletion of platform history or remote backups. [Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage).

## Threat model

| Risk | Required response |
|---|---|
| Malicious or changed website DOM | Treat attributes/content as untrusted; fixed allowlisted rules; no page text as executable input |
| Page scripts attempt privileged actions | Keep content script isolated; no unnecessary message bridge or externally exposed API |
| Supply-chain code exfiltrates data | Minimize dependencies, inspect changes/lockfile, review bundled code and network behavior |
| Saved preferences are corrupted or newer than app | Runtime validation; fail open; no destructive downgrade |
| Another extension modifies the same DOM | Touch only owned markers/styles; clean-profile reproduction; no claim to control other extensions |
| Shared device exposes activity | Do not store activity in the first place; explain profile-local preferences |
| Debug logs or test traces reveal personal content | No sensitive logs; synthetic fixtures; ignore profiles and reports in version control |
| Parent/school repurposes product for covert enforcement | No hidden monitoring, remote dashboard, tamper resistance, or removal prevention |
| Curiosity/AI features later transmit interests | New design review before implementation; no inherited permission to upload page context |

Bundle code/styles/assets. No remote configuration or selector downloads in v0.1; ship reviewed selector changes as normal extension updates. Manifest V3 store policy restricts remotely hosted executable code. [Chrome Web Store MV3 requirements](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements).

## Design rules for young users

1. Apply strong privacy defaults to everyone instead of collecting age for a feature that does not need it.
2. Explain the change to the person using the browser. Adult installation assistance does not replace the young person's need to understand the tool.
3. Make master off and ordinary access easy. Do not punish opting out, relaxing, or seeking entertainment.
4. Preserve deliberate learning/social access and safety/consent UI. Never rate beliefs, interests, school ability, or mental health.
5. Use short, concrete text and semantic controls. Support keyboard, screen readers, zoom, and reduced motion.
6. No nudges toward more data disclosure, advertising, engagement streaks, competitive scores, or parent-visible personal activity reports.
7. Do not label someone addicted from the number of clicks, minutes online, or their use of an override.
8. Do not claim the extension makes browsing universally safe or replaces support from caregivers, educators, or health professionals.

These are project design decisions consistent with child-centered guidance, not a claim that the product already satisfies every legal obligation. Consult [the Irish DPC's Fundamentals](https://www.dataprotection.ie/en/dpc-guidance/fundamentals-child-oriented-approach-data-processing) and [the ICO Children's Code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/).

## Before public or child-facing distribution

- Assign a responsible publisher/maintainer and define supported countries/audience.
- Review GDPR/national requirements and child-rights impacts for the actual processing. Decide whether a DPIA or additional assessment is required; document the reasoning.
- Review UK requirements if serving UK children and US COPPA where its coverage applies. Check the current amended rules, not a pre-2025 blog summary. Avoid assuming that an adult checkbox creates compliance.
- Decide whether and how audience/age assurance is necessary without introducing disproportionate identity collection. This handover does not mandate identity verification.
- Prepare age-appropriate privacy explanations, contact/deletion routes, incident handling, and maintenance commitments.
- Ensure Chrome Web Store disclosures and privacy policy match the actual behavior, including local handling. “We have no server” is not a substitute for this review.
- Complete naming/licensing and store asset requirements. Do not describe youth benefits as proven.

[FTC's current COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) and [Chrome's data-policy FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) are starting references. Applicability requires review of the real product and jurisdiction.

## Before research with minors

Define a specific research question and outcome, a justified protocol, minimal collection, an appropriate comparator, retention/deletion, and a withdrawal route. Obtain legal/ethics review where applicable, appropriate guardian permission and child assent, safeguarding arrangements, and a clear response plan for adverse experiences. Do not enroll participants through routine development tests.

Start with adult comprehension/usability work. Later efficacy work must consider self-selection, nonadherence, displacement to other devices, unblinded reports, baseline differences, and attrition. Do not infer diagnosis or improved reasoning from interface use. Research collection must remain separate from the extension's no-telemetry operation.

## Implementation-based notice draft

The separate [privacy notice draft](PRIVACY_NOTICE_DRAFT.md) now describes prototype 0.0.4 and its controlled runtime evidence. Publisher/contact and release review remain open; it is not ready to publish.

## Draft notice content for later implementation

After checking the actual implementation, a short notice should explain:

- Purpose: change selected YouTube page sections at the user's request.
- Access: current supported YouTube page structure and route, transiently.
- Storage: exact preference fields in the local browser profile; no sync.
- Sharing: no runtime upload, analytics, accounts, advertising, or sale by Project Freedom.
- Controls: switch off, reset, uninstall, and known device/profile limitations.
- Boundaries: the platform and browser retain their own data practices; linked external sources open only after user action.
- Publisher identity, contact, date, and policy-change process once those are decided.

This outline is not a ready-to-publish privacy policy because publisher details and implementation verification are still pending.
