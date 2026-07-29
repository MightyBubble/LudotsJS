import React from 'react';
import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';

// 姿态路径（HFSM 扁平路径，如 'Paladin.Field'）→ 显示标签（逐节取 label，缺失回退 key）
function stanceLabel(machine, path) {
  let node = machine;
  const parts = [];
  for (const k of String(path || '').split('.')) {
    node = node?.states?.[k];
    if (!node) return path;
    parts.push(node.label || k);
  }
  return parts.join(' / ');
}

// 运行时姿态面板：快速切换 + 实时当前叶状态；图与配置在 FSM 编辑器。
// HFSM：按钮为顶层状态（复合态点击 = 下沉初始叶）；当前态显示完整叶路径 ——
// 子状态即机器数据本身（条件蓝图驱动流转），面板不做任何推断。
export default function StancePanel({ unit, machine, onSet }) {
  if (!unit) return null;
  const m = machine;
  const activeRoot = String(unit.stance || '').split('.')[0];
  return (
    <div className="space-y-2 border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">姿态（{unit.id}）</div>
        <Link to="/fsm?asset=StanceMachine" className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700">
          <Settings2 className="w-3 h-3" />FSM 编辑器
        </Link>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {Object.entries(m.states).map(([key, st]) => {
          const active = activeRoot === key;
          return (
            <button
              key={key}
              onClick={() => onSet(key)}
              className={`px-2 py-1 text-[11px] border transition-colors ${active ? 'text-white' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
              style={active ? { backgroundColor: st.color || '#475569', borderColor: st.color || '#475569' } : {}}
            >
              {st.label}
            </button>
          );
        })}
      </div>
      <div className="text-[10px] text-slate-400 font-mono">
        当前：{stanceLabel(m, unit.stance)}{unit.blackboard?.lastHit ? ` · bb.lastHit ← ${unit.blackboard.lastHit.by}` : ''}
      </div>
    </div>
  );
}