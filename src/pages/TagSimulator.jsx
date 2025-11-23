import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, AlertCircle, Check, Ban, Zap, Trash2, Power, Eraser, Info, ArrowRight, Shield, Layers } from "lucide-react";

export default function TagSimulator() {
  const [entityName, setEntityName] = useState("Test Entity");
  const [activeTags, setActiveTags] = useState(new Set());
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['tagCategories'],
    queryFn: () => base44.entities.TagCategory.list(),
    initialData: [],
  });

  const getCategoryColor = (categoryKey) => {
    if (!categories || !Array.isArray(categories)) return '#94a3b8';
    const category = categories.find(c => c.key === categoryKey);
    return category?.color || '#94a3b8';
  };

  // Check if tag can be added
  const canAddTag = (tag) => {
    if (activeTags.has(tag.full_path)) return { canAdd: false, reason: "Already Added" };

    if (tag.required_tags && tag.required_tags.length > 0) {
      const missingRequired = tag.required_tags.filter(reqTag => !activeTags.has(reqTag));
      if (missingRequired.length > 0) {
        return { canAdd: false, reason: `Missing: ${missingRequired.join(', ')}` };
      }
    }

    if (tag.blocked_tags && tag.blocked_tags.length > 0) {
      const blockingTags = tag.blocked_tags.filter(blockTag => activeTags.has(blockTag));
      if (blockingTags.length > 0) {
        return { canAdd: false, reason: `Blocked by: ${blockingTags.join(', ')}` };
      }
    }

    return { canAdd: true };
  };

  const simulateAddTag = (tag) => {
    const result = { willAttach: [], willRemove: [], willDisable: false, willBeRemoved: false };

    if (tag.attached_tags) result.willAttach = tag.attached_tags;
    if (tag.removed_tags) result.willRemove = tag.removed_tags.filter(t => activeTags.has(t));

    if (tag.disabled_if_tags?.tags?.length > 0) {
      const matchMode = tag.disabled_if_tags.match_mode || "any";
      const matches = tag.disabled_if_tags.tags.filter(t => activeTags.has(t));
      if ((matchMode === "any" && matches.length > 0) || (matchMode === "all" && matches.length === tag.disabled_if_tags.tags.length)) {
        result.willDisable = true;
      }
    }

    if (tag.remove_if_tags?.tags?.length > 0) {
      const matchMode = tag.remove_if_tags.match_mode || "any";
      const matches = tag.remove_if_tags.tags.filter(t => activeTags.has(t));
      if ((matchMode === "any" && matches.length > 0) || (matchMode === "all" && matches.length === tag.remove_if_tags.tags.length)) {
        result.willBeRemoved = true;
      }
    }

    return result;
  };

  const handleAddTag = (tag) => {
    const check = canAddTag(tag);
    if (!check.canAdd) return;

    const newActiveTags = new Set(activeTags);
    newActiveTags.add(tag.full_path);

    tag.attached_tags?.forEach(t => newActiveTags.add(t));
    tag.removed_tags?.forEach(t => newActiveTags.delete(t));

    const tagsToRemove = [];
    newActiveTags.forEach(activeTagPath => {
      const activeTag = tags.find(t => t.full_path === activeTagPath);
      if (!activeTag) return;
      if (activeTag.remove_if_tags?.tags?.length > 0) {
        const matchMode = activeTag.remove_if_tags.match_mode || "any";
        const matches = activeTag.remove_if_tags.tags.filter(t => newActiveTags.has(t));
        if ((matchMode === "any" && matches.length > 0) || (matchMode === "all" && matches.length === activeTag.remove_if_tags.tags.length)) {
          tagsToRemove.push(activeTagPath);
        }
      }
    });
    tagsToRemove.forEach(t => newActiveTags.delete(t));
    setActiveTags(newActiveTags);
  };

  const handleRemoveTag = (tagPath) => {
    const newActiveTags = new Set(activeTags);
    newActiveTags.delete(tagPath);
    setActiveTags(newActiveTags);
  };

  const isTagDisabled = (tag) => {
    if (!activeTags.has(tag.full_path)) return false;
    if (tag.disabled_if_tags?.tags?.length > 0) {
      const matchMode = tag.disabled_if_tags.match_mode || "any";
      const matches = tag.disabled_if_tags.tags.filter(t => activeTags.has(t));
      if ((matchMode === "any" && matches.length > 0) || (matchMode === "all" && matches.length === tag.disabled_if_tags.tags.length)) return true;
    }
    return false;
  };

  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags;
    return tags.filter(tag => tag.full_path.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tags, searchQuery]);

  const { addableTags, blockedTags } = useMemo(() => {
    const addable = [], blocked = [];
    filteredTags.forEach(tag => {
      if (activeTags.has(tag.full_path)) return; // Skip active tags in library
      const check = canAddTag(tag);
      if (check.canAdd) addable.push(tag);
      else blocked.push({ tag, reason: check.reason });
    });
    return { addableTags: addable, blockedTags: blocked };
  }, [filteredTags, activeTags]);

  const simulation = selectedTag ? simulateAddTag(selectedTag) : null;

  return (
    <div className="h-screen flex bg-[#0a0a0a] text-[#e5e5e5] font-sans overflow-hidden selection:bg-[#D97706] selection:text-white">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #141414; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>

      {/* Left Sidebar: Active Tags (Entity State) */}
      <div className="w-80 bg-[#141414] border-r border-[#262626] flex flex-col">
        <div className="p-4 border-b border-[#262626] bg-[#141414]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded bg-[#D97706]/10 flex items-center justify-center text-[#D97706]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Entity State</h2>
              <p className="text-[10px] text-gray-500 font-mono">SIMULATION</p>
            </div>
          </div>
          <Input
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            className="h-8 bg-[#0a0a0a] border-[#262626] text-sm text-white focus:border-[#D97706]"
            placeholder="Entity Name"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Tags</span>
            <span className="text-xs font-mono text-[#D97706] bg-[#D97706]/10 px-1.5 py-0.5 rounded">{activeTags.size}</span>
          </div>

          {activeTags.size === 0 ? (
            <div className="text-center py-8 text-gray-600 text-xs border border-dashed border-[#262626] rounded">
              No active tags
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from(activeTags).map(tagPath => {
                const tag = tags.find(t => t.full_path === tagPath);
                if (!tag) return null;
                const disabled = isTagDisabled(tag);

                return (
                  <div 
                    key={tagPath} 
                    className={`group relative p-2.5 rounded border transition-all ${
                      disabled 
                        ? 'bg-[#1a1a1a] border-[#262626] opacity-60' 
                        : 'bg-[#0a0a0a] border-[#262626] hover:border-[#D97706]/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(tag.category_key) }} />
                        <span className={`text-xs font-medium truncate ${disabled ? 'text-gray-500' : 'text-gray-200'}`}>
                          {tag.name}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveTag(tagPath)}
                        className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="font-mono text-[10px] text-gray-500 truncate">{tag.full_path}</div>
                    {disabled && (
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded w-fit">
                        <Power className="w-3 h-3" /> Disabled
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-[#262626] bg-[#141414]">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTags(new Set())}
            className="w-full h-8 text-xs text-gray-500 hover:text-red-400 hover:bg-[#262626]"
            disabled={activeTags.size === 0}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear All Tags
          </Button>
        </div>
      </div>

      {/* Main Content: Library */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0">
        {/* Search Header */}
        <div className="h-14 border-b border-[#262626] flex items-center px-4 gap-4 bg-[#0a0a0a]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 bg-[#141414] border-[#262626] text-sm text-[#e5e5e5] focus:border-[#D97706] rounded-md"
            />
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50" />
              <span>Available ({addableTags.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50" />
              <span>Blocked ({blockedTags.length})</span>
            </div>
          </div>
        </div>

        {/* Library Grid */}
        <div className="flex-1 overflow-hidden flex">
          {/* Available Tags Column */}
          <div className="flex-1 overflow-y-auto p-4 border-r border-[#262626] custom-scrollbar">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-green-500" /> Available
            </h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
              {addableTags.map(tag => (
                <div
                  key={tag.id}
                  onClick={() => setSelectedTag(tag)}
                  className={`group p-3 rounded border cursor-pointer transition-all ${
                    selectedTag?.id === tag.id
                      ? 'bg-[#D97706]/10 border-[#D97706]'
                      : 'bg-[#141414] border-[#262626] hover:border-[#D97706]/50 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: getCategoryColor(tag.category_key) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-200 truncate">{tag.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddTag(tag); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#D97706]/20 text-[#D97706] transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono truncate bg-[#0a0a0a] px-1.5 py-0.5 rounded w-fit">
                        {tag.full_path}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {addableTags.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-600 text-xs italic">
                  No available tags found
                </div>
              )}
            </div>
          </div>

          {/* Blocked Tags Column */}
          <div className="w-1/3 min-w-[250px] overflow-y-auto p-4 bg-[#0c0c0c] custom-scrollbar">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Ban className="w-3.5 h-3.5 text-red-500" /> Blocked
            </h3>
            <div className="space-y-2">
              {blockedTags.map(({ tag, reason }) => (
                <div
                  key={tag.id}
                  onClick={() => setSelectedTag(tag)}
                  className={`p-3 rounded border border-[#262626] bg-[#141414] opacity-70 hover:opacity-100 transition-all cursor-pointer ${
                    selectedTag?.id === tag.id ? 'border-[#D97706] opacity-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(tag.category_key) }} />
                    <span className="text-sm font-medium text-gray-400 truncate">{tag.name}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 font-mono truncate mb-2">{tag.full_path}</div>
                  <div className="flex items-start gap-1.5 text-[10px] text-red-400 bg-red-950/20 px-2 py-1 rounded border border-red-900/30">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="leading-tight">{reason}</span>
                  </div>
                </div>
              ))}
              {blockedTags.length === 0 && (
                <div className="py-8 text-center text-gray-600 text-xs italic">
                  No blocked tags
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Inspector */}
      <div className="w-80 bg-[#141414] border-l border-[#262626] flex flex-col">
        <div className="p-4 border-b border-[#262626]">
          <h2 className="text-xs font-bold text-[#D97706] uppercase tracking-wider flex items-center gap-2">
            <Info className="w-3.5 h-3.5" /> Inspector
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {selectedTag ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{selectedTag.name}</h3>
                  <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: getCategoryColor(selectedTag.category_key) }} />
                </div>
                <div className="p-2 bg-[#0a0a0a] rounded border border-[#262626]">
                  <p className="font-mono text-[10px] text-gray-400 break-all">{selectedTag.full_path}</p>
                </div>
                {selectedTag.description && (
                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">{selectedTag.description}</p>
                )}
              </div>

              {/* Simulation Results */}
              {simulation && (
                <div className="space-y-4">
                  <div className="h-px bg-[#262626]" />
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Add Effects</h4>

                  {/* Will Attach */}
                  {simulation.willAttach.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-green-400 flex items-center gap-1.5 font-medium">
                        <ArrowRight className="w-3 h-3" /> Auto-Attach
                      </div>
                      {simulation.willAttach.map((t, i) => (
                        <div key={i} className="px-2 py-1.5 bg-[#0a0a0a] border-l-2 border-green-500 text-xs text-gray-300 ml-4">
                          {t}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Will Remove */}
                  {simulation.willRemove.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
                        <Trash2 className="w-3 h-3" /> Auto-Remove
                      </div>
                      {simulation.willRemove.map((t, i) => (
                        <div key={i} className="px-2 py-1.5 bg-[#0a0a0a] border-l-2 border-red-500 text-xs text-gray-300 ml-4">
                          {t}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status Changes */}
                  {simulation.willDisable && (
                    <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-start gap-2">
                      <Power className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-yellow-500">Will be Disabled</div>
                        <div className="text-[10px] text-yellow-500/70 mt-0.5">Conditions met to disable this tag immediately.</div>
                      </div>
                    </div>
                  )}

                  {simulation.willBeRemoved && (
                    <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-2">
                      <Eraser className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-red-500">Will be Removed</div>
                        <div className="text-[10px] text-red-500/70 mt-0.5">Conditions met to remove this tag immediately.</div>
                      </div>
                    </div>
                  )}

                  {!simulation.willAttach.length && !simulation.willRemove.length && !simulation.willDisable && !simulation.willBeRemoved && (
                    <div className="text-xs text-gray-600 italic text-center py-2">No side effects</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <Info className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">Select a tag to inspect</p>
            </div>
          )}
        </div>

        {/* Bottom Action */}
        {selectedTag && (
          <div className="p-4 border-t border-[#262626] bg-[#141414]">
            {!activeTags.has(selectedTag.full_path) ? (
              canAddTag(selectedTag).canAdd ? (
                <Button 
                  onClick={() => handleAddTag(selectedTag)}
                  className="w-full bg-[#D97706] hover:bg-[#B45309] text-black font-bold h-9 text-xs"
                >
                  Add to Entity
                </Button>
              ) : (
                <div className="w-full py-2 text-center text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded">
                  <Ban className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                  {canAddTag(selectedTag).reason}
                </div>
              )
            ) : (
              <Button 
                onClick={() => handleRemoveTag(selectedTag.full_path)}
                variant="destructive"
                className="w-full bg-[#262626] hover:bg-red-900/50 text-red-400 border border-red-900/30 h-9 text-xs"
              >
                Remove from Entity
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}