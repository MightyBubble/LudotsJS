import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "npm:d3@7";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";

export default function TagVisualization() {
  const svgRef = useRef(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  useEffect(() => {
    if (!tags.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // 构建层级数据
    const root = d3.stratify()
      .id(d => d.full_path)
      .parentId(d => d.parent_path || null)
      (tags);

    const treeLayout = d3.tree().size([height - 100, width - 200]);
    treeLayout(root);

    const g = svg.append("g")
      .attr("transform", `translate(100, 50)`);

    // 绘制连接线
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x))
      .attr("fill", "none")
      .attr("stroke", "#667eea")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 2);

    // 绘制节点
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
      .attr("r", 8)
      .attr("fill", d => d.data.color || "#8b5cf6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -12 : 12)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .attr("fill", "#fff")
      .attr("font-size", "12px");

    // 缩放功能
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setTransform(event.transform);
      });

    svg.call(zoom);

  }, [tags]);

  const handleZoom = (factor) => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().scaleBy,
      factor
    );
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="glass-effect border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">标签关系图谱</h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom(1.2)}
              className="border-white/20 hover:bg-white/10 text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom(0.8)}
              className="border-white/20 hover:bg-white/10 text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-white/20 hover:bg-white/10 text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {tags.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-gray-400 text-lg">暂无标签数据</p>
              <p className="text-gray-500 text-sm">创建一些标签后，它们的关系会在这里显示</p>
            </div>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ cursor: "grab" }}
          />
        )}
      </div>
    </div>
  );
}