import React from 'react';
import { Search } from 'lucide-react';

/**
 * 全局唯一的样式来源。所有页面禁止再写自己的颜色 / 行高。
 * 面板 #15171C · 底 #0D0F14 · 边框 #2A2E37 · 强调 #D97706 · hover #B45309 · 标题字 #E2D8B3
 */
export const S = {
  page: 'h-full flex flex-col overflow-hidden bg-[#0D0F14] text-[#e5e5e5]',
  pageScroll: 'h-full overflow-auto bg-[#0D0F14] text-[#e5e5e5]',
  panel: 'bg-[#15171C] border border-[#2A2E37] rounded',
  sub: 'bg-[#0D0F14] border border-[#2A2E37] rounded',
  divider: 'border-[#2A2E37]',
  label: 'text-xs text-gray-400 mb-1 block',
  input: 'h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-[#e5e5e5]',
  select: 'h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-[#e5e5e5]',
  menu: 'bg-[#15171C] border-[#2A2E37] text-[#e5e5e5]',
  th: 'text-left p-2 font-semibold text-gray-400 text-xs',
  td: 'p-2 text-xs text-gray-300',
  row: 'border-b border-[#2A2E37] hover:bg-[#15171C]',
  rowActive: 'border-b border-[#2A2E37] bg-[#15171C]',
  mono: 'font-mono text-xs text-gray-300',
  hint: 'text-xs text-gray-500',
  empty: 'h-full flex items-center justify-center text-sm text-gray-600',
};

const TONES = {
  default: 'bg-[#1E2128] hover:bg-[#2A2E37] text-gray-200',
  primary: 'bg-[#D97706] hover:bg-[#B45309] text-black',
  danger: 'bg-[#1E2128] hover:bg-[#7f1d1d] text-red-400',
};

/** 统一的工具条按钮 */
export function ToolButton({ icon: Icon, children, onClick, tone = 'default', disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-7 px-2.5 rounded text-xs inline-flex items-center gap-1 whitespace-nowrap disabled:opacity-40 transition-colors ${TONES[tone]}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </button>
  );
}

/** 统一的图标按钮（表格行内操作） */
export function IconButton({ icon: Icon, onClick, tone = 'default', title, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`h-6 w-6 rounded inline-flex items-center justify-center disabled:opacity-40 transition-colors ${TONES[tone]}`}
    >
      <Icon className="w-3 h-3" />
    </button>
  );
}

/** 统一的搜索框 */
export function SearchBox({ value, onChange, placeholder = '搜索...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-7 pl-7 pr-2 w-40 lg:w-56 rounded bg-[#0D0F14] border border-[#2A2E37] text-xs text-[#e5e5e5] placeholder:text-gray-600 focus:outline-none focus:border-[#D97706]"
      />
    </div>
  );
}