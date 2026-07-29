import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'ludots.scope';
const ScopeContext = createContext(null);

const readStored = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
};

/** 当前 Workspace / Project 作用域（持久化到本地偏好） */
export function ProjectScopeProvider({ children }) {
  const [stored, setStored] = useState(readStored);

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => base44.entities.Workspace.list(),
    initialData: [],
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: [],
  });

  const workspace =
    workspaces.find(w => w.workspace_id === stored.workspace_id) || workspaces[0] || null;

  const wsProjects = useMemo(
    () => projects.filter(p => p.workspace_id === workspace?.workspace_id && !p.is_archived),
    [projects, workspace?.workspace_id],
  );

  const project =
    wsProjects.find(p => p.project_id === stored.project_id) ||
    wsProjects.find(p => p.project_id === workspace?.default_project_id) ||
    wsProjects[0] ||
    null;

  useEffect(() => {
    if (!workspace || !project) return;
    const next = { workspace_id: workspace.workspace_id, project_id: project.project_id };
    if (next.workspace_id !== stored.workspace_id || next.project_id !== stored.project_id) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStored(next);
    }
  }, [workspace?.workspace_id, project?.project_id]);

  const selectWorkspace = (workspace_id) => {
    const next = { workspace_id, project_id: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setStored(next);
  };
  const selectProject = (project_id) => {
    const next = { workspace_id: workspace?.workspace_id, project_id };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setStored(next);
  };

  const value = {
    workspaces, projects, workspace, project, projectsInWorkspace: wsProjects,
    workspaceId: workspace?.workspace_id || null,
    projectId: project?.project_id || null,
    selectWorkspace, selectProject,
    /** 新建记录的默认作用域字段 */
    newScopeFields: () => ({
      scope_type: 'project',
      workspace_id: workspace?.workspace_id || null,
      project_id: project?.project_id || null,
    }),
    /** 列表过滤：当前项目记录 + 当前 Workspace 共享记录；无作用域字段的旧记录一并显示 */
    inScope: (rec) => {
      if (!rec || !workspace) return true;
      if (!rec.workspace_id && !rec.project_id) return true;
      if (rec.workspace_id && rec.workspace_id !== workspace.workspace_id) return false;
      if (rec.scope_type === 'workspace' || !rec.project_id) return true;
      return rec.project_id === project?.project_id;
    },
  };

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export default function useProjectScope() {
  return useContext(ScopeContext) || {
    workspaces: [], projects: [], projectsInWorkspace: [], workspace: null, project: null,
    workspaceId: null, projectId: null,
    selectWorkspace: () => {}, selectProject: () => {},
    newScopeFields: () => ({}), inScope: () => true,
  };
}