// 箭头相关的工具函数
import type { ArrowDirection, ArrowPosition, PixelPosition } from '../types/game';

// 根据箭头方向和位置获取占用的格子
export const getArrowOccupiedPositions = (
  position: ArrowPosition, 
  direction: ArrowDirection
): ArrowPosition[] => {
  const positions: ArrowPosition[] = [];
  
  switch (direction) {
    case 'up':
    case 'down':
      // 垂直箭头：2行1列
      positions.push({ row: position.row, col: position.col });
      positions.push({ row: position.row + 1, col: position.col });
      break;
    case 'left':
    case 'right':
      // 水平箭头：1行2列
      positions.push({ row: position.row, col: position.col });
      positions.push({ row: position.row, col: position.col + 1 });
      break;
  }
  
  return positions;
};

// 根据当前位置和方向获取下一个位置
export const getNextPosition = (
  currentPos: ArrowPosition, 
  direction: ArrowDirection
): ArrowPosition => {
  switch (direction) {
    case 'up':
      return { row: currentPos.row - 1, col: currentPos.col };
    case 'down':
      return { row: currentPos.row + 1, col: currentPos.col };
    case 'left':
      return { row: currentPos.row, col: currentPos.col - 1 };
    case 'right':
      return { row: currentPos.row, col: currentPos.col + 1 };
    default:
      return currentPos;
  }
};

// 检查位置是否在网格范围内
export const isPositionInBounds = (
  position: ArrowPosition, 
  rows: number, 
  cols: number
): boolean => {
  return position.row >= 0 && position.row < rows && 
         position.col >= 0 && position.col < cols;
};

// 将像素位置转换为网格位置
export const pixelToGrid = (
  pixelX: number, 
  pixelY: number, 
  gridSize: number = 60, 
  offsetX: number = 0, 
  offsetY: number = 0,
  gap: number = 2 // grid gap-0.5 = 2px
): ArrowPosition => {
  return {
    row: Math.round((pixelY - offsetY) / (gridSize + gap)),
    col: Math.round((pixelX - offsetX) / (gridSize + gap))
  };
};

// 将网格位置转换为像素位置
export const gridToPixel = (
  gridPos: ArrowPosition, 
  gridSize: number = 60, 
  offsetX: number = 0, 
  offsetY: number = 0,
  gap: number = 2 // grid gap-0.5 = 2px
): PixelPosition => {
  return {
    x: (gridPos.col) * (gridSize + gap) + offsetX,
    y: gridPos.row * (gridSize + gap) + offsetY
  };
};

// 生成随机箭头方向
export const getRandomDirection = (): ArrowDirection => {
  const directions: ArrowDirection[] = ['up', 'down', 'left', 'right'];
  return directions[Math.floor(Math.random() * directions.length)];
};

// 获取箭头符号
export const getArrowSymbol = (direction: ArrowDirection): string => {
  switch (direction) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'left': return '←';
    case 'right': return '→';
    default: return '↑';
  }
};

// 根据像素位置计算箭头占据的格子
export const getArrowOccupiedCellsByPixel = (
  pixelX: number,
  pixelY: number,
  direction: ArrowDirection,
  gridSize: number = 60,
  offsetX: number = 0,
  offsetY: number = 0,
  gap: number = 2,
  maxRows: number = 6,
  maxCols: number = 6
): ArrowPosition[] => {
  const occupiedCells: ArrowPosition[] = [];
  
  // 计算箭头的边界框
  let arrowWidth, arrowHeight;
  if (direction === 'left' || direction === 'right') {
    arrowWidth = gridSize * 2 + gap;
    arrowHeight = gridSize;
  } else {
    arrowWidth = gridSize;
    arrowHeight = gridSize * 2 + gap;
  }
  
  // 箭头的四个角的坐标
  const left = pixelX;
  const right = pixelX + arrowWidth;
  const top = pixelY;
  const bottom = pixelY + arrowHeight;
  
  // 遍历所有网格，检查是否与箭头重叠
  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col < maxCols; col++) {
      // 计算网格单元的边界
      const cellLeft = col * (gridSize + gap) + offsetX;
      const cellRight = cellLeft + gridSize;
      const cellTop = row * (gridSize + gap) + offsetY;
      const cellBottom = cellTop + gridSize;
      
      // 检查矩形重叠
      const overlapping = !(
        right <= cellLeft ||
        left >= cellRight ||
        bottom <= cellTop ||
        top >= cellBottom
      );
      
      if (overlapping) {
        occupiedCells.push({ row, col });
      }
    }
  }

  return occupiedCells;
};

// 将箭头位置调整到最近的合法网格位置（正好占据两个格子）
export const adjustToValidGridPosition = (
  currentPixelX: number,
  currentPixelY: number,
  direction: ArrowDirection,
  gridSize: number = 60,
  offsetX: number = 0,
  offsetY: number = 0,
  gap: number = 2
): PixelPosition => {
  // 计算最接近的网格位置
  const gridCol = Math.round((currentPixelX - offsetX) / (gridSize + gap));
  const gridRow = Math.round((currentPixelY - offsetY) / (gridSize + gap));
  
  // 将网格位置转换回像素位置
  const adjustedPixelPos = gridToPixel(
    { row: gridRow, col: gridCol },
    gridSize,
    offsetX,
    offsetY,
    gap
  );
  
  return adjustedPixelPos;
};

// 检查箭头是否可以放置在指定位置
export const canPlaceArrow = (
  position: ArrowPosition,
  direction: ArrowDirection,
  gridChecker: (row: number, col: number) => boolean,
  rows: number,
  cols: number
): boolean => {
  const occupiedPositions = getArrowOccupiedPositions(position, direction);
  
  // 检查所有占用位置是否都在边界内且为空
  for (const pos of occupiedPositions) {
    if (!isPositionInBounds(pos, rows, cols) || !gridChecker(pos.row, pos.col)) {
      return false;
    }
  }
  
  return true;
};
