// 关卡相关的类型定义

import type { ArrowData, ArrowDirection } from './game';

export interface LevelArrowData {
  id: number;
  direction: ArrowDirection;
  gridPosition: {
    row: number;
    col: number;
  };
}

export interface LevelConfig {
  rows: number;
  cols: number;
  gridGap: number;
  gridSize: number;
  offsetX: number;
  offsetY: number;
}

export interface LevelData {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  config: LevelConfig;
  arrows: LevelArrowData[];
  metadata: {
    createdAt: string;
    generationAttempts: number;
    isValid: boolean;
    estimatedSolveTime?: number;
    tags?: string[];
  };
}

export interface LevelPack {
  id: string;
  name: string;
  description: string;
  version: string;
  levels: LevelData[];
  metadata: {
    createdAt: string;
    totalLevels: number;
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
      expert: number;
    };
  };
}
