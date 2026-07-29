import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Database, Info } from 'lucide-react';

/** 画布内部浮动工具条，不参与二级导航操作区。 */
export default function Toolbar({
  onZoomIn, onZoomOut, onResetView, onToggleBlackboard, onToggleInfo,
  zoom, showBlackboard, showInfo,
}) {
  const toggleClass = (active) =>
    `h-7 w-7 ${active ? 'text-[#D97706] bg-[#262626]' : 'text-gray-400'} hover:text-white hover:bg-[#262626]`;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded border border-[#2A2E37] bg-[#15171C]/95 p-1 shadow-lg">
      {onToggleInfo && <Button variant="ghost" size="icon" onClick={onToggleInfo} className={toggleClass(showInfo)} title="资产信息"><Info className="w-3.5 h-3.5" /></Button>}
      {onToggleBlackboard && <Button variant="ghost" size="icon" onClick={onToggleBlackboard} className={toggleClass(showBlackboard)} title="黑板 / 模拟"><Database className="w-3.5 h-3.5" /></Button>}
      {(onToggleInfo || onToggleBlackboard) && <div className="w-px h-4 bg-[#2A2E37] mx-0.5" />}
      <Button variant="ghost" size="icon" onClick={onZoomOut} className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7" title="缩小"><ZoomOut className="w-3.5 h-3.5" /></Button>
      <span className="text-gray-400 text-[10px] font-mono min-w-10 text-center">{(zoom * 100).toFixed(0)}%</span>
      <Button variant="ghost" size="icon" onClick={onZoomIn} className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7" title="放大"><ZoomIn className="w-3.5 h-3.5" /></Button>
      <Button variant="ghost" size="icon" onClick={onResetView} className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7" title="重置视图"><Maximize2 className="w-3.5 h-3.5" /></Button>
    </div>
  );
}