'use client';

import { useState, useEffect, useRef } from 'react';
import type { ArrowDirection } from '../lib/types/game';
import { 
  getArrowSymbol, 
  getArrowOccupiedCellsByPixel,
  adjustToValidGridPosition
} from '../lib/utils/arrow';

interface ArrowProps {
  direction: ArrowDirection;
  pixelPosition: { x: number; y: number };
  index: number;
  arrowId: number;
  onMove: (index: number) => void;
  onStartMove: (index: number) => void;
  onPause: (index: number) => void;
  onPixelPositionUpdate: (index: number, newPixelPosition: { x: number; y: number }) => void;
  isMoving: boolean;
  checkCollision: (arrowId: number, currentPixelPosition?: { x: number; y: number }) => boolean;
}

const Arrow: React.FC<ArrowProps> = ({
  direction,
  pixelPosition,
  index,
  arrowId,
  onMove,
  onStartMove,
  onPause,
  onPixelPositionUpdate,
  isMoving,
  checkCollision
}) => {
  // 网格相关常量
  const GRID_SIZE = 60;
  const GRID_GAP = 2;
  const GRID_PADDING = 20;
  const GRID_ROWS = 6;
  const GRID_COLS = 6;
  
  const arrowRef = useRef<HTMLDivElement>(null);
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


  const handleClick = () => {
    // 防止重复点击
    if (isMoving || isAnimating) {
      return;
    }
    
    // 检查是否会立即碰撞
    if (checkCollision(arrowId, pixelPosition)) {
      return;
    }
    // 开始移动
    onStartMove(index);
    setIsAnimating(true);
    
    const animationSpeed = 400; // 像素/秒
    const animationStart = Date.now();
    let currentX = pixelPosition.x;
    let currentY = pixelPosition.y;
    
    // 计算移动方向的增量
    let deltaX = 0;
    let deltaY = 0;
    switch (direction) {
      case 'up':
        deltaY = -animationSpeed;
        break;
      case 'down':
        deltaY = animationSpeed;
        break;
      case 'left':
        deltaX = -animationSpeed;
        break;
      case 'right':
        deltaX = animationSpeed;
        break;
    }
    
    const animate = () => {
      const elapsed = Date.now() - animationStart;
      const deltaTime = elapsed / 1000; // 转换为秒
      
      // 计算当前位置
      const newX = pixelPosition.x + deltaX * deltaTime;
      const newY = pixelPosition.y + deltaY * deltaTime;
      const newPixelPos = { x: newX, y: newY };
      
      // 检测碰撞
      if (checkCollision(arrowId, newPixelPos)) {
        // 发生碰撞，调整到最近的网格位置停止
        const adjustedPos = adjustToValidGridPosition(currentX, currentY, direction);
        onPixelPositionUpdate(index, adjustedPos);
        setIsAnimating(false);
        onPause(index);
        return;
      }
      
      // 检查是否移出区域
      const occupiedCells = getArrowOccupiedCellsByPixel(
        newX, newY, direction,
        GRID_SIZE, GRID_PADDING, GRID_PADDING, GRID_GAP, GRID_ROWS, GRID_COLS
      );
      
      if (occupiedCells.length === 0) {
        // 完全移出区域，销毁箭头
        setIsAnimating(false);
        onMove(index);
        return;
      }
      
      // 更新当前位置
      currentX = newX;
      currentY = newY;
      onPixelPositionUpdate(index, newPixelPos);
      
      // 继续动画
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // 开始动画
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div 
      ref={arrowRef}
      className={`absolute flex items-center justify-center text-2xl font-bold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors ${
        isMoving || isAnimating ? 'pointer-events-none' : ''
      }`}
      style={{
        top: `${pixelPosition.y}px`,
        left: `${pixelPosition.x}px`,
        width: direction === 'left' || direction === 'right' ? `${GRID_SIZE * 2 + GRID_GAP}px` : `${GRID_SIZE}px`,
        height: direction === 'up' || direction === 'down' ? `${GRID_SIZE * 2 + GRID_GAP}px` : `${GRID_SIZE}px`,
        border: isAnimating ? '2px solid red' : '2px solid transparent',
        borderRadius: '8px',
        // backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 10
      }}
      onClick={handleClick}
    >
      {getArrowSymbol(direction)}
    </div>
  );
};

export default Arrow;
