import React, { useState } from 'react';
import { Archive, Loader2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const LABELS = { prefab: 'Prefab', material: '材质', texture: '贴图', model: '模型', audio: '音频', script: '脚本', other: '其他' };

export default function UnityPackageImport() {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [manifest, setManifest] = useState(null);
  const inspect = async (file) => {
    if (!file) return;
    setBusy('upload'); setError(''); setManifest(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBusy('parse');
      const response = await base44.functions.invoke('parseUnityPackage', { fileUrl: file_url, fileName: file.name });
      setManifest(response.data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || '解析失败');
    }
    setBusy('');
  };
  return <Dialog><DialogTrigger asChild><Button size="sm" variant="outline"><Archive />导入 UnityPackage</Button></DialogTrigger>
    <DialogContent className="max-w-3xl max-h-[82vh] overflow-hidden flex flex-col">
      <DialogHeader><DialogTitle>Unity Shuriken 资源包</DialogTitle><DialogDescription>上传后仅解析并预览目录，不会写入素材库。</DialogDescription></DialogHeader>
      <label className="flex items-center justify-center gap-2 min-h-20 rounded border border-dashed border-input bg-muted/40 text-sm cursor-pointer hover:bg-muted">
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}{busy === 'upload' ? '正在上传…' : busy === 'parse' ? '正在解析资源包…' : '选择 .unitypackage 文件'}
        <input type="file" className="hidden" accept=".unitypackage" disabled={Boolean(busy)} onChange={e => inspect(e.target.files?.[0])} />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {manifest && <div className="min-h-0 flex flex-col gap-3">
        <div><p className="text-sm font-medium">{manifest.fileName}</p><p className="text-xs text-muted-foreground">共 {manifest.total} 个文件 · {manifest.particleSystems} 个 Shuriken 粒子系统</p></div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">{Object.entries(manifest.counts).map(([key, value]) => <div key={key} className="rounded border bg-card px-2 py-1.5 text-center"><div className="text-base font-semibold">{value}</div><div className="text-[10px] text-muted-foreground">{LABELS[key]}</div></div>)}</div>
        <div className="overflow-y-auto rounded border divide-y divide-border">{manifest.files.map(file => <div key={file.path} className="flex gap-3 px-3 py-2 text-xs"><span className="w-14 shrink-0 text-muted-foreground">{LABELS[file.category]}</span><span className="flex-1 break-all">{file.path}</span>{file.shuriken && <span className="text-primary whitespace-nowrap">{file.particleSystems} 粒子</span>}</div>)}</div>
        {manifest.truncated && <p className="text-xs text-muted-foreground">文件较多，仅展示前 1500 项。</p>}
      </div>}
    </DialogContent>
  </Dialog>;
}