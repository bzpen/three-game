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
  // 使用新的死锁检测算法
  return !detectDeadlock(arrows, rows, cols);
};

/**
 * 检测是否存在死锁
 * @param arrows 箭头配置数组
 * @param rows 网格行数
 * @param cols 网格列数
 * @returns true表示存在死锁，false表示无死锁
 */
export const detectDeadlock = (
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): boolean => {
  return detectHorizontalDeadlock(arrows) ||
         detectVerticalDeadlock(arrows) ||
         detectCyclicDeadlock(arrows, rows, cols);
};

/**
 * 检测水平相互阻挡死锁
 * @param arrows 箭头配置数组
 * @returns true表示存在水平死锁
 */
const detectHorizontalDeadlock = (arrows: ArrowConfig[]): boolean => {
  const horizontalArrows = arrows.filter(arrow => 
    arrow.direction === 'left' || arrow.direction === 'right'
  );
  
  for (let i = 0; i < horizontalArrows.length; i++) {
    for (let j = i + 1; j < horizontalArrows.length; j++) {
      const arrow1 = horizontalArrows[i];
      const arrow2 = horizontalArrows[j];
      
      // 检查是否在同一行且相邻
      if (arrow1.position.row === arrow2.position.row) {
        const isAdjacent = Math.abs(arrow1.position.col - arrow2.position.col) === 2;
        const isFacing = (
          (arrow1.direction === 'right' && arrow2.direction === 'left' && 
           arrow1.position.col < arrow2.position.col) ||
          (arrow1.direction === 'left' && arrow2.direction === 'right' && 
           arrow1.position.col > arrow2.position.col)
        );
        
        if (isAdjacent && isFacing) {
          return true; // 发现水平死锁
        }
      }
    }
  }
  
  return false;
};

/**
 * 检测垂直相互阻挡死锁
 * @param arrows 箭头配置数组
 * @returns true表示存在垂直死锁
 */
const detectVerticalDeadlock = (arrows: ArrowConfig[]): boolean => {
  const verticalArrows = arrows.filter(arrow => 
    arrow.direction === 'up' || arrow.direction === 'down'
  );
  
  for (let i = 0; i < verticalArrows.length; i++) {
    for (let j = i + 1; j < verticalArrows.length; j++) {
      const arrow1 = verticalArrows[i];
      const arrow2 = verticalArrows[j];
      
      // 检查是否在同一列且相邻
      if (arrow1.position.col === arrow2.position.col) {
        const isAdjacent = Math.abs(arrow1.position.row - arrow2.position.row) === 2;
        const isFacing = (
          (arrow1.direction === 'down' && arrow2.direction === 'up' && 
           arrow1.position.row < arrow2.position.row) ||
          (arrow1.direction === 'up' && arrow2.direction === 'down' && 
           arrow1.position.row > arrow2.position.row)
        );
        
        if (isAdjacent && isFacing) {
          return true; // 发现垂直死锁
        }
      }
    }
  }
  
  return false;
};

/**
 * 检测环形循环依赖死锁
 * @param arrows 箭头配置数组
 * @param rows 网格行数
 * @param cols 网格列数
 * @returns true表示存在环形死锁
 */
const detectCyclicDeadlock = (
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): boolean => {
  const grid = createGridFromArrows(arrows, rows, cols);
  
  // 构建依赖图
  const dependencies = new Map<number, number[]>();
  
  arrows.forEach(arrow => {
    const blockers = getBlockingArrows(arrow, arrows, grid, rows, cols);
    dependencies.set(arrow.id, blockers);
  });
  
  // 检测循环依赖
  return hasCycle(dependencies);
};

/**
 * 获取阻挡指定箭头的箭头列表
 */
const getBlockingArrows = (
  arrow: ArrowConfig,
  allArrows: ArrowConfig[],
  grid: number[][],
  rows: number,
  cols: number
): number[] => {
  const blockers: number[] = [];
  const { position, direction } = arrow;
  
  // 根据方向获取移动路径上的阻挡箭头
  const checkPositions: ArrowPosition[] = [];
  
  switch (direction) {
    case 'up':
      for (let row = position.row - 1; row >= 0; row--) {
        checkPositions.push({ row, col: position.col });
      }
      break;
    case 'down':
      for (let row = position.row + 2; row < rows; row++) {
        checkPositions.push({ row, col: position.col });
      }
      break;
    case 'left':
      for (let col = position.col - 1; col >= 0; col--) {
        checkPositions.push({ row: position.row, col });
      }
      break;
    case 'right':
      for (let col = position.col + 2; col < cols; col++) {
        checkPositions.push({ row: position.row, col });
      }
      break;
  }
  
  // 找到第一个阻挡的箭头
  for (const pos of checkPositions) {
    if (isPositionInBounds(pos, rows, cols)) {
      const cellValue = grid[pos.row][pos.col];
      if (cellValue !== 0 && cellValue !== arrow.id) {
        blockers.push(cellValue);
        break; // 只需要第一个阻挡者
      }
    }
  }
  
  return blockers;
};

/**
 * 检测依赖图中是否存在循环
 */
const hasCycle = (dependencies: Map<number, number[]>): boolean => {
  const visited = new Set<number>();
  const recursionStack = new Set<number>();
  
  for (const nodeId of dependencies.keys()) {
    if (hasCycleDFS(nodeId, dependencies, visited, recursionStack)) {
      return true;
    }
  }
  
  return false;
};

/**
 * 使用DFS检测循环
 */
const hasCycleDFS = (
  nodeId: number,
  dependencies: Map<number, number[]>,
  visited: Set<number>,
  recursionStack: Set<number>
): boolean => {
  if (recursionStack.has(nodeId)) {
    return true; // 发现循环
  }
  
  if (visited.has(nodeId)) {
    return false; // 已访问过且无循环
  }
  
  visited.add(nodeId);
  recursionStack.add(nodeId);
  
  const deps = dependencies.get(nodeId) || [];
  for (const depId of deps) {
    if (hasCycleDFS(depId, dependencies, visited, recursionStack)) {
      return true;
    }
  }
  
  recursionStack.delete(nodeId);
  return false;
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
  const blockers = getBlockingArrows(targetArrow, arrows, grid, rows, cols);
  return blockers.length === 0;
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
    const blockers = getBlockingArrows(arrow, arrows, grid, rows, cols);
    if (blockers.length === 0) {
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
