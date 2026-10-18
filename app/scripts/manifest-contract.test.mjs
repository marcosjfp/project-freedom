import assert from 'node:assert/strict';
import { test } from 'node:test';
import { expectedManifest, validateManifest } from './manifest-contract.mjs';
const pkg = { version: '0.0.4', description: 'Synthetic metadata' };
test('allows only the reviewed production manifest', () =>
  validateManifest(expectedManifest(pkg), pkg));
for (const [label, change] of [
  [
    'new privilege',
    (m) => {
      m.permissions.push('tabs');
    },
  ],
  [
    'broad site scope',
    (m) => {
      m.content_scripts[0].matches.push('<all_urls>');
    },
  ],
  [
    'frame injection',
    (m) => {
      m.content_scripts[0].all_frames = true;
    },
  ],
  [
    'page world',
    (m) => {
      m.content_scripts[0].world = 'MAIN';
    },
  ],
  [
    'remote worker',
    (m) => {
      m.background = { service_worker: 'https://example.invalid/worker.js' };
    },
  ],
  [
    'debug resource',
    (m) => {
      m.web_accessible_resources = [
        { resources: ['debug.js'], matches: ['<all_urls>'] },
      ];
    },
  ],
  [
    'unreviewed CSP',
    (m) => {
      m.content_security_policy = {
        extension_pages: "script-src 'self' 'unsafe-eval'",
      };
    },
  ],
  [
    'unexpected future field',
    (m) => {
      m.history = {};
    },
  ],
])
  test(`rejects ${label}`, () => {
    const manifest = expectedManifest(pkg);
    change(manifest);
    assert.throws(() => validateManifest(manifest, pkg));
  });
