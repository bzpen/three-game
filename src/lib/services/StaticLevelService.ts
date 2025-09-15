// 静态关卡服务 - 只读模式，用于生产环境加载预制关卡

import type { LevelData, LevelPack, LevelArrowData } from '../types/level';
import type { ArrowData } from '../types/game';
import { gridToPixel } from '../utils/arrow';

export class StaticLevelService {
  private static instance: StaticLevelService;
  private levelPacks: Map<string, LevelPack> = new Map();
  private levels: Map<string, LevelData> = new Map();
  private isLoaded = false;

  private constructor() {}

  static getInstance(): StaticLevelService {
    if (!StaticLevelService.instance) {
      StaticLevelService.instance = new StaticLevelService();
    }
    return StaticLevelService.instance;
  }

  /**
   * 从公共目录加载关卡包
   */
  async loadLevelPack(packFileName: string): Promise<LevelPack | null> {
    try {
      const response = await fetch(`/levels/${packFileName}`);
      if (!response.ok) {
        throw new Error(`Failed to load level pack: ${response.statusText}`);
      }

      const rawLevelPack = await response.json();
      
      // 验证关卡包数据
      if (!this.validateLevelPack(rawLevelPack)) {
        throw new Error('Invalid level pack format');
      }

      // 处理关卡包数据，只保留核心游戏数据
      const levelPack = this.processLevelPack(rawLevelPack as unknown as Record<string, unknown>);

      // 缓存关卡包和所有关卡
      this.levelPacks.set(levelPack.id, levelPack);
      levelPack.levels.forEach(level => {
        this.levels.set(level.id, level);
      });

      console.log(`✓ 关卡包加载成功: ${levelPack.name} (${levelPack.levels.length} 个关卡)`);
      return levelPack;
    } catch (error) {
      console.error(`关卡包加载失败: ${packFileName}`, error);
      return null;
    }
  }

  /**
   * 加载默认关卡包
   */
  async loadDefaultLevels(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // 加载示例关卡包
      await this.loadLevelPack('sample_pack.json');
      
      // 这里可以加载更多关卡包
      // await this.loadLevelPack('adventure_pack.json');
      // await this.loadLevelPack('challenge_pack.json');

      this.isLoaded = true;
      console.log('✓ 默认关卡加载完成');
    } catch (error) {
      console.error('默认关卡加载失败:', error);
    }
  }

  /**
   * 获取关卡数据
   */
  getLevel(levelId: string): LevelData | null {
    return this.levels.get(levelId) || null;
  }

  /**
   * 获取所有可用关卡
   */
  getAllLevels(): LevelData[] {
    return Array.from(this.levels.values()).sort((a, b) => {
      // 按名称排序
      return a.name.localeCompare(b.name);
    });
  }


  /**
   * 获取关卡包
   */
  getLevelPack(packId: string): LevelPack | null {
    return this.levelPacks.get(packId) || null;
  }

  /**
   * 获取所有关卡包
   */
  getAllLevelPacks(): LevelPack[] {
    return Array.from(this.levelPacks.values());
  }

  /**
   * 将关卡箭头数据转换为运行时数据
   */
  convertLevelArrowsToRuntime(level: LevelData, gridSize: number = 60, gridGap: number = 2): ArrowData[] {
    return level.arrows.map(levelArrow => {
      const pixelPosition = gridToPixel(
        levelArrow.gridPosition,
        gridSize,
        0,
        0,
        gridGap
      );

      return {
        id: levelArrow.id,
        direction: levelArrow.direction,
        pixelPosition,
        isMoving: false,
      };
    });
  }

  /**
   * 获取关卡统计信息
   */
  getStatistics(): {
    totalLevels: number;
    totalPacks: number;
  } {
    const levels = this.getAllLevels();
    
    return {
      totalLevels: levels.length,
      totalPacks: this.levelPacks.size,
    };
  }

  /**
   * 检查是否已加载
   */
  isDataLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 处理关卡包数据，只保留核心游戏数据
   */
  private processLevelPack(rawLevelPack: Record<string, unknown>): LevelPack {
    const processedLevels = (rawLevelPack.levels as Record<string, unknown>[]).map((rawLevel: Record<string, unknown>) => {
      const config = rawLevel.config as Record<string, unknown>;
      return {
        id: rawLevel.id as string,
        name: rawLevel.name as string,
        config: {
          rows: config.rows as number,
          cols: config.cols as number,
        },
        arrows: rawLevel.arrows as LevelArrowData[]
      };
    });

    return {
      id: rawLevelPack.id as string,
      name: rawLevelPack.name as string,
      version: (rawLevelPack.version as string) || '1.0.0',
      levels: processedLevels
    };
  }


  /**
   * 验证关卡包格式 - 适配简化格式
   */
  private validateLevelPack(levelPack: unknown): levelPack is LevelPack {
    if (!levelPack || typeof levelPack !== 'object') return false;
    
    const obj = levelPack as Record<string, unknown>;
    return (
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      Array.isArray(obj.levels) &&
      obj.levels.every((level: unknown) => this.validateLevel(level))
    );
  }

  /**
   * 验证关卡格式 - 适配简化格式，不再验证metadata和difficulty
   */
  private validateLevel(level: unknown): level is LevelData {
    if (!level || typeof level !== 'object') return false;
    
    const obj = level as Record<string, unknown>;
    return (
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      obj.config !== null &&
      typeof obj.config === 'object' &&
      this.validateConfig(obj.config) &&
      Array.isArray(obj.arrows) &&
      obj.arrows.every((arrow: unknown) => this.validateArrow(arrow))
    );
  }

  /**
   * 验证配置格式 - 适配简化格式，只需要rows和cols
   */
  private validateConfig(config: unknown): boolean {
    if (!config || typeof config !== 'object') return false;
    
    const obj = config as Record<string, unknown>;
    return (
      typeof obj.rows === 'number' &&
      typeof obj.cols === 'number'
    );
  }

  /**
   * 验证箭头格式
   */
  private validateArrow(arrow: unknown): boolean {
    if (!arrow || typeof arrow !== 'object') return false;
    
    const obj = arrow as Record<string, unknown>;
    return (
      typeof obj.id === 'number' &&
      typeof obj.direction === 'string' &&
      ['up', 'down', 'left', 'right'].includes(obj.direction as string) &&
      obj.gridPosition !== null &&
      typeof obj.gridPosition === 'object' &&
      this.validateGridPosition(obj.gridPosition)
    );
  }

  /**
   * 验证网格位置格式
   */
  private validateGridPosition(position: unknown): boolean {
    if (!position || typeof position !== 'object') return false;
    
    const obj = position as Record<string, unknown>;
    return (
      typeof obj.row === 'number' &&
      typeof obj.col === 'number'
    );
  }

  /**
   * 重新加载所有关卡数据
   */
  async reload(): Promise<void> {
    this.levelPacks.clear();
    this.levels.clear();
    this.isLoaded = false;
    await this.loadDefaultLevels();
  }
}
