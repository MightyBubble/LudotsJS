import React from 'react';
import { SelectField } from '@/components/ludots/ui';
import VectorField from './VectorField';

export default function PerformerTransformEditor({ behaviors, selectedSlot, onSelectSlot, onChange, compact = false }) {
  const options = behaviors.map((behavior, index) => ({ value: String(index), label: behavior.slot || `AssetBinding ${index + 1}` }));
  const index = Number(selectedSlot || 0);
  const behavior = behaviors[index];
  if (!behavior) return <p className="text-xs text-gray-500">当前节点没有可变换的 AssetBinding。</p>;
  const asset = behavior.assetBinding || {};
  const patchAsset = next => onChange(behaviors.map((item, itemIndex) => itemIndex === index
    ? { ...item, assetBinding: { ...(item.assetBinding || {}), ...next } }
    : item));
  return (
    <div className="space-y-3">
      {options.length > 1 && <SelectField label="编辑对象" value={String(index)} options={options} onChange={onSelectSlot} />}
      <div className={`grid grid-cols-1 gap-3 ${compact ? '' : 'xl:grid-cols-3'}`}>
        <VectorField label="位置 XYZ" length={3} value={asset.localOffset || [0, 0, 0]} onChange={localOffset => patchAsset({ localOffset })} />
        <VectorField label="旋转 XYZ（度）" length={3} value={asset.localRotation || [0, 0, 0]} onChange={localRotation => patchAsset({ localRotation })} />
        <VectorField label="缩放 XYZ" length={3} value={asset.localScale || [1, 1, 1]} onChange={localScale => patchAsset({ localScale })} />
      </div>
    </div>
  );
}