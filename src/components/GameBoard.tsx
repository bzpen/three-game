'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../lib/hooks/redux';
import type { RootState } from '../lib/store';
import { updateConfig, resetGrid } from '../lib/store/levelSlice';
import { ArrowManagerWithRef, type ArrowManagerRef } from './ArrowManager';
import { ArrowController, type ArrowControllerConfig } from '../lib/controllers/ArrowController';
import { StaticLevelService } from '../lib/services/StaticLevelService';
import type { ArrowData } from '../lib/types/game';
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
  rows = 6,
  cols = 6,
  gridGap = 2,
  gridSize = 60,
  arrowCount = 3,
  showGridData: initialShowGridData = false
}) => {
  const dispatch = useAppDispatch();
  const stateConfig = useAppSelector((state: RootState) => state.level.config);
  const stateGridData = useAppSelector((state: RootState) => state.level.gridData);
  
  const config = useMemo(() => {
    return stateConfig || {
      rows, cols, gridGap, gridSize, arrowCount, offsetX: 20, offsetY: 20
    };
  }, [stateConfig, rows, cols, gridGap, gridSize, arrowCount]);
  
  const gridData = stateGridData || [];

  const [showGridData, setShowGridData] = useState(initialShowGridData);
  const [isLoading, setIsLoading] = useState(false);
  const [currentArrows, setCurrentArrows] = useState<ArrowData[]>([]);
  const [currentLevel, setCurrentLevel] = useState<LevelData | null>(null);
  const [availableLevels, setAvailableLevels] = useState<LevelData[]>([]);
  const [isRandomMode, setIsRandomMode] = useState(false);
  
  const arrowManagerRef = useRef<ArrowManagerRef>(null);
  const arrowController = useRef(ArrowController.getInstance());
  const staticLevelService = useRef(StaticLevelService.getInstance());

  // 加载关卡
  const loadLevel = useCallback(async (level: LevelData) => {
    setIsLoading(true);
    
    try {
      // 转换关卡箭头数据为运行时数据
      const arrows = staticLevelService.current.convertLevelArrowsToRuntime(level);
      
      setCurrentLevel(level);
      setCurrentArrows(arrows);
      setIsRandomMode(false);
      
      // 更新配置以匹配关卡
      dispatch(updateConfig(level.config));
      
      // 通过ref设置箭头到ArrowManager
      if (arrowManagerRef.current) {
        arrowManagerRef.current.setArrows(arrows);
      }
      
      console.log(`✓ 关卡加载成功: ${level.name}`);
    } catch (error) {
      console.error('加载关卡时发生错误:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // 生成随机箭头（稳定版本，不依赖变化的config）
  const generateRandomArrows = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // 使用当前的稳定配置，避免依赖频繁变化的config
      const currentConfig = stateConfig || {
        rows, cols, gridGap, gridSize, arrowCount, offsetX: 20, offsetY: 20
      };
      
      const arrowConfig: ArrowControllerConfig = {
        rows: currentConfig.rows,
        cols: currentConfig.cols,
        gridGap: currentConfig.gridGap,
        gridSize: currentConfig.gridSize,
        arrowCount: currentConfig.arrowCount,
        offsetX: currentConfig.offsetX,
        offsetY: currentConfig.offsetY,
      };

      const result = await arrowController.current.generateArrows(arrowConfig);
      
      if (result.success) {
        setCurrentArrows(result.arrows);
        setCurrentLevel(null);
        setIsRandomMode(true);
        
        // 通过ref设置箭头到ArrowManager
        if (arrowManagerRef.current) {
          arrowManagerRef.current.setArrows(result.arrows);
        }
      } else {
        console.warn('随机箭头生成失败');
        setCurrentArrows([]);
      }
    } catch (error) {
      console.error('生成随机箭头时发生错误:', error);
      setCurrentArrows([]);
    } finally {
      setIsLoading(false);
    }
  }, [stateConfig, rows, cols, gridGap, gridSize, arrowCount]); // 使用稳定的依赖

  // 加载静态关卡数据
  useEffect(() => {
    let isMounted = true; // 防止组件卸载后的状态更新
    
    const loadLevels = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        await staticLevelService.current.loadDefaultLevels();
        if (!isMounted) return;
        
        const levels = staticLevelService.current.getAllLevels();
        setAvailableLevels(levels);
        
        // 如果有关卡，默认加载第一个
        if (levels.length > 0 && isMounted) {
          const firstLevel = levels[0];
          
          // 直接处理关卡加载，避免useCallback依赖
          try {
            const arrows = staticLevelService.current.convertLevelArrowsToRuntime(firstLevel);
            
            if (isMounted) {
              setCurrentLevel(firstLevel);
              setCurrentArrows(arrows);
              setIsRandomMode(false);
              dispatch(updateConfig(firstLevel.config));
              
              // 通过ref设置箭头到ArrowManager
              if (arrowManagerRef.current) {
                arrowManagerRef.current.setArrows(arrows);
              }
              
              console.log(`✓ 关卡加载成功: ${firstLevel.name}`);
            }
          } catch (levelError) {
            console.error('加载首个关卡失败:', levelError);
            if (isMounted) {
              setIsRandomMode(true);
              // 生成随机箭头的逻辑
              generateRandomArrowsInternal();
            }
          }
        } else if (isMounted) {
          // 如果没有关卡，切换到随机模式
          setIsRandomMode(true);
          generateRandomArrowsInternal();
        }
      } catch (error) {
        console.error('加载关卡失败:', error);
        if (isMounted) {
          // 失败时切换到随机模式
          setIsRandomMode(true);
          generateRandomArrowsInternal();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // 内部随机箭头生成函数，避免外部依赖
    const generateRandomArrowsInternal = async () => {
      if (!isMounted) return;
      
      try {
        const currentConfig = stateConfig || {
          rows, cols, gridGap, gridSize, arrowCount, offsetX: 20, offsetY: 20
        };
        
        const arrowConfig: ArrowControllerConfig = {
          rows: currentConfig.rows,
          cols: currentConfig.cols,
          gridGap: currentConfig.gridGap,
          gridSize: currentConfig.gridSize,
          arrowCount: currentConfig.arrowCount,
          offsetX: currentConfig.offsetX,
          offsetY: currentConfig.offsetY,
        };

        const result = await arrowController.current.generateArrows(arrowConfig);
        
        if (isMounted && result.success) {
          setCurrentArrows(result.arrows);
          setCurrentLevel(null);
          setIsRandomMode(true);
          
          // 通过ref设置箭头到ArrowManager
          if (arrowManagerRef.current) {
            arrowManagerRef.current.setArrows(result.arrows);
          }
        } else if (isMounted) {
          console.warn('随机箭头生成失败');
          setCurrentArrows([]);
        }
      } catch (error) {
        console.error('生成随机箭头时发生错误:', error);
        if (isMounted) {
          setCurrentArrows([]);
        }
      }
    };

    loadLevels();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 故意只在挂载时执行一次，避免循环依赖导致的死锁

  // 初始化配置 - 只在组件挂载时设置一次，避免频繁更新
  useEffect(() => {
    // 只有当Redux中没有配置时才初始化
    if (!stateConfig) {
      dispatch(updateConfig({
        rows,
        cols,
        gridGap,
        gridSize,
        arrowCount,
        offsetX: 20,
        offsetY: 20,
      }));
    }
  }, [dispatch, stateConfig, rows, cols, gridGap, gridSize, arrowCount]);

  // 重新加载当前内容
  const handleReload = useCallback(() => {
    // 重置网格
    dispatch(resetGrid());
    // 清空当前箭头
    if (arrowManagerRef.current) {
      arrowManagerRef.current.clearArrows();
    }
    
    if (isRandomMode) {
      generateRandomArrows();
    } else if (currentLevel) {
      loadLevel(currentLevel);
    }
  }, [dispatch, isRandomMode, currentLevel, generateRandomArrows, loadLevel]);

  // 切换到随机模式
  const switchToRandomMode = useCallback(() => {
    setCurrentLevel(null);
    generateRandomArrows();
  }, [generateRandomArrows]);

  // 处理网格更新回调
  const handleGridUpdate = useCallback(() => {
    // ArrowManager已经通过dispatch更新了Redux
  }, []);

  const boardSize = config.gridSize * config.cols + 40 + 2 * (config.cols - 1);

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
                    {level.name} ({level.difficulty})
                  </option>
                ))}
              </select>
              
              <div className="h-6 border-l border-gray-300"></div>
            </>
          )}
          
          {/* 随机模式切换 */}
          <button 
            onClick={switchToRandomMode}
            disabled={isLoading}
            className={`px-4 py-2 rounded text-white ${
              isRandomMode 
                ? 'bg-purple-600' 
                : 'bg-purple-500 hover:bg-purple-600'
            } disabled:bg-gray-400`}
          >
            随机模式
          </button>
          
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
            arrows={currentArrows}
            onGridUpdate={handleGridUpdate}
          />
        </div>
        
        {/* 状态显示 */}
        <div className="text-sm text-gray-600">
          <p>模式: {isRandomMode ? '随机模式' : '关卡模式'}</p>
          {currentLevel && (
            <p>当前关卡: {currentLevel.name} ({currentLevel.difficulty})</p>
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