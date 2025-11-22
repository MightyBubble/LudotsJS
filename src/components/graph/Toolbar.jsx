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
    <div className="h-12 bg-[#141414] border-b border-[#262626] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-8 w-8"
          title="返回项目列表"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-[#262626]" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleLibrary}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-8 w-8"
          title="切换节点库"
        >
          <Menu className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleBlackboard}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-8 w-8"
          title={showBlackboard ? "显示模拟结果" : "显示黑板"}
        >
          {showBlackboard ? <Activity className="w-4 h-4" /> : <Database className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onConfigOutput}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-8 w-8"
          title="配置输出"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <h1 className="text-[#e5e5e5] font-medium text-sm">{projectName || '数据图编辑器'}</h1>
      </div>

      <div className="flex items-center gap-1 bg-[#0a0a0a] rounded p-0.5 border border-[#262626]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="text-gray-400 text-xs font-mono min-w-[50px] text-center">
          {(zoom * 100).toFixed(0)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-4 bg-[#262626] mx-0.5" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onResetView}
          className="text-gray-400 hover:text-white hover:bg-[#262626] h-7 w-7"
          title="重置视图"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onSimulate}
          disabled={isSimulating}
          size="sm"
          className="bg-[#f97316] hover:bg-[#ea580c] text-black h-8"
        >
          <Play className="w-3.5 h-3.5 mr-1.5" />
          {isSimulating ? '模拟中...' : '运行模拟'}
        </Button>
        <Button
          onClick={onSave}
          size="sm"
          className="bg-[#141414] border border-[#262626] hover:bg-[#262626] text-[#e5e5e5] h-8"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          保存
        </Button>
      </div>
    </div>
  );
}