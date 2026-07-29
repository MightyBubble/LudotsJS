// 苹果系深色设计基元 —— 全产品统一的现代 UI 组件库。
// 设计规格：Apple HIG 深色层级（越高越亮）· 边框一律半透明白 · 玻璃材质只给浮层 ·
// 字重 400/500/600 三档 · 4px 基准网格 · 13px 正文 · 动效 150ms cubic-bezier(0.2,0,0,1)。
import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { applyNorm, applyCurve } from '@/lib/ai/core/belief.js';

export const T = {
  canvas: '#0C0D10',
  panel: '#131417',
  panelDeep: '#0E0F12',
  elevated: '#1C1E22',
  hover: 'rgba(255,255,255,0.05)',
  active: 'rgba(255,255,255,0.08)',
  selectedBg: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.12)',
  separator: 'rgba(255,255,255,0.08)',
  text1: 'rgba(255,255,255,0.92)',
  text2: 'rgba(235,235,245,0.62)',
  text3: 'rgba(235,235,245,0.38)',
  text4: 'rgba(235,235,245,0.22)',
  accent: '#E8E8ED',
  accentDark: '#1C1C1E',
  silver: ['#E5E5EA', '#D1D1D6', '#C7C7CC', '#AEAEB2', '#98989D', '#8E8E93', '#7C7C80', '#636366'],
  exec: '#E8E8ED',
  ok: '#30D158',
  warn: '#FFD60A',
  err: '#FF453A',
  info: '#8E8E93',
  shadowMenu: '0 0 0 1px rgba(255,255,255,.08), 0 8px 24px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.30)',
  insetHi: 'inset 0 1px 0 rgba(255,255,255,.05)',
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif',
  mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, "JetBrains Mono", Consolas, monospace',
};

export const EASE = 'cubic-bezier(0.2,0,0,1)';

/* ---------- 文本与分组 ---------- */
export const SectionLabel = ({ children, style }) => (
  <div style={{
    fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
    color: T.text3, margin: '14px 0 6px', ...style,
  }}>{children}</div>
);

