import React, { useState } from 'react';
import { Image as ImageIcon, Music, Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Section, TextField, SelectField } from '@/components/ludots/ui';

const VOICES = ['river', 'honey', 'sunny', 'storm', 'spark'];

/** 资源库内联生成：AI 图像 / 语音音效，以及本地文件（含 FBX / GLB）上传。 */
export default function AssetGenerationPanel({ draft, patch }) {
  const [prompt, setPrompt] = useState('');
  const [voice, setVoice] = useState('river');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const run = async (mode) => {
    setBusy(mode); setError('');
    try {
      if (mode === 'image') {
        const { url } = await base44.integrations.Core.GenerateImage({ prompt });
        patch({ uri: url, preview_uri: url, source_type: 'generated', asset_type: 'image' });
      } else {
        const { url } = await base44.integrations.Core.GenerateSpeech({ text: prompt, voice });
        patch({ uri: url, source_type: 'generated', asset_type: 'audio' });
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
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const type = ['fbx', 'glb', 'gltf'].includes(ext) ? 'model' : ['mp3', 'wav', 'ogg'].includes(ext) ? 'audio' : draft.asset_type;
      patch({ uri: file_url, source_type: 'uploaded', asset_type: type });
    } catch (e) {
      setError(e?.message || '上传失败');
    }
    setBusy('');
  };

  return <Section title="生成与导入">
    <TextField label={draft.asset_type === 'audio' ? '语音文本' : '生成提示词'} value={prompt} onChange={setPrompt} />
    <div className="flex flex-wrap items-end gap-3">
      <Button size="sm" disabled={!prompt || Boolean(busy)} onClick={() => run('image')} className="h-8 bg-[#1E2128] hover:bg-[#2A2E37]">
        {busy === 'image' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}生成图像
      </Button>
      <Button size="sm" disabled={!prompt || Boolean(busy)} onClick={() => run('audio')} className="h-8 bg-[#1E2128] hover:bg-[#2A2E37]">
        {busy === 'audio' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Music className="w-3 h-3" />}生成音效
      </Button>
      <div className="w-40"><SelectField label="语音" value={voice} options={VOICES.map(v => ({ value: v, label: v }))} onChange={setVoice} /></div>
      <label className="inline-flex items-center gap-2 h-8 px-3 rounded border border-[#2A2E37] bg-[#1E2128] text-xs text-gray-300 cursor-pointer">
        {busy === 'upload' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}上传文件（FBX / GLB / 图像 / 音频）
        <input type="file" className="hidden" accept=".fbx,.glb,.gltf,image/*,audio/*" onChange={e => upload(e.target.files?.[0])} />
      </label>
    </div>
    <p className="text-[11px] text-gray-500">生成或上传后会自动填入资源地址与来源类型；模型文件会切换为 model 类型并在下方预览。</p>
    {error && <p className="text-[11px] text-red-400">{error}</p>}
  </Section>;
}