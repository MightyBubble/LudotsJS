import React, { useState } from 'react';
import { Database, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function BlackboardPanel({ blackboard = {}, onChange }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newVar, setNewVar] = useState({ name: '', value: 0, type: 'number', public: true });

  const handleAdd = () => {
    if (!newVar.name.trim() || blackboard[newVar.name]) return;
    
    let initialValue = newVar.value;
    if (newVar.type === 'number') {
      initialValue = parseFloat(newVar.value) || 0;
    } else if (newVar.type === 'array') {
      initialValue = [];
    }
    
    onChange({
      ...blackboard,
      [newVar.name]: {
        value: initialValue,
        type: newVar.type,
        public: newVar.public
      }
    });
    
    setNewVar({ name: '', value: 0, type: 'number', public: true });
    setIsAdding(false);
  };

  const handleDelete = (key) => {
    const newBlackboard = { ...blackboard };
    delete newBlackboard[key];
    onChange(newBlackboard);
  };

  const handleTogglePublic = (key) => {
    onChange({
      ...blackboard,
      [key]: { ...blackboard[key], public: !blackboard[key].public }
    });
  };

  const handleValueChange = (key, newValue) => {
    onChange({
      ...blackboard,
      [key]: { ...blackboard[key], value: newValue }
    });
  };

  const handleDragStart = (e, key) => {
    const dragData = { blackboardKey: key };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderValueEditor = (key, data) => {
    if (data.type === 'number') {
      return (
        <Input
          type="number"
          value={data.value}
          onChange={(e) => handleValueChange(key, parseFloat(e.target.value) || 0)}
          onClick={(e) => e.stopPropagation()}
          className="h-7 text-xs bg-[#2d2d30] border-[#434343] text-white"
        />
      );
    }
    
    if (data.type === 'array') {
      return (
        <Textarea
          value={JSON.stringify(data.value)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              if (Array.isArray(parsed)) {
                handleValueChange(key, parsed);
              }
            } catch (err) {
              // 忽略解析错误
            }
          }}
          onClick={(e) => e.stopPropagation()}
          placeholder="[1, 2, 3]"
          className="h-16 text-xs bg-[#2d2d30] border-[#434343] text-white font-mono"
        />
      );
    }
    
    return (
      <div className="text-white/70 text-xs font-mono px-2 py-1 bg-[#2d2d30] rounded">
        {String(data.value)}
      </div>
    );
  };

  return (
    <div className="w-72 bg-[#252526] border-l border-[#3e3e42] flex flex-col">
      <div className="p-3 border-b border-[#3e3e42] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <h2 className="text-white font-medium text-sm">黑板</h2>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">添加变量</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">变量名</label>
                <Input
                  value={newVar.name}
                  onChange={(e) => setNewVar({ ...newVar, name: e.target.value })}
                  placeholder="例如: player_level"
                  className="bg-[#3c3c3c] border-[#434343] text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">类型</label>
                <select
                  value={newVar.type}
                  onChange={(e) => setNewVar({ ...newVar, type: e.target.value })}
                  className="w-full bg-[#3c3c3c] border border-[#434343] text-white rounded px-3 py-2 text-sm"
                >
                  <option value="number">数值</option>
                  <option value="string">字符串</option>
                  <option value="boolean">布尔值</option>
                  <option value="array">数组</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">初始值</label>
                {newVar.type === 'array' ? (
                  <Textarea
                    value={newVar.value}
                    onChange={(e) => setNewVar({ ...newVar, value: e.target.value })}
                    placeholder="[1, 2, 3]"
                    className="bg-[#3c3c3c] border-[#434343] text-white h-16"
                  />
                ) : (
                  <Input
                    type={newVar.type === 'number' ? 'number' : 'text'}
                    value={newVar.value}
                    onChange={(e) => setNewVar({ ...newVar, value: e.target.value })}
                    className="bg-[#3c3c3c] border-[#434343] text-white"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={newVar.public}
                  onChange={(e) => setNewVar({ ...newVar, public: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="public" className="text-sm text-white/70">公开（可被外部访问）</label>
              </div>
              <Button onClick={handleAdd} className="w-full bg-[#0e639c] hover:bg-[#1177bb]">
                添加
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {Object.entries(blackboard).map(([key, data]) => (
          <div
            key={key}
            draggable
            onDragStart={(e) => handleDragStart(e, key)}
            className="bg-[#1e1e1e] rounded p-3 border border-[#3e3e42] hover:border-[#0e639c] transition-colors cursor-move"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white/90 text-sm font-medium">{key}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePublic(key);
                  }}
                  className="text-white/40 hover:text-white/70"
                  title={data.public ? '公开' : '私有'}
                >
                  {data.public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(key);
                }}
                className="text-white/30 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-white/40 text-xs mb-2">{data.type}</div>
            {renderValueEditor(key, data)}
          </div>
        ))}

        {Object.keys(blackboard).length === 0 && (
          <div className="text-center py-8 text-white/40 text-xs">
            暂无变量<br/>点击 + 添加
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3e3e42;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4e4e52;
        }
      `}</style>
    </div>
  );
}