// 箭头布局验证工具 - 检测是否存在无解的死锁情况
import type { ArrowDirection, ArrowPosition } from '../types/game';
import { getArrowOccupiedPositions, isPositionInBounds } from './arrow';

interface ArrowConfig {
  id: number;
  position: ArrowPosition;
  direction: ArrowDirection;
}

/**
 * 验证箭头布局是否存在死锁情况
 * @param arrows 箭头配置数组
 * @param rows 网格行数
 * @param cols 网格列数
 * @returns true表示布局可解，false表示存在死锁
 */
export const validateArrowLayout = (
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): boolean => {
  // 创建网格状态
  const grid = createGridFromArrows(arrows, rows, cols);
  
  // 使用回溯算法检测是否存在解决方案
  return canSolveLayout(arrows.slice(), grid, rows, cols);
};

/**
 * 根据箭头配置创建网格状态
 */
const createGridFromArrows = (
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): number[][] => {
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(0));
  
  arrows.forEach(arrow => {
    const occupiedPositions = getArrowOccupiedPositions(arrow.position, arrow.direction);
    occupiedPositions.forEach(pos => {
      if (isPositionInBounds(pos, rows, cols)) {
        grid[pos.row][pos.col] = arrow.id;
      }
    });
  });
  
  return grid;
};

/**
 * 检查箭头是否可以移动（移动方向上没有其他箭头阻挡）
 */
const canArrowMove = (
  arrow: ArrowConfig,
  grid: number[][],
  rows: number,
  cols: number
): boolean => {
  const { position, direction, id } = arrow;
  const occupiedPositions = getArrowOccupiedPositions(position, direction);
  
  // 根据方向确定检查的路径
  let checkPositions: ArrowPosition[] = [];
  
  switch (direction) {
    case 'up':
      // 向上移动，检查箭头上方的所有位置
      for (let row = position.row - 1; row >= 0; row--) {
        checkPositions.push({ row, col: position.col });
      }
      break;
    case 'down':
      // 向下移动，检查箭头下方的所有位置
      for (let row = position.row + 2; row < rows; row++) {
        checkPositions.push({ row, col: position.col });
      }
      break;
    case 'left':
      // 向左移动，检查箭头左方的所有位置
      for (let col = position.col - 1; col >= 0; col--) {
        checkPositions.push({ row: position.row, col });
      }
      break;
    case 'right':
      // 向右移动，检查箭头右方的所有位置
      for (let col = position.col + 2; col < cols; col++) {
        checkPositions.push({ row: position.row, col });
      }
      break;
  }
  
  // 检查路径上是否有其他箭头阻挡
  for (const pos of checkPositions) {
    if (isPositionInBounds(pos, rows, cols)) {
      const cellValue = grid[pos.row][pos.col];
      if (cellValue !== 0 && cellValue !== id) {
        return false; // 被其他箭头阻挡
      }
    }
  }
  
  return true; // 可以移动
};

/**
 * 移除箭头后更新网格状态
 */
const removeArrowFromGrid = (
  arrow: ArrowConfig,
  grid: number[][],
  rows: number,
  cols: number
): number[][] => {
  const newGrid = grid.map(row => [...row]);
  const occupiedPositions = getArrowOccupiedPositions(arrow.position, arrow.direction);
  
  occupiedPositions.forEach(pos => {
    if (isPositionInBounds(pos, rows, cols)) {
      newGrid[pos.row][pos.col] = 0;
    }
  });
  
  return newGrid;
};

/**
 * 使用回溯算法检测布局是否可解
 */
const canSolveLayout = (
  remainingArrows: ArrowConfig[],
  grid: number[][],
  rows: number,
  cols: number
): boolean => {
  // 如果没有箭头了，说明找到了解决方案
  if (remainingArrows.length === 0) {
    return true;
  }
  
  // 尝试移动每个箭头
  for (let i = 0; i < remainingArrows.length; i++) {
    const arrow = remainingArrows[i];
    
    // 检查这个箭头是否可以移动
    if (canArrowMove(arrow, grid, rows, cols)) {
      // 创建移除这个箭头后的新状态
      const newGrid = removeArrowFromGrid(arrow, grid, rows, cols);
      const newRemainingArrows = remainingArrows.filter((_, index) => index !== i);
      
      // 递归检查剩余箭头
      if (canSolveLayout(newRemainingArrows, newGrid, rows, cols)) {
        return true;
      }
    }
  }
  
  // 没有找到解决方案
  return false;
};

/**
 * 检查单个箭头在当前布局下是否可以移动
 * @param arrowId 箭头ID
 * @param arrows 所有箭头配置
 * @param rows 网格行数
 * @param cols 网格列数
 * @returns true表示可以移动，false表示被阻挡
 */
export const canSingleArrowMove = (
  arrowId: number,
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): boolean => {
  const targetArrow = arrows.find(arrow => arrow.id === arrowId);
  if (!targetArrow) {
    return false;
  }
  
  const grid = createGridFromArrows(arrows, rows, cols);
  return canArrowMove(targetArrow, grid, rows, cols);
};

/**
 * 获取当前布局下可以移动的箭头列表
 * @param arrows 所有箭头配置
 * @param rows 网格行数
 * @param cols 网格列数
 * @returns 可移动的箭头ID数组
 */
export const getMovableArrows = (
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): number[] => {
  const grid = createGridFromArrows(arrows, rows, cols);
  const movableArrows: number[] = [];
  
  arrows.forEach(arrow => {
    if (canArrowMove(arrow, grid, rows, cols)) {
      movableArrows.push(arrow.id);
    }
  });
  
  return movableArrows;
};

/**
 * 从像素位置的箭头数据转换为验证用的配置格式
 * @param arrowsData 游戏中的箭头数据
 * @param gridSize 网格大小
 * @param offsetX X偏移
 * @param offsetY Y偏移
 * @param gap 网格间隙
 * @returns 箭头配置数组
 */
export const convertArrowDataToConfig = (
  arrowsData: Array<{
    id: number;
    direction: ArrowDirection;
    pixelPosition: { x: number; y: number };
  }>,
  gridSize: number = 60,
  offsetX: number = 20,
  offsetY: number = 20,
  gap: number = 2
): ArrowConfig[] => {
  return arrowsData.map(arrow => ({
    id: arrow.id,
    direction: arrow.direction,
    position: {
      row: Math.round((arrow.pixelPosition.y - offsetY) / (gridSize + gap)),
      col: Math.round((arrow.pixelPosition.x - offsetX) / (gridSize + gap))
    }
  }));
};
