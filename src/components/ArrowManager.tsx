'use client';

import React, { useState, useCallback } from 'react';
import type { ArrowData } from '../lib/types/game';
import { useAppDispatch, useAppSelector } from '../lib/hooks/redux';
import type { RootState } from '../lib/store';
import { updateGridData } from '../lib/store/levelSlice';
import { useArrows, type UseArrowsConfig } from '../lib/hooks/useArrows';
import Arrow from './Arrow';

// 为了支持外部设置箭头，我们创建一个带ref的版本
export interface ArrowManagerRef {
  setArrows: (arrows: ArrowData[]) => void;
  clearArrows: () => void;
  getArrows: () => ArrowData[];
}

export const ArrowManagerWithRef = React.forwardRef<ArrowManagerRef, object>(
  (_, ref) => {
    const dispatch = useAppDispatch();
    const stateConfig = useAppSelector((state: RootState) => state.level.config);
    
    const config: UseArrowsConfig = stateConfig ;

    const [, setMovingArrows] = useState<Set<number>>(new Set());

    const handleGridUpdate = useCallback((newGridData: number[][]) => {
      dispatch(updateGridData(newGridData));
    
    }, [dispatch]);

    const {
      arrows,
      setArrows,
      updateArrowPosition,
      removeArrow,
      setArrowMoving,
      checkCollision,
      clearArrows,
    } = useArrows(config, handleGridUpdate);

    // 暴露给父组件的方法
    React.useImperativeHandle(ref, () => ({
      setArrows,
      clearArrows,
      getArrows: () => arrows,
    }));

    const handleStartMove = useCallback((index: number) => {
      setMovingArrows(prev => new Set(prev).add(index));
      setArrowMoving(index, true);
    }, [setArrowMoving]);

    const handleArrowPause = useCallback((index: number) => {
      setMovingArrows(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      setArrowMoving(index, false);
    }, [setArrowMoving]);

    const handlePixelPositionUpdate = useCallback((
      index: number, 
      newPixelPosition: { x: number; y: number }
    ) => {
      updateArrowPosition(index, newPixelPosition);
    }, [updateArrowPosition]);

    const handleArrowMove = useCallback((index: number) => {
      setTimeout(() => {
        removeArrow(index);
        setMovingArrows(prev => {
          const newSet = new Set<number>();
          prev.forEach(i => {
            if (i < index) newSet.add(i);
            else if (i > index) newSet.add(i - 1);
          });
          return newSet;
        });
      }, 100);
    }, [removeArrow]);

    return (
      <>
        {arrows.map((arrow: ArrowData, index: number) => (
          <div key={`arrow-${arrow.id}`} data-arrow-index={index}>
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
              gridSize={config.gridSize}
              gridGap={config.gridGap}
              gridRows={config.rows}
              gridCols={config.cols}
            />
          </div>
        ))}
      </>
    );
  }
);

ArrowManagerWithRef.displayName = 'ArrowManagerWithRef';