// Board 的宏块数换算为真实 cell 网格与世界尺寸（cm）。
// 尺度常量的单一事实源是 editorFacts（mapBoard 组），此处只做换算。
import { factValue } from '@/lib/editorFacts';

export function boardCellGrid(board = {}) {
  const macroX = Math.max(Number(board.width_in_macro_tiles) || factValue('mapBoard.defaultMacroTilesX'), 1);
  const macroY = Math.max(Number(board.height_in_macro_tiles) || factValue('mapBoard.defaultMacroTilesY'), 1);
  const cellCm = Math.max(Number(board.grid_cell_size_cm) || factValue('mapBoard.defaultCellCm'), 1);
  return {
    macroX,
    macroY,
    width: macroX * factValue('mapBoard.macroTileCells'),
    height: macroY * factValue('mapBoard.macroTileCells'),
    cellCm,
  };
}
