import React, { useState } from 'react';
import AssetBrowserPanel from '@/components/assetBrowser/AssetBrowserPanel';
import PageActions from '@/components/shell/PageActions';
import RecordTable from '@/components/ludots/RecordTable';
import { ToolButton, S } from '@/components/shell/ui';
import { Save, ListTree, Table2, Plus } from 'lucide-react';

/**
 * 所有数据实例的统一工作区：
 * 视图 A（tree）：左侧文件树（虚拟层级）+ 右侧详情
 * 视图 B（table）：全宽二维表（需传 columns）
 * 所有操作统一投递到二级导航行。
 */
export default function RecordWorkspace({
  entityName,
  records,
  toItem,
  columns,
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
  const storageKey = `ludots.view.${entityName}`;
  const [view, setView] = useState(() => localStorage.getItem(storageKey) || 'tree');
  const changeView = (v) => { setView(v); localStorage.setItem(storageKey, v); };
  const hasTable = Array.isArray(columns) && columns.length > 0;

  return (
    <div className={S.page}>
      <PageActions>
        {headerRight}
        {hasTable && (
          <div className="flex items-center gap-1">
            <ToolButton icon={ListTree} tone={view === 'tree' ? 'primary' : 'default'} title="文件树 + 详情" onClick={() => changeView('tree')}>详情</ToolButton>
            <ToolButton icon={Table2} tone={view === 'table' ? 'primary' : 'default'} title="二维表" onClick={() => changeView('table')}>表格</ToolButton>
          </div>
        )}
        {view === 'table' && onCreate && <ToolButton icon={Plus} onClick={onCreate}>新建</ToolButton>}
        {view === 'tree' && selectedId && onSave && (
          <ToolButton icon={Save} tone="primary" onClick={onSave}>保存{dirty ? ' *' : ''}</ToolButton>
        )}
      </PageActions>

      {view === 'table' && hasTable ? (
        <div className="flex-1 overflow-hidden">
          <RecordTable
            records={records}
            columns={columns}
            selectedId={selectedId}
            onSelect={(r) => { onSelect?.(r); changeView('tree'); }}
            onDelete={onDelete}
          />
        </div>
      ) : (
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
      )}
    </div>
  );
}