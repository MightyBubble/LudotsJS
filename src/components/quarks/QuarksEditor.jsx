import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useQuarksEditor from '@/hooks/useQuarksEditor';
import { updateMaterial } from '@/lib/quarks/quarksDocument';
import VfxPreview from '@/components/asset/VfxPreview';
import QuarksEmitterList from '@/components/quarks/QuarksEmitterList';
import QuarksInspector from '@/components/quarks/QuarksInspector';
export default function QuarksEditor({ asset, effect }) {
  const editor = useQuarksEditor(asset, effect);
  if (editor.status === 'loading') return <div className="flex h-40 items-center justify-center gap-2 text-xs text-gray-500"><Loader2 className="h-4 w-4 animate-spin"/>读取 Quarks 文档…</div>;
  if (!editor.document || !editor.selected) return <p className="p-4 text-xs text-red-400">{editor.error || '无法读取 Quarks 文档'}</p>;
  const material = (editor.document.materials || []).find(item => item.uuid === editor.selected.ps.material);
  const patchMaterial = patch => editor.changeDocument(updateMaterial(editor.document, editor.selected.ps.material, patch));
  return <div className="overflow-hidden rounded border border-[#2A2E37] bg-[#0D0F14]"><div className="flex items-center justify-between border-b border-[#2A2E37] bg-[#15171C] px-3 py-2"><div><h3 className="text-xs font-semibold text-gray-200">Quarks 粒子编辑器</h3><p className="text-[10px] text-gray-500">原生 v2 JSON · {editor.emitters.length} 个发射器 · 实时预览</p></div><Button size="sm" disabled={!editor.dirty || editor.status === 'saving'} onClick={editor.save} className="h-8 gap-1">{editor.status === 'saving' ? <Loader2 className="h-3 w-3 animate-spin"/> : <Save className="h-3 w-3"/>}保存特效</Button></div>
    {editor.error && <p className="border-b border-red-900/40 bg-red-950/20 px-3 py-2 text-[11px] text-red-400">{editor.error}</p>}
    <div className="flex flex-col md:flex-row"><QuarksEmitterList emitters={editor.emitters} selectedUuid={editor.selectedUuid} onSelect={editor.setSelectedUuid}/><QuarksInspector editor={editor} material={material} patchMaterial={patchMaterial}/><aside className="w-full shrink-0 border-t border-[#2A2E37] p-3 md:w-[360px] md:border-l md:border-t-0"><VfxPreview asset={{ asset_id: asset.asset_id, backend: 'quarks', source_uris: [asset.uri], source_json: editor.document }}/></aside></div>
  </div>;
}