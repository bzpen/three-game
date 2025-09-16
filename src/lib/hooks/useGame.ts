import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  loadDefaultLevels,
  loadLevel,
  loadFirstAvailableLevel,
  reloadLevels,
  initializeGame,
  setCurrentArrows,
  updateArrow,
  addArrow,
  removeArrow,
  clearLoadingError,
  resetGameState,
} from '../store/gameSlice';

// 自定义hook用于游戏状态管理
export const useGame = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // 获取游戏状态
  const gameState = useSelector((state: RootState) => state.game);
  
  // 异步actions
  const loadDefaultLevelsAction = useCallback(() => {
    return dispatch(loadDefaultLevels());
  }, [dispatch]);
  
  const loadLevelAction = useCallback((levelId: string, gridSize = 60, gridGap = 2) => {
    return dispatch(loadLevel({ levelId, gridSize, gridGap }));
  }, [dispatch]);
  
  const loadFirstAvailableLevelAction = useCallback((gridSize = 60, gridGap = 2) => {
    return dispatch(loadFirstAvailableLevel({ gridSize, gridGap }));
  }, [dispatch]);
  
  const reloadLevelsAction = useCallback(() => {
    return dispatch(reloadLevels());
  }, [dispatch]);
  
  const initializeGameAction = useCallback((gridSize = 60, gridGap = 2) => {
    return dispatch(initializeGame({ gridSize, gridGap }));
  }, [dispatch]);
  
  // 同步actions
  const setArrows = useCallback((arrows: Parameters<typeof setCurrentArrows>[0]) => {
    dispatch(setCurrentArrows(arrows));
  }, [dispatch]);
  
  const updateArrowById = useCallback((id: number, arrow: Parameters<typeof updateArrow>[0]['arrow']) => {
    dispatch(updateArrow({ id, arrow }));
  }, [dispatch]);
  
  const addArrowAction = useCallback((arrow: Parameters<typeof addArrow>[0]) => {
    dispatch(addArrow(arrow));
  }, [dispatch]);
  
  const removeArrowAction = useCallback((id: number) => {
    dispatch(removeArrow(id));
  }, [dispatch]);
  
  const clearError = useCallback(() => {
    dispatch(clearLoadingError());
  }, [dispatch]);
  
  const resetGame = useCallback(() => {
    dispatch(resetGameState());
  }, [dispatch]);
  
  return {
    // 状态
    ...gameState,
    
    // Actions
    initializeGame: initializeGameAction,
    loadDefaultLevels: loadDefaultLevelsAction,
    loadLevel: loadLevelAction,
    loadFirstAvailableLevel: loadFirstAvailableLevelAction,
    reloadLevels: reloadLevelsAction,
    setArrows,
    updateArrow: updateArrowById,
    addArrow: addArrowAction,
    removeArrow: removeArrowAction,
    clearError,
    resetGame,
  };
};
