import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Plus, AlertCircle, Hash, Calculator, Zap, Tag, Sparkles, Database, Wand2, Clapperboard, Layers, ChevronRight, Home, Swords } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { ChevronDown, PlusCircle } from "lucide-react";

export default function Toolbar({ 
  onSave, 
  onAddNode, 
  hasUnsavedChanges, 
  isSaving,
  abilities = [],
  currentAbilityId,
  onChangeAbility,
  onCreateAbility,
  scopeStack = [],
  onNavigateUp
}) {
  const currentAbility = abilities.find(a => a.id === currentAbilityId);

  return (
    <div className="h-14 bg-[#0b0d12] border-b border-white/5 flex items-center px-4 gap-4 select-none">
      <div className="flex items-center gap-3 mr-4">
        <div className="w-8 h-8 bg-amber-600/20 border border-amber-500/20 rounded flex items-center justify-center">
          <Swords className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <h1 className="font-bold text-gray-200 text-sm tracking-wide uppercase">GAS Editor</h1>
          <div className="text-[10px] text-amber-500/60 font-mono">BETA</div>
        </div>
      </div>

      <div className="h-6 w-px bg-white/5 mx-2" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#15171c] hover:bg-[#1a1d23] border border-white/5 hover:border-amber-500/20 rounded transition-all group min-w-[160px]">
            <span className="text-xs text-gray-300 font-bold uppercase tracking-wide truncate flex-1 text-left">
              {currentAbility ? currentAbility.name : "Select Ability..."}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#15171c] border-white/10 w-60 text-gray-300">
          <DropdownMenuLabel className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Switch Ability</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          {abilities.map(ability => (
            <DropdownMenuItem 
              key={ability.id}
              onClick={() => onChangeAbility(ability.id)}
              className="text-gray-400 hover:bg-white/5 hover:text-amber-500 cursor-pointer flex justify-between text-xs font-medium"
            >
              <span>{ability.name}</span>
              {currentAbilityId === ability.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem 
            onClick={onCreateAbility}
            className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-500 cursor-pointer text-xs font-bold uppercase tracking-wide"
          >
            <Plus className="w-3 h-3 mr-2" />
            Create New Ability
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Breadcrumbs */}
      {scopeStack.length > 0 && (
        <div className="flex items-center ml-2 bg-[#15171c] rounded px-2 py-1 border border-white/5">
           <button 
             onClick={() => onNavigateUp(-1)}
             className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-amber-500 transition-colors"
             title="Root"
           >
             <Home className="w-3 h-3" />
           </button>
           
           {scopeStack.map((scope, index) => (
             <React.Fragment key={scope.id}>
               <ChevronRight className="w-3 h-3 text-gray-700 mx-1" />
               <button
                 onClick={() => onNavigateUp(index)}
                 className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
                   index === scopeStack.length - 1 
                     ? 'text-amber-500 bg-amber-500/10' 
                     : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                 }`}
               >
                 {scope.name}
               </button>
             </React.Fragment>
           ))}
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-500 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span>Unsaved Changes</span>
          </div>
        )}

        {/* Add Node Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider gap-2 border-none h-8">
              <Plus className="w-3 h-3" />
              Add Node
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#15171c] border-white/10 w-56 text-gray-300">
            <DropdownMenuLabel className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Clips</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => onAddNode('effect_clip')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Zap className="w-3 h-3 mr-2 text-violet-400" />
              Effect Clip
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('gameplay_tag_clip')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Tag className="w-3 h-3 mr-2 text-pink-400" />
              Gameplay Tag Clip
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('gameplay_cue_clip')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Wand2 className="w-3 h-3 mr-2 text-blue-400" />
              Gameplay Cue Clip
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('montage_clip')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Clapperboard className="w-3 h-3 mr-2 text-stone-400" />
              Montage Clip
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('composite_clip')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Layers className="w-3 h-3 mr-2 text-emerald-400" />
              Composite Clip
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuLabel className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Frames</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => onAddNode('instant_effect_frame')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Sparkles className="w-3 h-3 mr-2 text-amber-400" />
              Instant Effect Frame
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('custom_event_frame')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Zap className="w-3 h-3 mr-2 text-cyan-400" />
              Custom Event Frame
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('gameplay_cue_frame')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Wand2 className="w-3 h-3 mr-2 text-blue-400" />
              Gameplay Cue Frame
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuLabel className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Events</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => onAddNode('effect_events')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Zap className="w-3 h-3 mr-2 text-purple-400" />
              Effect Events
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuLabel className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Data</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => onAddNode('get_blackboard')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Database className="w-3 h-3 mr-2 text-emerald-400" />
              Get Blackboard
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('set_blackboard')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Database className="w-3 h-3 mr-2 text-orange-400" />
              Set Blackboard
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuLabel className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Math</DropdownMenuLabel>
            <DropdownMenuItem 
              onClick={() => onAddNode('add')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Calculator className="w-3 h-3 mr-2" />
              Add
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('subtract')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Calculator className="w-3 h-3 mr-2" />
              Subtract
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('multiply')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Calculator className="w-3 h-3 mr-2" />
              Multiply
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('divide')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Calculator className="w-3 h-3 mr-2" />
              Divide
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddNode('constant')}
              className="text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer text-xs"
            >
              <Hash className="w-3 h-3 mr-2" />
              Constant
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save Button */}
        <Button 
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className={`
            min-w-[100px] transition-all duration-300 h-8 text-xs font-bold uppercase tracking-wide border
            ${hasUnsavedChanges 
              ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300' 
              : 'bg-transparent border-white/5 text-gray-600 hover:bg-white/5'}
          `}
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="w-3 h-3" />
              <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}