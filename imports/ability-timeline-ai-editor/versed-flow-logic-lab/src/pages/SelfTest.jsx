import React, { useState } from 'react';
import { runSelfTest } from '@/lib/ai/selftest.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, CheckCircle2, XCircle, Play } from 'lucide-react';
import { UE } from '@/components/aieditor/theme.js';

export default function SelfTest() {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    // 让按钮状态先渲染
    setTimeout(() => {
      try { setResult(runSelfTest()); }
      catch (e) { setResult({ passed: 0, failed: 1, failures: ['自检运行抛出异常：' + (e?.message || e)], logs: [String(e?.stack || e)] }); }
      setRunning(false);
    }, 30);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4 min-h-full" style={{ background: UE.canvas, color: UE.text }}>
      <div className="flex items-center gap-2">
        <FlaskConical className="w-5 h-5" style={{ color: UE.selected }} />
        <h1 className="font-semibold">引擎自检</h1>
        <span className="text-xs" style={{ color: UE.faint }}>GraphVM / 模板库 / Utility / Belief / BT / FSM / GOAP / HTN / 外交 / 4X 冒烟（300 回合）</span>
        <div className="flex-1" />
        <Button onClick={run} disabled={running} className="text-black" style={{ background: UE.ok }}>
          <Play className="w-4 h-4 mr-1" />{running ? '运行中…' : result ? '重新运行' : '运行自检'}
        </Button>
      </div>

      {result && (
        <>
          <div className="flex gap-2 items-center">
            {result.failed === 0
              ? <Badge style={{ background: '#24382c', color: UE.ok }}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />全部通过 {result.passed}/{result.passed}</Badge>
              : <Badge style={{ background: '#3a2a2e', color: '#e08a8a' }}><XCircle className="w-3.5 h-3.5 mr-1" />通过 {result.passed} · 失败 {result.failed}</Badge>}
          </div>

          {result.failures?.length > 0 && (
            <div className="rounded-md p-3 space-y-1" style={{ border: `1px solid #5c3038`, background: '#2a1e21' }}>
              <div className="text-sm font-semibold" style={{ color: '#e08a8a' }}>失败用例</div>
              {result.failures.map((f, i) => <div key={i} className="text-xs font-mono" style={{ color: '#e08a8a' }}>✗ {f}</div>)}
            </div>
          )}

          <div className="rounded-md p-3" style={{ background: UE.panel, border: `1px solid ${UE.border}` }}>
            <div className="text-sm font-semibold mb-1.5">日志（尾部）</div>
            <div className="text-[11px] font-mono space-y-0.5 max-h-[420px] overflow-y-auto" style={{ color: UE.dim }}>
              {(result.logs || []).slice(-80).map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
