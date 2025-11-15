import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Plus, Minus, RotateCcw } from "lucide-react";

export default function ModifierSimulatorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tagCounts, setTagCounts] = useState({});

  const { data: modifiers = [] } = useQuery({
    queryKey: ['attributeModifiers'],
    queryFn: () => base44.entities.AttributeModifier.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
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
          // 找到最近的两个点进行插值
          const sortedPoints = [...points].sort((a, b) => a.tag_count - b.tag_count);
          
          if (count <= sortedPoints[0].tag_count) {
            value = sortedPoints[0].value;
          } else if (count >= sortedPoints[sortedPoints.length - 1].tag_count) {
            value = sortedPoints[sortedPoints.length - 1].value;
          } else {
            // 线性插值
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

  // 计算所有属性的最终值
  const attributeValues = useMemo(() => {
    const attributes = {};

    modifiers
      .filter(mod => mod.is_active)
      .sort((a, b) => b.priority - a.priority)
      .forEach(mod => {
        const count = tagCounts[mod.tag_path] || 0;
        const value = calculateModifierValue(mod, count);

        if (!attributes[mod.affected_attribute_id]) {
          attributes[mod.affected_attribute_id] = {
            base: 100, // 假设基础值为100
            add: 0,
            multiply: 1,
            flat_add: 0,
            override: null,
            operations: []
          };
        }

        const attr = attributes[mod.affected_attribute_id];

        if (count > 0) {
          attr.operations.push({
            modifier: mod.modifier_name,
            operation: mod.operation_type,
            value: value,
            tagCount: count
          });
        }

        switch (mod.operation_type) {
          case 'add':
            attr.add += value;
            break;
          case 'multiply':
            attr.multiply *= value;
            break;
          case 'flat_add':
            attr.flat_add += value;
            break;
          case 'override':
            if (attr.override === null || value > attr.override) {
              attr.override = value;
            }
            break;
        }
      });

    // 计算最终值: (base + add) * multiply + flat_add
    Object.keys(attributes).forEach(attrId => {
      const attr = attributes[attrId];
      if (attr.override !== null) {
        attr.final = attr.override;
      } else {
        attr.final = (attr.base + attr.add) * attr.multiply + attr.flat_add;
      }
    });

    return attributes;
  }, [modifiers, tagCounts]);

  const filteredModifiers = useMemo(() => {
    if (!searchQuery) return modifiers;
    return modifiers.filter(mod => 
      mod.modifier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.tag_path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [modifiers, searchQuery]);

  const uniqueTagPaths = useMemo(() => {
    return [...new Set(modifiers.map(mod => mod.tag_path))];
  }, [modifiers]);

  const updateTagCount = (tagPath, delta) => {
    setTagCounts(prev => ({
      ...prev,
      [tagPath]: Math.max(0, (prev[tagPath] || 0) + delta)
    }));
  };

  const setTagCount = (tagPath, value) => {
    setTagCounts(prev => ({
      ...prev,
      [tagPath]: Math.max(0, parseInt(value) || 0)
    }));
  };

  const resetAll = () => {
    setTagCounts({});
  };

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-white">
      {/* 左侧：标签计数器 */}
      <div className="w-96 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
        <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-300">标签计数器</span>
          <div className="flex-1" />
          <Button size="sm" onClick={resetAll} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            重置
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {uniqueTagPaths.map(tagPath => {
            const count = tagCounts[tagPath] || 0;
            const affectedModifiers = modifiers.filter(mod => mod.tag_path === tagPath && mod.is_active);

            return (
              <div key={tagPath} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-3">
                <div className="text-sm font-semibold text-white mb-1 font-mono">{tagPath}</div>
                <div className="text-xs text-gray-500 mb-2">
                  影响 {affectedModifiers.length} 个修饰器
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateTagCount(tagPath, -1)}
                    disabled={count === 0}
                    className="h-7 w-7 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d] disabled:opacity-30"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>

                  <Input
                    type="number"
                    value={count}
                    onChange={(e) => setTagCount(tagPath, e.target.value)}
                    className="h-7 flex-1 text-center bg-[#2d2d2d] border-[#3d3d3d] text-white font-semibold"
                  />

                  <Button
                    size="sm"
                    onClick={() => updateTagCount(tagPath, 1)}
                    className="h-7 w-7 p-0 bg-[#0e639c] hover:bg-[#1177bb]"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 中间：修饰器列表 */}
      <div className="flex-1 flex flex-col">
        <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
          <span className="text-sm font-semibold text-gray-300">修饰器效果</span>
          <span className="text-xs text-gray-500">共 {filteredModifiers.length} 个</span>

          <div className="flex-1" />

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <Input
              placeholder="搜索修饰器..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {filteredModifiers.map(mod => {
            const count = tagCounts[mod.tag_path] || 0;
            const value = calculateModifierValue(mod, count);
            const steps = Math.floor(count / mod.tag_count_per_step);
            const isActive = mod.is_active && count > 0 && steps > 0;

            return (
              <div 
                key={mod.id} 
                className={`border rounded p-3 transition-all ${
                  isActive 
                    ? 'border-[#0e639c] bg-[#0e639c]/10' 
                    : 'border-[#3d3d3d] bg-[#252526]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">{mod.modifier_name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
                  </div>
                  {isActive && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        {mod.operation_type === 'multiply' ? `×${value.toFixed(2)}` : `${value > 0 ? '+' : ''}${value.toFixed(1)}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {steps} 层效果
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">标签路径：</span>
                    <span className="text-gray-300 font-mono">{mod.tag_path}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">每 {mod.tag_count_per_step} 个触发</span>
                  </div>
                  <div>
                    <span className="text-gray-500">操作：</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#3d3d3d] text-gray-300 ml-1">{mod.operation_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">曲线：</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#3d3d3d] text-gray-300 ml-1">{mod.curve_type}</span>
                  </div>
                  {mod.max_stacks && (
                    <div>
                      <span className="text-gray-500">最大层数：{mod.max_stacks}</span>
                    </div>
                  )}
                </div>

                {isActive && (
                  <div className="mt-2 pt-2 border-t border-[#3d3d3d]">
                    <div className="text-xs text-gray-400">
                      当前标签数：{count} → 触发层数：{steps} → 影响 
                      <span className="text-blue-400 font-semibold ml-1">{mod.affected_attribute_id}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧：属性汇总 */}
      <div className="w-96 bg-[#252526] border-l border-[#3d3d3d] flex flex-col">
        <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4">
          <span className="text-sm font-semibold text-gray-300">属性汇总</span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {Object.keys(attributeValues).length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-12">
              调整标签数量查看属性变化
            </div>
          ) : (
            Object.entries(attributeValues).map(([attrId, attr]) => (
              <div key={attrId} className="bg-[#1e1e1e] border border-[#3d3d3d] rounded p-4">
                <h3 className="text-lg font-semibold text-white mb-3 font-mono">{attrId}</h3>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">基础值</span>
                    <span className="text-gray-300">{attr.base.toFixed(1)}</span>
                  </div>
                  {attr.add !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">加法修饰</span>
                      <span className="text-green-400">+{attr.add.toFixed(1)}</span>
                    </div>
                  )}
                  {attr.multiply !== 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">乘法修饰</span>
                      <span className="text-blue-400">×{attr.multiply.toFixed(2)}</span>
                    </div>
                  )}
                  {attr.flat_add !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">固定加成</span>
                      <span className="text-yellow-400">+{attr.flat_add.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#3d3d3d] flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">最终值</span>
                  <span className="text-2xl font-bold text-green-400">{attr.final.toFixed(1)}</span>
                </div>

                {attr.operations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#3d3d3d]">
                    <div className="text-xs text-gray-500 mb-2">应用的修饰器：</div>
                    {attr.operations.map((op, idx) => (
                      <div key={idx} className="text-xs text-gray-400 mb-1">
                        • {op.modifier} ({op.tagCount} 标签)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}