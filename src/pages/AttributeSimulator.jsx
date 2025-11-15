import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus, X, Activity } from "lucide-react";

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
      case 'custom':
        const points = modifier.curve_config?.custom_points || [];
        if (points.length === 0) {
          value = 0;
        } else {
          const sortedPoints = [...points].sort((a, b) => a.tag_count - b.tag_count);
          if (count <= sortedPoints[0].tag_count) {
            value = sortedPoints[0].value;
          } else if (count >= sortedPoints[sortedPoints.length - 1].tag_count) {
            value = sortedPoints[sortedPoints.length - 1].value;
          } else {
            for (let i = 0; i < sortedPoints.length - 1; i++) {
              const p1 = sortedPoints[i];
              const p2 = sortedPoints[i + 1];
              if (count >= p1.tag_count && count <= p2.tag_count) {
                const t = (count - p1.tag_count) / (p2.tag_count - p1.tag_count);
                value = p1.value + t * (p2.value - p1.value);
                break;
              }
            }
          }
        }
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
            zones: { base_add: [], base_multiply: [], flat_add: [], override: [] },
            steps: []
          };
        }

        const attr = attributes[mod.affected_attribute_id];

        if (count > 0) {
          const entry = {
            name: mod.modifier_name,
            tagPath: mod.tag_path,
            tagCount: count,
            operation: mod.operation_type,
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

    Object.keys(attributes).forEach(attrId => {
      const attr = attributes[attrId];
      const steps = attr.steps;

      steps.push({ name: '基础值', value: attr.base, accumulated: attr.base });

      if (attr.zones.base_add.length > 0) {
        const addSum = attr.zones.base_add.reduce((sum, entry) => sum + entry.value, 0);
        const accumulated = attr.base + addSum;
        steps.push({
          name: '基础加法区',
          value: addSum,
          accumulated: accumulated,
          details: attr.zones.base_add
        });
      }

      let currentValue = steps[steps.length - 1].accumulated;
      if (attr.zones.base_multiply.length > 0) {
        const multiplyProduct = attr.zones.base_multiply.reduce((prod, entry) => prod * entry.value, 1);
        const accumulated = currentValue * multiplyProduct;
        steps.push({
          name: '基础乘法区',
          value: multiplyProduct,
          accumulated: accumulated,
          details: attr.zones.base_multiply
        });
        currentValue = accumulated;
      }

      if (attr.zones.flat_add.length > 0) {
        const flatSum = attr.zones.flat_add.reduce((sum, entry) => sum + entry.value, 0);
        const accumulated = currentValue + flatSum;
        steps.push({
          name: '固定加成区',
          value: flatSum,
          accumulated: accumulated,
          details: attr.zones.flat_add
        });
        currentValue = accumulated;
      }

      if (attr.zones.override.length > 0) {
        const maxOverride = Math.max(...attr.zones.override.map(e => e.value));
        steps.push({
          name: '覆盖值',
          value: maxOverride,
          accumulated: maxOverride,
          details: attr.zones.override
        });
        currentValue = maxOverride;
      }

      attr.final = currentValue;
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
        <div className="w-72 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          <div className="p-3 border-b border-[#3d3d3d]">
            <div className="text-xs font-semibold text-gray-400 mb-2">基础值</div>
            <div className="space-y-1.5">
              {Object.entries(baseValues).map(([attrId, value]) => (
                <div key={attrId} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-24 truncate">{attrId}</span>
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

          <div className="flex-1 overflow-auto p-3">
            <div className="text-xs font-semibold text-gray-400 mb-2">标签计数</div>
            <div className="space-y-1.5">
              {uniqueTagPaths.map(tagPath => {
                const count = tagCounts[tagPath] || 0;
                return (
                  <div key={tagPath} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-2">
                    <div className="text-xs text-gray-400 mb-1 truncate font-mono">{tagPath}</div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => setTagCounts(prev => ({ ...prev, [tagPath]: Math.max(0, (prev[tagPath] || 0) - 1) }))}
                        disabled={count === 0}
                        className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d] disabled:opacity-30"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        value={count}
                        onChange={(e) => setTagCounts(prev => ({ ...prev, [tagPath]: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="h-6 flex-1 text-center bg-[#2d2d2d] border-[#3d3d3d] text-white text-xs font-bold"
                      />
                      <Button
                        size="sm"
                        onClick={() => setTagCounts(prev => ({ ...prev, [tagPath]: (prev[tagPath] || 0) + 1 }))}
                        className="h-6 w-6 p-0 bg-[#0e639c] hover:bg-[#1177bb]"
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

        {/* 右侧：计算详情 */}
        <div className="flex-1 overflow-auto p-4">
          {Object.keys(attributeCalculations).length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              调整标签数量查看属性计算
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(attributeCalculations).map(([attrId, attr]) => (
                <div key={attrId} className="bg-[#252526] border border-[#3d3d3d] rounded">
                  <div className="bg-[#2d2d2d] px-3 py-2 flex items-center justify-between border-b border-[#3d3d3d]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-bold text-white font-mono">{attrId}</span>
                    </div>
                    <div className="text-xl font-bold text-green-400">{attr.final.toFixed(1)}</div>
                  </div>

                  <div className="p-3 space-y-2">
                    {attr.steps.map((step, idx) => (
                      <div key={idx} className="bg-[#1e1e1e] rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-[#0e639c] flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                            <span className="text-xs font-semibold text-white">{step.name}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-400">{step.accumulated.toFixed(1)}</span>
                        </div>

                        {step.details && step.details.length > 0 && (
                          <div className="mt-1.5 pt-1.5 border-t border-[#3d3d3d] space-y-0.5">
                            {step.details.map((detail, detailIdx) => (
                              <div key={detailIdx} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-gray-600">•</span>
                                  <span className="text-gray-300">{detail.name}</span>
                                  <span className="text-gray-600 text-[10px]">({detail.tagCount})</span>
                                </div>
                                <span className="font-mono text-gray-400">
                                  {detail.operation === 'multiply' ? `×${detail.value.toFixed(2)}` : `+${detail.value.toFixed(1)}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
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