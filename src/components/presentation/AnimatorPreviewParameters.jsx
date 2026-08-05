import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AnimatorPreviewParameters({ parameters, values, onChange }) {
  if (!parameters.length) return <p className="text-[11px] text-gray-500">该控制器没有 Parameter。</p>;
  return <div className="grid grid-cols-2 gap-2">
    {parameters.map(parameter => <label key={parameter.id} className="flex min-w-0 items-center gap-2 text-[11px] text-gray-400">
      <span className="min-w-0 flex-1 truncate">{parameter.name}</span>
      {parameter.type === 'Bool' && <input aria-label={`Preview parameter ${parameter.name}`} type="checkbox" checked={!!values[parameter.name]} onChange={event => onChange(parameter.name, event.target.checked)} />}
      {parameter.type === 'Trigger' && <Button aria-label={`Preview parameter ${parameter.name}`} size="sm" className="h-7 px-2" onClick={() => onChange(parameter.name, Date.now())}>触发</Button>}
      {(parameter.type === 'Float' || parameter.type === 'Int') && <Input aria-label={`Preview parameter ${parameter.name}`} type="number" step={parameter.type === 'Float' ? 0.1 : 1} value={values[parameter.name] ?? 0} onChange={event => onChange(parameter.name, Number(event.target.value))} className="h-7 w-20 border-[#2A2E37] bg-[#0D0F14] text-xs" />}
    </label>)}
  </div>;
}