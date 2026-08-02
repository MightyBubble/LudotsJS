import React from 'react';
import { boardCellGrid, MACRO_TILE_CELLS } from '@/lib/map/spatialScale';

/** 按 Ludots C# 规范展示 Board 的真实尺度换算与硬性约束。 */
export default function BoardScaleSummary({ board }) {
  const { macroX, macroY, width, height, cellCm } = boardCellGrid(board);
  const chunk = Number(board.chunk_size_cells) || 0;
  const chunkInvalid = chunk <= 0 || (chunk & (chunk - 1)) !== 0;
  const capacityMissing = board.spatial_type === 'NodeGraph' && !(Number(board.loaded_chunk_capacity) > 0);
  const meters = v => Math.round((v * cellCm) / 100);
  return <div className="rounded border border-[#2A2E37] bg-[#15171C] px-2.5 py-2 space-y-1">
    <p className="text-[10px] text-gray-400">{macroX}×{macroY} 宏块 × {MACRO_TILE_CELLS} cells = <b className="text-gray-200">{width}×{height} cells</b> ≈ {meters(width)}×{meters(height)} m（{cellCm} cm/cell）</p>
    {board.spatial_type === 'HexGrid' && <p className="text-[10px] text-gray-500">HexGrid 使用 Hex Edge ({board.hex_edge_length_cm || 400} cm) 决定单元尺寸，Grid Cell Size 仍是空间基准 cell。</p>}
    {chunkInvalid && <p className="text-[10px] text-amber-300/80">Chunk Size Cells 必须是大于 0 的 2 的幂。</p>}
    {capacityMissing && <p className="text-[10px] text-amber-300/80">NodeGraph Board 必须配置大于 0 的 Loaded Chunk Capacity。</p>}
  </div>;
}