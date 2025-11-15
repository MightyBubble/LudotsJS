import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus, X, ChevronRight } from "lucide-react";

export default function AttributeSimulatorPage() {
  const [baseValues, setBaseValues] = useState({
    attack_power: 100,
    defense: 50,
    move_speed: 100,
    critical_chance: 5,
    critical_damage: 150
  });

  const [tagCounts, setTagCounts] = useState({});

  const { data: modifiers = [] } = useQuery({
    queryKey: ['attributeModifiers'],
    queryFn: () => base44.entities.AttributeModifier.list(),
    initialData: [],
  });

  const calculateModifierValue = (modifier, count) => {
    if (count === 0) return 0;
    const steps = Math.floor(count / modifier.tag_count_per_step);
    if (steps === 0) return 0;
    const effectiveSteps = modifier.max_stacks ? Math.min(steps, modifier.max_stacks) : steps;

    let value = 0;
    switch (modifier.curve_type) {
      case 'linear':
        value = modifier.base_value * effectiveSteps;
        break;
      case 'exponential':
        const base = modifier.curve_config?.exponential_base || 1.5;
        value = modifier.base_value * Math.pow(base, effectiveSteps - 1);
        break;
      case 'logarithmic':
        const logBase = modifier.curve_config?.logarithmic_base || 10;
        value = modifier.base_value * (Math.log(effectiveSteps + 1) / Math.log(logBase));
        break;
      default:
        value = modifier.base_value * effectiveSteps;
    }
    return value;
  };

  const attributeCalculations = useMemo(() => {
    const attributes = {};

    modifiers
      .filter(mod => mod.is_active)
      .sort((a, b) => b.priority - a.priority)
      .forEach(mod => {
        const count = tagCounts[mod.tag_path] || 0;
        const value = calculateModifierValue(mod, count);

        if (!attributes[mod.affected_attribute_id]) {
          attributes[mod.affected_attribute_id] = {
            base: baseValues[mod.affected_attribute_id] || 100,
            zones: { base_add: [], base_multiply: [], flat_add: [], override: [] }
          };
        }

        const attr = attributes[mod.affected_attribute_id];

        if (count > 0) {
          const entry = {
            name: mod.modifier_name,
            tagPath: mod.tag_path,
            tagCount: count,
            value: value
          };

          switch (mod.operation_type) {
            case 'add': attr.zones.base_add.push(entry); break;
            case 'multiply': attr.zones.base_multiply.push(entry); break;
            case 'flat_add': attr.zones.flat_add.push(entry); break;
            case 'override': attr.zones.override.push(entry); break;
          }
        }
      });

    // 计算各阶段结果
    Object.keys(attributes).forEach(attrId => {
      const attr = attributes[attrId];
      
      let current = attr.base;
      attr.result_after_base = current;
      
      if (attr.zones.base_add.length > 0) {
        const sum = attr.zones.base_add.reduce((s, e) => s + e.value, 0);
        current += sum;
      }
      attr.result_after_add = current;
      
      if (attr.zones.base_multiply.length > 0) {
        const prod = attr.zones.base_multiply.reduce((p, e) => p * e.value, 1);
        current *= prod;
      }
      attr.result_after_multiply = current;
      
      if (attr.zones.flat_add.length > 0) {
        const sum = attr.zones.flat_add.reduce((s, e) => s + e.value, 0);
        current += sum;
      }
      attr.result_after_flat = current;
      
      if (attr.zones.override.length > 0) {
        current = Math.max(...attr.zones.override.map(e => e.value));
      }
      attr.final = current;
    });

    return attributes;
  }, [modifiers, tagCounts, baseValues]);

  const uniqueTagPaths = useMemo(() => {
    return [...new Set(modifiers.map(mod => mod.tag_path))];
  }, [modifiers]);

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Calculator className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">属性计算模拟器</span>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setTagCounts({})} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
          <X className="w-3 h-3 mr-1" />清空
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：标签计数 + 基础值 */}
        <div className="w-64 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          <div className="p-2 border-b border-[#3d3d3d]">
            <div className="text-xs font-semibold text-gray-400 mb-1.5">基础值</div>
            <div className="space-y-1">
              {Object.entries(baseValues).map(([attrId, value]) => (
                <div key={attrId} className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 w-20 truncate">{attrId}</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => setBaseValues(prev => ({ ...prev, [attrId]: parseFloat(e.target.value) || 0 }))}
                    className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2">
            <div className="text-xs font-semibold text-gray-400 mb-1.5">标签计数</div>
            <div className="space-y-1">
              {uniqueTagPaths.map(tagPath => {
                const count = tagCounts[tagPath] || 0;
                return (
                  <div key={tagPath} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-1.5">
                    <div className="text-[10px] text-gray-400 mb-1 truncate font-mono">{tagPath}</div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => setTagCounts(prev => ({ ...prev, [tagPath]: Math.max(0, (prev[tagPath] || 0) - 1) }))}
                        disabled={count === 0}
                        className="h-5 w-5 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d] disabled:opacity-30"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        value={count}
                        onChange={(e) => setTagCounts(prev => ({ ...prev, [tagPath]: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="h-5 flex-1 text-center bg-[#2d2d2d] border-[#3d3d3d] text-white text-xs font-bold px-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => setTagCounts(prev => ({ ...prev, [tagPath]: (prev[tagPath] || 0) + 1 }))}
                        className="h-5 w-5 p-0 bg-[#0e639c] hover:bg-[#1177bb]"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：横向阶段，纵向来源 */}
        <div className="flex-1 overflow-auto p-3">
          {Object.keys(attributeCalculations).length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              调整标签数量查看属性计算
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(attributeCalculations).map(([attrId, attr]) => (
                <div key={attrId} className="bg-[#252526] border border-[#3d3d3d] rounded">
                  {/* 属性标题 */}
                  <div className="bg-[#2d2d2d] px-3 py-2 flex items-center justify-between border-b border-[#3d3d3d]">
                    <span className="text-sm font-bold text-white font-mono">{attrId}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">最终值</span>
                      <span className="text-xl font-bold text-green-400">{attr.final.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* 横向阶段布局 */}
                  <div className="p-3 flex gap-2 overflow-x-auto">
                    {/* 基础值 */}
                    <div className="flex-shrink-0 w-32">
                      <div className="bg-[#1e1e1e] rounded p-2 h-full">
                        <div className="text-xs text-gray-400 mb-1">基础值</div>
                        <div className="text-lg font-bold text-blue-400">{attr.base}</div>
                      </div>
                    </div>

                    {attr.zones.base_add.length > 0 && (
                      <>
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 self-center" />
                        <div className="flex-shrink-0 w-40">
                          <div className="bg-[#1e1e1e] rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">基础加法</span>
                              <span className="text-sm font-bold text-blue-400">{attr.result_after_add.toFixed(1)}</span>
                            </div>
                            <div className="space-y-0.5">
                              {attr.zones.base_add.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px]">
                                  <span className="text-gray-400 truncate flex-1">{entry.name}</span>
                                  <span className="text-green-400 ml-1">+{entry.value.toFixed(1)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {attr.zones.base_multiply.length > 0 && (
                      <>
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 self-center" />
                        <div className="flex-shrink-0 w-40">
                          <div className="bg-[#1e1e1e] rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">基础乘法</span>
                              <span className="text-sm font-bold text-blue-400">{attr.result_after_multiply.toFixed(1)}</span>
                            </div>
                            <div className="space-y-0.5">
                              {attr.zones.base_multiply.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px]">
                                  <span className="text-gray-400 truncate flex-1">{entry.name}</span>
                                  <span className="text-yellow-400 ml-1">×{entry.value.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {attr.zones.flat_add.length > 0 && (
                      <>
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 self-center" />
                        <div className="flex-shrink-0 w-40">
                          <div className="bg-[#1e1e1e] rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">固定加成</span>
                              <span className="text-sm font-bold text-blue-400">{attr.result_after_flat.toFixed(1)}</span>
                            </div>
                            <div className="space-y-0.5">
                              {attr.zones.flat_add.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px]">
                                  <span className="text-gray-400 truncate flex-1">{entry.name}</span>
                                  <span className="text-purple-400 ml-1">+{entry.value.toFixed(1)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {attr.zones.override.length > 0 && (
                      <>
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 self-center" />
                        <div className="flex-shrink-0 w-40">
                          <div className="bg-[#1e1e1e] rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">覆盖值</span>
                              <span className="text-sm font-bold text-blue-400">{attr.final.toFixed(1)}</span>
                            </div>
                            <div className="space-y-0.5">
                              {attr.zones.override.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[10px]">
                                  <span className="text-gray-400 truncate flex-1">{entry.name}</span>
                                  <span className="text-red-400 ml-1">={entry.value.toFixed(1)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}