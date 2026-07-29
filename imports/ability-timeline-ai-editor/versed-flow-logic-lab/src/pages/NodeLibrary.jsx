import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BEHAVIOR_LIST, BEHAVIORS, EVALUATORS } from '@/lib/simBehaviors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ConditionConfigEditor from '@/components/test/ConditionConfigEditor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Play, HelpCircle, Boxes } from 'lucide-react';

export default function NodeLibrary() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    node_type: 'action',
    category: '',
    behavior_key: '',
    config: null,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.TaskNode.list();
      setNodes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      node_type: 'action',
      category: '通用',
      behavior_key: '',
      config: null,
    });
    setDialogOpen(true);
  };

  const openEdit = (node) => {
    setEditing(node);
    setForm({
      name: node.name || '',
      description: node.description || '',
      node_type: node.node_type || 'action',
      category: node.category || '通用',
      behavior_key: node.behavior_key || '',
      config: node.config || null,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name) return;
    const isAction = form.node_type === 'action';
    if (isAction && !form.behavior_key) return;
    if (!isAction && !form.config?.evaluator) return;

    const payload = {
      name: form.name,
      description: form.description,
      node_type: form.node_type,
      category: form.category,
    };
    if (isAction) {
      payload.behavior_key = form.behavior_key;
    } else {
      payload.config = form.config;
    }

    if (editing) {
      await base44.entities.TaskNode.update(editing.id, payload);
    } else {
      await base44.entities.TaskNode.create(payload);
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    await base44.entities.TaskNode.delete(id);
    load();
  };

  const filteredBehaviors = BEHAVIOR_LIST.filter((b) => b.type === 'action');
  const isAction = form.node_type === 'action';

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">服务节点库</h1>
            <p className="text-sm text-slate-500 mt-1">
              Action 节点映射行为函数，Condition 节点数据驱动配置（评估器 + 参数）
            </p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" />
            新建节点
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">加载中...</div>
        ) : nodes.length === 0 ? (
          <div className="text-center py-20">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">暂无服务节点，点击「新建节点」创建</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => {
              const beh = node.node_type === 'action'
                ? BEHAVIORS[node.behavior_key]
                : EVALUATORS[node.config?.evaluator];
              const nodeIsAction = node.node_type === 'action';
              const Icon = nodeIsAction ? Play : HelpCircle;
              return (
                <div
                  key={node.id}
                  className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        nodeIsAction ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(node)}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(node.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{node.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        nodeIsAction
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {nodeIsAction ? 'Action' : 'Condition'}
                    </span>
                    {beh && (
                      <span className="text-[10px] text-slate-400">{beh.label}</span>
                    )}
                  </div>
                  {node.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{node.description}</p>
                  )}
                  {!nodeIsAction && node.config?.params && (
                    <div className="mt-2 text-[10px] text-slate-400 font-mono bg-slate-50 rounded p-1.5 space-y-0.5">
                      {Object.entries(node.config.params).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-slate-500">{k}:</span> {String(v)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑节点' : '新建服务节点'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>名称</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：巡逻、追击、敌人检测"
              />
            </div>
            <div className="space-y-1.5">
              <Label>描述</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="节点功能描述"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>类型</Label>
                <div className="flex gap-2">
                  {['action', 'condition'].map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        setForm({ ...form, node_type: t, behavior_key: '', config: null })
                      }
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.node_type === t
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'action' ? 'Action' : 'Condition'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>分类</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="如：移动、战斗"
                />
              </div>
            </div>

            {/* Action: behavior selector | Condition: data-driven config editor */}
            {isAction ? (
              <div className="space-y-1.5">
                <Label>行为实现</Label>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                  {filteredBehaviors.map((b) => (
                    <button
                      key={b.key}
                      onClick={() => setForm({ ...form, behavior_key: b.key })}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                        form.behavior_key === b.key
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium text-slate-800">{b.label}</div>
                      <div className="text-[11px] text-slate-400">{b.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>条件配置（数据驱动）</Label>
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <ConditionConfigEditor
                    config={form.config || {}}
                    onChange={(config) => setForm({ ...form, config })}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={save}
              disabled={!form.name || (isAction ? !form.behavior_key : !form.config?.evaluator)}
            >
              {editing ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}