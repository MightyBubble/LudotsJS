import React from 'react';
import VectorField from './VectorField';

export default function PerformerTransformEditor({ transform = {}, onChange, compact = false }) {
  const patchTransform = next => onChange({ ...transform, ...next });
  return (
    <div className={`grid grid-cols-1 gap-3 ${compact ? '' : 'xl:grid-cols-3'}`}>
      <VectorField label="位置 XYZ" length={3} value={transform.local_position || [0, 0, 0]} onChange={local_position => patchTransform({ local_position })} />
      <VectorField label="旋转 XYZ（度）" length={3} value={transform.local_rotation || [0, 0, 0]} onChange={local_rotation => patchTransform({ local_rotation })} />
      <VectorField label="缩放 XYZ" length={3} value={transform.local_scale || [1, 1, 1]} onChange={local_scale => patchTransform({ local_scale })} />
    </div>
  );
}