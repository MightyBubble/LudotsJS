import { Section, TextField } from '@/components/ludots/ui';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import usePresentationRefs from '@/components/presentation/usePresentationRefs';
import PresenterAuthoringSettings from './PresenterAuthoringSettings';
import AnimatorParamContractSection from './AnimatorParamContractSection';
import PresenterBehaviorList from './PresenterBehaviorList';
import PresenterParamsSection from './PresenterParamsSection';
import PresenterRulesSection from './PresenterRulesSection';

export default function PresenterDetails({ draft, patch, compact = false }) {
  const refs = usePresentationRefs();
  return <div className="space-y-4">
    <Section title="基础信息">
      <div className={`grid grid-cols-1 gap-3 ${compact ? '' : 'md:grid-cols-3'}`}>
        <TextField label="Presenter ID" value={draft.presenter_id} onChange={presenter_id => patch({ presenter_id })} />
        <TextField label="名称（不导出）" value={draft.label} onChange={label => patch({ label })} />
        <ReferenceSelect label="Extends" hint="继承的 presenter id" value={draft.extends} options={refs.presenters} onChange={extendsId => patch({ extends: extendsId })} />
      </div>
      <TextField label="说明（不导出）" value={draft.description} onChange={description => patch({ description })} />
    </Section>

    <PresenterAuthoringSettings draft={draft} patch={patch} compact={compact} />

    <PresenterBehaviorList behaviors={draft.behaviors} refs={refs} onChange={behaviors => patch({ behaviors })} />
    <AnimatorParamContractSection draft={draft} refs={refs} patch={patch} />
    <PresenterParamsSection
      paramDefaults={draft.paramDefaults}
      onChangeParams={paramDefaults => patch({ paramDefaults })}
    />
    <PresenterRulesSection rules={draft.rules} refs={refs} onChange={rules => patch({ rules })} />
  </div>;
}

