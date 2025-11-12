import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileJson, FileText, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ImportExport({ tags, onImportComplete }) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const exportToJSON = () => {
    const data = JSON.stringify(tags, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gameplaytags_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['name', 'full_path', 'parent_path', 'depth', 'category', 'description', 'is_locked'];
    const rows = tags.map(tag => [
      tag.name,
      tag.full_path,
      tag.parent_path || '',
      tag.depth,
      tag.category,
      tag.description || '',
      tag.is_locked || false
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gameplaytags_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      let importedTags = [];

      if (file.name.endsWith('.json')) {
        importedTags = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        importedTags = lines.slice(1).map(line => {
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').trim());
          const tag = {};
          headers.forEach((header, i) => {
            if (header === 'depth') {
              tag[header] = parseInt(values[i]);
            } else if (header === 'is_locked') {
              tag[header] = values[i] === 'true';
            } else {
              tag[header] = values[i] || null;
            }
          });
          return tag;
        });
      }

      // 验证和导入
      const existingPaths = new Set(tags.map(t => t.full_path));
      const toCreate = importedTags.filter(tag => !existingPaths.has(tag.full_path));

      if (toCreate.length === 0) {
        setError('没有找到新的标签需要导入');
        setImporting(false);
        return;
      }

      // 批量创建
      const creates = toCreate.map(tag => 
        base44.entities.GameplayTag.create({
          name: tag.name,
          full_path: tag.full_path,
          parent_path: tag.parent_path || "",
          depth: tag.depth || 0,
          category: tag.category || "other",
          description: tag.description || "",
          is_locked: tag.is_locked || false,
          usage_count: 0,
        })
      );

      await Promise.all(creates);
      
      if (onImportComplete) {
        onImportComplete();
      }

      alert(`成功导入 ${toCreate.length} 个标签`);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-4 bg-[#252526] border border-[#3d3d3d] rounded">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">导入/导出</h3>
      
      <div className="space-y-3">
        {/* 导出 */}
        <div>
          <div className="text-xs text-gray-400 mb-2">导出标签数据</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={exportToJSON}
              className="flex-1 border-[#3d3d3d] hover:bg-[#2d2d2d]"
            >
              <FileJson className="w-4 h-4 mr-2" />
              导出 JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportToCSV}
              className="flex-1 border-[#3d3d3d] hover:bg-[#2d2d2d]"
            >
              <FileText className="w-4 h-4 mr-2" />
              导出 CSV
            </Button>
          </div>
        </div>

        {/* 导入 */}
        <div>
          <div className="text-xs text-gray-400 mb-2">导入标签数据</div>
          <label className="block">
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full border-[#3d3d3d] hover:bg-[#2d2d2d]"
              disabled={importing}
              onClick={(e) => e.currentTarget.previousElementSibling.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? '导入中...' : '选择文件导入'}
            </Button>
          </label>
          <div className="text-xs text-gray-500 mt-1">
            支持 JSON 和 CSV 格式
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}