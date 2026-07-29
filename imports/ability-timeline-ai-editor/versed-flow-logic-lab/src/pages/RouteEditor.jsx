import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';
import { CONTEXT_ROUTES, matchRouteIndex, findShadowed } from '@/lib/lab/contextRouting';
import RuleCard from '@/components/routes/RuleCard';
import RouteSimulator from '@/components/routes/RouteSimulator';

const INPUT_TAG = 'Input.Smart';

// 上下文路由表作者态：有序规则列表（first-match）+ 命中模拟器 + 不可达静态检查。
// 保存到 RouteTable 实体；施法实验室加载时读库覆盖内置默认表。
export default function RouteEditor() {
  const [record, setRecord] = useState(null);
  const [rules, setRules] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ctx, setCtx] = useState({ targetKind: 'ally', selfTags: ['Role.Healer'], targetTags: [], targetHpRatio: 0.6 });

  useEffect(() => {
    base44.entities.RouteTable.filter({ input_tag: INPUT_TAG }).then((rs) => {
      if (rs[0]) { setRecord(rs[0]); setRules(rs[0].rules || []); }
      else setRules(JSON.parse(JSON.stringify(CONTEXT_ROUTES[INPUT_TAG])));
    });
  }, []);

  if (!rules) return <div className="p-8 text-sm text-slate-400">加载中…</div>;

  const mutate = (next) => { setRules(next); setDirty(true); };
  const patch = (i, r) => mutate(rules.map((x, j) => (j === i ? r : x)));
  const move = (i, dir) => { const n = [...rules]; const [r] = n.splice(i, 1); n.splice(i + dir, 0, r); mutate(n); };
  const remove = (i) => mutate(rules.filter((_, j) => j !== i));
  const add = () => mutate([...rules, { when: { target: 'ground' }, do: { type: 'move' } }]);

  const save = async () => {
    setSaving(true);
    const saved = record
      ? await base44.entities.RouteTable.update(record.id, { rules })
      : await base44.entities.RouteTable.create({ input_tag: INPUT_TAG, rules });
    setRecord(saved);
    setDirty(false);
    setSaving(false);
  };

  const matchedIndex = matchRouteIndex(rules, ctx);
  const shadowed = findShadowed(rules);

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">上下文路由表</h1>
            <p className="text-xs text-slate-500 mt-1">
              <kbd className="font-mono bg-slate-200 rounded px-1.5 py-0.5 text-[10px]">{INPUT_TAG}</kbd>（右键/智能指令）
              · 自上而下<b>首条命中生效</b>，顺序即优先级 · 保存后施法实验室即读此表
            </p>
          </div>
          <Button size="sm" onClick={save} disabled={!dirty || saving}>
            <Save className="w-3.5 h-3.5" /> {saving ? '保存中…' : dirty ? '保存' : '已保存'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
          <div className="space-y-2">
            {rules.map((rule, i) => (
              <RuleCard
                key={i}
                rule={rule}
                index={i}
                matched={i === matchedIndex}
                shadowed={shadowed.includes(i)}
                onChange={(r) => patch(i, r)}
                onMove={(dir) => move(i, dir)}
                onRemove={() => remove(i)}
                isFirst={i === 0}
                isLast={i === rules.length - 1}
              />
            ))}
            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={add}>
              <Plus className="w-3.5 h-3.5" /> 添加规则
            </Button>
          </div>
          <div className="lg:sticky lg:top-6">
            <RouteSimulator rules={rules} ctx={ctx} onChange={setCtx} matchedIndex={matchedIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}