import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MinusSquare, MaximizeSquare } from 'lucide-react';

export default function ClampConfigPanel({ config, keys, onChange }) {
  const clampConfig = config || { enabled: false };

  const handleChange = (field, value) => {
    onChange({ ...clampConfig, [field]: value });
  };

  return (
    <div className="border border-[#3d3d3d] rounded p-3 bg-[#1e1e1e] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MinusSquare className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white/90">钳制约束</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={clampConfig.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-xs text-white/70">启用</span>
        </label>
      </div>

      {clampConfig.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">最小值</label>
            <div className="space-y-1.5">
              <Select
                value={clampConfig.min_key || ''}
                onValueChange={(v) => handleChange('min_key', v)}
              >
                <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                  <SelectValue placeholder="选择键或固定值" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                  <SelectItem value={null} className="text-white text-xs">固定值</SelectItem>
                  {keys.map(k => (
                    <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!clampConfig.min_key && (
                <Input
                  type="number"
                  step="0.1"
                  value={clampConfig.min_value ?? 0}
                  onChange={(e) => handleChange('min_value', parseFloat(e.target.value) || 0)}
                  className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
                  placeholder="最小值"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">最大值</label>
            <div className="space-y-1.5">
              <Select
                value={clampConfig.max_key || ''}
                onValueChange={(v) => handleChange('max_key', v)}
              >
                <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                  <SelectValue placeholder="选择键或固定值" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                  <SelectItem value={null} className="text-white text-xs">固定值</SelectItem>
                  {keys.map(k => (
                    <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!clampConfig.max_key && (
                <Input
                  type="number"
                  step="0.1"
                  value={clampConfig.max_value ?? 100}
                  onChange={(e) => handleChange('max_value', parseFloat(e.target.value) || 0)}
                  className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
                  placeholder="最大值"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}