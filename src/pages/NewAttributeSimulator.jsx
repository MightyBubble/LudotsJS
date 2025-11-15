import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus, ArrowRight, Target } from "lucide-react";

export default function NewAttributeSimulatorPage() {
  const [heroLevel, setHeroLevel] = useState(1);
  const [selectedHero, setSelectedHero] = useState(null);
  const [activeTags, setActiveTags] = useState([]);

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

  const heroes = useMemo(() => {
    return tags.filter(t => t.full_path && t.full_path.startsWith('Hero.') && t.depth === 1);
  }, [tags]);

  const buffTags = useMemo(() => {
    return tags.filter(t => t.full_path && t.full_path.startsWith('Buff.') && t.depth === 1);
  }, [tags]);

  // 计算标签计数
  const tagCounts = useMemo(() => {
    const counts = {};
    counts['Level.LevelUp'] = heroLevel;
    activeTags.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
    return counts;
  }, [heroLevel, activeTags]);

  // 第一步：计算修饰器输出
  const modifierOutputs = useMemo(() => {
    const outputs = [];
    
    modifiers.filter(m => m.is_active).forEach(mod => {
      const inputs = {};
      let canTrigger = true;
      
      // 收集曲线输入
      (mod.curve_input_mappings || []).forEach(mapping => {
        if (mapping.source_type === 'tag_count') {
          const count = tagCounts[mapping.tag_path] || 0;
          inputs[mapping.graph_blackboard_key] = Math.floor(count / (mapping.step_size || 1));
        } else if (mapping.source_type === 'constant') {
          inputs[mapping.graph_blackboard_key] = mapping.constant_value || 0;
        } else {
          inputs[mapping.graph_blackboard_key] = 0;
        }
      });

      // 简单计算（假设线性）
      const inputValues = Object.values(inputs);
      const magnitude = inputValues.length > 0 ? inputValues.reduce((a, b) => a * 10 + b * 5, 0) : 0;
      
      if (magnitude > 0 || mod.modifier_name.includes('等级')) {
        outputs.push({
          modifier: mod,
          inputs,
          magnitude,
          targetAttribute: mod.target_attribute_id,
          targetKey: mod.output_key
        });
      }
    });
    
    return outputs;
  }, [modifiers, tagCounts]);

  // 第二步：聚合到属性键
  const attributeKeys = useMemo(() => {
    const result = {};
    
    attributes.forEach(attr => {
      const keys = {};
      
      // 初始化键
      (attr.keys || []).forEach(key => {
        if (key.type === 'value') {
          keys[key.name] = key.name.includes('base') ? attr.default_base_value : 0;
        } else {
          keys[key.name] = [];
        }
      });
      
      // 应用修饰器
      modifierOutputs.forEach(output => {
        if (output.targetAttribute === attr.attribute_id) {
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

  // 第三步：计算最终值
  const finalValues = useMemo(() => {
    const result = {};
    
    attributes.forEach(attr => {
      const keys = attributeKeys[attr.attribute_id] || {};
      
      // 简单求和逻辑
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

  const toggleTag = (tagPath) => {
    setActiveTags(prev => 
      prev.includes(tagPath) ? prev.filter(t => t !== tagPath) : [...prev, tagPath]
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Calculator className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">属性模拟器</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：输入配置 */}
        <div className="w-80 bg-[#252526] border-r border-[#3d3d3d] flex flex-col overflow-auto">
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">选择英雄</label>
              <select 
                value={selectedHero?.full_path || ''}
                onChange={(e) => setSelectedHero(heroes.find(h => h.full_path === e.target.value))}
                className="w-full bg-[#3d3d3d] border border-[#4d4d4d] rounded px-3 py-2 text-white text-sm"
              >
                <option value="">请选择...</option>
                {heroes.map(hero => (
                  <option key={hero.id} value={hero.full_path}>{hero.description}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">英雄等级: {heroLevel}</label>
              <input
                type="range"
                min="1"
                max="18"
                value={heroLevel}
                onChange={(e) => setHeroLevel(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>1级</span>
                <span>18级</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">激活Buff</label>
              <div className="space-y-1">
                {buffTags.map(buff => {
                  const count = activeTags.filter(t => t === buff.full_path).length;
                  return (
                    <div key={buff.id} className="flex items-center justify-between bg-[#1e1e1e] rounded p-2">
                      <span className="text-xs text-white/90">{buff.description}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleTag(buff.full_path)}
                          className="w-5 h-5 bg-[#3d3d3d] hover:bg-[#4d4d4d] rounded flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs">{count}</span>
                        <button
                          onClick={() => setActiveTags(prev => [...prev, buff.full_path])}
                          className="w-5 h-5 bg-[#0e639c] hover:bg-[#1177bb] rounded flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[#3d3d3d]">
              <div className="text-[10px] text-gray-500">
                标签计数:
                {Object.entries(tagCounts).map(([tag, count]) => (
                  <div key={tag} className="mt-1">
                    {tag.split('.').pop()}: {count}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：计算流程和结果 */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* 步骤1：修饰器计算 */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">1</span>
              修饰器计算
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {modifierOutputs.map((output, idx) => (
                <div key={idx} className="bg-[#252526] border border-[#3d3d3d] rounded p-3">
                  <div className="text-xs font-semibold text-white mb-2">{output.modifier.modifier_name}</div>
                  <div className="space-y-1 text-[10px] text-gray-400">
                    <div>曲线: {output.modifier.curve_data_graph_id}</div>
                    <div className="flex items-center gap-1">
                      <span>输入:</span>
                      {Object.entries(output.inputs).map(([key, val]) => (
                        <span key={key} className="bg-[#3d3d3d] px-1 rounded">{key}={val}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#3d3d3d]">
                      <ArrowRight className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 font-semibold">{output.magnitude.toFixed(1)}</span>
                      <ArrowRight className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-400">{output.targetAttribute}.{output.targetKey}</span>
                    </div>
                  </div>
                </div>
              ))}
              {modifierOutputs.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                  暂无激活的修饰器输出
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
                            <div className="flex gap-1">
                              {keyValue.map((v, i) => (
                                <span key={i} className="bg-[#3d3d3d] px-1 rounded text-white">{v.toFixed(1)}</span>
                              ))}
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

          {/* 说明 */}
          <div className="bg-[#252526] border border-blue-600/30 rounded p-3 text-xs text-gray-400">
            <div className="font-semibold text-blue-400 mb-2">💡 模拟流程说明</div>
            <div className="space-y-1 text-[10px]">
              <div><strong>步骤1:</strong> 根据当前标签计数，每个激活的修饰器读取其配置的输入（标签/常量/属性），通过曲线Data Graph计算出一个数值</div>
              <div><strong>步骤2:</strong> 将修饰器的输出数值写入对应属性的指定键（value类型直接覆盖，array类型追加）</div>
              <div><strong>步骤3:</strong> 每个属性将其所有键的值通过最终计算Data Graph汇总，得到最终属性值</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}