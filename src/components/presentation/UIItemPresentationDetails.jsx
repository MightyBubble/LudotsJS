import React from 'react';
import { Section, SelectField, TextField } from '@/components/ludots/ui';
import UIItemDefinitionsEditor from './UIItemDefinitionsEditor';
import AttributeTextBindingsEditor from './AttributeTextBindingsEditor';
import TagTextBindingsEditor from './TagTextBindingsEditor';

export default function UIItemPresentationDetails({ draft, patch, refs }) {
  return <div className="max-w-6xl mx-auto space-y-3">
    <Section title="UI Item Presenter">
      <div className="grid gap-3 lg:grid-cols-2">
        <TextField label="Profile ID" value={draft.profile_id} onChange={profile_id => patch({ profile_id })} />
        <SelectField label="Item Domain" value={draft.item_kind} options={[{ value: 'entity', label: 'Entity' }, { value: 'ability', label: 'Ability' }]} onChange={item_kind => patch({ item_kind })} />
        <TextField label="显示名" value={draft.label} onChange={label => patch({ label })} />
        <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
      </div>
    </Section>
    <UIItemDefinitionsEditor kind={draft.item_kind} value={draft.items} refs={refs} onChange={items => patch({ items })} />
    <AttributeTextBindingsEditor value={draft.attribute_text_bindings} refs={refs} onChange={attribute_text_bindings => patch({ attribute_text_bindings })} />
    <TagTextBindingsEditor value={draft.tag_text_bindings} refs={refs} onChange={tag_text_bindings => patch({ tag_text_bindings })} />
  </div>;
}