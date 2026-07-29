import React from 'react';
import AssetBrowserPanel from '@/components/assetBrowser/AssetBrowserPanel';
import PageActions from '@/components/shell/PageActions';
import { ToolButton, S } from '@/components/shell/ui';
import { Save } from 'lucide-react';

/** 通用「左侧资产树 + 右侧详情」工作区外壳（操作统一投递到二级 Tab 行） */
export default function RecordWorkspace({
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
    <div className={S.page}>
      <PageActions>
        {headerRight}
        {selectedId && onSave && (
          <ToolButton icon={Save} tone="primary" onClick={onSave}>
            保存{dirty ? ' *' : ''}
          </ToolButton>
        )}
      </PageActions>

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
          {children || <div className={S.empty}>{emptyHint}</div>}
        </div>
      </div>
    </div>
  );
}