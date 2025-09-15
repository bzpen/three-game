// 箭头状态管理Hook - 只负责管理箭头状态，不负责生成

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ArrowData } from '../types/game';
import { GridManager } from '../managers/GridManager';
import { GridService, type GridConfig } from '../services/GridService';

export interface UseArrowsConfig {
  rows: number;
  cols: number;
  gridGap: number;
  gridSize: number;
}

export interface UseArrowsReturn {
  arrows: ArrowData[];
  gridData: number[][];
  setArrows: (arrows: ArrowData[]) => void;
  updateArrowPosition: (index: number, newPixelPosition: { x: number; y: number }) => void;
  removeArrow: (index: number) => void;
  setArrowMoving: (index: number, isMoving: boolean) => void;
  checkCollision: (arrowId: number, currentPixelPosition?: { x: number; y: number }) => boolean;
  clearArrows: () => void;
}

export const useArrows = (
  config: UseArrowsConfig,
  onGridUpdate?: (gridData: number[][]) => void
): UseArrowsReturn => {
  const [arrows, setArrows] = useState<ArrowData[]>([]);
  const [gridManager] = useState(() => new GridManager(config.rows, config.cols));

  // 服务实例
  const gridService = useMemo(() => GridService.getInstance(), []);

  // 使用ref保存最新的arrows状态
  const arrowsRef = useRef(arrows);
  arrowsRef.current = arrows;

  // 更新GridManager尺寸
  useEffect(() => {
    if (config.rows !== gridManager['rows'] || config.cols !== gridManager['cols']) {
      gridManager['rows'] = config.rows;
      gridManager['cols'] = config.cols;
      gridManager.reset();
    }
  }, [config.rows, config.cols, gridManager]);

  // 定时更新网格状态
  const [gridData, setGridData] = useState<number[][]>(() => 
    gridService.createEmptyGrid(config.rows, config.cols)
  );

  useEffect(() => {
    const updateGridStatus = () => {
      const gridConfig: GridConfig = {
        rows: config.rows,
        cols: config.cols,
        gridSize: config.gridSize,
        gridGap: config.gridGap,
        offsetX: 0,
        offsetY: 0,
      };

      const newGridData = gridService.updateGridFromArrows(
        arrowsRef.current,
        gridManager,
        gridConfig
      );
      
      setGridData(newGridData);
      
      if (onGridUpdate) {
        onGridUpdate(newGridData);
      }
    };

    const interval = setInterval(updateGridStatus, 50);
    updateGridStatus();
    
    return () => clearInterval(interval);
  }, [config, gridManager, gridService, onGridUpdate]);

  // 更新箭头位置
  const updateArrowPosition = useCallback((index: number, newPixelPosition: { x: number; y: number }) => {
    setArrows(prev => prev.map((arrow, i) => 
      i === index ? { ...arrow, pixelPosition: newPixelPosition } : arrow
    ));
  }, []);

  // 移除箭头
  const removeArrow = useCallback((index: number) => {
    setArrows(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 设置箭头移动状态
  const setArrowMoving = useCallback((index: number, isMoving: boolean) => {
    setArrows(prev => prev.map((arrow, i) => 
      i === index ? { ...arrow, isMoving } : arrow
    ));
  }, []);

  // 清空所有箭头
  const clearArrows = useCallback(() => {
    setArrows([]);
  }, []);

  // 检查碰撞
  const checkCollision = useCallback((
    arrowId: number, 
    currentPixelPosition?: { x: number; y: number }
  ): boolean => {
    const gridConfig: GridConfig = {
      rows: config.rows,
      cols: config.cols,
      gridSize: config.gridSize,
      gridGap: config.gridGap,
      offsetX: 0,
      offsetY: 0,
    };

    return gridService.checkArrowCollision(
      arrowId,
      arrows,
      gridManager,
      gridConfig,
      currentPixelPosition
    );
  }, [arrows, gridManager, config, gridService]);

  return {
    arrows,
    gridData,
    setArrows,
    updateArrowPosition,
    removeArrow,
    setArrowMoving,
    checkCollision,
    clearArrows,
  };
};