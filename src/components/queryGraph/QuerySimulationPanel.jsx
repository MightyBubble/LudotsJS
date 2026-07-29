import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { executeQueryGraph, simulatedEntitiesToRuntime } from '@/lib/queryRuntime';
import { getNodeLabel } from '@/components/graph/nodeConfigs';

export default function QuerySimulationPanel({ nodes, connections }) {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['simulatedEntities'],
    queryFn: () => base44.entities.SimulatedEntity.list(),
  });

  const dbEntities = useMemo(() => simulatedEntitiesToRuntime(records), [records]);
  const [entitiesText, setEntitiesText] = useState('');
  const [runToken, setRunToken] = useState(0);

  useEffect(() => {
    if (dbEntities.length > 0) setEntitiesText(JSON.stringify(dbEntities, null, 2));
  }, [dbEntities]);

  const { result, parseError } = useMemo(() => {
    let entities;
    try {
      entities = JSON.parse(entitiesText || '[]');
      if (!Array.isArray(entities)) throw new Error('必须是数组');
    } catch (e) {
      return { result: null, parseError: e.message };
    }
    return { result: executeQueryGraph({ nodes, connections }, entities), parseError: null };
  }, [entitiesText, nodes, connections, runToken]);

  return (
    <div className="w-72 bg-[#15171C] border-l border-[#2A2E37] p-3 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#e5e5e5]">查询模拟</h3>
        <div className="flex gap-1">
          <Button size="sm" className="h-6 px-2 bg-[#0D0F14] hover:bg-[#2A2E37] text-xs text-gray-400"
            title="恢复为数据库中的模拟实体"
            onClick={() => setEntitiesText(JSON.stringify(dbEntities, null, 2))}>
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button size="sm" className="h-6 px-2 bg-[#D97706] hover:bg-[#B45309] text-black text-xs"
            onClick={() => setRunToken(t => t + 1)}>
            <Play className="w-3 h-3 mr-1" />运行
          </Button>
        </div>
      </div>

      <div className="text-[10px] text-gray-500 mb-1">
        模拟实体集 (来自 SimulatedEntity，共 {dbEntities.length} 个)
      </div>
      {isLoading ? (
        <div className="text-xs text-gray-600">加载中...</div>
      ) : (
        <textarea
          value={entitiesText}
          onChange={(e) => setEntitiesText(e.target.value)}
          spellCheck={false}
          className="w-full h-40 bg-[#0D0F14] border border-[#2A2E37] rounded p-2 text-[10px] font-mono text-[#e5e5e5] resize-y"
        />
      )}
      {parseError && <div className="text-[10px] text-red-400 mt-1">JSON 错误：{parseError}</div>}
      {!isLoading && dbEntities.length === 0 && (
        <div className="text-[10px] text-gray-500 mt-1">数据库中暂无模拟实体，请先添加 SimulatedEntity 记录。</div>
      )}

      {result && (
        <>
          <div className="text-[10px] text-gray-500 mt-4 mb-1">各节点结果</div>
          <div className="space-y-1">
            {nodes.length === 0 && <div className="text-xs text-gray-600">暂无节点</div>}
            {nodes.map(node => {
              const out = result.nodeResults[node.id] || [];
              const isOutput = result.outputNodeId === node.id;
              return (
                <div key={node.id} className={`bg-[#0D0F14] rounded border p-2 text-[10px] ${isOutput ? 'border-[#D97706]' : 'border-[#2A2E37]'}`}>
                  <div className="flex justify-between text-gray-400">
                    <span>{getNodeLabel(node.type)}</span>
                    <span className="font-mono text-[#E2D8B3]">{out.length}</span>
                  </div>
                  {out.length > 0 && (
                    <div className="text-gray-600 mt-0.5 truncate">
                      {out.map(e => e.name || e.id).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-gray-500 mt-4 mb-1">最终输出 ({result.output.length})</div>
          <div className="bg-[#0D0F14] border border-[#2A2E37] rounded p-2 text-[10px] text-[#E2D8B3] font-mono break-words">
            {result.output.length === 0 ? '空' : result.output.map(e => e.name || e.id).join(', ')}
          </div>
        </>
      )}
    </div>
  );
}