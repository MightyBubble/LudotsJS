import React from 'react';
import { Section, SelectField, TextField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';

export default function UIItemPresentationDetails({ draft, patch }) {
  return <div className="max-w-4xl mx-auto grid gap-3 lg:grid-cols-2 items-start">
    <Section title="UI Item Presenter">
      <TextField label="Profile ID" value={draft.profile_id} onChange={profile_id => patch({ profile_id })} />
      <TextField label="显示名" value={draft.label} onChange={label => patch({ label })} />
      <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
      <SelectField label="Item Domain" value={draft.item_kind} options={[{ value: 'entity', label: 'Entity' }, { value: 'ability', label: 'Ability' }]} onChange={item_kind => patch({ item_kind })} />
    </Section>
    <div className="space-y-3">
      <JsonValueField label="Items [{target_id, icon_glyph, accent_color, text:{...token_ref}}]" value={draft.items} onChange={items => patch({ items })} />
      <JsonValueField label="Attribute → Text Bindings" value={draft.attribute_text_bindings} onChange={attribute_text_bindings => patch({ attribute_text_bindings })} />
      <JsonValueField label="Tag → Text Bindings" value={draft.tag_text_bindings} onChange={tag_text_bindings => patch({ tag_text_bindings })} />
    </div>
  </div>;
}