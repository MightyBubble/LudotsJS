const NPC_DOT_COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b'];

const LEGEND = [
  { label: '巡逻', color: 'bg-blue-500' },
  { label: '追击', color: 'bg-amber-500' },
  { label: '近战攻击', color: 'bg-red-600' },
  { label: '远程攻击', color: 'bg-orange-500' },
  { label: '逃跑', color: 'bg-purple-500' },
  { label: '待机', color: 'bg-slate-500' },
  { label: '治疗', color: 'bg-emerald-500' },
];

export default function SimStats({ agentStats, enemyStats, mode, log }) {
  const aliveEnemies = enemyStats.filter((e) => e.alive).length;

  return (
    <div className="w-72 bg-white border-l border-slate-200 overflow-y-auto shrink-0">
      <div className="p-4 space-y-4">
        {/* NPC squad */}
        <div>
          <div className="text-xs font-semibold text-slate-900 mb-2">
            NPC 小队 ({agentStats.length})
          </div>
          <div className="space-y-2.5">
            {agentStats.map((a, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: NPC_DOT_COLORS[i % NPC_DOT_COLORS.length] }}
                  />
                  <span className="text-xs font-medium text-slate-700">NPC {i + 1}</span>
                  <span className="text-xs text-slate-400 ml-auto truncate">{a.label}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${a.health}%`,
                      backgroundColor: NPC_DOT_COLORS[i % NPC_DOT_COLORS.length],
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 pl-4 flex gap-2">
                  <span>视野{a.visionRange}</span>
                  <span>近战{a.attackRange}</span>
                  <span>远程{a.rangedRange}</span>
                  {a.hasTarget === false && <span className="text-amber-500">无目标</span>}
                </div>
                {mode === 'fsm' && a.stateName !== '—' && (
                  <div className="text-[11px] text-slate-400 pl-4">状态: {a.stateName}</div>
                )}
                {/* Ability system: active / lockout / queue */}
                <div className="flex items-center gap-1.5 pl-4">
                  {a.ability ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                      ⚔ {a.ability}
                    </span>
                  ) : a.lockout > 0 ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">
                      硬直 {a.lockout}s
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                      就绪
                    </span>
                  )}
                  {a.queue?.length > 0 && (
                    <span className="text-[10px] text-slate-400">+{a.queue.length} 排队</span>
                  )}
                </div>
                {a.queue?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-4">
                    {a.queue.map((q, qi) => (
                      <span key={qi} className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-500">
                        {q}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enemies */}
        <div>
          <div className="text-xs font-semibold text-slate-900 mb-2">
            敌人 ({aliveEnemies}/{enemyStats.length} 存活)
          </div>
          <div className="space-y-1.5">
            {enemyStats.map((e, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-10 shrink-0">敌{i + 1}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-200"
                    style={{ width: `${e.alive ? e.health : 0}%` }}
                  />
                </div>
                {!e.alive && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-400 shrink-0">
                    阵亡
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div>
          <div className="text-xs font-semibold text-slate-900 mb-2">图例</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {LEGEND.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${l.color} shrink-0`} />
                <span className="text-slate-500 truncate">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Log */}
        <div>
          <div className="text-xs font-semibold text-slate-900 mb-2">行为日志</div>
          <div className="space-y-1">
            {log.length === 0 ? (
              <div className="text-xs text-slate-400">点击「运行」开始</div>
            ) : (
              log.map((entry, i) => (
                <div
                  key={i}
                  className={`text-xs px-2 py-1 rounded ${
                    i === 0
                      ? 'bg-slate-900 text-white font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}