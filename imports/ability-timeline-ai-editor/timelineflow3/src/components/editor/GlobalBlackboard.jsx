import React, { useState } from "react";
import { Trash2, Plus, Box, Type, ToggleLeft, Hash, Move3d, User, Search, BookOpen, Settings2, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export default function GlobalBlackboard({ blackboard, onUpdateBlackboard }) {
  const [newVarName, setNewVarName] = useState("");
  const [newVarType, setNewVarType] = useState("number");
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddVariable = () => {
    if (!newVarName.trim() || blackboard[newVarName]) return;

    const defaultValue = 
      newVarType === 'number' ? 0 :
      newVarType === 'string' ? '' :
      newVarType === 'boolean' ? false :
      newVarType === 'vector' ? { x: 0, y: 0, z: 0 } :
      newVarType === 'actor' ? null : null;

    onUpdateBlackboard({
      ...blackboard,
      [newVarName]: { type: newVarType, value: defaultValue }
    });
    setNewVarName("");
  };

  const handleDeleteVariable = (name) => {
    const newBlackboard = { ...blackboard };
    delete newBlackboard[name];
    onUpdateBlackboard(newBlackboard);
  };

  const handleValueChange = (name, value) => {
    onUpdateBlackboard({
      ...blackboard,
      [name]: { ...blackboard[name], value }
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'number': return <Hash className="w-3 h-3" />;
      case 'string': return <Type className="w-3 h-3" />;
      case 'boolean': return <ToggleLeft className="w-3 h-3" />;
      case 'vector': return <Move3d className="w-3 h-3" />;
      case 'actor': return <User className="w-3 h-3" />;
      default: return <Box className="w-3 h-3" />;
    }
  };

  const filteredVars = Object.entries(blackboard).filter(([name]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#0b0d12] text-gray-300 font-sans selection:bg-amber-500/30">
      {/* Header */}
      <div className="p-5 border-b border-white/5 space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-lg font-bold tracking-wide">Global Blackboard</h2>
        </div>
        
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500 group-hover:text-gray-400 transition-colors" />
          <Input 
            placeholder="Search variables..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-[#15171c] border-transparent focus:border-amber-500/50 text-xs rounded-md transition-all hover:bg-[#1a1d23]"
          />
        </div>
      </div>

      {/* Add New Section */}
      <div className="p-5 space-y-3 border-b border-white/5 bg-[#0f1116]/50">
        <div className="flex items-center gap-2 text-amber-500 text-xs font-bold tracking-wider uppercase mb-1">
          <Settings2 className="w-3 h-3" />
          <span>New Variable</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              placeholder="Variable Name"
              className="h-8 bg-[#15171c] border-transparent focus:border-amber-500/50 text-xs rounded-md"
            />
            <Select value={newVarType} onValueChange={setNewVarType}>
              <SelectTrigger className="w-[100px] h-8 bg-[#15171c] border-transparent text-xs rounded-md focus:ring-amber-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d23] border-white/10 text-gray-300">
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="vector">Vector</SelectItem>
                <SelectItem value="actor">Actor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleAddVariable}
            className="w-full h-8 bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs tracking-wide rounded-md transition-all"
          >
            <Plus className="w-3 h-3 mr-1.5" />
            CREATE VARIABLE
          </Button>
        </div>
      </div>

      {/* List Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-amber-500 text-xs font-bold tracking-wider uppercase">
            <div className="flex items-center gap-2">
              <Layers className="w-3 h-3" />
              <span>Variables ({filteredVars.length})</span>
            </div>
            <span className="text-[10px] text-gray-600 bg-[#15171c] px-2 py-0.5 rounded">
              READ/WRITE
            </span>
          </div>

          <div className="space-y-2">
            {filteredVars.map(([name, data]) => (
              <div 
                key={name} 
                className="group bg-[#15171c] hover:bg-[#1a1d23] rounded-lg p-3 border border-white/5 hover:border-amber-500/20 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`p-1.5 rounded-md ${
                      data.type === 'boolean' ? 'bg-purple-500/10 text-purple-500' :
                      data.type === 'vector' ? 'bg-emerald-500/10 text-emerald-500' :
                      data.type === 'number' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {getTypeIcon(data.type)}
                    </div>
                    <span className="text-sm font-medium text-gray-200 truncate">{name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteVariable(name)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="pl-9">
                  {data.type === 'boolean' && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        {data.value ? 'True' : 'False'}
                      </span>
                      <Switch
                        checked={data.value}
                        onCheckedChange={(checked) => handleValueChange(name, checked)}
                        className="data-[state=checked]:bg-amber-600 scale-75 origin-left"
                      />
                    </div>
                  )}

                  {data.type === 'vector' && (
                    <div className="grid grid-cols-3 gap-2">
                      {['x', 'y', 'z'].map(axis => (
                        <div key={axis} className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600 uppercase">
                            {axis}
                          </span>
                          <Input
                            type="number"
                            value={data.value[axis]}
                            onChange={(e) => handleValueChange(name, { ...data.value, [axis]: parseFloat(e.target.value) || 0 })}
                            className="h-7 pl-5 pr-1 bg-[#0b0d12] border-transparent text-xs rounded text-right focus:border-emerald-500/50"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {data.type === 'number' && (
                    <div className="relative">
                       <Input
                        type="number"
                        value={data.value}
                        onChange={(e) => handleValueChange(name, parseFloat(e.target.value))}
                        className="h-7 bg-[#0b0d12] border-transparent text-xs rounded focus:border-blue-500/50 font-mono text-blue-400"
                      />
                    </div>
                  )}

                  {data.type === 'string' && (
                    <Input
                      value={data.value}
                      onChange={(e) => handleValueChange(name, e.target.value)}
                      className="h-7 bg-[#0b0d12] border-transparent text-xs rounded focus:border-amber-500/50"
                    />
                  )}
                  
                  {data.type === 'actor' && (
                    <div className="h-7 bg-[#0b0d12] rounded border border-dashed border-white/10 flex items-center justify-center text-[10px] text-gray-600">
                      Reference
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredVars.length === 0 && (
              <div className="text-center py-8 opacity-30">
                <Box className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">No variables found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}