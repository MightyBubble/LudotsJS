import React from 'react';
const SHAPES = ['point','circle','sphere','cone','rectangle','grid','hemisphere','donut','mesh_surface'];
const DEFAULTS = { point:{type:'point'}, circle:{type:'circle',radius:1,arc:Math.PI*2,thickness:1}, sphere:{type:'sphere',radius:1,arc:Math.PI*2,thickness:1}, cone:{type:'cone',radius:1,angle:Math.PI/6,arc:Math.PI*2,thickness:1}, rectangle:{type:'rectangle',width:1,height:1}, grid:{type:'grid',width:1,height:1,column:4,row:4}, hemisphere:{type:'hemisphere',radius:1,thickness:1}, donut:{type:'donut',radius:1,donutRadius:0.25,arc:Math.PI*2}, mesh_surface:{type:'mesh_surface'} };
const FIELDS = { circle:['radius','arc','thickness'], sphere:['radius','arc','thickness'], cone:['radius','angle','arc','thickness'], rectangle:['width','height'], grid:['width','height','column','row'], hemisphere:['radius','thickness'], donut:['radius','donutRadius','arc'] };
export default function QuarksShapePanel({ ps, patch }) {
  const shape = ps.shape || DEFAULTS.point; const change = next => patch({ shape: next });
  return <div className="space-y-3"><label className="block text-[10px] text-gray-400">发射形状<select aria-label="发射形状" value={shape.type} onChange={e => change(DEFAULTS[e.target.value])} className="mt-1 h-8 w-full rounded border border-[#424A55] bg-[#0D0F14] px-2 text-xs">{SHAPES.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-2">{(FIELDS[shape.type] || []).map(field => <label key={field} className="text-[10px] text-gray-400">{field}<input aria-label={`形状${field}`} type="number" step="any" value={shape[field] ?? 0} onChange={e => change({ ...shape, [field]: Number(e.target.value) })} className="mt-1 h-8 w-full rounded border border-[#424A55] bg-[#0D0F14] px-2 text-xs"/></label>)}</div>
    {shape.type === 'mesh_surface' && <p className="text-[11px] text-gray-500">网格表面引用保留在原始 JSON 中，可在高级面板编辑。</p>}
  </div>;
}