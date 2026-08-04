import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ludots/ui';
import { buildGeneratedQuarks } from '@/lib/quarks/quarksGenerator';
const DEFAULT_PROMPT = '二次元风格的黑白闪核爆：瞬时白闪、墨线冲击环、蘑菇云、放射速度线与黑色碎屑';
export default function QuarksGeneratorPanel({ asset, templateUri, patch }) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT); const [busy, setBusy] = useState(''); const [message, setMessage] = useState(''); const queryClient = useQueryClient();
  const generate = async () => { setBusy('正在设计分镜'); setMessage(''); try {
    const spec = await base44.integrations.Core.InvokeLLM({ prompt: `为原创游戏特效生成结构化美术规格，不模仿任何具体作品或工作室。需求：${prompt}。输出贴图提示词必须是纯黑背景、白灰发光图形、2x2粒子图集、无文字。`, response_json_schema: { type: 'object', properties: { name: { type: 'string' }, texture_prompt: { type: 'string' }, duration: { type: 'number' }, intensity: { type: 'number' } }, required: ['name','texture_prompt','duration','intensity'] } });
    setBusy('正在生成粒子贴图'); const { url } = await base44.integrations.Core.GenerateImage({ prompt: `${spec.texture_prompt}. Pure black background, monochrome white and gray only, 2x2 isolated particle sprite atlas, generous padding, no text, no border, no scenery.` });
    setBusy('正在构建 Quarks'); const template = await (await fetch(templateUri)).json(); const document = buildGeneratedQuarks(template, url, spec); const file = new File([JSON.stringify(document)], `${asset.asset_id}.json`, { type: 'application/json' }); const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const assetData = { name: `${spec.name}.quarks.json`, description: prompt, uri: file_url, preview_uri: url, source_type: 'generated', tags: [...new Set([...(asset.tags || []), 'quarks', 'ai-generated', 'monochrome'])], metadata: { ...(asset.metadata || {}), package_label: 'AI 特效', generation_prompt: prompt, texture_uri: url } }; await base44.entities.Asset.update(asset.id, assetData);
    const effects = await base44.entities.PresentationEffectAsset.filter({ asset_id: asset.asset_id }); const effectData = { asset_id: asset.asset_id, backend: 'quarks', source_uris: [file_url], config: { generation_prompt: prompt, texture_uri: url }, loop: false, scale: 1 }; if (effects[0]) await base44.entities.PresentationEffectAsset.update(effects[0].id, effectData); else await base44.entities.PresentationEffectAsset.create(effectData);
    const bindings = await base44.entities.HostAssetBinding.filter({ asset_id: asset.asset_id }); const bindingData = { binding_id: `Host.Browser.${asset.asset_id}`, asset_kind: 'Vfx', asset_id: asset.asset_id, backend_id: 'browser-quarks', source_uris: [file_url], editor_asset_id: asset.asset_id }; if (bindings[0]) await base44.entities.HostAssetBinding.update(bindings[0].id, bindingData); else await base44.entities.HostAssetBinding.create(bindingData);
    patch(assetData); await Promise.all(['assets','presentation-effects'].map(key => queryClient.invalidateQueries({ queryKey: [key] }))); setMessage('已生成并保存，可在下方继续微调。');
  } catch (error) { setMessage(error?.message || '生成失败'); } finally { setBusy(''); } };
  return <Section title="AI Quarks 生成器"><textarea aria-label="特效描述" value={prompt} onChange={event => setPrompt(event.target.value)} rows={3} className="w-full rounded border border-[#424A55] bg-[#0D0F14] p-2 text-xs text-gray-200"/><div className="flex items-center gap-3"><Button size="sm" disabled={!prompt.trim() || !templateUri || Boolean(busy)} onClick={generate}>{busy ? <Loader2 className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3"/>}{busy || '生成完整特效'}</Button><span className="text-[11px] text-gray-500">AI 分镜 · 2×2 粒子图集 · 亮度抠图 · 原生 Quarks JSON</span></div>{message && <p className="text-[11px] text-gray-300">{message}</p>}</Section>;
}