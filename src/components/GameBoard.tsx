'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../lib/hooks/redux';
import type { RootState } from '../lib/store';
import { updateConfig, resetGrid } from '../lib/store/levelSlice';
import { ArrowManagerWithRef, type ArrowManagerRef } from './ArrowManager';
import { useGame } from '../lib/hooks/useGame';
import type { LevelData } from '../lib/types/level';
import Grid from './Grid';

interface GameBoardProps {
  rows?: number;
  cols?: number;
  gridGap?: number;
  gridSize?: number;
  arrowCount?: number;
  showGridData?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const config = useAppSelector((state: RootState) => state.level.config);
  const stateGridData = useAppSelector((state: RootState) => state.level.gridData);
  
  // 使用新的游戏状态管理hook
  const {
    availableLevels,
    currentLevel,
    currentArrows,
    isLoading,
    loadingError,
    loadDefaultLevels,
    loadLevel: loadLevelAction,
    loadFirstAvailableLevel,
  } = useGame();
  
  const gridData = stateGridData || [];
  const [showGridData, setShowGridData] = useState(false);
  const arrowManagerRef = useRef<ArrowManagerRef>(null);

  // 导航到错误页面的辅助函数
  const navigateToError = useCallback((title: string, message: string, showRetry: boolean = true) => {
    const params = new URLSearchParams({
      title,
      message,
      showRetry: showRetry.toString()
    });
    router.push(`/error?${params.toString()}`);
  }, [router]);

  // 加载关卡
  const loadLevel = useCallback(async (level: LevelData) => {
    try {
      // 使用Redux action加载关卡
      await loadLevelAction(level.id, config.gridSize, config.gridGap);
      
      // 更新配置，合并关卡配置和UI配置
      dispatch(updateConfig({
        ...config, // 保留当前的UI配置(gridSize, gridGap, arrowCount)
        ...level.config // 覆盖关卡特定配置(rows, cols)
      }));
      
      console.log(`✓ 关卡加载成功: ${level.name}`);
    } catch (error) {
      console.error('加载关卡时发生错误:', error);
      const errorMsg = `关卡"${level.name}"加载失败: ${error instanceof Error ? error.message : '未知错误'}`;
      navigateToError('关卡加载失败', errorMsg);
    }
  }, [dispatch, navigateToError, config, loadLevelAction]);


  // 加载静态关卡数据
  useEffect(() => {
    let isMounted = true;
    
    const initializeGame = async () => {
      if (!isMounted) return;
      
      try {
        // 使用Redux action加载默认关卡
        await loadDefaultLevels();
        
        if (!isMounted) return;
        
        // 检查是否有关卡可用，如果有则加载第一个
        if (availableLevels.length === 0) {
          // 等待下一次渲染以获取最新的availableLevels
          setTimeout(async () => {
            if (!isMounted) return;
            
            try {
              // 使用Redux action加载第一个可用关卡
              await loadFirstAvailableLevel(config.gridSize, config.gridGap);
              
              if (currentLevel && isMounted) {
                // 更新配置，合并关卡配置和UI配置
                dispatch(updateConfig({
                  ...config,
                  ...currentLevel.config
                }));
                
                console.log(`✓ 首个关卡加载成功: ${currentLevel.name}`);
              }
            } catch (error) {
              if (isMounted) {
                const errorMsg = `首个关卡加载失败: ${error instanceof Error ? error.message : '未知错误'}`;
                navigateToError('游戏初始化失败', errorMsg);
              }
            }
          }, 100);
        }
        
      } catch (error) {
        console.error('加载关卡失败:', error);
        if (isMounted) {
          const errorMsg = `关卡系统加载失败: ${error instanceof Error ? error.message : '未知错误'}`;
          navigateToError('系统加载失败', errorMsg);
        }
      }
    };

    initializeGame();
    
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 故意只在挂载时执行一次

  // 同步箭头数据到ArrowManager
  useEffect(() => {
    if (arrowManagerRef.current && currentArrows.length > 0) {
      arrowManagerRef.current.setArrows(currentArrows);
    }
  }, [currentArrows]);

  // 处理加载错误
  useEffect(() => {
    if (loadingError) {
      navigateToError('加载失败', loadingError);
    }
  }, [loadingError, navigateToError]);

  // 重新加载当前内容
  const handleReload = useCallback(() => {
    // 重置网格
    dispatch(resetGrid());
    // 清空当前箭头
    if (arrowManagerRef.current) {
      arrowManagerRef.current.clearArrows();
    }
    
    if (currentLevel) {
      loadLevel(currentLevel);
    }
  }, [dispatch, currentLevel, loadLevel]);


  const boardSize = config.gridSize * config.cols + config.gridGap * (config.cols - 1);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* 控制按钮 */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* 关卡选择 */}
          {availableLevels.length > 0 && (
            <>
              <select 
                onChange={(e) => {
                  const selectedLevel = availableLevels.find(level => level.id === e.target.value);
                  if (selectedLevel) {
                    loadLevel(selectedLevel);
                  }
                }}
                value={currentLevel?.id || ''}
                disabled={isLoading}
                className="px-3 py-2 border rounded bg-white"
              >
                <option value="">选择关卡...</option>
                {availableLevels.map(level => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </>
          )}
          
          {/* 重新加载 */}
          <button 
            onClick={handleReload}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? '加载中...' : '重新加载'}
          </button>
          
          {/* 显示网格状态 */}
          <button 
            onClick={() => setShowGridData(!showGridData)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {showGridData ? '隐藏' : '显示'}网格状态
          </button>
        </div>
        
        {/* 游戏区域 */}
        <div 
          className="relative bg-white shadow-lg"
          style={{ width: `${boardSize}px`, height: `${boardSize}px` }}
        >
          {/* 网格背景 */}
          <Grid
            rows={config.rows}
            cols={config.cols}
            gridSize={config.gridSize}
            gridData={gridData}
            gridGap={config.gridGap}
            showGridData={showGridData}
          />
          
          {/* 箭头管理器 */}
          <ArrowManagerWithRef
            ref={arrowManagerRef}
          />
        </div>
        
        {/* 状态显示 */}
        <div className="text-sm text-gray-600">
          {currentLevel && (
            <p>当前关卡: {currentLevel.name}</p>
          )}
          <p>关卡尺寸: {config.rows}x{config.cols}</p>
          <p>当前箭头数量: {currentArrows.length}</p>
          <p>网格大小: {config.gridSize}px</p>
          <p>可用关卡: {availableLevels.length} 个</p>
          {isLoading && <p className="text-blue-500">正在加载...</p>}
        </div>

        {/* 开发者提示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm">
            <p className="font-medium text-yellow-800">开发者模式</p>
            <p className="text-yellow-700">
              访问 <a href="/level-editor" className="underline">/level-editor</a> 来制作新关卡
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;