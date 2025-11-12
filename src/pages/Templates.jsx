import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, BookTemplate, Play, Trash2, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Templates() {
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['tagTemplates'],
    queryFn: () => base44.entities.TagTemplate.list(),
    initialData: [],
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.TagTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagTemplates'] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => 
      base44.entities.TagTemplate.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagTemplates'] });
    },
  });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">标签模板</h1>
            <p className="text-gray-400">快速创建常用的标签结构</p>
          </div>
          
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
            <Plus className="w-4 h-4 mr-2" />
            创建模板
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <BookTemplate className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">暂无模板</h3>
            <p className="text-gray-400 mb-6">创建模板来快速生成常用的标签结构</p>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
              <Plus className="w-4 h-4 mr-2" />
              创建第一个模板
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass-effect border-white/10 hover:border-white/20 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <BookTemplate className="w-5 h-5 text-purple-400" />
                        {template.template_name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavoriteMutation.mutate({ 
                          id: template.id, 
                          isFavorite: template.is_favorite 
                        })}
                      >
                        <Star 
                          className={`w-4 h-4 ${
                            template.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                          }`}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">
                      {template.description || "暂无描述"}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-gray-300">
                        使用 {template.usage_count || 0} 次
                      </Badge>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 hover:bg-white/10 text-white"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          应用
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}