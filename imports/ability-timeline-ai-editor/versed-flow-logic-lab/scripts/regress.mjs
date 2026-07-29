// 统一回归基线：实验室 31 例 + AI 引擎自检。esbuild 打包后 node 直跑。
import { runSelfTests as runLab } from '../src/lib/lab/selftest.js';
import { runSelfTest as runAi } from '../src/lib/ai/selftest.js';

const lab = runLab();
const labBad = lab.filter((r) => !r.pass);
console.log('LAB ' + JSON.stringify({ total: lab.length, pass: lab.length - labBad.length, fails: labBad.map((b) => b.name + ': ' + b.error) }));

const ai = runAi();
console.log('AI ' + JSON.stringify({ total: ai.passed + ai.failed, pass: ai.passed, fails: ai.failures }));
for (const l of (ai.logs || [])) console.log('LOG ' + l);
if (labBad.length || ai.failed) process.exit(1);
