import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import AbilityJsonField from './AbilityJsonField';

export default function AbilityPresentationEditor({ value = {}, onChange }) {
  const patch = next => onChange({ ...value, ...next });
  return <Section title="表现 Presentation">
    <TextField label="显示名称 displayName" value={value.displayName} onChange={displayName => patch({ displayName })} />
    <TextField label="名称 Token displayNameToken" value={value.displayNameToken} onChange={displayNameToken => patch({ displayNameToken })} />
    <TextField label="图标字符 iconGlyph" value={value.iconGlyph} onChange={iconGlyph => patch({ iconGlyph })} />
    <TextField label="强调色 accentColor" value={value.accentColor} onChange={accentColor => patch({ accentColor })} />
    <TextField label="提示 hintText" value={value.hintText} onChange={hintText => patch({ hintText })} />
    <TextField label="提示 Token hintTextToken" value={value.hintTextToken} onChange={hintTextToken => patch({ hintTextToken })} />
    <AbilityJsonField label="模式图标 modeIconGlyphs" value={value.modeIconGlyphs || {}} onChange={modeIconGlyphs => patch({ modeIconGlyphs })} />
    <AbilityJsonField label="模式提示 modeHints" value={value.modeHints || {}} onChange={modeHints => patch({ modeHints })} />
    <AbilityJsonField label="模式提示 Token modeHintTokens" value={value.modeHintTokens || {}} onChange={modeHintTokens => patch({ modeHintTokens })} />
  </Section>;
}