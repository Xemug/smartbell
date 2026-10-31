// Generates firestore.stage1.rules from firestore.rules so the two can't drift.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('..', import.meta.url));

export function stage1From(source) {
  const off = 'function legacyClients() { return false; }';
  if (!source.includes(off)) throw new Error('legacyClients toggle not found');
  return source
    .replace(off, 'function legacyClients() { return true; }')
    .replace(
      /^\/\/ Target rules[^\n]*\n\/\/ Do NOT deploy[^\n]*\n\/\/ firestore\.stage1\.rules is generated[^\n]*\n/m,
      '// GENERATED from firestore.rules by npm run build:stage1. Do not edit.\n' +
        '// Stage 1: closes cross-ranch writes now; reads stay open until the app release.\n',
    );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(`${dir}firestore.stage1.rules`, stage1From(readFileSync(`${dir}firestore.rules`, 'utf8')));
}
