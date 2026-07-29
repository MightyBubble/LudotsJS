import React from 'react';
import AssetBrowserPanel from '@/components/assetBrowser/AssetBrowserPanel';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

/** 通用「左侧资产树 + 右侧详情」工作区外壳 */
export default function RecordWorkspace({
  title,
  icon: Icon,
  entityName,
  records,
  toItem,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onSave,
  dirty,
  headerRight,
  children,
  emptyHint = '从左侧选择或新建一条记录',
}) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0D0F14] text-[#e5e5e5]">
      {(headerRight || (selectedId && onSave)) && (
        <div className="h-9 bg-[#15171C] border-b border-[#2A2E37] flex items-center justify-end px-3 gap-3">
          {headerRight}
          {selectedId && onSave && (
            <Button onClick={onSave} size="sm" className="h-7 bg-[#D97706] hover:bg-[#B45309] text-black text-xs">
              <Save className="w-3 h-3 mr-1" />保存{dirty ? ' *' : ''}
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <AssetBrowserPanel
          entityName={entityName}
          records={records}
          toItem={toItem}
          selectedId={selectedId}
          onSelect={onSelect}
          onCreate={onCreate}
          onDelete={onDelete}
        />
        <div className="flex-1 overflow-y-auto p-4 min-w-0">
          {children || <div className="h-full flex items-center justify-center text-gray-600 text-sm">{emptyHint}</div>}
        </div>
      </div>
    </div>
  );
}