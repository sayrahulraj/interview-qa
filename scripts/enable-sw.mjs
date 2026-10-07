// One-time setup: enables the Angular service worker for production builds and raises the
// initial-bundle budgets a little (marked + highlight.js + Angular exceed the 500 kB default warning).
// Usage (from the project root):  node scripts/enable-sw.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'angular.json';
const cfg = JSON.parse(readFileSync(file, 'utf8'));
const name = Object.keys(cfg.projects)[0];
const prod = cfg.projects[name].architect.build.configurations.production;
prod.serviceWorker = 'ngsw-config.json';
// Mermaid pulls in a few CommonJS packages; allow them so the build output stays clean.
const opts = cfg.projects[name].architect.build.options ?? (cfg.projects[name].architect.build.options = {});
opts.allowedCommonJsDependencies = [
  'cytoscape-fcose',
  'cytoscape-cose-bilkent',
  '@braintree/sanitize-url',
  'dayjs',
  'elkjs',
];
for (const b of prod.budgets ?? []) {
  if (b.type === 'initial') {
    b.maximumWarning = '800kB';
    b.maximumError = '1.5MB';
  }
}
writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
console.log(`angular.json updated for project "${name}".`);
