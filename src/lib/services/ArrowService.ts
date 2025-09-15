// 箭头服务 - 处理箭头生成和验证相关的业务逻辑

import type { ArrowData, ArrowPosition } from '../types/game';
import { GridManager } from '../managers/GridManager';
import { 
  getArrowOccupiedPositions,
  getRandomDirection,
  canPlaceArrow,
  gridToPixel
} from '../utils/arrow';
import { validateArrowLayout, convertArrowDataToConfig } from '../utils/validation';

export interface ArrowGenerationConfig {
  rows: number;
  cols: number;
  gridGap: number;
  gridSize: number;
  arrowCount: number;
  offsetX: number;
  offsetY: number;
}

export interface ArrowGenerationResult {
  arrows: ArrowData[];
  gridData: number[][];
  success: boolean;
  attempts: number;
}

export class ArrowService {
  private static instance: ArrowService;

  static getInstance(): ArrowService {
    if (!ArrowService.instance) {
      ArrowService.instance = new ArrowService();
    }
    return ArrowService.instance;
  }

  /**
   * 生成随机箭头布局
   */
  generateArrows(config: ArrowGenerationConfig): ArrowGenerationResult {
    const gridManager = new GridManager(config.rows, config.cols);
    const maxLayoutAttempts = 50;
    let layoutAttempt = 0;
    let validLayout = false;
    let finalArrows: ArrowData[] = [];
    
    while (!validLayout && layoutAttempt < maxLayoutAttempts) {
      const result = this.attemptArrowPlacement(config, gridManager);
      
      if (result.success) {
        const arrowConfigs = convertArrowDataToConfig(
          result.arrows, 
          config.gridSize, 
          config.offsetX, 
          config.offsetY, 
          config.gridGap
        );
        
        if (validateArrowLayout(arrowConfigs, config.rows, config.cols)) {
          validLayout = true;
          finalArrows = result.arrows;
        }
      }
      
      layoutAttempt++;
    }
    
    return {
      arrows: finalArrows,
      gridData: [...gridManager.getGrid()],
      success: validLayout,
      attempts: layoutAttempt
    };
  }

  /**
   * 尝试放置所有箭头
   */
  private attemptArrowPlacement(
    config: ArrowGenerationConfig, 
    gridManager: GridManager
  ): { arrows: ArrowData[]; success: boolean } {
    const arrows: ArrowData[] = [];
    const maxAttempts = 100;
    
    gridManager.reset();
    
    for (let i = 0; i < config.arrowCount; i++) {
      const arrowResult = this.placeArrow(config, gridManager, i + 1, maxAttempts);
      
      if (!arrowResult.success) {
        return { arrows: [], success: false };
      }
      
      arrows.push(arrowResult.arrow);
    }
    
    return { arrows, success: true };
  }

  /**
   * 放置单个箭头
   */
  private placeArrow(
    config: ArrowGenerationConfig,
    gridManager: GridManager,
    arrowId: number,
    maxAttempts: number
  ): { arrow: ArrowData; success: boolean } {
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      const direction = getRandomDirection();
      const position = this.generateRandomPosition(config, direction);
      
      if (canPlaceArrow(position, direction, (r, c) => gridManager.isEmpty(r, c), config.rows, config.cols)) {
        const occupiedPositions = getArrowOccupiedPositions(position, direction);
        gridManager.occupyPositions(occupiedPositions, arrowId);
        
        const pixelPosition = gridToPixel(
          position, 
          config.gridSize, 
          config.offsetX, 
          config.offsetY, 
          config.gridGap
        );
        
        const arrow: ArrowData = {
          id: arrowId,
          direction,
          pixelPosition,
          isMoving: false
        };
        
        return { arrow, success: true };
      }
      
      attempt++;
    }
    
    return { arrow: {} as ArrowData, success: false };
  }

  /**
   * 生成随机位置
   */
  private generateRandomPosition(config: ArrowGenerationConfig, direction: string): ArrowPosition {
    const maxRow = config.rows - (direction === 'up' || direction === 'down' ? 1 : 0);
    const maxCol = config.cols - (direction === 'left' || direction === 'right' ? 1 : 0);
    
    return {
      row: Math.floor(Math.random() * maxRow),
      col: Math.floor(Math.random() * maxCol)
    };
  }

  /**
   * 验证箭头布局是否有效
   */
  validateLayout(arrows: ArrowData[], config: ArrowGenerationConfig): boolean {
    const arrowConfigs = convertArrowDataToConfig(
      arrows,
      config.gridSize,
      config.offsetX,
      config.offsetY,
      config.gridGap
    );
    
    return validateArrowLayout(arrowConfigs, config.rows, config.cols);
  }
}
