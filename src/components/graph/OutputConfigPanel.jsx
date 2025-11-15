import React, { useState } from 'react';
import { Download, Plus, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function OutputConfigPanel({ outputs = [], onChange, onClose }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newOutput, setNewOutput] = useState({ label: '', type: 'number' });

  const handleAdd = () => {
    if (!newOutput.label.trim()) return;
    
    const output = {
      id: `output-${Date.now()}`,
      label: newOutput.label,
      type: newOutput.type
    };
    
    onChange([...outputs, output]);
    setNewOutput({ label: '', type: 'number' });
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    onChange(outputs.filter(o => o.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#252526] rounded-lg shadow-2xl w-[600px] max-h-[70vh] flex flex-col border border-[#3e3e42]">
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <h2 className="text-white font-medium text-lg">输出配置</h2>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#0e639c] hover:bg-[#1177bb]">
                  <Plus className="w-4 h-4 mr-1.5" />
                  添加输出
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">添加输出</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm text-white/70 mb-1.5 block">输出名称</label>
                    <Input
                      value={newOutput.label}
                      onChange={(e) => setNewOutput({ ...newOutput, label: e.target.value })}
                      placeholder="例如: 最终生命值"
                      className="bg-[#3c3c3c] border-[#434343] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-1.5 block">类型</label>
                    <select
                      value={newOutput.type}
                      onChange={(e) => setNewOutput({ ...newOutput, type: e.target.value })}
                      className="w-full bg-[#3c3c3c] border border-[#434343] text-white rounded px-3 py-2 text-sm"
                    >
                      <option value="number">数值</option>
                      <option value="vector2">二维向量</option>
                      <option value="vector3">三维向量</option>
                      <option value="vector4">四维向量</option>
                      <option value="color">颜色</option>
                    </select>
                  </div>
                  <Button onClick={handleAdd} className="w-full bg-[#0e639c] hover:bg-[#1177bb]">
                    添加
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" onClick={onClose} className="text-white/70 hover:text-white">
              完成
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {outputs.map((output) => (
            <div
              key={output.id}
              className="bg-[#1e1e1e] rounded p-3 border border-[#3e3e42] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-white text-sm font-medium">{output.label}</div>
                  <div className="text-white/40 text-xs">{output.type}</div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(output.id)}
                className="text-white/30 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {outputs.length === 0 && (
            <div className="text-center py-8 text-white/40 text-sm">
              暂无输出<br/>点击添加输出定义图的输出值
            </div>
          )}
        </div>
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