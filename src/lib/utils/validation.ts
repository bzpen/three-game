// 完善的箭头死锁检测系统 - 支持相邻和长距离死锁检测
import type { ArrowDirection, ArrowPosition, ArrowData } from '../types/game';
import { getArrowOccupiedPositions, isPositionInBounds } from './arrow';

interface ArrowConfig {
  id: number;
  position: ArrowPosition;
  direction: ArrowDirection;
}

interface Position {
  row: number;
  col: number;
}

interface DeadlockInfo {
  hasDeadlock: boolean;
  deadlockType: 'horizontal-adjacent' | 'vertical-adjacent' | 'horizontal-long-distance' | 'vertical-long-distance' | 'tight-cyclic' | 'none';
  involvedArrows: number[];
  description: string;
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
  return !detectDeadlock(arrows, rows, cols);
};

/**
 * 将ArrowData数组转换为ArrowConfig数组
 * @param arrowData 箭头数据数组
 * @param gridSize 网格大小
 * @param offsetX X偏移量
 * @param offsetY Y偏移量
 * @param scale 缩放比例
 * @returns ArrowConfig数组
 */
export const convertArrowDataToConfig = (
  arrowData: ArrowData[],
  gridSize: number,
  offsetX: number = 0,
  offsetY: number = 0,
  scale: number = 1
): ArrowConfig[] => {
  return arrowData.map(arrow => ({
    id: arrow.id,
    position: {
      row: Math.floor((arrow.pixelPosition.y - offsetY) / (gridSize * scale)),
      col: Math.floor((arrow.pixelPosition.x - offsetX) / (gridSize * scale))
    },
    direction: arrow.direction
  }));
};

/**
 * 检测是否存在死锁 - 完善版本
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
  const deadlockInfo = getDetailedDeadlockInfo(arrows, rows, cols);
  return deadlockInfo.hasDeadlock;
};

/**
 * 获取详细的死锁信息
 * @param arrows 箭头配置数组
 * @param rows 网格行数
 * @param cols 网格列数
 * @returns 详细的死锁信息
 */
export const getDetailedDeadlockInfo = (
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): DeadlockInfo => {
  // 1. 检测相邻死锁（保留原有逻辑用于快速检测）
  const adjacentHorizontal = detectHorizontalAdjacentDeadlock(arrows);
  if (adjacentHorizontal.hasDeadlock) {
    return {
      ...adjacentHorizontal,
      deadlockType: 'horizontal-adjacent',
      description: '水平相邻箭头死锁'
    };
  }

  const adjacentVertical = detectVerticalAdjacentDeadlock(arrows);
  if (adjacentVertical.hasDeadlock) {
    return {
      ...adjacentVertical,
      deadlockType: 'vertical-adjacent',
      description: '垂直相邻箭头死锁'
    };
  }

  // 2. 检测长距离死锁
  const longDistanceHorizontal = detectLongDistanceHorizontalDeadlock(arrows, rows, cols);
  if (longDistanceHorizontal.hasDeadlock) {
    return {
      ...longDistanceHorizontal,
      deadlockType: 'horizontal-long-distance',
      description: '水平长距离死锁'
    };
  }

  const longDistanceVertical = detectLongDistanceVerticalDeadlock(arrows, rows, cols);
  if (longDistanceVertical.hasDeadlock) {
    return {
      ...longDistanceVertical,
      deadlockType: 'vertical-long-distance',
      description: '垂直长距离死锁'
    };
  }

  // 3. 检测紧密环形死锁
  const tightCyclic = detectTightCyclicDeadlock(arrows);
  if (tightCyclic.hasDeadlock) {
    return {
      ...tightCyclic,
      deadlockType: 'tight-cyclic',
      description: '紧密环形死锁'
    };
  }

  return {
    hasDeadlock: false,
    deadlockType: 'none',
    involvedArrows: [],
    description: '无死锁'
  };
};

// ==================== 相邻死锁检测 ====================

/**
 * 检测水平相邻死锁
 */
const detectHorizontalAdjacentDeadlock = (
  arrows: ArrowConfig[]
): { hasDeadlock: boolean; involvedArrows: number[] } => {
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
          return { 
            hasDeadlock: true, 
            involvedArrows: [arrow1.id, arrow2.id] 
          };
        }
      }
    }
  }
  
  return { hasDeadlock: false, involvedArrows: [] };
};

/**
 * 检测垂直相邻死锁
 */
const detectVerticalAdjacentDeadlock = (
  arrows: ArrowConfig[]
): { hasDeadlock: boolean; involvedArrows: number[] } => {
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
          return { 
            hasDeadlock: true, 
            involvedArrows: [arrow1.id, arrow2.id] 
          };
        }
      }
    }
  }
  
  return { hasDeadlock: false, involvedArrows: [] };
};

// ==================== 长距离死锁检测 ====================

