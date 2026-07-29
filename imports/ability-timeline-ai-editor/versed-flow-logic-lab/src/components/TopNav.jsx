import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { T } from './aieditor/uikit.jsx';

// 顶部导航（两级）：第一行 = 决策层分组，第二行 = 当前分组的功能项（含 Utility 子页平铺）。
// 两级铺开后单行不再溢出，无横向滚动条。
const matches = (pathname, item) => item.exact ? pathname === item.path
  : item.path === '/' ? pathname === '/'
    : pathname.startsWith(item.path);

// 分组内展开子项：父项 + 子项同排（子项缩进以点前缀区分）
const flatten = (items) => items.flatMap((it) => [it, ...(it.children || []).map((c) => ({ ...c, sub: true }))]);

function ItemLink({ item, active }) {
  const Icon = item.icon;
  return (
    <Link to={item.path}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, height: 24, padding: '0 9px',
        fontSize: item.sub ? 11 : 12, fontWeight: active ? 500 : 400,
        textDecoration: 'none', whiteSpace: 'nowrap',
        color: active ? T.text1 : (item.sub ? T.text3 : T.text2),
        background: active ? T.selectedBg : 'transparent',
        boxShadow: active ? `inset 0 -2px 0 ${T.accent}` : 'none',
        transition: 'background .12s cubic-bezier(0.2,0,0,1)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.hover; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      <Icon size={item.sub ? 11 : 13} style={{ color: active ? T.accent : T.text3, flexShrink: 0 }} />
      {item.sub ? `· ${item.label}` : item.label}
    </Link>
  );
}

export default function TopNav({ groups }) {
  const { pathname } = useLocation();
  const routeGroup = groups.find((g) => flatten(g.items).some((it) => matches(pathname, it))) || groups[0];
  const [tag, setTag] = useState(routeGroup.tag);
  useEffect(() => { setTag(routeGroup.tag); }, [routeGroup.tag]);
  const group = groups.find((g) => g.tag === tag) || routeGroup;

  return (
    <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
      {/* 一级：决策层 */}
      <div className="flex items-center gap-1 flex-wrap" style={{ minHeight: 26, paddingBottom: 2 }}>
        {groups.map((g) => {
          const sel = g.tag === group.tag;
          return (
            <button key={g.tag} onClick={() => setTag(g.tag)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: sel ? T.selectedBg : 'transparent',
                color: sel ? T.text1 : T.text2,
                transition: 'background .12s cubic-bezier(0.2,0,0,1)',
              }}
              onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = T.hover; }}
              onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{
                fontSize: 9, fontFamily: T.mono, letterSpacing: '0.04em', padding: '1px 4px',
                color: sel ? T.text1 : T.text3, border: `1px solid ${T.border2}`, background: 'rgba(255,255,255,0.04)',
              }}>{g.tag}</span>
              <span style={{ fontSize: 11, fontWeight: sel ? 500 : 400 }}>{g.label}</span>
              <span style={{ fontSize: 9, fontFamily: T.mono, letterSpacing: '0.08em', color: T.text4 }}>{g.en}</span>
            </button>
          );
        })}
      </div>
      {/* 二级：当前层的功能项 */}
      <div className="flex items-center gap-1 flex-wrap" style={{ minHeight: 26, borderTop: `1px solid ${T.separator}`, paddingTop: 2 }}>
        {flatten(group.items).map((item) => (
          <ItemLink key={item.path} item={item} active={matches(pathname, item)} />
        ))}
      </div>
    </div>
  );
}