import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus, ChevronRight, Database } from "lucide-react";

// Mock Data Graph 执行器（简化版，后续替换为真实API）
function mockExecuteCurveDataGraph(graphId, inputValue, baseValue) {
  // 模拟不同类型的曲线计算
  if (graphId === "linear_curve") {
    return inputValue * baseValue;
  } else if (graphId === "exponential_curve") {
    return baseValue * Math.pow(1.5, inputValue);
  } else if (graphId === "logarithmic_curve") {
    return baseValue * Math.log(inputValue + 1) / Math.log(10);
  }
  return inputValue * baseValue; // 默认线性
}

function mockExecuteAttributeDataGraph(graphId, blackboard, attributeId) {
  // 模拟属性最终计算的Data Graph
  // 假设标准计算流程：base + sum(add_zone) * product(multiply_zone) + sum(flat_add_zone) * product(final_multiply_zone)
  
  const baseKey = `${attributeId}_base`;
  const addZoneKey = `${attributeId}_add_zone`;
  const multiplyZoneKey = `${attributeId}_multiply_zone`;
  const flatAddZoneKey = `${attributeId}_flat_add_zone`;
  const finalMultiplyZoneKey = `${attributeId}_final_multiply_zone`;
  
  let result = blackboard[baseKey] || 0;
  
  // 加法区
  if (blackboard[addZoneKey] && blackboard[addZoneKey].length > 0) {
    const addSum = blackboard[addZoneKey].reduce((sum, val) => sum + val, 0);
    result += addSum;
  }
  
  // 乘法区
  if (blackboard[multiplyZoneKey] && blackboard[multiplyZoneKey].length > 0) {
    const multiplyProduct = blackboard[multiplyZoneKey].reduce((prod, val) => prod * val, 1);
    result *= multiplyProduct;
  }
  
  // 固定加成区
  if (blackboard[flatAddZoneKey] && blackboard[flatAddZoneKey].length > 0) {
    const flatAddSum = blackboard[flatAddZoneKey].reduce((sum, val) => sum + val, 0);
    result += flatAddSum;
  }
  
  // 最终百分比区
  if (blackboard[finalMultiplyZoneKey] && blackboard[finalMultiplyZoneKey].length > 0) {
    const finalMultiplyProduct = blackboard[finalMultiplyZoneKey].reduce((prod, val) => prod * val, 1);
    result *= finalMultiplyProduct;
  }
  
  return result;
}

export default function NewAttributeSimulatorPage() {
  const [blackboardInputs, setBlackboardInputs] = useState({
    player_level: 10,
    tag_count_Status_Buff: 3
  });

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

  // 计算黑板聚合数据
  const blackboard = useMemo(() => {
    const bb = { ...blackboardInputs };
    
    // 为每个属性设置基础值
    attributes.forEach(attr => {
      bb[`${attr.attribute_id}_base`] = attr.default_base_value;
    });
    
    // 处理所有激活的Modifier
    modifiers
      .filter(mod => mod.is_active)
      .forEach(mod => {
        const inputValue = bb[mod.input_blackboard_key] || 0;
        const steps = Math.floor(inputValue / mod.input_step_size);
        
        if (steps > 0) {
          const effectiveSteps = mod.max_trigger_times ? Math.min(steps, mod.max_trigger_times) : steps;
          
          // Mock执行曲线Data Graph
          const magnitude = mockExecuteCurveDataGraph(
            mod.curve_data_graph_id,
            effectiveSteps,
            mod.base_value
          );
          
          // 将magnitude添加到对应的聚合键数组中
          if (!bb[mod.output_blackboard_aggregation_key]) {
            bb[mod.output_blackboard_aggregation_key] = [];
          }
          bb[mod.output_blackboard_aggregation_key].push(magnitude);
        }
      });
    
    return bb;
  }, [blackboardInputs, modifiers, attributes]);

  // 计算最终属性值
  const finalAttributeValues = useMemo(() => {
    const results = {};
    
    attributes.forEach(attr => {
      results[attr.attribute_id] = mockExecuteAttributeDataGraph(
        attr.final_calculation_data_graph_id,
        blackboard,
        attr.attribute_id
      );
    });
    
    return results;
  }, [attributes, blackboard]);

  const updateBlackboardInput = (key, value) => {
    setBlackboardInputs(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const addBlackboardInput = () => {
    const newKey = prompt("输入新的黑板键名（例如：item_quality）");
    if (newKey && !blackboardInputs[newKey]) {
      setBlackboardInputs(prev => ({ ...prev, [newKey]: 0 }));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Calculator className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">新属性模拟器</span>
        <span className="text-xs text-yellow-600">(使用Mock Data Graph)</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：黑板输入 */}
        <div className="w-64 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          <div className="p-3 border-b border-[#3d3d3d] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">黑板输入值</span>
            <Button size="sm" onClick={addBlackboardInput} className="h-5 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {Object.keys(blackboardInputs).map(key => (
              <div key={key} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-2">
                <div className="text-[10px] text-gray-400 mb-1 font-mono">{key}</div>
                <Input
                  type="number"
                  step="0.1"
                  value={blackboardInputs[key]}
                  onChange={(e) => updateBlackboardInput(key, e.target.value)}
                  className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-white text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 中间：黑板聚合区 */}
        <div className="flex-1 overflow-auto p-3">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">黑板聚合区（中间态）</h3>
            <div className="space-y-2">
              {Object.keys(blackboard)
                .filter(key => Array.isArray(blackboard[key]))
                .map(key => (
                  <div key={key} className="bg-[#252526] border border-[#3d3d3d] rounded p-2">
                    <div className="text-xs text-gray-400 font-mono mb-1">{key}</div>
                    <div className="flex flex-wrap gap-1">
                      {blackboard[key].map((val, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[#3d3d3d] rounded text-xs text-green-400">
                          {val.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">最终属性值</h3>
            <div className="grid grid-cols-2 gap-3">
              {attributes.map(attr => (
                <div key={attr.id} className="bg-[#252526] border border-[#3d3d3d] rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">{attr.name}</div>
                  <div className="text-2xl font-bold text-green-400">
                    {finalAttributeValues[attr.attribute_id]?.toFixed(1) || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 font-mono">
                    Graph: {attr.final_calculation_data_graph_id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：激活的Modifier列表 */}
        <div className="w-80 bg-[#252526] border-l border-[#3d3d3d] overflow-auto p-3">
          <h3 className="text-xs font-semibold text-gray-400 mb-2">激活的修饰器</h3>
          <div className="space-y-2">
            {modifiers
              .filter(mod => mod.is_active)
              .map(mod => {
                const inputValue = blackboardInputs[mod.input_blackboard_key] || 0;
                const steps = Math.floor(inputValue / mod.input_step_size);
                const effectiveSteps = mod.max_trigger_times ? Math.min(steps, mod.max_trigger_times) : steps;
                const magnitude = effectiveSteps > 0 ? mockExecuteCurveDataGraph(mod.curve_data_graph_id, effectiveSteps, mod.base_value) : 0;
                
                return (
                  <div key={mod.id} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-2">
                    <div className="text-xs text-white font-semibold mb-1">{mod.modifier_name}</div>
                    <div className="text-[10px] text-gray-500 space-y-0.5">
                      <div>输入: {mod.input_blackboard_key} = {inputValue}</div>
                      <div>步长: {mod.input_step_size}, 触发: {effectiveSteps}次</div>
                      <div>曲线: {mod.curve_data_graph_id}</div>
                      <div className="text-green-400">输出: {magnitude.toFixed(2)} → {mod.output_blackboard_aggregation_key}</div>
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