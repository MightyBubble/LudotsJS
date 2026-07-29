import { Outlet } from 'react-router-dom';
import {
  LayoutGrid, Boxes, Network, Workflow, FlaskConical, Zap, MousePointerClick, BookOpen,
  GitBranch, ListTree, Layers, Crown, CheckCircle2, Brain, Crosshair, SlidersHorizontal,
  Filter, PlayCircle, Gauge, Wand2,
} from 'lucide-react';
import { T } from './aieditor/uikit.jsx';
import TopNav from './TopNav.jsx';

/* 功能分级导航 —— 按决策层组织（对齐产品架构：GraphVM 执行底座 → 战术 BT/FSM → 中观 GOAP/Utility → 战略 HTN/4X）。
   Studio 规范：直角、发丝线、等宽层级标签。 */
const navGroups = [
  {
    tag: 'L4', label: '战略层', en: 'STRATEGIC',
    items: [
      { path: '/grand', label: '大战略 4X', icon: Crown },
      { path: '/htn', label: 'HTN 编辑器', icon: Layers },
    ],
  },
  {
    tag: 'L3', label: '中观层', en: 'OPERATIONAL',
    items: [
      { path: '/goap', label: 'GOAP 规划器', icon: ListTree },
      {
        path: '/utility', label: 'Utility Intelligence', icon: Brain, exact: true,
        children: [
          { path: '/utility/inputs', label: 'Input 输入', icon: Gauge },
          { path: '/utility/normalizations', label: '归一化', icon: Wand2 },
          { path: '/utility/considerations', label: '考量', icon: SlidersHorizontal },
          { path: '/utility/filters', label: '目标过滤', icon: Filter },
          { path: '/utility/actions', label: '动作任务', icon: PlayCircle },
        ],
      },
    ],
  },
  {
    tag: 'L2', label: '战术层', en: 'TACTICAL',
    items: [
      { path: '/bt', label: '行为树编辑器', icon: Network },
      { path: '/fsm', label: 'FSM 编辑器', icon: Workflow },
    ],
  },
  {
    tag: 'L1', label: '执行层', en: 'GRAPHVM',
    items: [
      { path: '/lab', label: '指令实验室', icon: Zap },
      { path: '/graph', label: '图实验室', icon: GitBranch },
      { path: '/routes', label: '路由表', icon: MousePointerClick },
    ],
  },
  {
    tag: 'SYS', label: '系统', en: 'SYSTEM',
    items: [
      { path: '/', label: '仪表盘', icon: LayoutGrid },
      { path: '/selftest', label: '引擎自检', icon: CheckCircle2 },
      { path: '/docs', label: '设计文档', icon: BookOpen },
    ],
  },
  {
    tag: 'LEG', label: '遗留工具', en: 'LEGACY',
    items: [
      { path: '/nodes', label: '服务节点库', icon: Boxes },
      { path: '/test', label: '测试环境', icon: FlaskConical },
    ],
  },
];

export default function Layout() {
  return (
    <div className="flex flex-col h-screen" style={{ background: T.canvas, fontFamily: T.font }}>
      <header className="flex items-center gap-3 shrink-0"
        style={{ minHeight: 58, padding: '4px 12px', background: T.panel, borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 shrink-0" style={{ paddingRight: 10, borderRight: `1px solid ${T.separator}` }}>
          <div style={{
            width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #F5F5F7, #8E8E93)', boxShadow: T.insetHi,
          }}>
            <Crosshair size={13} color="#1C1C1E" />
          </div>
          <div className="hidden lg:block">
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, lineHeight: 1.2 }}>SOA AI 编辑器</div>
            <div style={{ fontSize: 8, fontFamily: T.mono, letterSpacing: '0.08em', color: T.text3 }}>GRAPHVM · LAYERED AI · 4X</div>
          </div>
        </div>
        <TopNav groups={navGroups} />
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}