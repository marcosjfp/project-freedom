import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { validateManifest } from './manifest-contract.mjs';
const manifest = JSON.parse(
  await readFile(
    new URL('../.output/chrome-mv3/manifest.json', import.meta.url),
    'utf8',
  ),
);
const pkg = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
validateManifest(manifest, pkg);
console.log(
  'Production manifest passed: exact reviewed metadata, storage only, isolated top-frame YouTube script.',
);
