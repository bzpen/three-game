// 关卡相关的类型定义

import type { ArrowDirection } from './game';

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
}

export interface LevelData {
  id: string;
  name: string;
  config: LevelConfig;
  arrows: LevelArrowData[];
}

export interface LevelPack {
  id: string;
  name: string;
  version: string;
  levels: LevelData[];
}
