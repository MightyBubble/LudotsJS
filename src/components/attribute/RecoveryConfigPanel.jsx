import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';

export default function RecoveryConfigPanel({ config, keys, onChange }) {
  const recoveryConfig = config || { enabled: false };

  const handleChange = (field, value) => {
    onChange({ ...recoveryConfig, [field]: value });
  };

  return (
    <div className="border border-[#3d3d3d] rounded p-3 bg-[#1e1e1e] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-white/90">回复行为</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={recoveryConfig.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-xs text-white/70">启用</span>
        </label>
      </div>

      {recoveryConfig.enabled && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">目标键</label>
            <Select
              value={recoveryConfig.target_key || ''}
              onValueChange={(v) => handleChange('target_key', v)}
            >
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择要回复的键" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                {keys.map(k => (
                  <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">回复速率/秒</label>
            <div className="space-y-1.5">
              <Select
                value={recoveryConfig.recovery_rate_key || ''}
                onValueChange={(v) => {
                  handleChange('recovery_rate_key', v);
                  if (v) handleChange('recovery_rate_value', undefined);
                }}
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
              {!recoveryConfig.recovery_rate_key && (
                <Input
                  type="number"
                  step="0.1"
                  value={recoveryConfig.recovery_rate_value ?? 1}
                  onChange={(e) => handleChange('recovery_rate_value', parseFloat(e.target.value) || 0)}
                  className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
                  placeholder="回复速率"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">回复延迟（秒）</label>
            <div className="space-y-1.5">
              <Select
                value={recoveryConfig.recovery_delay_key || ''}
                onValueChange={(v) => {
                  handleChange('recovery_delay_key', v);
                  if (v) handleChange('recovery_delay_value', undefined);
                }}
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
              {!recoveryConfig.recovery_delay_key && (
                <Input
                  type="number"
                  step="0.1"
                  value={recoveryConfig.recovery_delay_value ?? 0}
                  onChange={(e) => handleChange('recovery_delay_value', parseFloat(e.target.value) || 0)}
                  className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
                  placeholder="回复延迟"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}