import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PerformerEditDecisionDialog({ open, node, onOpenChange, onEditTemplate, onBreak }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="border-[#424a55] bg-[#171b21] text-[#e5e5e5]">
      <DialogHeader>
        <DialogTitle>如何编辑这个继承节点？</DialogTitle>
        <DialogDescription className="text-gray-400">
          该节点属于模板 {node?.templateOwnerId || node?.instance?.definition_id}。为避免跨模板局部覆盖，请选择修改模板，或先 Break 当前子实例。
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-2 text-xs text-gray-400">
        <p><strong className="text-gray-200">修改模板：</strong>打开拥有该节点的 Performer，修改会影响所有引用者。</p>
        <p><strong className="text-gray-200">Break 子实例：</strong>把完整嵌套树复制到当前根 Performer，后续修改仅影响当前实例。</p>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
        <Button variant="outline" onClick={onEditTemplate}>修改模板</Button>
        <Button onClick={onBreak}>Break 子实例</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}