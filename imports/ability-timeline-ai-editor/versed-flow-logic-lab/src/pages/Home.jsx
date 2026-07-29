import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Boxes, Network, Workflow, FlaskConical, ArrowRight, CircleDot } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({ nodes: 0, bt: 0, fsm: 0 });
  const [recentBTs, setRecentBTs] = useState([]);
  const [recentFSMs, setRecentFSMs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [nodes, bts, fsms] = await Promise.all([
          base44.entities.TaskNode.list(),
          base44.entities.BehaviorTree.list('-created_date', 5),
          base44.entities.StateMachine.list('-created_date', 5),
        ]);
        setStats({ nodes: nodes.length, bt: bts.length, fsm: fsms.length });
        setRecentBTs(bts);
        setRecentFSMs(fsms);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    {
      path: '/nodes',
      label: '服务节点库',
      desc: 'Action / Condition 可复用服务',
      icon: Boxes,
      count: stats.nodes,
      color: 'from-violet-500 to-purple-600',
    },
    {
      path: '/bt',
      label: '行为树编辑器',
      desc: '可视化节点编排',
      icon: Network,
      count: stats.bt,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      path: '/fsm',
      label: 'FSM 编辑器',
      desc: '状态转移图编辑',
      icon: Workflow,
      count: stats.fsm,
      color: 'from-amber-500 to-orange-600',
    },
    {
      path: '/test',
      label: '3D 测试环境',
      desc: 'Three.js 实时模拟',
      icon: FlaskConical,
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mb-4">
            <CircleDot className="w-3 h-3" />
            SOA 架构 · 服务复用
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI 行为编辑器</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            定义一次 Action 和 Condition 服务节点，在行为树和状态机中复用。在 Three.js 3D
            环境中实时测试 AI 行为。
          </p>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.path}
                to={c.path}
                className="group relative bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4 shadow-sm`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-semibold text-slate-900 text-sm">{c.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{c.desc}</div>
                {c.count !== undefined && (
                  <div className="text-2xl font-bold text-slate-900 mt-3">{c.count}</div>
                )}
                <ArrowRight className="w-4 h-4 text-slate-300 absolute top-5 right-5 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>

        {/* Recent items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">最近的行为树</h2>
              <Link to="/bt" className="text-xs text-slate-500 hover:text-slate-900">
                查看全部
              </Link>
            </div>
            {loading ? (
              <div className="text-sm text-slate-400">加载中...</div>
            ) : recentBTs.length === 0 ? (
              <div className="text-sm text-slate-400">暂无行为树</div>
            ) : (
              <div className="space-y-2">
                {recentBTs.map((bt) => (
                  <Link
                    key={bt.id}
                    to="/bt"
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-700">{bt.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">最近的状态机</h2>
              <Link to="/fsm" className="text-xs text-slate-500 hover:text-slate-900">
                查看全部
              </Link>
            </div>
            {loading ? (
              <div className="text-sm text-slate-400">加载中...</div>
            ) : recentFSMs.length === 0 ? (
              <div className="text-sm text-slate-400">暂无状态机</div>
            ) : (
              <div className="space-y-2">
                {recentFSMs.map((fsm) => (
                  <Link
                    key={fsm.id}
                    to="/fsm"
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-slate-700">{fsm.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}