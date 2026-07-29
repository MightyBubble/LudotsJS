import React, { useState } from 'react';
import { Plus, FolderOpen, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ProjectManager({ projects, onOpen, onCreate, onDelete, onClose }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', graph_type: 'curve' });

  const handleCreate = () => {
    if (!newProject.name.trim()) return;
    
    onCreate({
      graph_id: `graph_${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      graph_type: newProject.graph_type,
      graph_definition: JSON.stringify({ nodes: [], edges: [] })
    });
    
    setNewProject({ name: '', description: '', graph_type: 'curve' });
    setIsCreating(false);
  };

  return (
    <div className="h-screen w-full bg-[#1e1e1e] flex items-center justify-center">
      <div className="w-[800px] max-h-[80vh] bg-[#252526] rounded-lg shadow-2xl border border-[#3e3e42] flex flex-col">
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between">
          <h1 className="text-white font-medium text-lg">Data Graph 项目</h1>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#0e639c] hover:bg-[#1177bb]">
                <Plus className="w-4 h-4 mr-1.5" />
                新建项目
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
              <DialogHeader>
                <DialogTitle className="text-white">新建 Data Graph</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm text-white/70 mb-1.5 block">项目名称</label>
                  <Input
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="例如: 伤害计算图"
                    className="bg-[#3c3c3c] border-[#434343] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-1.5 block">描述</label>
                  <Input
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="简要描述这个图的用途"
                    className="bg-[#3c3c3c] border-[#434343] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-1.5 block">类型</label>
                  <select
                    value={newProject.graph_type}
                    onChange={(e) => setNewProject({ ...newProject, graph_type: e.target.value })}
                    className="w-full bg-[#3c3c3c] border border-[#434343] text-white rounded px-3 py-2 text-sm"
                  >
                    <option value="curve">曲线图</option>
                    <option value="attribute_calculation">属性计算图</option>
                  </select>
                </div>
                <Button onClick={handleCreate} className="w-full bg-[#0e639c] hover:bg-[#1177bb]">
                  创建
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#1e1e1e] rounded-lg border border-[#3e3e42] p-4 hover:border-[#0e639c] transition-colors group cursor-pointer"
                onClick={() => onOpen(project)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-400" />
                    <h3 className="text-white font-medium">{project.name}</h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定删除此项目？')) {
                        onDelete(project.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white/60 text-sm mb-2">{project.description || '暂无描述'}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    project.graph_type === 'curve' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'
                  }`}>
                    {project.graph_type === 'curve' ? '曲线' : '属性计算'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12 text-white/40">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无项目</p>
              <p className="text-sm mt-1">点击新建项目开始</p>
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