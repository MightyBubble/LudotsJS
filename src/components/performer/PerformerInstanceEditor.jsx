import React from 'react';
import { Button } from '@/components/ui/button';
import PerformerInstanceTabs from './PerformerInstanceTabs';

export default function PerformerInstanceEditor({ node, performers, onChange, onRequestInheritedEdit }) {
  if (!node?.instance) return null;
  const editable = onChange && node.source !== 'nested_template';
  return <div className="space-y-3 rounded border border-[#424a55] bg-[#171b21] p-3">
    <div>
      <p className="text-xs font-semibold text-[#dce2e8]">子 Performer 实例</p>
      <p className="mt-1 font-mono text-[10px] text-gray-500">{node.path}</p>
      {node.source === 'nested_template' && <div className="mt-2 space-y-2 rounded border border-amber-900/60 bg-amber-950/30 px-2 py-2 text-[10px] text-amber-200"><p>该节点由嵌套模板拥有，不能直接创建跨模板覆盖。</p><Button size="sm" onClick={onRequestInheritedEdit} className="h-7">选择编辑方式</Button></div>}
      {node.source === 'nested_override' && <p className="mt-2 rounded border border-sky-900/60 bg-sky-950/30 px-2 py-1.5 text-[10px] text-sky-200">当前子实例已 Break；运行时使用当前根 Performer 中的独立副本。</p>}
    </div>
    {editable ? <PerformerInstanceTabs instance={node.instance} performers={performers} onChange={onChange} /> : node.source !== 'nested_template' && <p className="text-[11px] text-gray-500">该实例属于嵌套定义，此处仅选择与预览，不会切换当前父级数据。</p>}
  </div>;
}