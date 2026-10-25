import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
// Keep test output under this package so external dependencies resolve normally.
const folder = await mkdtemp(path.join(root, '.roadmap-tests-'));
try {
  const outfile = path.join(folder, 'roadmaps.test.mjs');
  await build({ entryPoints: [path.join(root, 'tests/roadmaps.test.ts')], outfile, bundle: true, platform: 'node', format: 'esm', external: ['@libsql/*', 'pino', 'pino-http'], banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" } });
  const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
  process.exitCode = result.status ?? 1;
} finally {
  // folder is the freshly created temporary directory inside this package.
  await rm(folder, { recursive: true, force: true });
}
