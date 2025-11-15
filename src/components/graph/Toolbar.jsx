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
    <div className="h-12 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
          title="返回项目列表"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-white/10" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleLibrary}
          className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
          title="切换节点库"
        >
          <Menu className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleBlackboard}
          className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
          title={showBlackboard ? "显示模拟结果" : "显示黑板"}
        >
          {showBlackboard ? <Activity className="w-4 h-4" /> : <Database className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onConfigOutput}
          className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
          title="配置输出"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <h1 className="text-white font-medium text-sm">{projectName || '数据图编辑器'}</h1>
      </div>

      <div className="flex items-center gap-1 bg-[#1e1e1e] rounded p-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="text-white/70 text-xs font-mono min-w-[50px] text-center">
          {(zoom * 100).toFixed(0)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onResetView}
          className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7"
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
          className="bg-[#16825d] hover:bg-[#1a9870] text-white h-8"
        >
          <Play className="w-3.5 h-3.5 mr-1.5" />
          {isSimulating ? '模拟中...' : '运行模拟'}
        </Button>
        <Button
          onClick={onSave}
          size="sm"
          className="bg-[#0e639c] hover:bg-[#1177bb] text-white h-8"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          保存
        </Button>
      </div>
    </div>
  );
}