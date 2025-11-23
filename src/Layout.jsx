import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Edit3, Zap, KeyRound, Sparkles, Layers, GitBranch, Calculator, Box, Link as LinkIcon, Globe, Menu, X, Settings, Shield, CheckSquare, Table, Network } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <style>{`
        body {
          background: #0a0a0a;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #e5e5e5;
        }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #141414; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>

      {/* 桌面端导航 */}
      <div className="h-10 bg-[#141414] border-b border-[#262626] hidden md:flex items-center px-4 gap-1 overflow-x-auto">
        <Link to={createPageUrl("TagEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "TagEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Edit3 className="w-3.5 h-3.5" />标签
        </Link>
        <Link to={createPageUrl("TagSimulator")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "TagSimulator" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Zap className="w-3.5 h-3.5" />模拟器
        </Link>
        <div className="h-5 w-px bg-[#262626]" />
        <Link to={createPageUrl("ValidatorEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "ValidatorEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Shield className="w-3.5 h-3.5" />验证器
        </Link>
        <Link to={createPageUrl("RequirementEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "RequirementEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <CheckSquare className="w-3.5 h-3.5" />需求
        </Link>
        <Link to={createPageUrl("UnlockableCommands")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "UnlockableCommands" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <KeyRound className="w-3.5 h-3.5" />指令
        </Link>
        <Link to={createPageUrl("InteractionEffects")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "InteractionEffects" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Sparkles className="w-3.5 h-3.5" />效果
        </Link>
        <div className="h-5 w-px bg-[#262626]" />
        <Link to={createPageUrl("UnifiedGraphEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "UnifiedGraphEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Globe className="w-3.5 h-3.5" />图
        </Link>
        <Link to={createPageUrl("AttributeEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "AttributeEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Layers className="w-3.5 h-3.5" />属性
        </Link>
        <Link to={createPageUrl("ModifierDefinitionEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "ModifierDefinitionEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <GitBranch className="w-3.5 h-3.5" />修饰器
        </Link>
        <Link to={createPageUrl("EntityPrototypeEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "EntityPrototypeEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Box className="w-3.5 h-3.5" />原型
        </Link>
        <Link to={createPageUrl("EntityRelationEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "EntityRelationEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <LinkIcon className="w-3.5 h-3.5" />关系
        </Link>
        <Link to={createPageUrl("StructureEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "StructureEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Network className="w-3.5 h-3.5" />结构
        </Link>
        <Link to={createPageUrl("NewAttributeSimulator")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "NewAttributeSimulator" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Calculator className="w-3.5 h-3.5" />计算器
        </Link>
        <Link to={createPageUrl("GameEventEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "GameEventEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Zap className="w-3.5 h-3.5" />事件
        </Link>
        <Link to={createPageUrl("GlobalConstantEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "GlobalConstantEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Settings className="w-3.5 h-3.5" />常量
        </Link>
        <Link to={createPageUrl("DataTableEditor")} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap font-medium ${currentPageName === "DataTableEditor" ? "bg-[#D97706] text-black" : "text-gray-400 hover:bg-[#262626] hover:text-white"}`}>
          <Table className="w-3.5 h-3.5" />数据表
        </Link>
      </div>

      {/* 移动端导航 */}
      <div className="h-14 bg-[#141414] border-b border-[#262626] md:hidden flex items-center px-4 justify-between">
        <span className="text-sm font-semibold text-[#e5e5e5]">
          {currentPageName === "TagEditor" && "标签"}
          {currentPageName === "TagSimulator" && "模拟器"}
          {currentPageName === "ValidatorEditor" && "验证器"}
          {currentPageName === "RequirementEditor" && "需求"}
          {currentPageName === "UnlockableCommands" && "指令"}
          {currentPageName === "InteractionEffects" && "效果"}
          {currentPageName === "UnifiedGraphEditor" && "图"}
          {currentPageName === "AttributeEditor" && "属性"}
          {currentPageName === "ModifierDefinitionEditor" && "修饰器"}
          {currentPageName === "EntityPrototypeEditor" && "原型"}
          {currentPageName === "EntityRelationEditor" && "关系"}
          {currentPageName === "StructureEditor" && "结构"}
          {currentPageName === "NewAttributeSimulator" && "计算器"}
          {currentPageName === "GameEventEditor" && "事件"}
          {currentPageName === "GlobalConstantEditor" && "常量"}
          {currentPageName === "DataTableEditor" && "数据表"}
        </span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#141414] border-b border-[#262626] overflow-y-auto max-h-[50vh]">
          <Link to={createPageUrl("TagEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#262626] ${currentPageName === "TagEditor" ? "bg-[#D97706] text-black" : "text-gray-400"}`}>
            <Edit3 className="w-4 h-4" />标签
          </Link>
          <Link to={createPageUrl("TagSimulator")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "TagSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Zap className="w-4 h-4" />模拟器
          </Link>
          <Link to={createPageUrl("ValidatorEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "ValidatorEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Shield className="w-4 h-4" />验证器
          </Link>
          <Link to={createPageUrl("RequirementEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "RequirementEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <CheckSquare className="w-4 h-4" />需求
          </Link>
          <Link to={createPageUrl("UnlockableCommands")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "UnlockableCommands" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <KeyRound className="w-4 h-4" />指令
          </Link>
          <Link to={createPageUrl("InteractionEffects")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "InteractionEffects" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Sparkles className="w-4 h-4" />效果
          </Link>
          <Link to={createPageUrl("UnifiedGraphEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "UnifiedGraphEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Globe className="w-4 h-4" />图
          </Link>
          <Link to={createPageUrl("AttributeEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "AttributeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Layers className="w-4 h-4" />属性
          </Link>
          <Link to={createPageUrl("ModifierDefinitionEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "ModifierDefinitionEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <GitBranch className="w-4 h-4" />修饰器
          </Link>
          <Link to={createPageUrl("EntityPrototypeEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "EntityPrototypeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Box className="w-4 h-4" />原型
          </Link>
          <Link to={createPageUrl("EntityRelationEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "EntityRelationEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <LinkIcon className="w-4 h-4" />关系
          </Link>
          <Link to={createPageUrl("StructureEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "StructureEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Network className="w-4 h-4" />结构
          </Link>
          <Link to={createPageUrl("NewAttributeSimulator")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "NewAttributeSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Calculator className="w-4 h-4" />计算器
          </Link>
          <Link to={createPageUrl("GameEventEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "GameEventEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Zap className="w-4 h-4" />事件
          </Link>
          <Link to={createPageUrl("GlobalConstantEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "GlobalConstantEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Settings className="w-4 h-4" />常量
          </Link>
          <Link to={createPageUrl("DataTableEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 ${currentPageName === "DataTableEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
            <Table className="w-4 h-4" />数据表
          </Link>
        </div>
      )}

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}