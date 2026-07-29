import { EVALUATOR_LIST } from '@/lib/simBehaviors';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Data-driven condition config editor.
// Lets the user pick a generic evaluator and set its params.
// Param values can be literals (30, true) or property refs (agent.health, enemy.alive, bb.xxx).
export default function ConditionConfigEditor({ config, onChange }) {
  const evaluatorKey = config?.evaluator || '';
  const params = config?.params || {};
  const evaluatorDef = EVALUATOR_LIST.find((e) => e.key === evaluatorKey);

  const setEvaluator = (key) => {
    const def = EVALUATOR_LIST.find((e) => e.key === key);
    const defaultParams = {};
    if (def?.params) {
      def.params.forEach((p) => {
        if (p.default !== undefined) defaultParams[p.key] = p.default;
      });
    }
    onChange({ evaluator: key, params: defaultParams });
  };

  const setParam = (key, value) => {
    onChange({ ...config, params: { ...params, [key]: value } });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>条件评估器</Label>
        <select
          value={evaluatorKey}
          onChange={(e) => setEvaluator(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">选择评估器...</option>
          {EVALUATOR_LIST.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      {evaluatorDef?.description && (
        <p className="text-xs text-slate-400 -mt-1">{evaluatorDef.description}</p>
      )}

      {evaluatorDef?.params.map((p) => (
        <div key={p.key} className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            {p.label}
            {p.optional && <span className="text-slate-400 font-normal">(可选)</span>}
          </Label>
          <Input
            value={params[p.key] ?? ''}
            onChange={(e) => setParam(p.key, e.target.value)}
            placeholder={p.default != null ? String(p.default) : ''}
            className="h-8 text-sm font-mono"
          />
        </div>
      ))}

      {evaluatorDef && (
        <div className="text-[11px] text-slate-400 bg-slate-50 rounded-md p-2.5 space-y-0.5">
          <div className="font-medium text-slate-500 mb-1">参数支持:</div>
          <div>
            <code className="text-blue-600">agent.xxx</code> — 读取 Agent 属性
          </div>
          <div>
            <code className="text-blue-600">enemy.xxx</code> — 读取敌人属性
          </div>
          <div>
            <code className="text-blue-600">bb.xxx</code> — 读取黑板变量
          </div>
          <div>
            <code className="text-blue-600">30 / true / false</code> — 字面量
          </div>
        </div>
      )}
    </div>
  );
}