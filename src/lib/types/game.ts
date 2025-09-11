// 游戏相关的类型定义

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

export interface ArrowPosition {
  row: number;
  col: number;
}

export interface ArrowData {
  id: number;
  direction: ArrowDirection;
  pixelPosition: { x: number; y: number };
  isMoving: boolean;
}

export interface PixelPosition {
  x: number;
  y: number;
}
