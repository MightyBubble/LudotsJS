import React, { useState } from 'react';
import { Image as ImageIcon, Music, Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Section, TextField, SelectField } from '@/components/ludots/ui';
import AudioLibraryImportPanel from '@/components/asset/AudioLibraryImportPanel';

const VOICES = ['river', 'honey', 'sunny', 'storm', 'spark'];
const UPLOAD_CONFIG = {
  image: { title: '图像生成与上传', label: '上传图像', accept: 'image/*' },
  audio: { title: '音频生成与导入', label: '上传音频', accept: 'audio/*' },
  model: { title: '模型文件上传', label: '上传模型（FBX / GLB / GLTF）', accept: '.fbx,.glb,.gltf' },
  animation: { title: '动画文件上传', label: '上传动画（FBX / GLB / GLTF）', accept: '.fbx,.glb,.gltf' },
  particle: { title: '特效源文件', label: '上传特效（Quarks JSON / Effekseer EFK）', accept: '.json,.efk' },
};

/** 资源库内联生成：AI 图像 / 语音音效，以及本地文件（含 FBX / GLB）上传。 */
export default function AssetGenerationPanel({ draft, patch }) {
  const [prompt, setPrompt] = useState('');
  const [voice, setVoice] = useState('river');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const uploadConfig = UPLOAD_CONFIG[draft.asset_type] || { title: '文件上传', label: '上传文件', accept: undefined };

  const run = async (mode) => {
    setBusy(mode); setError('');
    try {
      if (mode === 'image') {
        const { url } = await base44.integrations.Core.GenerateImage({ prompt });
        patch({ name: 'generated-image.png', uri: url, preview_uri: url, source_type: 'generated', asset_type: 'image' });
      } else {
        const { url } = await base44.integrations.Core.GenerateSpeech({ text: prompt, voice });
        patch({ name: 'generated-audio.mp3', uri: url, source_type: 'generated', asset_type: 'audio' });
      }
    } catch (e) {
      setError(e?.message || '生成失败，请稍后重试');
    }
    setBusy('');
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy('upload'); setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      patch({
        name: file.name,
        uri: file_url,
        source_type: 'uploaded',
        asset_type: draft.asset_type,
        metadata: { ...(draft.metadata || {}), source_path: file.name },
      });
    } catch (e) {
      setError(e?.message || '上传失败');
    }
    setBusy('');
  };

  return <><Section title={uploadConfig.title}>
    {(draft.asset_type === 'image' || draft.asset_type === 'audio') && (
      <TextField label={draft.asset_type === 'audio' ? '语音文本' : '生成提示词'} value={prompt} onChange={setPrompt} />
    )}
    <div className="flex flex-wrap items-end gap-3">
      {draft.asset_type === 'image' && <Button size="sm" disabled={!prompt || Boolean(busy)} onClick={() => run('image')} className="h-8 bg-[#1E2128] hover:bg-[#2A2E37]">
        {busy === 'image' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}生成图像
      </Button>}
      {draft.asset_type === 'audio' && <Button size="sm" disabled={!prompt || Boolean(busy)} onClick={() => run('audio')} className="h-8 bg-[#1E2128] hover:bg-[#2A2E37]">
        {busy === 'audio' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Music className="w-3 h-3" />}生成语音
      </Button>}
      {draft.asset_type === 'audio' && <div className="w-40"><SelectField label="语音" value={voice} options={VOICES.map(v => ({ value: v, label: v }))} onChange={setVoice} /></div>}
      <label className="inline-flex items-center gap-2 h-8 px-3 rounded border border-[#2A2E37] bg-[#1E2128] text-xs text-gray-300 cursor-pointer">
        {busy === 'upload' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}{uploadConfig.label}
        <input type="file" className="hidden" accept={uploadConfig.accept} onChange={e => upload(e.target.files?.[0])} />
      </label>
    </div>
    {draft.asset_type === 'particle' && <p className="text-[11px] text-gray-500">上传仅替换源文件；运行后端由关联的特效资产配置决定。</p>}
    {error && <p className="text-[11px] text-red-400">{error}</p>}
  </Section>{draft.asset_type === 'audio' && <AudioLibraryImportPanel />}</>;
}