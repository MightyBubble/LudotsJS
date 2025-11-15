import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Edit3, Zap, KeyRound, Sparkles, Layers, GitBranch, Calculator, Network, Box, Link as LinkIcon } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col">
      <style>{`
        body {
          background: #1e1e1e;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        ::-webkit-scrollbar { width: 12px; height: 12px; }
        ::-webkit-scrollbar-track { background: #2d2d2d; }
        ::-webkit-scrollbar-thumb { background: #4a4a4a; border-radius: 0; }
        ::-webkit-scrollbar-thumb:hover { background: #5a5a5a; }
      `}</style>

      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-2">
        <Link
          to={createPageUrl("TagEditor")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "TagEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <Edit3 className="w-4 h-4" />标签编辑器
        </Link>
        <Link
          to={createPageUrl("TagSimulator")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "TagSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4" />标签模拟器
        </Link>
        <Link
          to={createPageUrl("UnlockableCommands")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "UnlockableCommands" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <KeyRound className="w-4 h-4" />指令解锁器
        </Link>
        <Link
          to={createPageUrl("InteractionEffects")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "InteractionEffects" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />效果编辑器
        </Link>
        
        <div className="h-6 w-px bg-[#3d3d3d]" />
        
        <Link
          to={createPageUrl("DataGraphEditor")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "DataGraphEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <Network className="w-4 h-4" />Data Graph
        </Link>
        <Link
          to={createPageUrl("AttributeEditor")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "AttributeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />属性编辑器
        </Link>
        <Link
          to={createPageUrl("ModifierDefinitionEditor")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "ModifierDefinitionEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <GitBranch className="w-4 h-4" />修饰器定义
        </Link>
        <Link
          to={createPageUrl("EntityPrototypeEditor")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "EntityPrototypeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <Box className="w-4 h-4" />实体原型
        </Link>
        <Link
          to={createPageUrl("EntityRelationEditor")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "EntityRelationEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <LinkIcon className="w-4 h-4" />实体关系
        </Link>
        <Link
          to={createPageUrl("NewAttributeSimulator")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            currentPageName === "NewAttributeSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"
          }`}
        >
          <Calculator className="w-4 h-4" />属性模拟器
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}