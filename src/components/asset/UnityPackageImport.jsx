import React, { useEffect, useRef, useState } from 'react';
import { Archive, Loader2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { parseUnityPackage } from '@/lib/assets/unityPackageParser';

const LABELS = { prefab: 'Prefab', material: '材质', texture: '贴图', model: '模型', audio: '音频', script: '脚本', other: '其他' };

export default function UnityPackageImport() {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [manifest, setManifest] = useState(null);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  useEffect(() => {
    if (!busy) return undefined;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  const inspect = async (file) => {
    if (!file) return;
    startedAt.current = Date.now();
    setBusy('parse'); setProgress(0); setElapsed(0); setError(''); setManifest(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 250));
      const parsed = await parseUnityPackage(file, setProgress);
      setManifest(parsed); setBusy('upload'); setProgress(90);
      await base44.integrations.Core.UploadFile({ file });
      setProgress(100);
    } catch (e) {
      setError(e?.message || '解析失败');
    }
    setBusy('');
  };
  return <Dialog><DialogTrigger asChild><Button size="sm" variant="outline"><Archive />导入 UnityPackage</Button></DialogTrigger>
    <DialogContent className="max-w-3xl max-h-[82vh] overflow-hidden flex flex-col">
      <DialogHeader><DialogTitle>Unity Shuriken 资源包</DialogTitle><DialogDescription>上传后仅解析并预览目录，不会写入素材库。</DialogDescription></DialogHeader>
      <label className="flex items-center justify-center gap-2 min-h-20 rounded border border-dashed border-input bg-muted/40 text-sm cursor-pointer hover:bg-muted">
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}{busy === 'parse' ? `正在本地解析 ${progress}%` : busy === 'upload' ? '解析完成，正在保存原包…' : '选择 .unitypackage 文件'}
        <input type="file" className="hidden" accept=".unitypackage" disabled={Boolean(busy)} onChange={e => { inspect(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
      {busy && <div className="space-y-1" aria-label="UnityPackage 处理进度">
        <div className="h-2 overflow-hidden rounded bg-muted"><div className={`h-full bg-primary transition-all ${busy === 'upload' ? 'animate-pulse' : ''}`} style={{ width: busy === 'upload' ? '100%' : `${progress}%` }} /></div>
        <p className="text-[11px] text-muted-foreground">{busy === 'parse' ? '正在读取压缩包目录与 Shuriken 配置' : '目录已可预览，正在上传保存原始文件'} · 已用时 {elapsed} 秒</p>
      </div>}
      {error && <p className="text-sm text-red-400">{manifest ? `目录解析成功，但原包保存失败：${error}` : error}</p>}
      {manifest && <div className="min-h-0 flex flex-col gap-3">
        <div><p className="text-sm font-medium">{manifest.fileName}</p><p className="text-xs text-muted-foreground">共 {manifest.total} 个文件 · {manifest.particleSystems} 个 Shuriken 粒子系统</p></div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">{Object.entries(manifest.counts).map(([key, value]) => <div key={key} className="rounded border bg-card px-2 py-1.5 text-center"><div className="text-base font-semibold">{value}</div><div className="text-[10px] text-muted-foreground">{LABELS[key]}</div></div>)}</div>
        <div className="overflow-y-auto rounded border divide-y divide-border">{manifest.files.map(file => <div key={file.path} className="flex gap-3 px-3 py-2 text-xs"><span className="w-14 shrink-0 text-muted-foreground">{LABELS[file.category]}</span><span className="flex-1 break-all">{file.path}</span>{file.shuriken && <span className="text-primary whitespace-nowrap">{file.particleSystems} 粒子</span>}</div>)}</div>
        {manifest.truncated && <p className="text-xs text-muted-foreground">文件较多，仅展示前 1500 项。</p>}
      </div>}
    </DialogContent>
  </Dialog>;
}