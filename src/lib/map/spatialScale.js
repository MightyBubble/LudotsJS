// 与 Ludots C# SpatialScaleDefaults / MapTile 对齐的空间尺度常量。
export const MACRO_TILE_CELLS = 256; // MapTile.Size
export const DEFAULT_CELL_CM = 100;  // SpatialScaleDefaults.CellCm

/** Board 的宏块数换算为真实 cell 网格与世界尺寸（cm）。 */
export function boardCellGrid(board = {}) {
  const macroX = Math.max(Number(board.width_in_macro_tiles) || 64, 1);
  const macroY = Math.max(Number(board.height_in_macro_tiles) || 64, 1);
  const cellCm = Math.max(Number(board.grid_cell_size_cm) || DEFAULT_CELL_CM, 1);
  return {
    macroX,
    macroY,
    width: macroX * MACRO_TILE_CELLS,
    height: macroY * MACRO_TILE_CELLS,
    cellCm,
  };
}