/* ---------- 按钮三级 ---------- */
export function Btn({ kind = 'secondary', size = 'md', children, style, ...rest }) {
  const base = {
    height: size === 'sm' ? 22 : 26, padding: size === 'sm' ? '0 9px' : '0 12px',
    borderRadius: 6, fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5,
    border: 'none', cursor: 'pointer', transition: `all .15s ${EASE}`, whiteSpace: 'nowrap',
  };
  const kinds = {
    primary: { background: 'linear-gradient(180deg, #F5F5F7, #C7C7CC)', color: '#1C1C1E', boxShadow: T.insetHi },
    secondary: { background: T.active, color: T.text1, border: `1px solid ${T.border}`, boxShadow: T.insetHi },
    ghost: { background: 'transparent', color: T.text2 },
    danger: { background: 'transparent', color: T.err },
  };
  return (
    <button
      style={{ ...base, ...kinds[kind], opacity: rest.disabled ? 0.4 : 1, ...style }}
      onMouseEnter={(e) => { if (kind === 'ghost' || kind === 'danger') e.currentTarget.style.background = T.hover; else e.currentTarget.style.filter = 'brightness(1.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = kinds[kind].background; e.currentTarget.style.filter = ''; }}
      {...rest}
    >{children}</button>
  );
}

/* ---------- 输入 ---------- */
export const fieldStyle = {
  height: 26, padding: '0 8px', borderRadius: 6, fontSize: 12, width: '100%',
  background: T.panelDeep, color: T.text1, border: `1px solid ${T.border}`, outline: 'none',
};
export const Field = ({ label, children, w }) => (
  <div style={{ width: w }}>
    <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>{label}</div>
    {children}
  </div>
);

/* ---------- 开关 ---------- */
export function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 34, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 2,
      background: value ? T.ok : 'rgba(255,255,255,0.16)', transition: `background .15s ${EASE}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: value ? 'flex-end' : 'flex-start',
    }}>
      <span style={{ width: 16, height: 16, borderRadius: 8, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.35)' }} />
    </button>
  );
}

/* ---------- 分段控件 ---------- */
export function Seg({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', padding: 2, gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 7, border: `1px solid ${T.border}` }}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        const sel = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            height: 24, padding: '0 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 500, transition: `all .15s ${EASE}`,
            background: sel ? 'rgba(255,255,255,0.12)' : 'transparent',
            color: sel ? T.text1 : T.text2,
            boxShadow: sel ? `0 1px 2px rgba(0,0,0,.3), ${T.insetHi}` : 'none',
          }}>{label}</button>
        );
      })}
    </div>
  );
}

/* ---------- 徽标 ---------- */
export const Tag = ({ children, color = T.text3, bg = 'rgba(255,255,255,0.08)' }) => (
  <span style={{
    fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 9999,
    color, background: bg, whiteSpace: 'nowrap',
  }}>{children}</span>
);

/* ---------- 左栏资产列表（可选 groupKey 分组，对齐参考项目 Category 字段） ---------- */
export function AssetList({ title, items, selId, onSelect, onAdd, onDelete, renderMeta, emptyHint, groupKey }) {
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const shown = items.filter((it) => !ql || (it.name || '').toLowerCase().includes(ql));
  const groups = groupKey
    ? [...new Set(shown.map((it) => groupKey(it) || '未分类'))].sort()
      .map((g) => [g, shown.filter((it) => (groupKey(it) || '未分类') === g)])
    : [[null, shown]];
  return (
    <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', background: T.panel, borderRight: `1px solid ${T.border}` }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{title}</span>
          {onAdd && <Btn kind="ghost" size="sm" onClick={onAdd} style={{ padding: '0 6px' }}><Plus size={13} /></Btn>}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 7, top: 7, color: T.text3 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索"
            style={{ ...fieldStyle, paddingLeft: 22, height: 24 }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
        {shown.length === 0 && <div style={{ fontSize: 12, color: T.text3, textAlign: 'center', padding: '20px 8px' }}>{emptyHint || '暂无资产'}</div>}
        {groups.map(([g, list]) => (
          <div key={g || '_'}>
            {g && <div style={{ fontSize: 9, fontFamily: T.mono, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.text4, padding: '8px 8px 3px' }}>{g}（{list.length}）</div>}
            {list.map((it) => {
              const sel = it.id === selId;
              return (
                <div key={it.id}
                  onClick={() => onSelect(it)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 8px', marginBottom: 1,
                    borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: sel ? 500 : 400,
                    color: sel ? T.text1 : T.text2, background: sel ? T.selectedBg : 'transparent',
                    boxShadow: sel ? `inset 2px 0 0 ${T.accent}` : 'none',
                    transition: `background .12s ${EASE}`,
                  }}
                  onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = T.hover; }}
                  onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name || '（未命名）'}</span>
                  {renderMeta?.(it)}
                  {onDelete && (
                    <span onClick={(e) => { e.stopPropagation(); onDelete(it); }}
                      style={{ color: T.text3, display: 'inline-flex', opacity: 0.7 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = T.err; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = T.text3; }}>
                      <Trash2 size={12} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 可折叠分组 ---------- */
export function Group({ title, children, defaultOpen = true, right }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: T.panel, overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', cursor: 'pointer',
        fontSize: 12, fontWeight: 600, color: T.text1, background: 'rgba(255,255,255,0.03)',
      }}>
        {open ? <ChevronDown size={13} style={{ color: T.text3 }} /> : <ChevronRight size={13} style={{ color: T.text3 }} />}
        {title}
        <span style={{ flex: 1 }} />
        <span onClick={(e) => e.stopPropagation()}>{right}</span>
      </div>
      {open && <div style={{ padding: 10 }}>{children}</div>}
    </div>
  );
}

/* ---------- 响应曲线预览（15 预设共用） ---------- */
export function CurvePreview({ norm, curve, h = 64 }) {
  const pts = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 60; i++) {
      const raw = (norm?.min_value ?? norm?.min ?? 0) + ((norm?.max_value ?? norm?.max ?? 100) - (norm?.min_value ?? norm?.min ?? 0)) * (i / 60);
      const x = applyNorm(raw, norm?.type || 'range', norm?.min_value ?? norm?.min ?? 0, norm?.max_value ?? norm?.max ?? 100);
      const y = applyCurve(x, curve?.type || 'logistic', curve?.slope ?? -1, curve?.exponent ?? 1, curve?.x_shift ?? curve?.xShift ?? 0, curve?.y_shift ?? curve?.yShift ?? 1);
      arr.push([i / 60, y]);
    }
    return arr;
  }, [norm, curve]);
  const H = h, BASE = H - 6, TOP = 8, W = 200;
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${(x * W).toFixed(1)} ${(BASE - y * (BASE - TOP)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: h, borderRadius: 8, background: T.panelDeep, border: `1px solid ${T.border}` }}>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={g * W} y1={TOP} x2={g * W} y2={BASE} stroke={T.separator} strokeWidth="0.5" />
      ))}
      <line x1="0" y1={BASE} x2={W} y2={BASE} stroke={T.border2} strokeWidth="1" />
      <line x1="0" y1={TOP} x2={W} y2={TOP} stroke={T.separator} strokeDasharray="3" />
      <path d={d} fill="none" stroke={T.accent} strokeWidth="1.8" />
    </svg>
  );
}

/* ---------- 原生下拉（样式化） ---------- */
export function Sel({ value, onChange, options, style }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...fieldStyle, appearance: 'auto', ...style }}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        return <option key={v} value={v} style={{ background: T.elevated, color: T.text1 }}>{label}</option>;
      })}
    </select>
  );
}

/* ---------- 数字输入 ---------- */
export function Num({ value, onChange, min, max, step = 1, style }) {
  return (
    <input type="number" value={value} min={min} max={max} step={step}
      onChange={(e) => onChange(+e.target.value)} style={{ ...fieldStyle, ...style }} />
  );
}

/* ---------- 引用选择器（按 id 引用其他资产，带搜索） ---------- */
export function RefPicker({ items, onPick, placeholder = '搜索资产…', exclude = [] }) {
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const shown = items.filter((it) => !exclude.includes(it.id) && (!ql || (it.name || '').toLowerCase().includes(ql))).slice(0, 8);
  return (
    <div style={{ borderRadius: 8, border: `1px solid ${T.border}`, background: T.panelDeep, overflow: 'hidden' }}>
      <div style={{ position: 'relative', borderBottom: `1px solid ${T.border}` }}>
        <Search size={12} style={{ position: 'absolute', left: 8, top: 8, color: T.text3 }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
          style={{ ...fieldStyle, border: 'none', background: 'transparent', paddingLeft: 24 }} />
      </div>
      <div style={{ maxHeight: 168, overflowY: 'auto', padding: 4 }}>
        {shown.length === 0 && <div style={{ fontSize: 12, color: T.text3, padding: '8px 10px' }}>无匹配</div>}
        {shown.map((it) => (
          <div key={it.id} onClick={() => { onPick(it); setQ(''); }}
            style={{ padding: '5px 8px', borderRadius: 5, fontSize: 12, color: T.text2, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.text1; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text2; }}>
            {it.name || '（未命名）'}
          </div>
        ))}
      </div>
    </div>
  );
}
