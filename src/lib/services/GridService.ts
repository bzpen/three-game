// 网格服务 - 处理网格更新和碰撞检测相关的业务逻辑

import type { ArrowData } from '../types/game';
import { GridManager } from '../managers/GridManager';
import { 
  getArrowOccupiedCellsByPixel,
  isPositionInBounds
} from '../utils/arrow';

export interface GridConfig {
  rows: number;
  cols: number;
  gridSize: number;
  gridGap: number;
  offsetX: number;
  offsetY: number;
}

export class GridService {
  private static instance: GridService;

  static getInstance(): GridService {
    if (!GridService.instance) {
      GridService.instance = new GridService();
    }
    return GridService.instance;
  }

  /**
   * 更新网格状态
   */
  updateGridFromArrows(
    arrows: ArrowData[], 
    gridManager: GridManager, 
    config: GridConfig
  ): number[][] {
    gridManager.reset();
    
    arrows.forEach((arrow: ArrowData) => {
      if (arrow && arrow.pixelPosition) {
        const occupiedCells = getArrowOccupiedCellsByPixel(
          arrow.pixelPosition.x,
          arrow.pixelPosition.y,
          arrow.direction,
          config.gridSize,
          config.offsetX,
          config.offsetY,
          config.gridGap,
          config.rows,
          config.cols
        );
        
        if (occupiedCells.length > 0) {
          gridManager.occupyPositions(occupiedCells, arrow.id);
        }
      }
    });
    
    return [...gridManager.getGrid()];
  }

  /**
   * 检查箭头碰撞
   */
  checkArrowCollision(
    arrowId: number,
    arrows: ArrowData[],
    gridManager: GridManager,
    config: GridConfig,
    currentPixelPosition?: { x: number; y: number }
  ): boolean {
    const arrow = arrows.find((arr: ArrowData) => arr.id === arrowId);
    if (!arrow) {
      return false;
    }

    const pixelPos = currentPixelPosition || arrow.pixelPosition;
    if (!pixelPos) {
      return false;
    }

    const currentOccupiedCells = getArrowOccupiedCellsByPixel(
      pixelPos.x,
      pixelPos.y,
      arrow.direction,
      config.gridSize,
      config.offsetX,
      config.offsetY,
      config.gridGap,
      config.rows,
      config.cols
    );
    
    for (const cell of currentOccupiedCells) {
      if (isPositionInBounds(cell, config.rows, config.cols)) {
        const cellValue = gridManager.getValue(cell.row, cell.col);
        if (cellValue !== 0 && cellValue !== arrow.id) {
          return true; // 发生碰撞
        }
      }
    }
    
    return false; // 无碰撞
  }

  /**
   * 创建空网格
   */
  createEmptyGrid(rows: number, cols: number): number[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  }
}
