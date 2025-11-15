import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus, ArrowRight, AlertTriangle, Power } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewAttributeSimulatorPage() {
  const [tagCounts, setTagCounts] = useState({});
  const [attributeKeyValues, setAttributeKeyValues] = useState({});
  const [constantValues, setConstantValues] = useState({});
  const [selectedPrototypeId, setSelectedPrototypeId] = useState(null);
  const [modifierActiveStates, setModifierActiveStates] = useState({});

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

  const { data: prototypes = [] } = useQuery({
    queryKey: ['entityPrototypes'],
    queryFn: () => base44.entities.EntityPrototype.list(),
    initialData: [],
  });

  const selectedPrototype = useMemo(() => {
    return prototypes.find(p => p.id === selectedPrototypeId);
  }, [prototypes, selectedPrototypeId]);

  // 检查哪些属性缺失
  const missingAttributes = useMemo(() => {
    if (!selectedPrototype) return [];
    return (selectedPrototype.referenced_attributes || []).filter(attrId => 
      !attributes.some(a => a.attribute_id === attrId)
    );
  }, [selectedPrototype, attributes]);

  // 过滤出原型引用的属性
  const filteredAttributes = useMemo(() => {
    if (!selectedPrototype) return attributes;
    return attributes.filter(a => 
      (selectedPrototype.referenced_attributes || []).includes(a.attribute_id)
    );
  }, [selectedPrototype, attributes]);

  // 收集被引用的输入源
  const referencedInputs = useMemo(() => {
    const tagSet = new Set();
    const attrKeySet = new Set();
    const constantSet = new Set();

    modifiers.forEach(mod => {
      (mod.curve_input_mappings || []).forEach(mapping => {
        const key = `${mod.id}-${mapping.graph_blackboard_key}`;
        if (mapping.source_type === 'tag_count' && mapping.tag_path) {
          tagSet.add(mapping.tag_path);
        } else if (mapping.source_type === 'attribute_key') {
          attrKeySet.add(key);
        } else if (mapping.source_type === 'constant') {
          constantSet.add(key);
        }
      });
    });

    return {
      tags: Array.from(tagSet).sort(),
      attributeKeys: Array.from(attrKeySet),
      constants: Array.from(constantSet)
    };
  }, [modifiers]);

  // 检查修饰器的输入和输出是否在原型中
  const modifierWarnings = useMemo(() => {
    const warnings = {};
    
    if (!selectedPrototype) return warnings;
    
    const prototypeAttrs = selectedPrototype.referenced_attributes || [];
    
    modifiers.forEach(mod => {
      const warns = [];
      
      // 检查输入来源的属性是否在原型中
      (mod.curve_input_mappings || []).forEach(mapping => {
        if (mapping.source_type === 'attribute_key' && mapping.attribute_id) {
          if (!prototypeAttrs.includes(mapping.attribute_id)) {
            warns.push({ type: 'input', message: `输入属性 ${mapping.attribute_id} 不在原型中` });
          }
        }
      });
      
      // 检查目标属性是否在原型中
      if (mod.target_attribute_id && !prototypeAttrs.includes(mod.target_attribute_id)) {
        warns.push({ type: 'target', message: `目标属性 ${mod.target_attribute_id} 不在原型中` });
      }
      
      if (warns.length > 0) {
        warnings[mod.id] = warns;
      }
    });
    
    return warnings;
  }, [modifiers, selectedPrototype]);

  const toggleModifierActive = (modId) => {
    setModifierActiveStates(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  // 步骤1：计算所有修饰器输出
  const modifierOutputs = useMemo(() => {
    return modifiers.map(mod => {
      const inputs = {};
      
      (mod.curve_input_mappings || []).forEach(mapping => {
        const key = `${mod.id}-${mapping.graph_blackboard_key}`;
        if (mapping.source_type === 'tag_count') {
          const count = tagCounts[mapping.tag_path] || 0;
          inputs[mapping.graph_blackboard_key] = Math.floor(count / (mapping.step_size || 1));
        } else if (mapping.source_type === 'constant') {
          inputs[mapping.graph_blackboard_key] = constantValues[key] ?? mapping.constant_value ?? 0;
        } else if (mapping.source_type === 'attribute_key') {
          const attrKeyPath = `${mapping.attribute_id}.${mapping.attribute_key}`;
          inputs[mapping.graph_blackboard_key] = attributeKeyValues[attrKeyPath] ?? 0;
        }
      });

      const inputValues = Object.values(inputs);
      const magnitude = inputValues.reduce((a, b) => a * 10 + b * 5, 0);
      
      const isManuallyActive = modifierActiveStates[mod.id] !== undefined ? modifierActiveStates[mod.id] : mod.is_active;
      
      return {
        modifier: mod,
        inputs,
        magnitude,
        isActive: isManuallyActive && magnitude > 0,
        targetAttribute: mod.target_attribute_id,
        targetKey: mod.output_key,
        warnings: modifierWarnings[mod.id] || []
      };
    });
  }, [modifiers, tagCounts, attributeKeyValues, constantValues, modifierActiveStates, modifierWarnings]);

  // 排序：激活的在前
  const sortedModifierOutputs = useMemo(() => {
    return [...modifierOutputs].sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return 0;
    });
  }, [modifierOutputs]);

  // 步骤2：聚合到属性键
  const attributeKeys = useMemo(() => {
    const result = {};
    
    filteredAttributes.forEach(attr => {
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
  }, [filteredAttributes, modifierOutputs]);

  // 步骤3：计算最终值
  const finalValues = useMemo(() => {
    const result = {};
    
    filteredAttributes.forEach(attr => {
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
  }, [filteredAttributes, attributeKeys]);

  const updateTagCount = (tag, delta) => {
    setTagCounts(prev => {
      const newCount = Math.max(0, (prev[tag] || 0) + delta);
      return { ...prev, [tag]: newCount };
    });
  };

  const unreferencedTags = useMemo(() => {
    return tags.filter(t => !referencedInputs.tags.includes(t.full_path));
  }, [tags, referencedInputs.tags]);

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Calculator className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">属性模拟器</span>
        
        <div className="flex-1" />
        
        <span className="text-xs text-gray-500">实体原型:</span>
        <Select value={selectedPrototypeId || ""} onValueChange={setSelectedPrototypeId}>
          <SelectTrigger className="h-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
            <SelectValue placeholder="全部属性" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
            <SelectItem value="all" className="text-white text-xs">全部属性</SelectItem>
            {prototypes.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-white text-xs">
                {p.name} ({p.prototype_id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {missingAttributes.length > 0 && (
        <div className="bg-red-900/20 border-b border-red-900/50 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400">
            原型引用的属性不存在: {missingAttributes.join(', ')}
          </span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：输入源 */}
        <div className="w-72 bg-[#252526] border-r border-[#3d3d3d] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {/* 被引用的标签 */}
            <div className="border-b border-[#3d3d3d]">
              <div className="p-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
                <span className="text-xs font-semibold text-green-400">被引用标签 ({referencedInputs.tags.length})</span>
              </div>
              <div className="p-2 space-y-1">
                {referencedInputs.tags.map(tagPath => {
                  const tag = tags.find(t => t.full_path === tagPath);
                  const count = tagCounts[tagPath] || 0;
                  return (
                    <div key={tagPath} className="bg-[#1e1e1e] border border-green-600/30 rounded p-2 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/90 truncate">{tag?.name || tagPath.split('.').pop()}</div>
                        <div className="text-[9px] text-gray-500 font-mono truncate">{tagPath}</div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => updateTagCount(tagPath, -1)} disabled={count === 0} className="w-5 h-5 bg-[#3d3d3d] hover:bg-[#4d4d4d] rounded flex items-center justify-center">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{count}</span>
                        <button onClick={() => updateTagCount(tagPath, 1)} className="w-5 h-5 bg-[#0e639c] hover:bg-[#1177bb] rounded flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {referencedInputs.tags.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-xs">无引用</div>
                )}
              </div>
            </div>

            {/* 属性键输入 */}
            <div className="border-b border-[#3d3d3d]">
              <div className="p-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
                <span className="text-xs font-semibold text-purple-400">属性键输入 ({referencedInputs.attributeKeys.length})</span>
              </div>
              <div className="p-2 space-y-1">
                {modifiers.map(mod => {
                  const attrKeyMappings = (mod.curve_input_mappings || []).filter(m => m.source_type === 'attribute_key');
                  if (attrKeyMappings.length === 0) return null;
                  return (
                    <div key={mod.id} className="bg-[#1e1e1e] border border-purple-600/30 rounded p-2">
                      <div className="text-[10px] text-gray-400 mb-1">{mod.modifier_name}</div>
                      {attrKeyMappings.map((mapping, idx) => {
                        const attrKeyPath = `${mapping.attribute_id}.${mapping.attribute_key}`;
                        const attr = attributes.find(a => a.attribute_id === mapping.attribute_id);
                        return (
                          <div key={idx} className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-500 flex-1">{attr?.name}.{mapping.attribute_key}</span>
                            <Input
                              type="number"
                              step="0.1"
                              value={attributeKeyValues[attrKeyPath] ?? 0}
                              onChange={(e) => setAttributeKeyValues(prev => ({ ...prev, [attrKeyPath]: parseFloat(e.target.value) || 0 }))}
                              className="h-6 w-16 bg-[#3d3d3d] border-[#4d4d4d] text-white text-xs"
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {referencedInputs.attributeKeys.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-xs">无引用</div>
                )}
              </div>
            </div>

            {/* 常量输入 */}
            <div className="border-b border-[#3d3d3d]">
              <div className="p-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
                <span className="text-xs font-semibold text-blue-400">常量输入 ({referencedInputs.constants.length})</span>
              </div>
              <div className="p-2 space-y-1">
                {modifiers.map(mod => {
                  const constantMappings = (mod.curve_input_mappings || []).filter(m => m.source_type === 'constant');
                  if (constantMappings.length === 0) return null;
                  return (
                    <div key={mod.id} className="bg-[#1e1e1e] border border-blue-600/30 rounded p-2">
                      <div className="text-[10px] text-gray-400 mb-1">{mod.modifier_name}</div>
                      {constantMappings.map((mapping, idx) => {
                        const key = `${mod.id}-${mapping.graph_blackboard_key}`;
                        return (
                          <div key={idx} className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-500 flex-1">{mapping.graph_blackboard_key}</span>
                            <Input
                              type="number"
                              step="0.1"
                              value={constantValues[key] ?? mapping.constant_value ?? 0}
                              onChange={(e) => setConstantValues(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                              className="h-6 w-16 bg-[#3d3d3d] border-[#4d4d4d] text-white text-xs"
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {referencedInputs.constants.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-xs">无引用</div>
                )}
              </div>
            </div>

            {/* 未引用的标签 */}
            <div>
              <div className="p-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
                <span className="text-xs font-semibold text-gray-500">未引用标签 ({unreferencedTags.length})</span>
              </div>
              <div className="p-2 space-y-1">
                {unreferencedTags.map(tag => {
                  const count = tagCounts[tag.full_path] || 0;
                  return (
                    <div key={tag.id} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-2 flex items-center justify-between opacity-50">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/70 truncate">{tag.name}</div>
                        <div className="text-[9px] text-gray-600 font-mono truncate">{tag.full_path}</div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => updateTagCount(tag.full_path, -1)} disabled={count === 0} className="w-5 h-5 bg-[#3d3d3d] hover:bg-[#4d4d4d] rounded flex items-center justify-center">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{count}</span>
                        <button onClick={() => updateTagCount(tag.full_path, 1)} className="w-5 h-5 bg-[#3d3d3d] hover:bg-[#4d4d4d] rounded flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 中间：修饰器计算 */}
        <div className="flex-1 overflow-auto p-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">1</span>
              修饰器计算 ({modifierOutputs.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {sortedModifierOutputs.map((output, idx) => {
                const isManuallyActive = modifierActiveStates[output.modifier.id] !== undefined 
                  ? modifierActiveStates[output.modifier.id] 
                  : output.modifier.is_active;
                const hasInputWarning = output.warnings.some(w => w.type === 'input');
                const hasTargetWarning = output.warnings.some(w => w.type === 'target');
                
                return (
                  <div key={idx} className={`bg-[#252526] border rounded p-3 ${output.isActive ? 'border-green-600/50' : 'border-[#3d3d3d] opacity-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold text-white">{output.modifier.modifier_name}</div>
                        <button
                          onClick={() => toggleModifierActive(output.modifier.id)}
                          className={`p-1 rounded transition-colors ${isManuallyActive ? 'bg-green-600/30 text-green-400' : 'bg-gray-700/30 text-gray-500'}`}
                          title={isManuallyActive ? '点击禁用' : '点击启用'}
                        >
                          <Power className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {hasInputWarning && (
                          <span className="text-[9px] bg-orange-900/50 text-orange-300 px-1 rounded" title={output.warnings.filter(w => w.type === 'input').map(w => w.message).join(', ')}>
                            输入预警
                          </span>
                        )}
                        {hasTargetWarning && (
                          <span className="text-[9px] bg-red-900/50 text-red-300 px-1 rounded" title={output.warnings.filter(w => w.type === 'target').map(w => w.message).join(', ')}>
                            目标预警
                          </span>
                        )}
                        {!isManuallyActive && <span className="text-[9px] bg-gray-700 text-gray-400 px-1 rounded">已禁用</span>}
                        {isManuallyActive && !output.isActive && <span className="text-[9px] bg-gray-700 text-gray-400 px-1 rounded">输出为0</span>}
                      </div>
                    </div>
                    <div className="space-y-1 text-[10px] text-gray-400">
                      <div>曲线: {output.modifier.curve_data_graph_id}</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>输入:</span>
                        {Object.entries(output.inputs).map(([key, val]) => (
                          <span key={key} className="bg-[#3d3d3d] px-1 rounded">{key}={val}</span>
                        ))}
                        {Object.keys(output.inputs).length === 0 && <span className="text-gray-600">无</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#3d3d3d]">
                        <ArrowRight className="w-3 h-3 text-green-400" />
                        <span className={`font-semibold ${output.isActive ? 'text-green-400' : 'text-gray-600'}`}>{output.magnitude.toFixed(1)}</span>
                        <ArrowRight className="w-3 h-3 text-blue-400" />
                        <span className={`text-blue-400 ${hasTargetWarning ? 'line-through' : ''}`}>{output.targetAttribute}.{output.targetKey}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：属性聚合和最终值 */}
        <div className="w-96 bg-[#252526] border-l border-[#3d3d3d] flex flex-col overflow-auto">
          <div className="p-3 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">2</span>
            <span className="text-sm font-semibold text-white">属性聚合计算</span>
          </div>
          <div className="flex-1 p-3 space-y-3">
            {filteredAttributes.map(attr => {
              const keys = attributeKeys[attr.attribute_id] || {};
              const final = finalValues[attr.attribute_id] || 0;
              return (
                <div key={attr.id} className="bg-gradient-to-br from-[#1e1e1e] to-[#252526] border-2 border-green-600/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-white">{attr.name}</div>
                    <div className="text-3xl font-bold text-green-400">{final.toFixed(0)}</div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-[#3d3d3d]/50">
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
                  <div className="text-[9px] text-gray-600 font-mono mt-2">{attr.attribute_id}</div>
                </div>
              );
            })}
            {filteredAttributes.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs">
                {selectedPrototype ? '原型没有引用任何属性' : '请选择实体原型'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}