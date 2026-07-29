// 右键联想菜单 —— UE 蓝图核心交互的共享实现（所有画布编辑器统一）。
// 空白处右键 = 可添加内容（带搜索过滤的联想列表）；节点上右键 = 该节点操作。
// 输入即过滤（label/hint 模糊匹配）、Enter 选第一项、Esc/点外部关闭、视口边缘防溢出。
import { useEffect, useRef, useState } from 'react';
import { UE } from './theme.js';

export function useContextMenu() {
  const [menu, setMenu] = useState(null); // {x, y, items:[{icon?, color?, label, hint?, onClick}]}
  const open = (e, items) => {
    e.preventDefault();
    e.stopPropagation();
    if (!items?.length) return;
    setMenu({ x: e.clientX, y: e.clientY, items });
  };
  const close = () => setMenu(null);
  return { menu, open, close };
}

export function ContextMenu({ menu, onClose }) {
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => { setQ(''); }, [menu]);
  useEffect(() => {
    if (!menu) return;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        const first = ref.current?.querySelector('button[data-item]');
        if (first) first.click();
      }
    };
    window.addEventListener('mousedown', down);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('mousedown', down); window.removeEventListener('keydown', key); };
  }, [menu, onClose]);
  if (!menu) return null;
  const ql = q.trim().toLowerCase();
  const items = menu.items.filter((it) => !ql || it.label.toLowerCase().includes(ql) || (it.hint || '').toLowerCase().includes(ql));
  const x = Math.min(menu.x, window.innerWidth - 240);
  const y = Math.min(menu.y, window.innerHeight - Math.max(1, items.length) * 30 - 64);
  return (
    <div ref={ref} className="fixed z-50 w-60"
      style={{
        left: x, top: Math.max(8, y),
        background: 'rgba(28,30,34,0.88)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderRadius: 10,
        boxShadow: UE.shadowMenu,
        padding: 5,
      }}>
      <div style={{ padding: '0 2px 5px' }}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索操作…"
          className="w-full h-6 px-2 text-xs rounded-md outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', color: UE.text, border: `1px solid ${UE.border}` }} />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {items.length === 0 && <div className="px-2.5 py-1.5 text-[11px]" style={{ color: UE.faint }}>无匹配操作</div>}
        {items.map((it, i) => (
          <button key={i} data-item onClick={() => { onClose(); it.onClick(); }}
            className="w-full flex items-center gap-2 px-2.5 h-7 text-left rounded-md transition-colors ctx-item"
            style={{ color: it.danger ? UE.err : undefined }}
            onMouseEnter={(e) => { e.currentTarget.style.background = UE.accent; for (const el of e.currentTarget.children) el.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; for (const el of e.currentTarget.children) el.style.color = ''; }}>
            {it.icon && <it.icon className="w-3.5 h-3.5 shrink-0" style={{ color: it.color || UE.dim }} />}
            <span className="text-xs" style={{ color: UE.text }}>{it.label}</span>
            {it.hint && <span className="ml-auto text-[10px] shrink-0" style={{ color: UE.faint }}>{it.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
