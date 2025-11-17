import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Edit3, Zap, KeyRound, Sparkles, Layers, GitBranch, Calculator, Box, Link as LinkIcon, Globe, Menu, X, Settings, Shield, CheckSquare, Table } from "lucide-react";

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
          <Edit3 className="w-4 h-4" />标签
        </Link>
        <Link to={createPageUrl("TagSimulator")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "TagSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Zap className="w-4 h-4" />模拟器
        </Link>
        <div className="h-6 w-px bg-[#3d3d3d]" />
        <Link to={createPageUrl("ValidatorEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "ValidatorEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Shield className="w-4 h-4" />验证器
        </Link>
        <Link to={createPageUrl("RequirementEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "RequirementEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <CheckSquare className="w-4 h-4" />需求
        </Link>
        <Link to={createPageUrl("UnlockableCommands")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "UnlockableCommands" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <KeyRound className="w-4 h-4" />指令
        </Link>
        <Link to={createPageUrl("InteractionEffects")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "InteractionEffects" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Sparkles className="w-4 h-4" />效果
        </Link>
        <div className="h-6 w-px bg-[#3d3d3d]" />
        <Link to={createPageUrl("UnifiedGraphEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "UnifiedGraphEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Globe className="w-4 h-4" />图
        </Link>
        <Link to={createPageUrl("AttributeEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "AttributeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Layers className="w-4 h-4" />属性
        </Link>
        <Link to={createPageUrl("ModifierDefinitionEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "ModifierDefinitionEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <GitBranch className="w-4 h-4" />修饰器
        </Link>
        <Link to={createPageUrl("EntityPrototypeEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "EntityPrototypeEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Box className="w-4 h-4" />原型
        </Link>
        <Link to={createPageUrl("EntityRelationEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "EntityRelationEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <LinkIcon className="w-4 h-4" />关系
        </Link>
        <Link to={createPageUrl("NewAttributeSimulator")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "NewAttributeSimulator" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Calculator className="w-4 h-4" />计算器
        </Link>
        <Link to={createPageUrl("GameEventEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "GameEventEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Zap className="w-4 h-4" />事件
        </Link>
        <Link to={createPageUrl("GlobalConstantEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "GlobalConstantEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Settings className="w-4 h-4" />常量
        </Link>
        <Link to={createPageUrl("DataTableEditor")} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${currentPageName === "DataTableEditor" ? "bg-[#0e639c] text-white" : "text-gray-300 hover:bg-[#3d3d3d] hover:text-white"}`}>
          <Table className="w-4 h-4" />数据表
        </Link>
      </div>

      {/* 移动端导航 */}
      <div className="h-14 bg-[#2d2d2d] border-b border-[#3d3d3d] md:hidden flex items-center px-4 justify-between">
        <span className="text-sm font-semibold text-white">
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
        <div className="md:hidden bg-[#2d2d2d] border-b border-[#3d3d3d] overflow-y-auto max-h-[50vh]">
          <Link to={createPageUrl("TagEditor")} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d] ${currentPageName === "TagEditor" ? "bg-[#0e639c] text-white" : "text-gray-300"}`}>
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