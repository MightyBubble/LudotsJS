import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Section, NumberField, SelectField, TextField } from '@/components/ludots/ui';
import { normalizeUiScreenProfile } from '@/lib/runtime/uiScreenRuntime';

const HORIZONTAL_OPTIONS = [{ value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' }];
const VERTICAL_OPTIONS = [{ value: 'top', label: '上' }, { value: 'center', label: '中' }, { value: 'bottom', label: '下' }];

export default function UIScreenProfileDetails({ draft, patch }) {
  const screen = normalizeUiScreenProfile(draft);
  const patchSkin = update => patch({ skin: { ...screen.skin, ...update } });
  const patchSlotAt = (index, update) => patch({ slots: screen.slots.map((slot, i) => (i === index ? { ...slot, ...update } : slot)) });
  const patchAnchorAt = (index, update) => patchSlotAt(index, { anchor: { ...screen.slots[index].anchor, ...update } });
  const addSlot = () => patch({ slots: [...screen.slots, { slot_id: `slot_${screen.slots.length + 1}`, label: '', anchor: { horizontal: 'center', vertical: 'bottom', offset_x: 0, offset_y: 12 }, width: 320 }] });
  const removeSlotAt = index => patch({ slots: screen.slots.filter((_, i) => i !== index) });

  return <div className="mx-auto grid max-w-5xl items-start gap-3 lg:grid-cols-2">
    <div>
      <Section title="基础">
        <TextField label="Screen ID" value={screen.screen_id} onChange={screen_id => patch({ screen_id })} />
        <TextField label="显示名" value={screen.label} onChange={label => patch({ label })} />
        <TextField label="说明" value={screen.description} onChange={description => patch({ description })} />
      </Section>
      <Section title="皮肤（Mod 换肤只改这里）">
        <TextField label="面板背景" value={screen.skin.panel_background} onChange={panel_background => patchSkin({ panel_background })} hint="CSS 颜色，支持带透明度的 HEX" />
        <TextField label="面板边框" value={screen.skin.panel_border} onChange={panel_border => patchSkin({ panel_border })} />
        <TextField label="标题文字色" value={screen.skin.header_text_color} onChange={header_text_color => patchSkin({ header_text_color })} />
        <TextField label="强调色" value={screen.skin.accent_color} onChange={accent_color => patchSkin({ accent_color })} />
        <NumberField label="圆角(px)" value={screen.skin.corner_radius} onChange={corner_radius => patchSkin({ corner_radius })} />
      </Section>
    </div>
    <Section title="槽位（Mod 改布局只改这里）" right={
      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={addSlot}><Plus className="mr-1 h-3 w-3" />添加槽位</Button>
    }>
      {screen.slots.length === 0 && <p className="text-[10px] text-gray-500">尚无槽位。槽位只描述位置与尺寸，挂什么面板由选中路由决定。</p>}
      {screen.slots.map((slot, index) => (
        <div key={index} className="rounded border border-[#2A2E37] p-2 space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1"><TextField label="Slot ID" value={slot.slot_id} onChange={slot_id => patchSlotAt(index, { slot_id })} /></div>
            <div className="flex-1"><TextField label="显示名" value={slot.label} onChange={label => patchSlotAt(index, { label })} /></div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => removeSlotAt(index)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <SelectField label="水平" value={slot.anchor.horizontal} options={HORIZONTAL_OPTIONS} onChange={horizontal => patchAnchorAt(index, { horizontal })} />
            <SelectField label="垂直" value={slot.anchor.vertical} options={VERTICAL_OPTIONS} onChange={vertical => patchAnchorAt(index, { vertical })} />
            <NumberField label="偏移X" value={slot.anchor.offset_x} onChange={offset_x => patchAnchorAt(index, { offset_x })} />
            <NumberField label="偏移Y" value={slot.anchor.offset_y} onChange={offset_y => patchAnchorAt(index, { offset_y })} />
            <NumberField label="宽度" value={slot.width} onChange={width => patchSlotAt(index, { width })} />
          </div>
        </div>
      ))}
    </Section>
  </div>;
}
