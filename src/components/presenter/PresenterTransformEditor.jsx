import React from 'react';
import VectorField from './VectorField';

export default function PresenterTransformEditor({ transform = {}, onChange, compact = false }) {
  const patchTransform = next => onChange({ ...transform, ...next });
  return (
    <div className={`grid grid-cols-1 gap-3 ${compact ? '' : 'xl:grid-cols-3'}`}>
      <VectorField label="位置 XYZ" length={3} value={transform.localPosition || [0, 0, 0]} onChange={localPosition => patchTransform({ localPosition })} />
      <VectorField label="旋转 XYZ（度）" length={3} value={transform.localRotation || [0, 0, 0]} onChange={localRotation => patchTransform({ localRotation })} />
      <VectorField label="缩放 XYZ" length={3} value={transform.localScale || [1, 1, 1]} onChange={localScale => patchTransform({ localScale })} />
    </div>
  );
}
