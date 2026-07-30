import React from 'react';
import { X } from 'lucide-react';

export default function ConfigGuideSidebar({ guide, onClose }) {
  return <aside aria-label={`${guide.title}字段说明`} className="h-full w-full shrink-0 overflow-y-auto border-l border-border bg-popover md:w-[380px]">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-popover p-4">
      <div><h2 className="text-sm font-semibold text-popover-foreground">字段对照</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{guide.description}</p></div>
      <button type="button" onClick={onClose} aria-label="关闭字段说明" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"><X className="h-4 w-4" /></button>
    </div>
    <div className="space-y-3 p-4">
      {guide.fields.map((field, index) => <section key={field.name} className="rounded border border-border bg-background p-3">
        <div className="flex items-start gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary text-[10px] text-secondary-foreground">{index + 1}</span><code className="break-all text-xs font-semibold text-foreground">{field.name}</code></div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{field.behavior}</p>
        <p className="mt-1 text-xs leading-5 text-foreground">结果：{field.result}</p>
      </section>)}
      <div className="border-t border-border pt-3"><h3 className="mb-2 text-xs font-semibold text-foreground">配置方案</h3>{guide.recipes.map(recipe => <div key={recipe.title} className="mb-2 rounded border border-border bg-background p-3"><div className="text-xs font-medium text-foreground">{recipe.title}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{recipe.setup}</p><p className="mt-1 text-xs leading-5 text-foreground">{recipe.result}</p></div>)}</div>
    </div>
  </aside>;
}