import React from 'react';
import { Input } from '@/components/ui/input';
import useEditorMeta from '@/components/assetBrowser/useEditorMeta';
import { graphTypeLabel } from './graphLabels';

export default function GraphMetaPanel({ graph }) {
  const meta = useEditorMeta('Graph');

  return (
    <div className="p-3 space-y-3">
      <div>
        <label className="text-[10px] text-gray-500 block mb-1">名称</label>
        <div className="text-sm text-[#E2D8B3] font-medium">{graph.name}</div>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 block mb-1">类型</label>
        <div className="text-xs text-gray-400">
          {graphTypeLabel(graph)}
          {graph.entity_type === 'DataGraph' && ` · 出口 ${graph.return_type || 'number'}`}
        </div>
      </div>
      {graph.description && (
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">描述</label>
          <p className="text-xs text-gray-400 leading-relaxed">{graph.description}</p>
        </div>
      )}
      <div>
        <label className="text-[10px] text-gray-500 block mb-1">虚拟目录（用 / 分隔）</label>
        <Input
          key={graph.id}
          defaultValue={meta.getCategory(graph.id)}
          placeholder="例如 曲线/属性成长"
          onBlur={(e) => meta.setCategory(graph.id, e.target.value.trim())}
          className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-[#e5e5e5]"
        />
      </div>
    </div>
  );
}