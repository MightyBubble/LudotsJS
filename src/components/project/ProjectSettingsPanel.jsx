import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

/** 项目设置：名称、类型与启用模块（模块开关直接决定顶层 Tab 可见性） */
export default function ProjectSettingsPanel({ project, allGroups }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({
    name: project.name,
    game_type: project.game_type || '',
    description: project.description || '',
    enabled_modules: project.enabled_modules?.length ? project.enabled_modules : allGroups.map(g => g.key),
  });

  const save = useMutation({
    mutationFn: () => base44.entities.Project.update(project.id, draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const toggle = (key) => setDraft(d => ({
    ...d,
    enabled_modules: d.enabled_modules.includes(key)
      ? d.enabled_modules.filter(k => k !== key)
      : [...d.enabled_modules, key],
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="项目名称" className="h-8 bg-[#15171C] border-[#2A2E37] text-white" />
        <Input value={draft.game_type} onChange={(e) => setDraft({ ...draft, game_type: e.target.value })}
          placeholder="游戏类型（arpg / rts / tcg）" className="h-8 bg-[#15171C] border-[#2A2E37] text-white" />
      </div>
      <Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        placeholder="描述" className="h-8 bg-[#15171C] border-[#2A2E37] text-white" />

      <div className="bg-[#15171C] border border-[#2A2E37] rounded p-3">
        <p className="text-xs text-gray-400 mb-2">模块开关（控制顶层 Tab 可见性）</p>
        <div className="grid grid-cols-2 gap-2">
          {allGroups.map(g => (
            <label key={g.key} className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" checked={draft.enabled_modules.includes(g.key)} onChange={() => toggle(g.key)} />
              {g.label} <span className="text-gray-600">({g.key})</span>
            </label>
          ))}
        </div>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending}
        className="bg-[#D97706] hover:bg-[#B45309] h-8 text-xs">
        <Save className="w-3 h-3 mr-1" />保存项目设置
      </Button>
    </div>
  );
}