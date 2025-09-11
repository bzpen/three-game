'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GridManager } from '../lib/managers/GridManager';
import type { ArrowPosition, ArrowData } from '../lib/types/game';
import { 
  getArrowOccupiedPositions,
  getRandomDirection,
  canPlaceArrow,
  isPositionInBounds,
  getArrowOccupiedCellsByPixel,
  gridToPixel
} from '../lib/utils/arrow';
import Arrow from './Arrow';
import Grid from './Grid';

interface GameBoardProps {
  rows?: number;
  cols?: number;
  gridSize?: number;
  arrowCount?: number;
  showGridData?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  rows = 6,
  cols = 6,
  gridSize = 60,
  arrowCount = 3,
  showGridData: initialShowGridData = false
}) => {
  const [gridManager] = useState(() => new GridManager(rows, cols));
  const [arrows, setArrows] = useState<ArrowData[]>([]);
  const [movingArrows, setMovingArrows] = useState<Set<number>>(new Set());
  const [gridData, setGridData] = useState<number[][]>(() => gridManager.getGrid());
  const [showGridData, setShowGridData] = useState(initialShowGridData);

  // 更新网格显示数据
  const updateGridData = useCallback(() => {
    setGridData([...gridManager.getGrid()]);
  }, [gridManager]);

  // 生成随机箭头
  const generateRandomArrows = useCallback(() => {
    const newArrows: ArrowData[] = [];
    const attempts = 100; // 最大尝试次数
    
    gridManager.reset();
    
    for (let i = 0; i < arrowCount; i++) {
      let placed = false;
      let attempt = 0;
      const arrowId = i + 1; // 箭头ID从1开始
      
      while (!placed && attempt < attempts) {
        const direction = getRandomDirection();
        const row = Math.floor(Math.random() * (rows - (direction === 'up' || direction === 'down' ? 1 : 0)));
        const col = Math.floor(Math.random() * (cols - (direction === 'left' || direction === 'right' ? 1 : 0)));
        const position: ArrowPosition = { row, col };
        
        if (canPlaceArrow(position, direction, (r, c) => gridManager.isEmpty(r, c), rows, cols)) {
          const occupiedPositions = getArrowOccupiedPositions(position, direction);
          gridManager.occupyPositions(occupiedPositions, arrowId);
          
          const pixelPosition = gridToPixel(position, gridSize, 20, 20, 2);
          newArrows.push({
            id: arrowId,
            direction,
            pixelPosition,
            isMoving: false
          });
          
          placed = true;
        }
        
        attempt++;
      }
    }
    
    setArrows(newArrows);
    updateGridData();
  }, [arrowCount, rows, cols, gridManager, updateGridData, gridSize]);

  // 初始化生成箭头
  useEffect(() => {
    generateRandomArrows();
  }, [generateRandomArrows]);

  // 使用useRef来保存最新的arrows状态，避免useEffect依赖
  const arrowsRef = useRef(arrows);
  arrowsRef.current = arrows;

  // 定时更新网格状态
  useEffect(() => {
    const updateGridStatus = () => {
      // 重置网格
      gridManager.reset();
      
      // 使用ref获取最新的arrows状态
      const currentArrows = arrowsRef.current;
      
      // 遍历所有箭头，计算它们当前占据的格子
      currentArrows.forEach((arrow: ArrowData) => {
        if (arrow && arrow.pixelPosition) {
          // 使用箭头当前的像素位置计算占据的格子
          const occupiedCells = getArrowOccupiedCellsByPixel(
            arrow.pixelPosition.x,
            arrow.pixelPosition.y,
            arrow.direction,
            60, 20, 20, 2, rows, cols
          );
          
          if (occupiedCells.length > 0) {
            gridManager.occupyPositions(occupiedCells, arrow.id);
          }
        }
      });
      
      updateGridData();
    };

    // 每50ms更新一次网格状态
    const interval = setInterval(updateGridStatus, 50);
    
    // 立即执行一次
    updateGridStatus();
    
    return () => clearInterval(interval);
  }, [gridManager, updateGridData, rows, cols]); // 移除arrows依赖

  // 处理箭头开始移动
  const handleStartMove = (index: number) => {
    setMovingArrows(prev => new Set(prev).add(index));
    setArrows(prev => prev.map((arrow, i) => 
      i === index ? { ...arrow, isMoving: true } : arrow
    ));
  };

  // 处理箭头暂停
  const handleArrowPause = (index: number) => {
    setMovingArrows(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setArrows(prev => prev.map((arrow, i) => 
      i === index ? { ...arrow, isMoving: false } : arrow
    ));
  };

  // 处理箭头像素位置更新（由Arrow组件调用）
  const handlePixelPositionUpdate = useCallback((index: number, newPixelPosition: { x: number; y: number }) => {
    setArrows(prev => prev.map((arrow, i) => 
      i === index ? { 
        ...arrow, 
        pixelPosition: newPixelPosition
      } : arrow
    ));
  }, []);

  // 处理箭头移出区域（销毁）
  const handleArrowMove = (index: number) => {
    setTimeout(() => {
      setArrows(prev => prev.filter((_, i) => i !== index));
      setMovingArrows(prev => {
        const newSet = new Set<number>();
        prev.forEach(i => {
          if (i < index) newSet.add(i);
          else if (i > index) newSet.add(i - 1);
        });
        return newSet;
      });
    }, 100);
  };



  // 检查碰撞（基于当前位置的侵入检测）
  const checkCollision = useCallback((arrowId: number, currentPixelPosition?: { x: number; y: number }): boolean => {
    // 通过ID找到对应的箭头，而不是依赖索引
    const arrow = arrows.find(arr => arr.id === arrowId);
    if (!arrow) {
      return false;
    }

    // 优先使用传入的实时像素位置，如果没有则使用状态中的位置
    const pixelPos = currentPixelPosition || arrow.pixelPosition;
    if (!pixelPos) {
      return false;
    }

    // 获取箭头当前位置占据的所有格子
    const currentOccupiedCells = getArrowOccupiedCellsByPixel(
      pixelPos.x,
      pixelPos.y,
      arrow.direction,
      60, 20, 20, 2, rows, cols
    );
    
    // 检查当前占据的格子中是否有被其他箭头占据的
    for (const cell of currentOccupiedCells) {
      if (isPositionInBounds(cell, rows, cols)) {
        const cellValue = gridManager.getValue(cell.row, cell.col);
        // 如果格子被其他箭头占据（不是空格也不是自己的ID），说明发生了侵入
        if (cellValue !== 0 && cellValue !== arrow.id) {
          return true; // 发生侵入碰撞
        }
      }
    }
    
    return false; // 无侵入
  }, [arrows, gridManager, rows, cols]);


  const boardSize = gridSize * cols + 40; // 包含padding

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* 控制按钮 */}
        <div className="flex gap-2">
          <button 
            onClick={generateRandomArrows}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重新生成箭头
          </button>
          <button 
            onClick={() => setShowGridData(!showGridData)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {showGridData ? '隐藏' : '显示'}网格状态
          </button>
        </div>
        
        {/* 游戏区域 */}
        <div 
          className="relative bg-white border-4 border-gray-300 shadow-lg"
          style={{ width: `${boardSize}px`, height: `${boardSize}px` }}
        >
          {/* 网格背景 */}
          <Grid 
            rows={rows}
            cols={cols}
            gridSize={gridSize}
            gridData={gridData}
            showGridData={showGridData}
          />
          
          {/* 箭头 */}
          {arrows.map((arrow, index) => (
            <div key={`arrow-${index}`} data-arrow-index={index}>
              <Arrow 
                direction={arrow.direction}
                pixelPosition={arrow.pixelPosition}
                index={index}
                arrowId={arrow.id}
                onMove={handleArrowMove}
                onStartMove={handleStartMove}
                onPause={handleArrowPause}
                onPixelPositionUpdate={handlePixelPositionUpdate}
                isMoving={arrow.isMoving}
                checkCollision={checkCollision}
              />
            </div>
          ))}
        </div>
        
        {/* 状态显示 */}
        <div className="text-sm text-gray-600">
          <p>箭头数量: {arrows.length}</p>
          <p>移动中: {movingArrows.size}</p>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
