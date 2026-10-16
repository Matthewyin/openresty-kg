import { Spike } from '../src/session.mjs';
const [stateDir, sessionId] = process.argv.slice(2);
const spike = await Spike.create({ stateDir, mockDelayMs: 1 });
try {
  const restored = await spike.restore(sessionId);
  const job = spike.start({ ...restored.request, question: '追问：默认值与依据是什么？' }, sessionId);
  await job.done;
  console.log(JSON.stringify({ restored, state: job.state, cacheHit: job.cacheHit, requests: spike.mock.requests, trace: job.trace }));
} finally { await spike.close(); }
