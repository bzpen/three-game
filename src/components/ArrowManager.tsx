'use client';

import React, { useState, useCallback } from 'react';
import type { ArrowData } from '../lib/types/game';
import { useAppDispatch, useAppSelector } from '../lib/hooks/redux';
import type { RootState } from '../lib/store';
import { updateGridData } from '../lib/store/levelSlice';
import { useArrows, type UseArrowsConfig } from '../lib/hooks/useArrows';
import Arrow from './Arrow';

interface ArrowManagerProps {
  arrows?: ArrowData[];
  onGridUpdate?: (gridData: number[][]) => void;
}

// 为了支持外部设置箭头，我们创建一个带ref的版本
export interface ArrowManagerRef {
  setArrows: (arrows: ArrowData[]) => void;
  clearArrows: () => void;
  getArrows: () => ArrowData[];
}

export const ArrowManagerWithRef = React.forwardRef<ArrowManagerRef, ArrowManagerProps>(
  (props, ref) => {
    const dispatch = useAppDispatch();
    const stateConfig = useAppSelector((state: RootState) => state.level.config);
    
    const config: UseArrowsConfig = stateConfig || {
      rows: 6, 
      cols: 6, 
      gridGap: 2, 
      gridSize: 60, 
      offsetX: 20, 
      offsetY: 20
    };

    const [, setMovingArrows] = useState<Set<number>>(new Set());

    const { onGridUpdate } = props;
    const handleGridUpdate = useCallback((newGridData: number[][]) => {
      dispatch(updateGridData(newGridData));
      if (onGridUpdate) {
        onGridUpdate(newGridData);
      }
    }, [dispatch, onGridUpdate]);

    const {
      arrows,
      setArrows,
      updateArrowPosition,
      removeArrow,
      setArrowMoving,
      checkCollision,
      clearArrows,
    } = useArrows(config, handleGridUpdate);

    // 初始化时设置传入的箭头数据
    React.useEffect(() => {
      if (props.arrows && props.arrows.length > 0) {
        setArrows(props.arrows);
      }
    }, [props.arrows, setArrows]);

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
              gridPadding={config.offsetX}
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