/**
 * 检测水平长距离死锁
 */
const detectLongDistanceHorizontalDeadlock = (
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): { hasDeadlock: boolean; involvedArrows: number[] } => {
  const horizontalArrows = arrows.filter(arrow => 
    arrow.direction === 'left' || arrow.direction === 'right'
  );
  
  for (let i = 0; i < horizontalArrows.length; i++) {
    for (let j = i + 1; j < horizontalArrows.length; j++) {
      const arrow1 = horizontalArrows[i];
      const arrow2 = horizontalArrows[j];
      
      // 检查是否在同一行
      if (arrow1.position.row === arrow2.position.row) {
        // 检查是否相对
        const isFacing = (
          (arrow1.direction === 'right' && arrow2.direction === 'left' && 
           arrow1.position.col < arrow2.position.col) ||
          (arrow1.direction === 'left' && arrow2.direction === 'right' && 
           arrow1.position.col > arrow2.position.col)
        );
        
        if (isFacing) {
          // 计算两个箭头的移动路径
          const path1 = getArrowMovementPath(arrow1, arrows, rows, cols);
          const path2 = getArrowMovementPath(arrow2, arrows, rows, cols);
          
          // 检查路径是否相交
          if (pathsIntersect(path1, path2)) {
            console.log(`检测到水平长距离死锁: 箭头${arrow1.id} <-> 箭头${arrow2.id}`);
            return { 
              hasDeadlock: true, 
              involvedArrows: [arrow1.id, arrow2.id] 
            };
          }
        }
      }
    }
  }
  
  return { hasDeadlock: false, involvedArrows: [] };
};

/**
 * 检测垂直长距离死锁
 */
const detectLongDistanceVerticalDeadlock = (
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): { hasDeadlock: boolean; involvedArrows: number[] } => {
  const verticalArrows = arrows.filter(arrow => 
    arrow.direction === 'up' || arrow.direction === 'down'
  );
  
  for (let i = 0; i < verticalArrows.length; i++) {
    for (let j = i + 1; j < verticalArrows.length; j++) {
      const arrow1 = verticalArrows[i];
      const arrow2 = verticalArrows[j];
      
      // 检查是否在同一列
      if (arrow1.position.col === arrow2.position.col) {
        // 检查是否相对
        const isFacing = (
          (arrow1.direction === 'down' && arrow2.direction === 'up' && 
           arrow1.position.row < arrow2.position.row) ||
          (arrow1.direction === 'up' && arrow2.direction === 'down' && 
           arrow1.position.row > arrow2.position.row)
        );
        
        if (isFacing) {
          // 计算两个箭头的移动路径
          const path1 = getArrowMovementPath(arrow1, arrows, rows, cols);
          const path2 = getArrowMovementPath(arrow2, arrows, rows, cols);
          
          // 检查路径是否相交
          if (pathsIntersect(path1, path2)) {
            console.log(`检测到垂直长距离死锁: 箭头${arrow1.id} <-> 箭头${arrow2.id}`);
            return { 
              hasDeadlock: true, 
              involvedArrows: [arrow1.id, arrow2.id] 
            };
          }
        }
      }
    }
  }
  
  return { hasDeadlock: false, involvedArrows: [] };
};

/**
 * 检测紧密环形死锁（只检测相邻箭头形成的环）
 */
const detectTightCyclicDeadlock = (
  arrows: ArrowConfig[]
): { hasDeadlock: boolean; involvedArrows: number[] } => {
  // 构建相邻阻挡关系图
  const adjacentBlockGraph = buildAdjacentBlockGraph(arrows);
  
  // 检测环形依赖
  const cyclicArrows = findCyclicArrows(adjacentBlockGraph);
  
  return {
    hasDeadlock: cyclicArrows.length > 0,
    involvedArrows: cyclicArrows
  };
};

// ==================== 路径计算工具函数 ====================

/**
 * 计算箭头的完整移动路径
 */
const getArrowMovementPath = (
  arrow: ArrowConfig,
  allArrows: ArrowConfig[],
  rows: number,
  cols: number
): Position[] => {
  const path: Position[] = [];
  
  // 从箭头的前端开始计算路径
  let currentPos = getArrowFrontPosition(arrow);
  
  while (isPositionInBounds({ row: currentPos.row, col: currentPos.col }, rows, cols)) {
    // 检查当前位置是否被其他箭头占用
    if (isPositionOccupiedByOtherArrows(currentPos, arrow.id, allArrows)) {
      break; // 遇到障碍物，停止
    }
    
    path.push({ ...currentPos });
    
    // 移动到下一个位置
    currentPos = getNextPosition(currentPos, arrow.direction);
  }
  
  return path;
};

/**
 * 获取箭头的前端位置（移动方向的最前面）
 */
