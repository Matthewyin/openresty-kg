import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { ROOT } from '../src/session.mjs';
import { deploymentEntry } from './fixtures/deployment-entry.mjs';

await mkdir(join(ROOT, '.state'), { recursive: true });
const stateDir = await mkdtemp(join(ROOT, '.state/desktop-deployment-'));
const entry = await deploymentEntry({ stateDir, distDir: resolve(ROOT, '../../dist'), mockDelayMs: Number(process.env.PI_TEST_DELAY_MS ?? 1500) });
console.log(JSON.stringify({ url: entry.url, stateDir, mode: 'mock' }));
const input = createInterface({ input: process.stdin });
input.on('line', async line => {
  if (line === 'stop') { await entry.stopBackend(); console.log('BACKEND_STOPPED'); }
  if (line === 'start') { await entry.startBackend(); console.log('BACKEND_STARTED'); }
});
let closing = false;
async function close() {
  if (closing) return; closing = true;
  await entry.close(); input.close(); await rm(stateDir, { recursive: true, force: true }); process.exit(0);
}
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, close);
