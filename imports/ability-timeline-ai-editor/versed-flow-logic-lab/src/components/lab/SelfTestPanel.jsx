import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FlaskConical, Check, X } from 'lucide-react';
import { runSelfTests } from '@/lib/lab/selftest';

// 引擎 tick 级自检：独立沙盒状态跑确定性用例，不影响场景
export default function SelfTestPanel() {
  const [results, setResults] = useState(null);
  const passed = results?.filter((r) => r.pass).length ?? 0;
  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">引擎自检</span>
        <Button variant="outline" size="sm" onClick={() => setResults(runSelfTests())}>
          <FlaskConical className="w-3.5 h-3.5" /> 运行
        </Button>
      </div>
      {results && (
        <div className="space-y-1">
          <div className={`text-[11px] font-bold ${passed === results.length ? 'text-emerald-600' : 'text-red-500'}`}>
            {passed}/{results.length} 通过
          </div>
          {results.map((r) => (
            <div key={r.name} className="flex items-start gap-1.5 text-[10px]">
              {r.pass
                ? <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-px" />
                : <X className="w-3 h-3 text-red-500 shrink-0 mt-px" />}
              <span className={r.pass ? 'text-slate-600' : 'text-red-600'}>
                {r.name}{!r.pass && ` — ${r.error}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}