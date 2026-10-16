import { spawn } from 'node:child_process';
import { launchConfig } from './src/launch-config.mjs';

const { args, cwd, env } = await launchConfig(process.argv.slice(2));
const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
