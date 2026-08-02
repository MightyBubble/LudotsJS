import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getTypeColor, getTypeShape } from './nodeConfigs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function BlackboardPanel({ blackboard, onChange, terminology = '黑板变量' }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newVar, setNewVar] = useState({ name: '', value: 0, type: 'number', public: true });

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

  const { data: relations = [] } = useQuery({
    queryKey: ['entityRelations'],
    queryFn: () => base44.entities.EntityRelation.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const { data: prototypes = [] } = useQuery({
    queryKey: ['entityPrototypes'],
    queryFn: () => base44.entities.EntityPrototype.list(),
    initialData: [],
  });

  const variables = Object.entries(blackboard || {}).map(([key, data]) => ({
    key,
    ...data
  }));

  const handleAdd = () => {
    if (!newVar.name || blackboard[newVar.name]) {
      alert('请输入唯一的变量名');
      return;
    }

    onChange({
      ...blackboard,
      [newVar.name]: {
        value: newVar.value,
        type: newVar.type,
        public: newVar.public
      }
    });

    setNewVar({ name: '', value: 0, type: 'number', public: true });
    setIsAdding(false);
  };

  const handleUpdate = (key, field, value) => {
    onChange({
      ...blackboard,
      [key]: {
        ...blackboard[key],
        [field]: value
      }
    });
  };

  const handleDelete = (key) => {
    const newBlackboard = { ...blackboard };
    delete newBlackboard[key];
    onChange(newBlackboard);
  };

  const handleDragStart = (e, key) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ blackboardKey: key }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const getDefaultValueForType = (type) => {
    switch (type) {
      case 'number': return 0;
      case 'string': return '';
      case 'boolean': return false;
      case 'vector2': return { x: 0, y: 0 };
      case 'vector3': return { x: 0, y: 0, z: 0 };
      case 'vector4': return { x: 0, y: 0, z: 0, w: 0 };
      case 'color': return { r: 1, g: 1, b: 1 };
      case 'relation': return '';
      case 'attribute': return '';
      case 'tag': return '';
      case 'entityPrototype': return '';
      case 'entitySet': return [];
      default: return 0;
    }
  };

  const renderTypeIndicator = (type) => {
    const color = getTypeColor(type);
    const shape = getTypeShape(type);
    const size = 10;
    
    const shapeElement = () => {
      const commonProps = {
        style: { fill: color, stroke: '#1a1a1a', strokeWidth: 1 }
      };
      
      switch (shape) {
        case 'circle':
          return <circle cx={size/2} cy={size/2} r={size/2 - 1} {...commonProps} />;
        case 'square':
          return <rect x={1} y={1} width={size - 2} height={size - 2} {...commonProps} />;
        case 'diamond':
          return <polygon points={`${size/2},1 ${size-1},${size/2} ${size/2},${size-1} 1,${size/2}`} {...commonProps} />;
        case 'triangle':
          return <polygon points={`${size/2},1 ${size-1},${size-1} 1,${size-1}`} {...commonProps} />;
        default:
          return <circle cx={size/2} cy={size/2} r={size/2 - 1} {...commonProps} />;
      }
    };
    
    return (
      <svg width={size} height={size} style={{ minWidth: size, minHeight: size }}>
        {shapeElement()}
      </svg>
    );
  };

  return (
    <div className="w-full flex flex-col bg-transparent">
      <style>{`
        .blackboard-scroll::-webkit-scrollbar { width: 8px; }
        .blackboard-scroll::-webkit-scrollbar-track { background: #2d2d2d; }
        .blackboard-scroll::-webkit-scrollbar-thumb { background: #4a4a4a; border-radius: 4px; }
        .blackboard-scroll::-webkit-scrollbar-thumb:hover { background: #5a5a5a; }
      `}</style>

      <div className="flex items-center justify-end px-2 pt-2">
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button aria-label={`添加${terminology}`} size="sm" className="h-6 px-2 bg-[#D97706] hover:bg-[#1177bb] text-white">
              <Plus className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#15171C] border-[#2A2E37] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">添加{terminology}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">变量名</label>
                <Input
                  value={newVar.name}
                  onChange={(e) => setNewVar({ ...newVar, name: e.target.value })}
                  placeholder="variable_name"
                  className="bg-[#3c3c3c] border-[#434343] text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">类型</label>
                <Select
                  value={newVar.type}
                  onValueChange={(val) => setNewVar({ ...newVar, type: val, value: getDefaultValueForType(val) })}
                >
                  <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    <SelectItem value="number" className="text-white">数值</SelectItem>
                    <SelectItem value="string" className="text-white">字符串</SelectItem>
                    <SelectItem value="boolean" className="text-white">布尔</SelectItem>
                    <SelectItem value="vector2" className="text-white">二维向量</SelectItem>
                    <SelectItem value="vector3" className="text-white">三维向量</SelectItem>
                    <SelectItem value="vector4" className="text-white">四维向量</SelectItem>
                    <SelectItem value="color" className="text-white">颜色</SelectItem>
                    <SelectItem value="relation" className="text-white">关系</SelectItem>
                    <SelectItem value="attribute" className="text-white">属性</SelectItem>
                    <SelectItem value="tag" className="text-white">标签</SelectItem>
                    <SelectItem value="entityPrototype" className="text-white">实体原型</SelectItem>
                    <SelectItem value="entitySet" className="text-white">实体集</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">初始值</label>
                {newVar.type === 'number' && (
                  <Input
                    type="number"
                    value={newVar.value}
                    onChange={(e) => setNewVar({ ...newVar, value: parseFloat(e.target.value) || 0 })}
                    className="bg-[#3c3c3c] border-[#434343] text-white"
                  />
                )}
                {newVar.type === 'string' && (
                  <Input
                    value={newVar.value}
                    onChange={(e) => setNewVar({ ...newVar, value: e.target.value })}
                    className="bg-[#3c3c3c] border-[#434343] text-white"
                  />
                )}
                {newVar.type === 'boolean' && (
                  <Select
                    value={newVar.value ? 'true' : 'false'}
                    onValueChange={(val) => setNewVar({ ...newVar, value: val === 'true' })}
                  >
                    <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      <SelectItem value="true" className="text-white">true</SelectItem>
                      <SelectItem value="false" className="text-white">false</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {newVar.type === 'relation' && (
                  <Select
                    value={newVar.value}
                    onValueChange={(val) => setNewVar({ ...newVar, value: val })}
                  >
                    <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                      <SelectValue placeholder="选择关系" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {relations.map(r => (
                        <SelectItem key={r.id} value={r.relation_id} className="text-white">
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {newVar.type === 'attribute' && (
                  <Select
                    value={newVar.value}
                    onValueChange={(val) => setNewVar({ ...newVar, value: val })}
                  >
                    <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                      <SelectValue placeholder="选择属性" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {attributes.map(a => (
                        <SelectItem key={a.id} value={a.attribute_id} className="text-white">
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {newVar.type === 'tag' && (
                  <Select
                    value={newVar.value}
                    onValueChange={(val) => setNewVar({ ...newVar, value: val })}
                  >
                    <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                      <SelectValue placeholder="选择标签" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {tags.map(t => (
                        <SelectItem key={t.id} value={t.full_path} className="text-white">
                          {t.full_path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {newVar.type === 'entityPrototype' && (
                  <Select
                    value={newVar.value}
                    onValueChange={(val) => setNewVar({ ...newVar, value: val })}
                  >
                    <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                      <SelectValue placeholder="选择原型" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {prototypes.map(p => (
                        <SelectItem key={p.id} value={p.prototype_id} className="text-white">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {newVar.type === 'entitySet' && (
                  <div className="text-xs text-white/50">实体集（初始为空数组）</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newVar.public}
                  onChange={(e) => setNewVar({ ...newVar, public: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-white/70">公开（可拖拽创建Get/Set节点）</label>
              </div>
              <Button onClick={handleAdd} className="w-full bg-[#D97706] hover:bg-[#1177bb]">
                添加
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 blackboard-scroll">
        {variables.length === 0 && (
          <div className="text-center py-8 text-white/40 text-xs">
            <Database className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p>暂无变量</p>
          </div>
        )}

        {variables.map((variable) => (
          <div
            key={variable.key}
            draggable={variable.public}
            onDragStart={(e) => handleDragStart(e, variable.key)}
            className={`bg-[#15171C] rounded px-2 py-1.5 border border-[#2A2E37] ${
              variable.public ? 'cursor-move hover:border-[#D97706]' : 'cursor-default'
            } transition-colors`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                {renderTypeIndicator(variable.type)}
                <span className="text-[11px] font-mono text-white/90">{variable.key}</span>
                <button
                  onClick={() => handleUpdate(variable.key, 'public', !variable.public)}
                  className="text-white/30 hover:text-white/70"
                >
                  {variable.public ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                </button>
              </div>
              <button
                onClick={() => handleDelete(variable.key)}
                className="text-white/30 hover:text-red-400"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>

            {variable.type === 'number' && (
              <Input
                type="number"
                value={variable.value ?? 0}
                onChange={(e) => handleUpdate(variable.key, 'value', parseFloat(e.target.value) || 0)}
                className="h-5 text-[10px] px-1.5 bg-[#1e1e1e] border-[#434343] text-white"
              />
            )}

            {variable.type === 'string' && (
              <Input
                value={variable.value ?? ''}
                onChange={(e) => handleUpdate(variable.key, 'value', e.target.value)}
                className="h-5 text-[10px] px-1.5 bg-[#1e1e1e] border-[#434343] text-white"
              />
            )}

            {variable.type === 'boolean' && (
              <Select
                value={variable.value ? 'true' : 'false'}
                onValueChange={(val) => handleUpdate(variable.key, 'value', val === 'true')}
              >
                <SelectTrigger className="h-6 text-xs bg-[#1e1e1e] border-[#434343] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  <SelectItem value="true" className="text-white text-xs">true</SelectItem>
                  <SelectItem value="false" className="text-white text-xs">false</SelectItem>
                </SelectContent>
              </Select>
            )}

            {variable.type === 'relation' && (
              <Select
                value={variable.value ?? ''}
                onValueChange={(val) => handleUpdate(variable.key, 'value', val)}
              >
                <SelectTrigger className="h-6 text-xs bg-[#1e1e1e] border-[#434343] text-white">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  {relations.map(r => (
                    <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {variable.type === 'attribute' && (
              <Select
                value={variable.value ?? ''}
                onValueChange={(val) => handleUpdate(variable.key, 'value', val)}
              >
                <SelectTrigger className="h-6 text-xs bg-[#1e1e1e] border-[#434343] text-white">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  {attributes.map(a => (
                    <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {variable.type === 'tag' && (
              <Select
                value={variable.value ?? ''}
                onValueChange={(val) => handleUpdate(variable.key, 'value', val)}
              >
                <SelectTrigger className="h-6 text-xs bg-[#1e1e1e] border-[#434343] text-white">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  {tags.map(t => (
                    <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">
                      {t.full_path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {variable.type === 'entityPrototype' && (
              <Select
                value={variable.value ?? ''}
                onValueChange={(val) => handleUpdate(variable.key, 'value', val)}
              >
                <SelectTrigger className="h-6 text-xs bg-[#1e1e1e] border-[#434343] text-white">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  {prototypes.map(p => (
                    <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {variable.type === 'entitySet' && (
              <div className="text-xs text-white/50 font-mono">
                [{Array.isArray(variable.value) ? variable.value.length : 0}]
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-[#2A2E37] text-[10px] text-white/40">
        拖拽公开变量到画布创建Get/Set节点
      </div>
    </div>
  );
}