// 网格管理器 - 管理游戏网格状态
import type { ArrowPosition } from '../types/game';

export class GridManager {
  private grid: number[][];
  private rows: number;
  private cols: number;

  constructor(rows: number = 6, cols: number = 6) {
    this.rows = rows;
    this.cols = cols;
    this.grid = this.createEmptyGrid();
  }

  // 创建空网格
  private createEmptyGrid(): number[][] {
    return Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
  }

  // 获取网格状态
  getGrid(): number[][] {
    return this.grid;
  }

  // 检查位置是否为空
  isEmpty(row: number, col: number): boolean {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return false;
    }
    return this.grid[row][col] === 0;
  }

  // 获取位置的值
  getValue(row: number, col: number): number {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return -1; // 越界返回-1
    }
    return this.grid[row][col];
  }

  // 设置位置状态
  setPosition(row: number, col: number, value: number): void {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.grid[row][col] = value;
    }
  }

  // 清空位置
  clearPosition(row: number, col: number): void {
    this.setPosition(row, col, 0);
  }

  // 检查多个位置是否都为空或被指定箭头占据
  arePositionsAccessible(positions: ArrowPosition[], arrowId: number): boolean {
    return positions.every(pos => {
      const value = this.getValue(pos.row, pos.col);
      return value === 0 || value === arrowId; // 空位或自己的位置
    });
  }

  // 检查多个位置是否都为空
  arePositionsEmpty(positions: ArrowPosition[]): boolean {
    return positions.every(pos => this.isEmpty(pos.row, pos.col));
  }

  // 用指定箭头ID占用多个位置
  occupyPositions(positions: ArrowPosition[], arrowId: number): void {
    positions.forEach(pos => this.setPosition(pos.row, pos.col, arrowId));
  }

  // 清空多个位置
  clearPositions(positions: ArrowPosition[]): void {
    positions.forEach(pos => this.clearPosition(pos.row, pos.col));
  }

  // 清空指定箭头占据的所有位置
  clearArrowPositions(arrowId: number): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] === arrowId) {
          this.grid[row][col] = 0;
        }
      }
    }
  }

  // 重置网格
  reset(): void {
    this.grid = this.createEmptyGrid();
  }

  // 打印网格状态（调试用）
  printGrid(): void {
    // 生产环境中禁用日志
  }
}
