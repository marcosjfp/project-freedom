# Project Freedom application

This directory contains the implemented WXT / React / TypeScript Manifest V3 extension, version **0.0.4**. It is a local prototype with open release gates.

Start with the [project README](../README.md) for behavior, installation, privacy, and limitations. The [documentation index](../docs/README.md) covers architecture, development, testing, and release evidence.

Run commands from this directory:

```bash
npm ci
npm run typecheck
npm run build
```

Load `.output/chrome-mv3` through **Load unpacked** in a separate Chrome testing profile. For local development, `npm run dev` reports the development directory to load manually. Production and development directories are different.

| Task                                                         | Guide                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Install, develop, rebuild, troubleshoot, package             | [Development](../docs/DEVELOPMENT.md)                                    |
| Run unit/DOM/browser tests and optional Chrome checks        | [Testing](../docs/TESTING.md)                                            |
| Understand storage, selectors, routing, cleanup, permissions | [Architecture](../docs/ARCHITECTURE.md)                                  |
| Review current results and unfinished work                   | [Status](../docs/STATUS.md), [release matrix](../docs/RELEASE_MATRIX.md) |
| Work with Codex or contribute safely                         | [AGENTS.md](../AGENTS.md), [contribution guide](../CONTRIBUTING.md)      |

Keep `package-lock.json` tracked. Do not edit generated `.wxt/` or `.output/` files, commit dependencies/test profiles, or add runtime permissions to make tests easier. Browser startup is intentionally manual; do not restore the removed optional browser-launch dependency without review and an audit.
