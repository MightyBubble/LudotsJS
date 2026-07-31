import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import SemanticRoleListEditor from './SemanticRoleListEditor';

export default function AbilitySemanticProfileDetails({ draft, patch }) {
  return (
    <>
      <Section title="语义组">
        <TextField label="语义组 ID" value={draft.profile_id}
          onChange={profile_id => patch({ profile_id })} placeholder="hero"
          hint="实体原型通过它引用这套语义。同一实体族（英雄 / 建筑 / 工人）共用一套。" />
        <TextField label="显示名" value={draft.label} onChange={label => patch({ label })} placeholder="英雄" />
        <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
      </Section>
      <Section title="技能语义">
        <SemanticRoleListEditor roles={draft.roles || []} onChange={roles => patch({ roles })} />
        <p className="text-[10px] text-gray-500">
          这是 AI 与关卡设计师唯一需要认识的名字表——脚本写 role_id，不写具体技能 ID。
          每个原型再自己决定哪个技能对应哪个语义。
        </p>
      </Section>
    </>
  );
}