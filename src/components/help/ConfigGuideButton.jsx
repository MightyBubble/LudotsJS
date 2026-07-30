import React from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ConfigGuideButton({ guide }) {
  return <Dialog>
    <DialogTrigger asChild><button type="button" aria-label={`${guide.title}说明`} title={`${guide.title}说明`} className="flex h-8 w-8 items-center justify-center rounded border border-border bg-secondary text-secondary-foreground hover:bg-accent"><Info className="h-4 w-4" /></button></DialogTrigger>
    <DialogContent className="max-h-[85vh] min-w-0 w-[calc(100%-1rem)] max-w-3xl overflow-x-hidden overflow-y-auto bg-popover text-popover-foreground [&>*]:min-w-0">
      <DialogHeader><DialogTitle className="break-words pr-6">{guide.title}</DialogTitle><DialogDescription className="break-words leading-6">{guide.description}</DialogDescription></DialogHeader>
      <div><h3 className="mb-2 text-sm font-semibold">主要作用</h3><ul className="space-y-1 break-words text-sm text-muted-foreground">{guide.points.map(point => <li key={point}>• {point}</li>)}</ul></div>
      <div><h3 className="mb-2 text-sm font-semibold">字段行为与功能结果</h3><div className="space-y-2">{guide.fields.map(field => <div key={field.name} className="min-w-0 rounded border border-border bg-background p-3"><div className="break-all font-mono text-xs font-semibold text-foreground">{field.name}</div><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">行为：{field.behavior}</p><p className="break-words text-xs leading-5 text-foreground">结果：{field.result}</p></div>)}</div></div>
      <div><h3 className="mb-2 text-sm font-semibold">配置方案与可获得功能</h3><div className="space-y-2">{guide.recipes.map(recipe => <div key={recipe.title} className="min-w-0 rounded border border-border bg-background p-3"><div className="break-words text-sm font-medium">{recipe.title}</div><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">配置：{recipe.setup}</p><p className="break-words text-xs leading-5 text-foreground">获得功能：{recipe.result}</p></div>)}</div></div>
      <div><h3 className="mb-2 text-sm font-semibold">示例配置</h3><pre className="whitespace-pre-wrap break-all rounded border border-border bg-background p-3 text-xs leading-5 text-foreground">{JSON.stringify(guide.example, null, 2)}</pre></div>
    </DialogContent>
  </Dialog>;
}