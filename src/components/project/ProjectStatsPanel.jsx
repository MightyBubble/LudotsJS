import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useProjectScope from '@/lib/projectScope';

const COUNTED = [
  ['GameplayTag', '标签'],
  ['Attribute', '属性'],
  ['DataTable', '数据表'],
  ['EntityPrototype', '实体原型'],
  ['Ability', '能力'],
  ['Effect', '效果'],
  ['Validator', '验证器'],
  ['Requirement', '需求'],
  ['Asset', '资源'],
];

/** 项目概览：记录统计、目录结构、校验摘要 */
export default function ProjectStatsPanel({ project, folders, showValidation }) {
  const { inScope } = useProjectScope();

  const { data: counts = {} } = useQuery({
    queryKey: ['projectStats', project.project_id],
    queryFn: async () => {
      const entries = await Promise.all(
        COUNTED.map(async ([name]) => {
          const list = await base44.entities[name].list();
          return [name, list.filter(inScope).length];
        }),
      );
      return Object.fromEntries(entries);
    },
    initialData: {},
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list(),
    initialData: [],
  });

  const legacyRequirements = requirements.filter(
    r => r.validator_id || r.validator_true_count !== undefined || JSON.stringify(r).includes('validator'),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {COUNTED.map(([name, label]) => (
          <div key={name} className="bg-[#15171C] border border-[#2A2E37] rounded p-3">
            <p className="text-[11px] text-gray-500">{label}</p>
            <p className="text-lg text-[#E2D8B3]">{counts[name] ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#15171C] border border-[#2A2E37] rounded p-3">
        <p className="text-xs text-gray-400 mb-2">项目结构 / 文件夹</p>
        {folders.length === 0
          ? <p className="text-[11px] text-gray-600">暂无自定义目录（记录默认置于模块根目录）</p>
          : folders.map(f => (
            <p key={f.folder_id} className="text-[11px] text-gray-300">
              {f.module_key ? `${f.module_key} / ` : ''}{f.name}
            </p>
          ))}
      </div>

      {showValidation && (
        <div className="bg-[#15171C] border border-[#2A2E37] rounded p-3 space-y-1">
          <p className="text-xs text-gray-400 mb-1">校验摘要</p>
          <p className="text-[11px] text-gray-300">
            Requirement 与 Validator 的旧混淆关系：{legacyRequirements.length} 条标记为 legacy_invalid_relation
          </p>
          <p className="text-[11px] text-gray-500">
            Requirement 仅用于 Ability 的 show/use progression 绑定，不参与每次激活验证。
          </p>
        </div>
      )}
    </div>
  );
}