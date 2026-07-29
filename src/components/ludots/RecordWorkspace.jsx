import React, { useMemo, useState } from 'react';
import AssetBrowserPanel from '@/components/assetBrowser/AssetBrowserPanel';
import PageActions from '@/components/shell/PageActions';
import RecordTable from '@/components/ludots/RecordTable';
import { SearchBox, ToolButton, ViewSwitch, S } from '@/components/shell/ui';
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
  const [searchQuery, setSearchQuery] = useState('');
  const changeView = (v) => { setView(v); localStorage.setItem(storageKey, v); };
  const hasTable = Array.isArray(columns) && columns.length > 0;
  const visibleRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((record) => {
      const item = toItem(record);
      return `${item.name || ''} ${item.subtitle || ''}`.toLowerCase().includes(q);
    });
  }, [records, searchQuery, toItem]);

  return (
    <div className={S.page}>
      <PageActions>
        <SearchBox value={searchQuery} onChange={setSearchQuery} />
        {hasTable && (
          <ViewSwitch
            value={view}
            onChange={changeView}
            options={[
              { value: 'tree', label: '详情', icon: ListTree, title: '文件树 + 详情' },
              { value: 'table', label: '表格', icon: Table2, title: '二维表' },
            ]}
          />
        )}
        {headerRight}
        {onCreate && <ToolButton icon={Plus} tone="primary" onClick={onCreate}>新建</ToolButton>}
        {onSave && (
          <ToolButton icon={Save} onClick={onSave} disabled={!selectedId || view !== 'tree'}>保存{dirty ? ' *' : ''}</ToolButton>
        )}
      </PageActions>

      {view === 'table' && hasTable ? (
        <div className="flex-1 overflow-hidden">
          <RecordTable
            records={visibleRecords}
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
            records={visibleRecords}
            toItem={toItem}
            hideSearch
            selectedId={selectedId}
            onSelect={onSelect}
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