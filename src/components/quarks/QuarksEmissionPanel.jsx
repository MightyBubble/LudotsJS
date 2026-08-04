import React from 'react';
import QuarksValueField from '@/components/quarks/QuarksValueField';
import QuarksBurstEditor from '@/components/quarks/QuarksBurstEditor';

export default function QuarksEmissionPanel({ ps, patch }) {
  return <div className="space-y-3">
    <QuarksValueField label="每秒发射" value={ps.emissionOverTime} onChange={emissionOverTime => patch({ emissionOverTime })}/>
    <QuarksValueField label="每距离发射" value={ps.emissionOverDistance} onChange={emissionOverDistance => patch({ emissionOverDistance })}/>
    <QuarksBurstEditor value={ps.emissionBursts || []} onChange={emissionBursts => patch({ emissionBursts })}/>
  </div>;
}