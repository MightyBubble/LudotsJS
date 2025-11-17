import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ParameterSourceEditor from './ParameterSourceEditor';

const PRESET_CONDITIONS = {
  equals: { label: '等于', needsParam2: true, allowTag: false },
  not_equals: { label: '不等于', needsParam2: true, allowTag: false },
  greater_than: { label: '大于', needsParam2: true, allowTag: false },
  less_than: { label: '小于', needsParam2: true, allowTag: false },
  greater_equal: { label: '大于等于', needsParam2: true, allowTag: false },
  less_equal: { label: '小于等于', needsParam2: true, allowTag: false },
  contains_tag: { label: '包含标签', needsParam2: false, allowTag: true },
  not_contains_tag: { label: '不包含标签', needsParam2: false, allowTag: true },
  has_attribute_value: { label: '拥有属性值', needsParam2: false, allowTag: false },
  is_empty: { label: '为空', needsParam2: false, allowTag: false },
  is_not_empty: { label: '不为空', needsParam2: false, allowTag: false },
};

export default function PresetConditionEditor({ config, onChange }) {
  const presetConfig = config || { preset_name: 'equals', param1_source: null, param2_source: null };
  const currentPreset = PRESET_CONDITIONS[presetConfig.preset_name] || PRESET_CONDITIONS.equals;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/70 mb-1.5 block">预设类型</label>
        <Select
          value={presetConfig.preset_name}
          onValueChange={(val) => onChange({ ...presetConfig, preset_name: val })}
        >
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            {Object.entries(PRESET_CONDITIONS).map(([key, { label }]) => (
              <SelectItem key={key} value={key} className="text-white text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ParameterSourceEditor
        label="参数1"
        value={presetConfig.param1_source}
        onChange={(val) => onChange({ ...presetConfig, param1_source: val })}
        allowEntityTag={currentPreset.allowTag}
      />

      {currentPreset.needsParam2 && (
        <ParameterSourceEditor
          label="参数2"
          value={presetConfig.param2_source}
          onChange={(val) => onChange({ ...presetConfig, param2_source: val })}
          allowEntityTag={false}
        />
      )}
    </div>
  );
}