import { runSelfTest } from './src/lib/ai/selftest.js';
const r = runSelfTest();
console.log('passed', r.passed, 'failed', r.failed);
if (r.failures.length) console.log('FAILURES:', r.failures);
