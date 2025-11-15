import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus, ArrowRight } from "lucide-react";

export default function NewAttributeSimulatorPage() {
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

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  // 步骤1：计算所有修饰器输出
  const modifierOutputs = useMemo(() => {
    return modifiers.map(mod => {
      const inputs = {};
      
      (mod.curve_input_mappings || []).forEach(mapping => {
        if (mapping.source_type === 'tag_count') {
          const count = tagCounts[mapping.tag_path] || 0;
          inputs[mapping.graph_blackboard_key] = Math.floor(count / (mapping.step_size || 1));
        } else if (mapping.source_type === 'constant') {
          inputs[mapping.graph_blackboard_key] = mapping.constant_value || 0;
        } else if (mapping.source_type === 'attribute_key') {
          inputs[mapping.graph_blackboard_key] = 0;
        }
      });

      const inputValues = Object.values(inputs);
      const magnitude = inputValues.reduce((a, b) => a * 10 + b * 5, 0);
      
      return {
        modifier: mod,
        inputs,
        magnitude,
        isActive: mod.is_active && magnitude > 0,
        targetAttribute: mod.target_attribute_id,
        targetKey: mod.output_key
      };
    });
  }, [modifiers, tagCounts]);

  // 步骤2：聚合到属性键
  const attributeKeys = useMemo(() => {
    const result = {};
    
    attributes.forEach(attr => {
      const keys = {};
      
      (attr.keys || []).forEach(key => {
        if (key.type === 'value') {
          keys[key.name] = key.name.includes('base') ? attr.default_base_value : 0;
        } else {
          keys[key.name] = [];
        }
      });
      
      modifierOutputs.forEach(output => {
        if (output.isActive && output.targetAttribute === attr.attribute_id) {
          const key = (attr.keys || []).find(k => k.name === output.targetKey);
          if (key) {
            if (key.type === 'array') {
              keys[output.targetKey].push(output.magnitude);
            } else {
              keys[output.targetKey] = (keys[output.targetKey] || 0) + output.magnitude;
            }
          }
        }
      });
      
      result[attr.attribute_id] = keys;
    });
    
    return result;
  }, [attributes, modifierOutputs]);

  // 步骤3：计算最终值
  const finalValues = useMemo(() => {
    const result = {};
    
    attributes.forEach(attr => {
      const keys = attributeKeys[attr.attribute_id] || {};
      
      let total = 0;
      Object.values(keys).forEach(val => {
        if (Array.isArray(val)) {
          total += val.reduce((sum, v) => sum + v, 0);
        } else {
          total += val;
        }
      });
      
      result[attr.attribute_id] = total;
    });
    
    return result;
  }, [attributes, attributeKeys]);

  const updateTagCount = (tag, delta) => {
    setTagCounts(prev => {
      const newCount = Math.max(0, (prev[tag] || 0) + delta);
      return { ...prev, [tag]: newCount };
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Calculator className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">属性模拟器</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：所有标签计数 */}
        <div className="w-64 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          <div className="p-3 border-b border-[#3d3d3d]">
            <span className="text-xs font-semibold text-gray-400">标签计数 ({tags.length})</span>
          </div>
          
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {tags.map(tag => {
              const count = tagCounts[tag.full_path] || 0;
              return (
                <div key={tag.id} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-2 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/90 truncate">{tag.name}</div>
                    <div className="text-[9px] text-gray-500 font-mono truncate">{tag.full_path}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => updateTagCount(tag.full_path, -1)}
                      className="w-5 h-5 bg-[#3d3d3d] hover:bg-[#4d4d4d] rounded flex items-center justify-center"
                      disabled={count === 0}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{count}</span>
                    <button
                      onClick={() => updateTagCount(tag.full_path, 1)}
                      className="w-5 h-5 bg-[#0e639c] hover:bg-[#1177bb] rounded flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {tags.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs">
                暂无标签
              </div>
            )}
          </div>
        </div>

        {/* 右侧：计算流程 */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* 步骤1：所有修饰器计算 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">1</span>
              修饰器计算 ({modifierOutputs.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {modifierOutputs.map((output, idx) => (
                <div key={idx} className={`bg-[#252526] border rounded p-3 ${
                  output.isActive ? 'border-green-600/50' : 'border-[#3d3d3d] opacity-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-white">{output.modifier.modifier_name}</div>
                    {!output.modifier.is_active && (
                      <span className="text-[9px] bg-red-900/50 text-red-300 px-1 rounded">未激活</span>
                    )}
                    {output.modifier.is_active && !output.isActive && (
                      <span className="text-[9px] bg-gray-700 text-gray-400 px-1 rounded">输出为0</span>
                    )}
                  </div>
                  <div className="space-y-1 text-[10px] text-gray-400">
                    <div>曲线: {output.modifier.curve_data_graph_id}</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span>输入:</span>
                      {Object.entries(output.inputs).map(([key, val]) => (
                        <span key={key} className="bg-[#3d3d3d] px-1 rounded">{key}={val}</span>
                      ))}
                      {Object.keys(output.inputs).length === 0 && (
                        <span className="text-gray-600">无</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#3d3d3d]">
                      <ArrowRight className="w-3 h-3 text-green-400" />
                      <span className={`font-semibold ${output.isActive ? 'text-green-400' : 'text-gray-600'}`}>
                        {output.magnitude.toFixed(1)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-400">{output.targetAttribute}.{output.targetKey}</span>
                    </div>
                  </div>
                </div>
              ))}
              {modifierOutputs.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                  暂无修饰器
                </div>
              )}
            </div>
          </div>

          {/* 步骤2：属性键聚合 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">2</span>
              属性键聚合
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {attributes.map(attr => {
                const keys = attributeKeys[attr.attribute_id] || {};
                return (
                  <div key={attr.id} className="bg-[#252526] border border-[#3d3d3d] rounded p-3">
                    <div className="text-xs font-semibold text-white mb-2">{attr.name}</div>
                    <div className="space-y-1">
                      {Object.entries(keys).map(([keyName, keyValue]) => (
                        <div key={keyName} className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">{keyName}:</span>
                          {Array.isArray(keyValue) ? (
                            <div className="flex gap-1 flex-wrap">
                              {keyValue.map((v, i) => (
                                <span key={i} className="bg-[#3d3d3d] px-1 rounded text-white">{v.toFixed(1)}</span>
                              ))}
                              {keyValue.length === 0 && <span className="text-gray-600">[]</span>}
                            </div>
                          ) : (
                            <span className="text-white">{keyValue.toFixed(1)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 步骤3：最终属性值 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-xs">3</span>
              最终属性值
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {attributes.map(attr => (
                <div key={attr.id} className="bg-gradient-to-br from-[#252526] to-[#1e1e1e] border-2 border-green-600/30 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-400 mb-1">{attr.name}</div>
                  <div className="text-3xl font-bold text-green-400">
                    {finalValues[attr.attribute_id]?.toFixed(0) || 0}
                  </div>
                  <div className="text-[9px] text-gray-600 mt-1 font-mono">
                    {attr.attribute_id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}