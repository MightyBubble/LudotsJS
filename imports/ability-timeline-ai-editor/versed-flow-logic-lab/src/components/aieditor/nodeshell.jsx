// 统一节点壳（master-component）—— 所有画布编辑器节点共享的声明式外壳。
// 规范来源：① CoMiGo 视觉脚本设计文——用一个 master-component 渲染所有节点，
// 保证样式与行为绝对一致；② React Flow 官方 Contextual Zoom 模式——
// 视口缩到阈值以下只渲染标题栏（缩略即目录，大画布一屏可读）。
// Studio 规范：直角玻璃体 + 类别色左锚点 + 等宽类型标签 + 选中四角括号（设计工具式）。
import { Handle, Position, useStore } from 'reactflow';
import { UE, ueNodeBox, ueHeader } from './theme.js';

const HANDLE = {
  width: 9, height: 9, background: UE.exec, borderRadius: '50%',
  border: `1.5px solid #0C0D10`, boxShadow: '0 0 0 1.5px rgba(255,255,255,0.14)',
};

/* 选中态四角括号（Studio 设计工具语言，替代廉价光圈） */
const Corner = ({ at }) => {
  const pos = { width: 7, height: 7, position: 'absolute', border: `1.5px solid ${UE.accent}` };
  const map = {
    tl: { top: -4, left: -4, borderRight: 'none', borderBottom: 'none' },
    tr: { top: -4, right: -4, borderLeft: 'none', borderBottom: 'none' },
    bl: { bottom: -4, left: -4, borderRight: 'none', borderTop: 'none' },
    br: { bottom: -4, right: -4, borderLeft: 'none', borderTop: 'none' },
  };
  return <span style={{ ...pos, ...map[at], pointerEvents: 'none', zIndex: 10 }} />;
};

export function NodeShell({
  color, litColor, icon: Icon, typeLabel, title, badge,
  width = 234, selected, lit, dim,
  leftIn = true, rightOut = true, topIn = false, bottomOut = false,
  children, bodyCls = 'px-2 py-1.5', lodZoom = 0.55,
}) {
  const zoomedOut = useStore((s) => s.transform[2] < lodZoom);
  const c = lit && litColor ? litColor : color;
  return (
    <div style={{ ...ueNodeBox(selected || lit), width, opacity: dim ? 0.25 : 1, transition: 'opacity .3s, box-shadow .3s' }}>
      {selected && <><Corner at="tl" /><Corner at="tr" /><Corner at="bl" /><Corner at="br" /></>}
      <div style={ueHeader(c)}>
        {Icon && <Icon className="w-3 h-3 shrink-0" style={{ color: UE.nodeTitle }} />}
        {typeLabel && (
          <span className="text-[8px] uppercase shrink-0"
            style={{ color: c, fontFamily: UE.mono, letterSpacing: '0.12em', fontWeight: 500 }}>{typeLabel}</span>
        )}
        <span className="text-[10.5px] font-semibold truncate" style={{ color: UE.nodeTitle, letterSpacing: '0.01em' }}>{title}</span>
        {badge}
      </div>
      {!zoomedOut && children && (
        <div className={bodyCls} style={{ background: 'transparent' }}>
          {children}
        </div>
      )}
      {leftIn && <Handle type="target" position={Position.Left} id="in" style={{ ...HANDLE, left: -5 }} />}
      {rightOut && <Handle type="source" position={Position.Right} id="out" style={{ ...HANDLE, right: -5 }} />}
      {topIn && <Handle type="target" position={Position.Top} id="in" style={{ ...HANDLE, top: -5 }} />}
      {bottomOut && <Handle type="source" position={Position.Bottom} id="out" style={{ ...HANDLE, bottom: -5 }} />}
    </div>
  );
}
