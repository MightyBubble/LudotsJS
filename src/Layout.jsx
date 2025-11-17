import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Edit3, Zap, KeyRound, Sparkles, Layers, GitBranch, Calculator, Network, Box, Link as LinkIcon, Globe, Menu, X, Settings, GitMerge } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      {/* 桌面端导航 */}
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] hidden md:flex items-center px-4 gap-2 overflow-x-auto">
        <Link to={createPageUrl("TagEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "TagEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Edit3 className="w-4 h-4" />标签编辑器
        </Link>
        <Link to={createPageUrl("TagSimulator")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "TagSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Zap className="w-4 h-4" />标签模拟器
        </Link>
        <Link to={createPageUrl("UnlockableCommands")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "UnlockableCommands" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <KeyRound className="w-4 h-4" />指令解锁器
        </Link>
        <Link to={createPageUrl("InteractionEffects")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "InteractionEffects" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Sparkles className="w-4 h-4" />效果编辑器
        </Link>
        <div className="h-6 w-px bg-[#3d3d3d]" />
        <Link to={createPageUrl("UnifiedGraphEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "UnifiedGraphEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Globe className="w-4 h-4" />图编辑器
        </Link>
        <Link to={createPageUrl("ConditionEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "ConditionEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <GitMerge className="w-4 h-4" />条件编辑器
        </Link>
        <Link to={createPageUrl("AttributeEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "AttributeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Layers className="w-4 h-4" />属性编辑器
        </Link>
        <Link to={createPageUrl("ModifierDefinitionEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "ModifierDefinitionEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <GitBranch className="w-4 h-4" />修饰器定义
        </Link>
        <Link to={createPageUrl("EntityPrototypeEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "EntityPrototypeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Box className="w-4 h-4" />实体原型
        </Link>
        <Link to={createPageUrl("EntityRelationEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "EntityRelationEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <LinkIcon className="w-4 h-4" />实体关系
        </Link>
        <Link to={createPageUrl("NewAttributeSimulator")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "NewAttributeSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Calculator className="w-4 h-4" />属性模拟器
        </Link>
        <Link to={createPageUrl("GameEventEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "GameEventEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Zap className="w-4 h-4" />事件编辑器
        </Link>
        <Link to={createPageUrl("GlobalConstantEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "GlobalConstantEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Settings className="w-4 h-4" />全局常量
        </Link>
      </div>

      {/* 移动端导航 */}
      <div className="h-14 bg-[#2d2d2d] border-b border-[#3d3d3d] md:hidden flex items-center px-4 justify-between">
        <span className="text-sm font-semibold text-white">
          {currentPageName === "TagEditor" && "标签编辑器"}
          {currentPageName === "TagSimulator" && "标签模拟器"}
          {currentPageName === "UnlockableCommands" && "指令解锁器"}
          {currentPageName === "InteractionEffects" && "效果编辑器"}
          {currentPageName === "UnifiedGraphEditor" && "图编辑器"}
          {currentPageName === "ConditionEditor" && "条件编辑器"}
          {currentPageName === "AttributeEditor" && "属性编辑器"}
          {currentPageName === "ModifierDefinitionEditor" && "修饰器定义"}
          {currentPageName === "EntityPrototypeEditor" && "实体原型"}
          {currentPageName === "EntityRelationEditor" && "实体关系"}
          {currentPageName === "NewAttributeSimulator" && "属性模拟器"}
          {currentPageName === "GameEventEditor" && "事件编辑器"}
          {currentPageName === "GlobalConstantEditor" && "全局常量"}
        </span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#2d2d2d] border-b border-[#3d3d3d] overflow-y-auto max-h-[50vh]">
          <Link to={createPageUrl("TagEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "TagEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Edit3 className="w-4 h-4" />标签编辑器
          </Link>
          <Link to={createPageUrl("TagSimulator")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "TagSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Zap className="w-4 h-4" />标签模拟器
          </Link>
          <Link to={createPageUrl("UnlockableCommands")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "UnlockableCommands" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <KeyRound className="w-4 h-4" />指令解锁器
          </Link>
          <Link to={createPageUrl("InteractionEffects")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "InteractionEffects" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Sparkles className="w-4 h-4" />效果编辑器
          </Link>
          <Link to={createPageUrl("UnifiedGraphEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "UnifiedGraphEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Globe className="w-4 h-4" />图编辑器
          </Link>
          <Link to={createPageUrl("ConditionEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "ConditionEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <GitMerge className="w-4 h-4" />条件编辑器
          </Link>
          <Link to={createPageUrl("AttributeEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "AttributeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Layers className="w-4 h-4" />属性编辑器
          </Link>
          <Link to={createPageUrl("ModifierDefinitionEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "ModifierDefinitionEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <GitBranch className="w-4 h-4" />修饰器定义
          </Link>
          <Link to={createPageUrl("EntityPrototypeEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "EntityPrototypeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Box className="w-4 h-4" />实体原型
          </Link>
          <Link to={createPageUrl("EntityRelationEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "EntityRelationEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <LinkIcon className="w-4 h-4" />实体关系
          </Link>
          <Link to={createPageUrl("NewAttributeSimulator")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "NewAttributeSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Calculator className="w-4 h-4" />属性模拟器
          </Link>
          <Link to={createPageUrl("GameEventEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "GameEventEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Zap className="w-4 h-4" />事件编辑器
          </Link>
          <Link to={createPageUrl("GlobalConstantEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 ${currentPageName === "GlobalConstantEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Settings className="w-4 h-4" />全局常量
          </Link>
        </div>
      )}

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}