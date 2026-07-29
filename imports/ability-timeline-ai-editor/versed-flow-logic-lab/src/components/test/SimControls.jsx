import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SimControls({
  mode,
  onModeSwitch,
  selectedId,
  onSelectChange,
  currentList,
  running,
  onToggleRun,
  onReset,
  executorName,
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
      <div className="flex rounded-lg bg-slate-100 p-0.5">
        <button
          onClick={() => onModeSwitch('bt')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'bt' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          行为树
        </button>
        <button
          onClick={() => onModeSwitch('fsm')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'fsm' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          状态机
        </button>
      </div>

      <select
        value={selectedId}
        onChange={(e) => onSelectChange(e.target.value)}
        className="h-8 px-3 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:border-slate-400"
      >
        {currentList.length === 0 && <option value="">暂无{mode === 'bt' ? '行为树' : '状态机'}</option>}
        {currentList.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      {executorName && (
        <span className="text-xs text-slate-400 hidden sm:inline">
          {mode === 'bt' ? 'BT' : 'FSM'} · {executorName}
        </span>
      )}

      <div className="flex gap-2 ml-auto">
        <Button
          onClick={onToggleRun}
          disabled={!selectedId}
          className="gap-1.5"
          size="sm"
        >
          {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {running ? '暂停' : '运行'}
        </Button>
        <Button onClick={onReset} variant="outline" size="sm" className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          重置
        </Button>
      </div>
    </div>
  );
}