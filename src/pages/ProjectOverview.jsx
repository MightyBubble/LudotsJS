import React from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FolderKanban } from 'lucide-react';
import useProjectScope from '@/lib/projectScope';
import { NAV_GROUPS } from '@/components/layout/navConfig';
import ProjectSettingsPanel from '@/components/project/ProjectSettingsPanel';
import ProjectStatsPanel from '@/components/project/ProjectStatsPanel';

export default function ProjectOverviewPage() {
  const panel = new URLSearchParams(useLocation().search).get('panel') || 'overview';
  const { workspace, project } = useProjectScope();

  const { data: folders = [] } = useQuery({
    queryKey: ['projectFolders'],
    queryFn: () => base44.entities.ProjectFolder.list(),
    initialData: [],
  });

  const projectFolders = folders.filter(f => f.project_id === project?.project_id);

  return (
    <div className="h-full overflow-auto bg-[#0D0F14] text-[#e5e5e5]">
      <div className="p-4 space-y-4">
        {!project && <p className="text-sm text-gray-500">尚未选择项目，请在左上角切换器中选择。</p>}

        {project && panel === 'settings' && <ProjectSettingsPanel project={project} allGroups={NAV_GROUPS} />}
        {project && panel !== 'settings' && (
          <ProjectStatsPanel project={project} folders={projectFolders} showValidation={panel === 'validation'} />
        )}
      </div>
    </div>
  );
}