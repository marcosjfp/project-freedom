import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { validateManifest } from './manifest-contract.mjs';

const root = path.resolve('.output/chrome-mv3');
async function files(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), 'Symlink in production output');
    const name = path.join(dir, entry.name);
    output.push(...(entry.isDirectory() ? await files(name) : [name]));
  }
  return output;
}
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
validateManifest(
  JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8')),
  pkg,
);
const names = (await files(root))
  .map((file) => path.relative(root, file))
  .sort();
assert.equal(
  names.length,
  8,
  'Unexpected file count: review the build contract',
);
const allowed =
  /^(manifest\.json|(?:options|popup)\.html|assets\/ui-[\w-]+\.css|chunks\/(?:options|popup|ui)-[\w-]+\.js|content-scripts\/youtube\.js)$/;
const hashes = {};
let javascriptFiles = 0;
for (const name of names) {
  assert(allowed.test(name), `Unreviewed production file: ${name}`);
  const data = await readFile(path.join(root, name)),
    source = data.toString('utf8');
  hashes[name] = {
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  };
  assert(
    !/localhost|127\.0\.0\.1|sourceMappingURL|@axe-core|Synthetic YouTube structure/.test(
      source,
    ),
    `Development/test material in ${name}`,
  );
  if (name.endsWith('.html')) {
    const references = [...source.matchAll(/(?:src|href)="([^"]+)"/g)].map(
      (match) => match[1],
    );
    for (const reference of references)
      assert(
        names.includes(reference.replace(/^\//, '')),
        `Nonlocal HTML resource: ${reference}`,
      );
  }
  if (name.endsWith('.css'))
    assert(
      !/@import|url\s*\(/i.test(source),
      `Unreviewed CSS resource in ${name}`,
    );
  if (!name.endsWith('.js')) continue;
  javascriptFiles++;
  const ast = ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  function visit(node) {
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const expression = node.expression.getText(ast);
      assert(
        !/(^|\.)(fetch|XMLHttpRequest|WebSocket|WebTransport|EventSource|sendBeacon|importScripts|Worker|SharedWorker|eval|Function)$/.test(
          expression,
        ),
        `Unreviewed network/execution API ${expression} in ${name}`,
      );
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const argument = node.arguments?.[0];
        assert(
          argument &&
            ts.isStringLiteral(argument) &&
            argument.text.startsWith('./'),
          `Unreviewed dynamic import in ${name}`,
        );
      }
    }
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier)
        assert(
          ts.isStringLiteral(node.moduleSpecifier) &&
            node.moduleSpecifier.text.startsWith('./'),
          `Nonlocal module in ${name}`,
        );
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const result = {
  version: pkg.version,
  files: hashes,
  javascriptFiles,
  checks: [
    'exact manifest',
    'eight reviewed files',
    'no test/dev material',
    'local HTML/CSS resources',
    'AST network/execution call scan',
  ],
  limitations:
    'Static checks are guardrails, not proof; combine with source review and runtime tests.',
};
await writeFile(
  '.output/phase3-artifact-audit.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  `Artifact check passed: ${names.length} reviewed files, ${javascriptFiles} JavaScript bundles, local resources only.`,
);
