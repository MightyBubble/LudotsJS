import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StructurePropsPanel({
  nodes,
  connections,
  relations,
  editingNodeId,
  onUpdateNodeData,
  onDeleteNode,
  onDeleteConnection,
  onUpdateConnections,
  onClearEditing
}) {
  const node = editingNodeId ? nodes.find(n => n.id === editingNodeId) : null;

  if (node) {
    return (
      <div className="p-3 space-y-3">
        <div className="text-[10px] text-gray-500">编辑节点</div>
        {[
          { key: 'nodeId', label: '节点ID' },
          { key: 'label', label: '显示名称' },
          { key: 'description', label: '描述' }
        ].map(f => (
          <div key={f.key}>
            <label className="text-[10px] text-gray-500 block mb-1">{f.label}</label>
            <Input
              value={node.data[f.key] || ''}
              onChange={e => onUpdateNodeData(node.id, { [f.key]: e.target.value })}
              className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-[#e5e5e5]"
            />
          </div>
        ))}
        <Button
          className="w-full bg-red-900/20 hover:bg-red-900/40 text-xs h-7 text-red-400"
          onClick={() => { onDeleteNode(node.id); onClearEditing(); }}
        >
          删除节点
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <div className="text-[10px] text-gray-500">连接列表 ({connections.length})</div>
      {connections.length === 0 && <div className="text-xs text-gray-600">暂无连接</div>}
      {connections.map(conn => {
        const from = nodes.find(n => n.id === conn.fromNode)?.data?.label || 'Unknown';
        const to = nodes.find(n => n.id === conn.toNode)?.data?.label || 'Unknown';
        return (
          <div key={conn.id} className="bg-[#0D0F14] p-2 rounded border border-[#2A2E37] text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">{from} → {to}</span>
              <button onClick={() => onDeleteConnection(conn.id)} className="text-red-400 hover:text-white">×</button>
            </div>
            <Select
              value={conn.data?.relation_definition_id || ''}
              onValueChange={v => onUpdateConnections(
                connections.map(c => c.id === conn.id ? { ...c, data: { ...c.data, relation_definition_id: v } } : c)
              )}
            >
              <SelectTrigger className="h-6 bg-[#15171C] border-[#2A2E37] text-xs w-full text-[#e5e5e5]">
                <SelectValue placeholder="选择关系" />
              </SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                {relations.map(r => (
                  <SelectItem key={r.id} value={r.relation_id} className="text-xs text-[#e5e5e5]">{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}