const getArrowFrontPosition = (arrow: ArrowConfig): Position => {
  const { row, col } = arrow.position;
  
  switch (arrow.direction) {
    case 'up':
      return { row, col };
    case 'down':
      return { row: row + 1, col };
    case 'left':
      return { row, col };
    case 'right':
      return { row, col: col + 1 };
    default:
      return { row, col };
  }
};

/**
 * 根据方向获取下一个位置
 */
const getNextPosition = (pos: Position, direction: ArrowDirection): Position => {
  switch (direction) {
    case 'up':
      return { row: pos.row - 1, col: pos.col };
    case 'down':
      return { row: pos.row + 1, col: pos.col };
    case 'left':
      return { row: pos.row, col: pos.col - 1 };
    case 'right':
      return { row: pos.row, col: pos.col + 1 };
    default:
      return pos;
  }
};

/**
 * 检查位置是否被其他箭头占用
 */
const isPositionOccupiedByOtherArrows = (
  pos: Position,
  excludeArrowId: number,
  allArrows: ArrowConfig[]
): boolean => {
  return allArrows.some(arrow => {
    if (arrow.id === excludeArrowId) return false;
    
    const occupiedPositions = getArrowOccupiedPositions(arrow.position, arrow.direction);
    return occupiedPositions.some(occupied => 
      occupied.row === pos.row && occupied.col === pos.col
    );
  });
};

/**
 * 检查两条路径是否相交
 */
const pathsIntersect = (path1: Position[], path2: Position[]): boolean => {
  for (const pos1 of path1) {
    for (const pos2 of path2) {
      if (pos1.row === pos2.row && pos1.col === pos2.col) {
        return true;
      }
    }
  }
  return false;
};

// ==================== 环形死锁检测工具函数 ====================

/**
 * 构建相邻阻挡关系图（只考虑相邻的箭头）
 */
const buildAdjacentBlockGraph = (
  arrows: ArrowConfig[]
): Map<number, number[]> => {
  const graph = new Map<number, number[]>();
  
  arrows.forEach(arrow => {
    const blockers: number[] = [];
    
    // 获取箭头前方的直接相邻位置
    const frontPos = getArrowFrontPosition(arrow);
    const nextPos = getNextPosition(frontPos, arrow.direction);
    
    // 检查直接相邻位置是否有其他箭头
    arrows.forEach(otherArrow => {
      if (otherArrow.id === arrow.id) return;
      
      const occupiedPositions = getArrowOccupiedPositions(otherArrow.position, otherArrow.direction);
      const isDirectlyBlocked = occupiedPositions.some(pos => 
        pos.row === nextPos.row && pos.col === nextPos.col
      );
      
      if (isDirectlyBlocked) {
        blockers.push(otherArrow.id);
      }
    });
    
    graph.set(arrow.id, blockers);
  });
  
  return graph;
};

/**
 * 查找参与环形依赖的箭头
 */
const findCyclicArrows = (graph: Map<number, number[]>): number[] => {
  const visited = new Set<number>();
  const recursionStack = new Set<number>();
  const cyclicArrows = new Set<number>();
  
  const dfs = (nodeId: number, path: number[]): boolean => {
    if (recursionStack.has(nodeId)) {
      // 找到环，记录环中的所有箭头
      const cycleStart = path.indexOf(nodeId);
      for (let i = cycleStart; i < path.length; i++) {
        cyclicArrows.add(path[i]);
      }
      cyclicArrows.add(nodeId);
      return true;
    }
    
    if (visited.has(nodeId)) {
      return false;
    }
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const neighbors = graph.get(nodeId) || [];
    for (const neighborId of neighbors) {
      if (dfs(neighborId, [...path])) {
        return true;
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  };
  
  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  }
  
  return Array.from(cyclicArrows);
};

// ==================== 调试和测试工具函数 ====================

/**
 * 打印死锁检测结果（用于调试）
 */
export const printDeadlockAnalysis = (
  arrows: ArrowConfig[],
  rows: number,
  cols: number
): void => {
  const deadlockInfo = getDetailedDeadlockInfo(arrows, rows, cols);
  
  console.log('=== 死锁检测分析 ===');
  console.log(`检测结果: ${deadlockInfo.hasDeadlock ? '发现死锁' : '无死锁'}`);
  console.log(`死锁类型: ${deadlockInfo.deadlockType}`);
  console.log(`描述: ${deadlockInfo.description}`);
  console.log(`涉及箭头: [${deadlockInfo.involvedArrows.join(', ')}]`);
  
  if (deadlockInfo.hasDeadlock) {
    console.log('\n=== 涉及箭头详情 ===');
    deadlockInfo.involvedArrows.forEach(arrowId => {
      const arrow = arrows.find(a => a.id === arrowId);
      if (arrow) {
        console.log(`箭头${arrowId}: 位置(${arrow.position.row}, ${arrow.position.col}), 方向: ${arrow.direction}`);
      }
    });
  }
};