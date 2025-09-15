// 关卡生成器 - 批量生成关卡数据

import type { LevelData, LevelConfig, LevelArrowData, LevelPack } from '../types/level';
import type { ArrowData } from '../types/game';
import { ArrowController, type ArrowControllerConfig } from '../controllers/ArrowController';
import { gridToPixel } from '../utils/arrow';

export interface GenerationOptions {
  levelCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  namePrefix?: string;
  maxRetries?: number;
}

export class LevelGenerator {
  private static instance: LevelGenerator;
  private arrowController: ArrowController;

  private constructor() {
    this.arrowController = ArrowController.getInstance();
  }

  static getInstance(): LevelGenerator {
    if (!LevelGenerator.instance) {
      LevelGenerator.instance = new LevelGenerator();
    }
    return LevelGenerator.instance;
  }

  /**
   * 根据难度获取配置
   */
  private getDifficultyConfig(difficulty: string): LevelConfig {
    const configs = {
      easy: {
        rows: 4,
        cols: 4,
        gridGap: 3,
        gridSize: 80,
        offsetX: 20,
        offsetY: 20,
      },
      medium: {
        rows: 6,
        cols: 6,
        gridGap: 2,
        gridSize: 60,
        offsetX: 20,
        offsetY: 20,
      },
      hard: {
        rows: 8,
        cols: 8,
        gridGap: 2,
        gridSize: 50,
        offsetX: 25,
        offsetY: 25,
      },
      expert: {
        rows: 10,
        cols: 10,
        gridGap: 1,
        gridSize: 40,
        offsetX: 30,
        offsetY: 30,
      },
    };

    return configs[difficulty as keyof typeof configs] || configs.medium;
  }

  /**
   * 根据难度获取箭头数量
   */
  private getArrowCount(difficulty: string, rows: number, cols: number): number {
    const baseCount = Math.floor((rows * cols) * 0.15); // 基础占用15%的格子
    
    const multipliers = {
      easy: 0.5,
      medium: 0.75,
      hard: 1.0,
      expert: 1.25,
    };

    const multiplier = multipliers[difficulty as keyof typeof multipliers] || 0.75;
    return Math.max(2, Math.floor(baseCount * multiplier));
  }

  /**
   * 将运行时箭头数据转换为关卡箭头数据
   */
  private convertToLevelArrowData(
    arrows: ArrowData[], 
    config: LevelConfig
  ): LevelArrowData[] {
    return arrows.map(arrow => {
      // 从像素位置反推网格位置
      const gridRow = Math.round((arrow.pixelPosition.y - config.offsetY) / (config.gridSize + config.gridGap));
      const gridCol = Math.round((arrow.pixelPosition.x - config.offsetX) / (config.gridSize + config.gridGap));

      return {
        id: arrow.id,
        direction: arrow.direction,
        gridPosition: {
          row: gridRow,
          col: gridCol,
        },
      };
    });
  }

  /**
   * 生成单个关卡
   */
  async generateLevel(
    levelId: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'expert',
    name?: string
  ): Promise<LevelData | null> {
    const config = this.getDifficultyConfig(difficulty);
    const arrowCount = this.getArrowCount(difficulty, config.rows, config.cols);
    
    const controllerConfig: ArrowControllerConfig = {
      ...config,
      arrowCount,
    };

    const result = await this.arrowController.generateArrows(controllerConfig);
    
    if (!result.success) {
      return null;
    }

    const levelArrows = this.convertToLevelArrowData(result.arrows, config);

    return {
      id: levelId,
      name: name || `${difficulty}_level_${levelId}`,
      difficulty,
      config,
      arrows: levelArrows,
      metadata: {
        createdAt: new Date().toISOString(),
        generationAttempts: result.attempts,
        isValid: true,
      },
    };
  }

  /**
   * 批量生成关卡
   */
  async generateLevels(options: GenerationOptions): Promise<LevelData[]> {
    const levels: LevelData[] = [];
    const { levelCount, difficulty, namePrefix = 'Level', maxRetries = 3 } = options;

    for (let i = 1; i <= levelCount; i++) {
      let level: LevelData | null = null;
      let retries = 0;

      while (!level && retries < maxRetries) {
        const levelId = `${difficulty}_${i.toString().padStart(3, '0')}`;
        const levelName = `${namePrefix} ${i}`;
        
        level = await this.generateLevel(levelId, difficulty, levelName);
        retries++;

        if (!level) {
          console.warn(`关卡生成失败: ${levelId}, 重试 ${retries}/${maxRetries}`);
        }
      }

      if (level) {
        levels.push(level);
        console.log(`✓ 生成关卡: ${level.name} (${level.metadata.generationAttempts} 次尝试)`);
      } else {
        console.error(`✗ 关卡生成失败: ${difficulty}_${i}`);
      }
    }

    return levels;
  }

  /**
   * 生成关卡包
   */
  async generateLevelPack(
    packId: string,
    packName: string,
    description: string,
    levelCounts: { easy: number; medium: number; hard: number; expert: number }
  ): Promise<LevelPack> {
    const allLevels: LevelData[] = [];

    // 按难度生成关卡
    for (const [difficulty, count] of Object.entries(levelCounts)) {
      if (count > 0) {
        console.log(`开始生成 ${difficulty} 难度关卡 (${count} 个)...`);
        const levels = await this.generateLevels({
          levelCount: count,
          difficulty: difficulty as any,
          namePrefix: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
        });
        allLevels.push(...levels);
      }
    }

    const difficultyDistribution = {
      easy: allLevels.filter(l => l.difficulty === 'easy').length,
      medium: allLevels.filter(l => l.difficulty === 'medium').length,
      hard: allLevels.filter(l => l.difficulty === 'hard').length,
      expert: allLevels.filter(l => l.difficulty === 'expert').length,
    };

    return {
      id: packId,
      name: packName,
      description,
      version: '1.0.0',
      levels: allLevels,
      metadata: {
        createdAt: new Date().toISOString(),
        totalLevels: allLevels.length,
        difficultyDistribution,
      },
    };
  }
}
