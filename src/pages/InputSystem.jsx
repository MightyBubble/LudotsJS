import React from 'react';
import { Gamepad2 } from 'lucide-react';

const PIPELINE = [
  'Input Buffer（固定容量，按 tick + sequence 记录 Pressed / Released / AxisChanged）',
  'Combo Recognizer（InputPattern：totalWindowTicks + steps.maxGapTicks）',
  'Command Intent（识别成功后生成 Intent，不直接执行 Ability）',
  'Order Router（InputOrderMapping → Order，AbilityOrderRoute → AbilityRequest）',
  'AbilityRequest（Ability 不读取 InputAction 或物理按键）',
];

export default function InputSystemPage() {
  return (
    <div className="h-full overflow-auto bg-[#0D0F14] text-white">
      <div className="h-10 bg-[#15171C] border-b border-[#2A2E37] flex items-center px-4 gap-3">
        <Gamepad2 className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">输入与订单</span>
      </div>
      <div className="p-4 max-w-3xl space-y-3">
        <p className="text-xs text-gray-400">
          此模块的实体（InputAction / InputContext / ControlScheme / InputBufferProfile / InputPattern /
          CommandIntentProfile / InputOrderMapping / AbilityOrderRoute / CastCommitProfile / CastDispatchProfile）
          将在下一阶段实现，管线约定已固定如下：
        </p>
        <ol className="space-y-2">
          {PIPELINE.map((s, i) => (
            <li key={i} className="bg-[#15171C] border border-[#2A2E37] rounded p-3 text-xs text-gray-300">
              <span className="text-[#D97706] mr-2">{i + 1}</span>{s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}