import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus } from "lucide-react";

// Mock Data Graph 执行器
function mockExecuteDataGraph(graphId, blackboard, dataGraphs) {
  const graph = dataGraphs.find(g => g.graph_id === graphId);
  if (!graph) return 0;

  try {
    const graphDef = typeof graph.graph_definition === 'string' 
      ? JSON.parse(graph.graph_definition) 
      : graph.graph_definition;
    
    const graphBlackboard = { ...(graphDef.blackboard || {}) };
    
    // 合并外部黑板值
    Object.keys(graphBlackboard).forEach(key => {
      if (blackboard[key] !== undefined) {
        graphBlackboard[key] = { ...graphBlackboard[key], value: blackboard[key] };
      }
    });

    // 简单计算逻辑（模拟节点执行）
    const nodes = graphDef.nodes || [];
    const outputNode = nodes.find(n => n.type && n.type.startsWith('output_'));
    
    if (!outputNode) return 0;
    
    // 简化：假设输出节点连接到一个计算结果
    // 这里做一个简单的模拟：base + growth * level
    const base = graphBlackboard.base_value?.value || graphBlackboard.hero_level?.value || 0;
    const growth = graphBlackboard.growth_per_level?.value || 0;
    const level = graphBlackboard.hero_level?.value || graphBlackboard.skill_level?.value || graphBlackboard.buff_stacks?.value || 1;
    
    return base + (growth * level);
  } catch (e) {
    console.error('Graph execution error:', e);
    return 0;
  }
}

