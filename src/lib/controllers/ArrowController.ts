// 箭头控制器 - 管理箭头生成

import type { ArrowData } from '../types/game';
import { ArrowService, type ArrowGenerationConfig } from '../services/ArrowService';

export interface ArrowControllerConfig {
  rows: number;
  cols: number;
  gridGap: number;
  gridSize: number;
  arrowCount: number;
  offsetX: number;
  offsetY: number;
}

export interface GenerateArrowsResult {
  arrows: ArrowData[];
  success: boolean;
  attempts: number;
}

export class ArrowController {
  private static instance: ArrowController;
  private arrowService: ArrowService;

  private constructor() {
    this.arrowService = ArrowService.getInstance();
  }

  static getInstance(): ArrowController {
    if (!ArrowController.instance) {
      ArrowController.instance = new ArrowController();
    }
    return ArrowController.instance;
  }

  /**
   * 生成箭头
   */
  async generateArrows(config: ArrowControllerConfig): Promise<GenerateArrowsResult> {
    try {
      const generationConfig: ArrowGenerationConfig = {
        rows: config.rows,
        cols: config.cols,
        gridGap: config.gridGap,
        gridSize: config.gridSize,
        arrowCount: config.arrowCount,
        offsetX: config.offsetX,
        offsetY: config.offsetY,
      };

      const result = this.arrowService.generateArrows(generationConfig);
      
      if (!result.success) {
        console.warn(`无法生成可解的箭头布局，尝试了 ${result.attempts} 次`);
      }
      
      return {
        arrows: result.arrows,
        success: result.success,
        attempts: result.attempts,
      };
    } catch (error) {
      console.error('生成箭头时发生错误:', error);
      return {
        arrows: [],
        success: false,
        attempts: 0,
      };
    }
  }


  /**
   * 验证箭头布局
   */
  validateArrows(arrows: ArrowData[], config: ArrowControllerConfig): boolean {
    const generationConfig: ArrowGenerationConfig = {
      rows: config.rows,
      cols: config.cols,
      gridGap: config.gridGap,
      gridSize: config.gridSize,
      arrowCount: config.arrowCount,
      offsetX: config.offsetX,
      offsetY: config.offsetY,
    };

    return this.arrowService.validateLayout(arrows, generationConfig);
  }
}
