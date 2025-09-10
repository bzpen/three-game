'use client';

import { useState, useEffect, useRef } from 'react';

// 箭头组件
const Arrow = ({ 
  direction, 
  index, 
  gridPosition,
  onMove, 
  onStartMove,
  onPause,
  isMoving,
  checkCollision
}: { 
  direction: 'up' | 'down' | 'left' | 'right';
  index: number;
  gridPosition: { row: number; col: number };
  onMove: (index: number) => void;
  onStartMove: (index: number) => void;
  onPause: (index: number) => void;
  isMoving: boolean;
  checkCollision: (index: number, direction: 'up' | 'down' | 'left' | 'right') => number | null;
}) => {
  const arrowRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ 
    top: gridPosition.row * 60 + 20, 
    left: gridPosition.col * 60 + 20 
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getArrowSymbol = () => {
    switch (direction) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'left': return '←';
      case 'right': return '→';
      default: return '↑';
    }
  };

  const handleClick = () => {
    console.log('Arrow clicked!', direction, index);
    console.log('Current position:', position);
    console.log('States:', { isMoving, isAnimating });
    
    // 防止重复点击：如果箭头正在移动或动画中，直接返回
    if (isMoving || isAnimating) {
      console.log('Arrow is already moving, ignoring click');
      return;
    }
    
    // 设置移动状态
    onStartMove(index);
    setIsAnimating(true);
    
    // 计算目标位置
    const currentTop = position.top;
    const currentLeft = position.left;
    let targetTop = currentTop;
    let targetLeft = currentLeft;
    
    // 根据方向计算目标位置（移动到区域外）
    switch (direction) {
      case 'up':
        targetTop = -100; // 移动到顶部外
        break;
      case 'down':
        targetTop = 400; // 移动到底部外
        break;
      case 'left':
        targetLeft = -100; // 移动到左侧外
        break;
      case 'right':
        targetLeft = 400; // 移动到右侧外
        break;
    }
    
    console.log('Target position:', { targetTop, targetLeft, currentTop, currentLeft });

    // 网格尺寸
    const gridSize = 60; // 每个网格的尺寸（1:1正方形）
    const gridStartX = 20; // 网格起始X
    const gridStartY = 20; // 网格起始Y

    // 使用requestAnimationFrame实现平滑动画
    const startTime = Date.now();
    const duration = 2000; // 2秒动画
    let hasCollided = false;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 线性插值计算当前位置
      const currentAnimTop = currentTop + (targetTop - currentTop) * progress;
      const currentAnimLeft = currentLeft + (targetLeft - currentLeft) * progress;
      
      // 计算当前所在的网格位置（基于像素位置）
      const currentGridCol = Math.round((currentAnimLeft - gridStartX) / gridSize);
      const currentGridRow = Math.round((currentAnimTop - gridStartY) / gridSize);
      
      // 检查是否即将发生碰撞
      if (!hasCollided && progress > 0.1) { // 移动超过10%时开始检测碰撞
        const collisionIndex = checkCollision(index, direction);
        if (collisionIndex !== null && collisionIndex !== -1) {
          console.log('Collision detected! Stopping movement, can click again to retry');
          hasCollided = true;
          
          // 碰撞时停止在当前位置，重置状态允许重新点击
          setIsAnimating(false);
          onPause(index); // 重置移动状态，允许重新点击
          return;
        }
      }
      
      console.log('Animation progress:', progress, 'Grid position:', { currentGridRow, currentGridCol });
      
      // 更新位置
      setPosition({ top: currentAnimTop, left: currentAnimLeft });
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 动画完成
        console.log('Animation completed');
        setIsAnimating(false);
        onMove(index);
      }
    };
    
    console.log('Starting animation...');
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div 
      ref={arrowRef}
      className={`absolute flex items-center justify-center text-2xl font-bold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors ${
        isMoving || isAnimating ? 'pointer-events-none' : ''
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: direction === 'left' || direction === 'right' ? '120px' : '60px', // 水平箭头2格宽，垂直箭头1格宽
        height: direction === 'up' || direction === 'down' ? '120px' : '60px', // 垂直箭头2格高，水平箭头1格高
        border: isAnimating ? '2px solid red' : '2px solid transparent',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 10
      }}
      onClick={handleClick}
    >
      {getArrowSymbol()}
    </div>
  );
};

export default function Home() {
  const [arrows, setArrows] = useState<Array<'up' | 'down' | 'left' | 'right' | null>>([]);
  const [movingArrows, setMovingArrows] = useState<Set<number>>(new Set());

  // 新的网格系统：6x6的1:1正方形网格
  const GRID_ROWS = 6;
  const GRID_COLS = 6;

  // 根据网格位置获取箭头索引（检查箭头占用的所有格子）
  const getArrowAtPosition = (row: number, col: number) => {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    
    // 检查所有箭头是否占用这个位置
    return arrows.findIndex((arrow, index) => {
      if (!arrow) return false;
      const arrowPos = getArrowGridPosition(index);
      return isPositionOccupiedByArrow(arrowPos, arrow, row, col);
    });
  };

  // 根据索引获取箭头的网格位置（左上角位置）
  const getArrowGridPosition = (index: number) => {
    // 将原来的12个位置映射到新的6x6网格
    const oldRow = Math.floor(index / 4);
    const oldCol = index % 4;
    
    // 映射到新网格：每个原格子对应1.5x1.5的新格子
    const newRow = Math.floor(oldRow * 1.5);
    const newCol = Math.floor(oldCol * 1.5);
    
    return { row: newRow, col: newCol };
  };

  // 检查指定位置是否被箭头占用
  const isPositionOccupiedByArrow = (arrowPos: {row: number, col: number}, direction: string, checkRow: number, checkCol: number) => {
    const positions = getArrowOccupiedPositions(arrowPos, direction);
    return positions.some(pos => pos.row === checkRow && pos.col === checkCol);
  };

  // 获取箭头占用的所有格子位置
  const getArrowOccupiedPositions = (arrowPos: {row: number, col: number}, direction: string) => {
    const positions = [];
    
    switch (direction) {
      case 'up':
      case 'down':
        // 垂直箭头：2行1列
        positions.push({ row: arrowPos.row, col: arrowPos.col });
        positions.push({ row: arrowPos.row + 1, col: arrowPos.col });
        break;
      case 'left':
      case 'right':
        // 水平箭头：1行2列
        positions.push({ row: arrowPos.row, col: arrowPos.col });
        positions.push({ row: arrowPos.row, col: arrowPos.col + 1 });
        break;
    }
    
    return positions;
  };

  // 生成随机箭头
  useEffect(() => {
    const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
    const newArrows: Array<'up' | 'down' | 'left' | 'right' | null> = [];
    
    // 创建12个位置（3行4列）
    for (let i = 0; i < 12; i++) {
      newArrows.push(null);
    }
    
    // 随机选择3个位置填入箭头
    const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].sort(() => Math.random() - 0.5).slice(0, 3);
    
    positions.forEach(pos => {
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      newArrows[pos] = randomDirection;
    });
    
    setArrows(newArrows);
  }, []);

  // 处理箭头开始移动
  const handleStartMove = (index: number) => {
    setMovingArrows(prev => new Set(prev).add(index));
  };

  // 处理箭头碰撞暂停（重置移动状态，允许重新点击）
  const handleArrowPause = (index: number) => {
    setMovingArrows(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  // 检查箭头移动方向是否会发生碰撞
  const checkCollisionInDirection = (currentIndex: number, direction: 'up' | 'down' | 'left' | 'right') => {
    const currentPos = getArrowGridPosition(currentIndex);
    const currentArrow = arrows[currentIndex];
    if (!currentArrow) return null;

    // 计算移动后的位置
    let nextRow = currentPos.row;
    let nextCol = currentPos.col;

    switch (direction) {
      case 'up':
        nextRow = currentPos.row - 1;
        break;
      case 'down':
        nextRow = currentPos.row + 1;
        break;
      case 'left':
        nextCol = currentPos.col - 1;
        break;
      case 'right':
        nextCol = currentPos.col + 1;
        break;
    }

    // 获取移动后箭头将占用的所有位置
    const nextPositions = getArrowOccupiedPositions({ row: nextRow, col: nextCol }, currentArrow);
    
    // 检查这些位置是否与其他箭头冲突
    for (const pos of nextPositions) {
      const conflictIndex = getArrowAtPosition(pos.row, pos.col);
      if (conflictIndex !== -1 && conflictIndex !== currentIndex) {
        return conflictIndex;
      }
    }

    return null;
  };

  // 处理箭头移动完成
  const handleArrowMove = (index: number) => {
    setTimeout(() => {
      setArrows(prev => {
        const newArrows = [...prev];
        newArrows[index] = null;
        return newArrows;
      });
      setMovingArrows(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 100); // 稍微延迟移除，确保动画完成
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 flex items-center justify-center">
      {/* 正方形区域 */}
      <div className="relative bg-white border-4 border-gray-300 shadow-lg" style={{ width: '400px', height: '400px' }}>
        {/* 网格背景：6x6的1:1正方形 */}
        <div className="grid grid-cols-6 grid-rows-6 h-full w-full gap-0.5 p-5">
          {Array.from({ length: 36 }).map((_, index) => (
            <div 
              key={index}
              className="border border-gray-200 bg-gray-50"
              style={{ width: '60px', height: '60px' }}
            />
          ))}
        </div>
        
        {/* 绝对定位的箭头 */}
        {arrows.map((arrow, index) => {
          if (!arrow) return null;
          const gridPos = getArrowGridPosition(index);
          
          return (
            <Arrow 
              key={`arrow-${index}`}
              direction={arrow} 
              index={index}
              gridPosition={gridPos}
              onMove={handleArrowMove}
              onStartMove={handleStartMove}
              onPause={handleArrowPause}
              isMoving={movingArrows.has(index)}
              checkCollision={checkCollisionInDirection}
            />
          );
        })}
      </div>
    </div>
  );
}