export default function NewAttributeSimulatorPage() {
  const [heroLevel, setHeroLevel] = useState(10);
  const [tagCounts, setTagCounts] = useState({});

  const { data: modifiers = [] } = useQuery({
    queryKey: ['modifierDefinitions'],
    queryFn: () => base44.entities.ModifierDefinition.list(),
    initialData: [],
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

  const { data: dataGraphs = [] } = useQuery({
    queryKey: ['dataGraphs'],
    queryFn: () => base44.entities.DataGraph.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  // 收集所有需要的标签
  const requiredTags = useMemo(() => {
    const tagSet = new Set();
    modifiers.forEach(mod => {
      (mod.curve_input_mappings || []).forEach(mapping => {
        if (mapping.source_type === 'tag_count' && mapping.tag_path) {
          tagSet.add(mapping.tag_path);
        }
      });
    });
    return Array.from(tagSet);
  }, [modifiers]);

  // 初始化标签计数
  useMemo(() => {
    const counts = {};
    requiredTags.forEach(tag => {
      if (tagCounts[tag] === undefined) {
        counts[tag] = tag.includes('LevelUp') ? heroLevel : 0;
      }
    });
    if (Object.keys(counts).length > 0) {
      setTagCounts(prev => ({ ...prev, ...counts }));
    }
  }, [requiredTags]);

  // 计算属性的中间键值
  const attributeKeyValues = useMemo(() => {
    const result = {};
    
    attributes.forEach(attr => {
      const keyValues = {};
      
      // 初始化所有键
      (attr.keys || []).forEach(key => {
        if (key.type === 'value') {
          keyValues[key.name] = key.name.includes('base') ? attr.default_base_value : 0;
        } else {
          keyValues[key.name] = [];
        }
      });

      // 处理修饰器输出
      modifiers.filter(m => m.is_active && m.target_attribute_id === attr.attribute_id).forEach(mod => {
        const blackboard = {};
        
        // 构建曲线图输入
        (mod.curve_input_mappings || []).forEach(mapping => {
          const bbKey = mapping.graph_blackboard_key;
          
          if (mapping.source_type === 'tag_count') {
            const count = tagCounts[mapping.tag_path] || 0;
            blackboard[bbKey] = Math.floor(count / (mapping.step_size || 1));
          } else if (mapping.source_type === 'constant') {
            blackboard[bbKey] = mapping.constant_value || 0;
          } else if (mapping.source_type === 'attribute_key') {
            const sourceAttr = attributes.find(a => a.attribute_id === mapping.attribute_id);
            if (sourceAttr) {
              const sourceKeyValues = result[sourceAttr.attribute_id];
              if (sourceKeyValues && sourceKeyValues[mapping.attribute_key] !== undefined) {
                blackboard[bbKey] = sourceKeyValues[mapping.attribute_key];
              }
            }
          }
        });

        // 执行曲线图计算
        const magnitude = mockExecuteDataGraph(mod.curve_data_graph_id, blackboard, dataGraphs);
        
        // 输出到目标键
        const outputKey = mod.output_key;
        const targetKey = (attr.keys || []).find(k => k.name === outputKey);
        
        if (targetKey) {
          if (targetKey.type === 'array') {
            if (!keyValues[outputKey]) keyValues[outputKey] = [];
            keyValues[outputKey].push(magnitude);
          } else {
            keyValues[outputKey] = (keyValues[outputKey] || 0) + magnitude;
          }
        }
      });
      
      result[attr.attribute_id] = keyValues;
    });
    
    return result;
  }, [attributes, modifiers, tagCounts, dataGraphs]);

  // 计算最终属性值
  const finalAttributeValues = useMemo(() => {
    const results = {};
    
    attributes.forEach(attr => {
      const keyValues = attributeKeyValues[attr.attribute_id] || {};
      const blackboard = {};
      
      // 映射键到黑板
      Object.entries(attr.input_mappings || {}).forEach(([graphKey, attrKey]) => {
        blackboard[graphKey] = keyValues[attrKey];
      });
      
      // 执行最终计算图
      results[attr.attribute_id] = mockExecuteDataGraph(
        attr.final_calculation_data_graph_id,
        blackboard,
        dataGraphs
      );
    });
    
    return results;
  }, [attributes, attributeKeyValues, dataGraphs]);

  const updateTagCount = (tag, value) => {
    setTagCounts(prev => ({ ...prev, [tag]: parseFloat(value) || 0 }));
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Calculator className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">属性模拟器</span>
        <span className="text-xs text-gray-500">{attributes.length}个属性 | {modifiers.filter(m => m.is_active).length}个激活修饰器</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：输入控制 */}
        <div className="w-64 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          <div className="p-3 border-b border-[#3d3d3d]">
            <span className="text-xs font-semibold text-gray-400">模拟器输入</span>
          </div>
          
          <div className="flex-1 overflow-auto p-2 space-y-2">
            <div className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-2">
              <div className="text-[10px] text-gray-400 mb-1">英雄等级</div>
              <Input
                type="number"
                min="1"
                max="18"
                value={heroLevel}
                onChange={(e) => {
                  const level = parseInt(e.target.value) || 1;
                  setHeroLevel(level);
                  if (tagCounts['Level.LevelUp'] !== undefined) {
                    setTagCounts(prev => ({ ...prev, 'Level.LevelUp': level }));
                  }
                }}
                className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-white text-xs"
              />
            </div>

            {requiredTags.filter(tag => !tag.includes('LevelUp')).map(tag => (
              <div key={tag} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-2">
                <div className="text-[10px] text-gray-400 mb-1 font-mono truncate" title={tag}>
                  {tag.split('.').pop()}
                </div>
                <Input
                  type="number"
                  step="1"
                  value={tagCounts[tag] || 0}
                  onChange={(e) => updateTagCount(tag, e.target.value)}
                  className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-white text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 中间：属性键值中间态 */}
        <div className="flex-1 overflow-auto p-3">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">属性键值（中间态）</h3>
            <div className="space-y-3">
              {attributes.map(attr => {
                const keyValues = attributeKeyValues[attr.attribute_id] || {};
                return (
                  <div key={attr.id} className="bg-[#252526] border border-[#3d3d3d] rounded p-3">
                    <div className="text-xs text-white font-semibold mb-2">{attr.name}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(attr.keys || []).map(key => (
                        <div key={key.name} className="bg-[#1e1e1e] rounded p-2">
                          <div className="text-[10px] text-gray-400 mb-1 font-mono">{key.name}</div>
                          {key.type === 'array' ? (
                            <div className="flex flex-wrap gap-1">
                              {(keyValues[key.name] || []).map((val, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-[#3d3d3d] rounded text-xs text-green-400">
                                  {val.toFixed(1)}
                                </span>
                              ))}
                              {(keyValues[key.name] || []).length === 0 && (
                                <span className="text-xs text-gray-600">[]</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-white">{(keyValues[key.name] || 0).toFixed(1)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">最终属性值</h3>
            <div className="grid grid-cols-3 gap-3">
              {attributes.map(attr => (
                <div key={attr.id} className="bg-[#252526] border border-[#3d3d3d] rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">{attr.name}</div>
                  <div className="text-3xl font-bold text-green-400">
                    {finalAttributeValues[attr.attribute_id]?.toFixed(1) || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 font-mono truncate" title={attr.final_calculation_data_graph_id}>
                    {attr.final_calculation_data_graph_id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：激活的修饰器 */}
        <div className="w-80 bg-[#252526] border-l border-[#3d3d3d] overflow-auto p-3">
          <h3 className="text-xs font-semibold text-gray-400 mb-2">激活的修饰器</h3>
          <div className="space-y-2">
            {modifiers.filter(mod => mod.is_active).map(mod => {
              const blackboard = {};
              (mod.curve_input_mappings || []).forEach(mapping => {
                if (mapping.source_type === 'tag_count') {
                  const count = tagCounts[mapping.tag_path] || 0;
                  blackboard[mapping.graph_blackboard_key] = Math.floor(count / (mapping.step_size || 1));
                } else if (mapping.source_type === 'constant') {
                  blackboard[mapping.graph_blackboard_key] = mapping.constant_value || 0;
                }
              });
              const magnitude = mockExecuteDataGraph(mod.curve_data_graph_id, blackboard, dataGraphs);
              
              return (
                <div key={mod.id} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-2">
                  <div className="text-xs text-white font-semibold mb-1">{mod.modifier_name}</div>
                  <div className="text-[10px] text-gray-500 space-y-0.5">
                    <div>目标: {mod.target_attribute_id}.{mod.output_key}</div>
                    <div>曲线: {mod.curve_data_graph_id}</div>
                    {(mod.curve_input_mappings || []).map((mapping, idx) => (
                      <div key={idx} className="text-[9px]">
                        {mapping.graph_blackboard_key} ← {
                          mapping.source_type === 'tag_count' ? `tag(${mapping.tag_path?.split('.').pop()})` :
                          mapping.source_type === 'constant' ? `${mapping.constant_value}` :
                          'attr'
                        }
                      </div>
                    ))}
                    <div className="text-green-400 font-semibold">输出: {magnitude.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}