import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tags, Layers, History, BookTemplate, GitBranch, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "标签编辑器",
    url: createPageUrl("TagEditor"),
    icon: Tags,
  },
  {
    title: "关系图谱",
    url: createPageUrl("TagVisualization"),
    icon: GitBranch,
  },
  {
    title: "模板管理",
    url: createPageUrl("Templates"),
    icon: BookTemplate,
  },
  {
    title: "操作历史",
    url: createPageUrl("History"),
    icon: History,
  },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --accent-glow: rgba(102, 126, 234, 0.2);
          --glass-bg: rgba(255, 255, 255, 0.05);
          --glass-border: rgba(255, 255, 255, 0.1);
        }
        
        body {
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          background-attachment: fixed;
        }
        
        .glass-effect {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
        }
        
        .glow-effect {
          box-shadow: 0 0 20px var(--accent-glow);
        }
      `}</style>
      
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl">
          <SidebarHeader className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">GameplayTag</h2>
                <p className="text-xs text-gray-400">专业标签管理系统</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                功能导航
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`rounded-xl transition-all duration-300 mb-1 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/30' 
                            : 'hover:bg-white/5 text-gray-300 hover:text-white'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                快捷统计
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 space-y-3">
                  <div className="glass-effect rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">总标签数</span>
                      <Tags className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">-</p>
                  </div>
                  <div className="glass-effect rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">层级深度</span>
                      <Layers className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">-</p>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-screen">
          <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-white/5 p-2 rounded-lg transition-colors" />
              <h1 className="text-xl font-semibold text-white">GameplayTag 编辑器</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-900/30 via-slate-800/30 to-slate-900/30">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}