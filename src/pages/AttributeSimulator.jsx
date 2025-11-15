import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus, X, Percent, Hash, TrendingUp, Activity } from "lucide-react";

export default function AttributeSimulatorPage() {
  const [baseValues, setBaseValues] = useState({
    attack_power: 100,
    defense: 50,
    move_speed: 100,
    critical_chance: 5,
    damage_over_time: 0
  });

  const [tagCounts, setTagCounts] = useState({});

  const { data: modifiers = [] } = useQuery({
    queryKey: ['attributeModifiers'],
    queryFn: () => base44.entities.AttributeModifier.list(),
    initialData: [],
  });

  // 计算修饰器的影响值
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

  // 计算所有属性的详细乘区
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
            zones: {
              base_add: [],
              base_multiply: [],
              flat_add: [],
              final_multiply: [],
              override: []
            },
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

          // 根据操作类型分配到不同的乘区
          switch (mod.operation_type) {
            case 'add':
              attr.zones.base_add.push(entry);
              break;
            case 'multiply':
              attr.zones.base_multiply.push(entry);
              break;
            case 'flat_add':
              attr.zones.flat_add.push(entry);
              break;
            case 'override':
              attr.zones.override.push(entry);
              break;
          }
        }
      });

    // 计算每个属性的各个步骤
    Object.keys(attributes).forEach(attrId => {
      const attr = attributes[attrId];
      const steps = attr.steps;

      // 步骤1: 基础值
      steps.push({
        name: '基础值',
        formula: `base`,
        value: attr.base,
        accumulated: attr.base
      });

      // 步骤2: 基础加法区
      if (attr.zones.base_add.length > 0) {
        const addSum = attr.zones.base_add.reduce((sum, entry) => sum + entry.value, 0);
        const accumulated = attr.base + addSum;
        steps.push({
          name: '基础加法区',
          formula: `(${attr.base.toFixed(1)} + ${addSum.toFixed(1)})`,
          value: addSum,
          accumulated: accumulated,
          details: attr.zones.base_add
        });
      }

      // 步骤3: 基础乘法区
      let currentValue = steps[steps.length - 1].accumulated;
      if (attr.zones.base_multiply.length > 0) {
        const multiplyProduct = attr.zones.base_multiply.reduce((prod, entry) => prod * entry.value, 1);
        const accumulated = currentValue * multiplyProduct;
        steps.push({
          name: '基础乘法区',
          formula: `${currentValue.toFixed(1)} × ${multiplyProduct.toFixed(3)}`,
          value: multiplyProduct,
          accumulated: accumulated,
          details: attr.zones.base_multiply
        });
        currentValue = accumulated;
      }

      // 步骤4: 固定加成区
      if (attr.zones.flat_add.length > 0) {
        const flatSum = attr.zones.flat_add.reduce((sum, entry) => sum + entry.value, 0);
        const accumulated = currentValue + flatSum;
        steps.push({
          name: '固定加成区',
          formula: `${currentValue.toFixed(1)} + ${flatSum.toFixed(1)}`,
          value: flatSum,
          accumulated: accumulated,
          details: attr.zones.flat_add
        });
        currentValue = accumulated;
      }

      // 步骤5: 覆盖值
      if (attr.zones.override.length > 0) {
        const maxOverride = Math.max(...attr.zones.override.map(e => e.value));
        steps.push({
          name: '覆盖值',
          formula: `override(${maxOverride.toFixed(1)})`,
          value: maxOverride,
          accumulated: maxOverride,
          details: attr.zones.override
        });
        currentValue = maxOverride;
      }

      // 最终值
      attr.final = currentValue;
    });

    return attributes;
  }, [modifiers, tagCounts, baseValues]);

  const uniqueTagPaths = useMemo(() => {
    return [...new Set(modifiers.map(mod => mod.tag_path))];
  }, [modifiers]);

  const updateTagCount = (tagPath, delta) => {
    setTagCounts(prev => ({
      ...prev,
      [tagPath]: Math.max(0, (prev[tagPath] || 0) + delta)
    }));
  };

  const resetAll = () => {
    setTagCounts({});
  };

  const updateBaseValue = (attrId, value) => {
    setBaseValues(prev => ({
      ...prev,
      [attrId]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-white">
      {/* 左侧：标签计数器 */}
      <div className="w-80 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
        <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
          <Hash className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-300">标签计数</span>
          <div className="flex-1" />
          <Button size="sm" onClick={resetAll} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
            <X className="w-3 h-3 mr-1" />
            清空
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {uniqueTagPaths.map(tagPath => {
            const count = tagCounts[tagPath] || 0;
            return (
              <div key={tagPath} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-2">
                <div className="text-xs text-gray-400 mb-1 font-mono">{tagPath}</div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateTagCount(tagPath, -1)}
                    disabled={count === 0}
                    className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d] disabled:opacity-30"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    type="number"
                    value={count}
                    onChange={(e) => setTagCounts(prev => ({ ...prev, [tagPath]: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="h-6 flex-1 text-center bg-[#2d2d2d] border-[#3d3d3d] text-white text-sm font-bold"
                  />
                  <Button
                    size="sm"
                    onClick={() => updateTagCount(tagPath, 1)}
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

      {/* 中间：属性计算详情 */}
      <div className="flex-1 flex flex-col">
        <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
          <Calculator className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-300">属性计算详情</span>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {Object.keys(attributeCalculations).length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-12">
              配置标签数量查看属性计算
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(attributeCalculations).map(([attrId, attr]) => (
                <div key={attrId} className="bg-[#252526] border border-[#3d3d3d] rounded-lg overflow-hidden">
                  {/* 属性标题栏 */}
                  <div className="bg-[#2d2d2d] border-b border-[#3d3d3d] p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-bold text-white font-mono">{attrId}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">最终值</div>
                      <div className="text-2xl font-bold text-green-400">{attr.final.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* 计算步骤 */}
                  <div className="p-4 space-y-3">
                    {attr.steps.map((step, idx) => (
                      <div key={idx} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#0e639c] flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-semibold text-white">{step.name}</span>
                          </div>
                          <div className="text-lg font-bold text-blue-400">{step.accumulated.toFixed(2)}</div>
                        </div>

                        <div className="text-xs text-gray-400 font-mono mb-2">{step.formula}</div>

                        {step.details && step.details.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#3d3d3d] space-y-1">
                            {step.details.map((detail, detailIdx) => (
                              <div key={detailIdx} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-300">{detail.name}</span>
                                  <span className="text-gray-600 font-mono">({detail.tagPath}: {detail.tagCount})</span>
                                </div>
                                <span className="font-mono text-gray-400">
                                  {detail.operation === 'multiply' ? `×${detail.value.toFixed(3)}` : `+${detail.value.toFixed(1)}`}
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

      {/* 右侧：基础值设置 */}
      <div className="w-80 bg-[#252526] border-l border-[#3d3d3d] flex flex-col">
        <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4">
          <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm font-semibold text-gray-300">基础值配置</span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {Object.entries(baseValues).map(([attrId, value]) => (
            <div key={attrId} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-3">
              <label className="text-xs text-gray-400 mb-2 block font-mono">{attrId}</label>
              <Input
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => updateBaseValue(attrId, e.target.value)}
                className="h-8 bg-[#2d2d2d] border-[#3d3d3d] text-white font-semibold"
              />
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#3d3d3d] bg-[#2d2d2d]">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>基础加法: base + Σ add</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>基础乘法: result × Π multiply</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span>固定加成: result + Σ flat_add</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span>覆盖值: max(override)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}