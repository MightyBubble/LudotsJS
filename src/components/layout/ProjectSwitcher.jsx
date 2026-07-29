import React from 'react';
import { ChevronDown, Check, FolderKanban } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useProjectScope from '@/lib/projectScope';
import { useI18n } from '@/i18n/I18nProvider';

/** 左上角品牌区的 Workspace / Project 切换器 */
export default function ProjectSwitcher() {
  const { workspaces, projectsInWorkspace, workspace, project, selectWorkspace, selectProject } = useProjectScope();
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-[#0D0F14] border border-[#2A2E37] text-gray-300 hover:border-[#D97706] max-w-[210px]">
          <FolderKanban className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
          <span className="truncate">{project?.name || t('project.none')}</span>
          <span className="text-gray-600 truncate hidden lg:inline">/ {workspace?.name || '—'}</span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-[#15171C] border-[#2A2E37] text-gray-300 min-w-56">
        <DropdownMenuLabel className="text-[10px] uppercase text-gray-500">{t('project.workspace')}</DropdownMenuLabel>
        {workspaces.map(w => (
          <DropdownMenuItem
            key={w.workspace_id}
            onClick={() => selectWorkspace(w.workspace_id)}
            className="text-xs focus:bg-[#2A2E37] focus:text-white cursor-pointer"
          >
            {w.workspace_id === workspace?.workspace_id && <Check className="w-3 h-3 text-[#D97706]" />}
            {w.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-[#2A2E37]" />
        <DropdownMenuLabel className="text-[10px] uppercase text-gray-500">{t('project.project')}</DropdownMenuLabel>
        {projectsInWorkspace.map(p => (
          <DropdownMenuItem
            key={p.project_id}
            onClick={() => selectProject(p.project_id)}
            className="text-xs focus:bg-[#2A2E37] focus:text-white cursor-pointer"
          >
            {p.project_id === project?.project_id && <Check className="w-3 h-3 text-[#D97706]" />}
            {p.name}
          </DropdownMenuItem>
        ))}
        {projectsInWorkspace.length === 0 && (
          <DropdownMenuItem disabled className="text-xs text-gray-500">{t('project.empty')}</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}