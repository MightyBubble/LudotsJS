import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, ZoomIn, ZoomOut, Maximize2, Menu, Play, ArrowLeft, Database, Activity, Settings } from 'lucide-react';

export default function Toolbar({ 
  onSave, 
  onZoomIn, 
  onZoomOut, 
  onResetView, 
  onToggleLibrary,
  onToggleBlackboard,
  onSimulate,
  onBack,
  onConfigOutput,
  projectName,
  zoom,
  isSimulating,
  showBlackboard
}) {
  return (
    <div className="h-10 bg-[#15171C] border-b border-[#2A2E37] flex items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7"
          title="返回项目列表"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-[#262626]" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleLibrary}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7"
          title="切换节点库"
        >
          <Menu className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleBlackboard}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7"
          title={showBlackboard ? "显示模拟结果" : "显示黑板"}
        >
          {showBlackboard ? <Activity className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onConfigOutput}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7"
          title="配置输出"
        >
          <Settings className="w-3.5 h-3.5" />
        </Button>
        <h1 className="text-[#e5e5e5] font-medium text-xs ml-2">{projectName || '数据图编辑器'}</h1>
      </div>

      <div className="flex items-center gap-0.5 bg-[#0D0F14] rounded p-0.5 border border-[#2A2E37]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-6 w-6"
        >
          <ZoomOut className="w-3 h-3" />
        </Button>
        <span className="text-gray-400 text-[10px] font-mono min-w-[40px] text-center">
          {(zoom * 100).toFixed(0)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-6 w-6"
        >
          <ZoomIn className="w-3 h-3" />
        </Button>
        <div className="w-px h-3 bg-[#262626] mx-0.5" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onResetView}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-6 w-6"
          title="重置视图"
        >
          <Maximize2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onSimulate}
          disabled={isSimulating}
          size="sm"
          className="bg-[#D97706] hover:bg-[#B45309] text-black h-7 px-3 text-xs"
        >
          <Play className="w-3 h-3 mr-1.5" />
          {isSimulating ? '...' : '运行'}
        </Button>
        <Button
          onClick={onSave}
          size="sm"
          className="bg-[#15171C] border border-[#2A2E37] hover:bg-[#262626] text-[#e5e5e5] h-7 px-3 text-xs"
        >
          <Save className="w-3 h-3 mr-1.5" />
          保存
        </Button>
      </div>
    </div>
  );
}