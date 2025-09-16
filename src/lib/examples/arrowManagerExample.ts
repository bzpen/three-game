// ArrowManager使用示例

import { store } from '../store';
import { updateConfig, resetGrid, type LevelState } from '../store/levelSlice';

// 示例1: 更新游戏配置
export const updateGameConfig = (config: {
  rows?: number;
  cols?: number;
  gridGap?: number;
  gridSize?: number;
  arrowCount?: number;
}) => {
  store.dispatch(updateConfig(config));
};

// 示例2: 设置小型游戏
export const setSmallGame = () => {
  store.dispatch(updateConfig({
    rows: 4,
    cols: 4,
    gridGap: 2,
    gridSize: 80,
    arrowCount: 2,
  }));
};

// 示例3: 设置大型游戏
export const setLargeGame = () => {
  store.dispatch(updateConfig({
    rows: 8,
    cols: 8,
    gridGap: 3,
    gridSize: 50,
    arrowCount: 5,
  }));
};

// 示例4: 重置游戏网格
export const resetGameGrid = () => {
  store.dispatch(resetGrid());
};

// 示例5: 获取当前游戏状态
export const getCurrentGameState = () => {
  const state = store.getState();
  return {
    config: state.level.config,
    gridData: state.level.gridData,
  };
};

// 示例6: 监听状态变化
export const subscribeToGameState = (callback: (state: LevelState) => void) => {
  return store.subscribe(() => {
    const state = store.getState();
    callback(state.level);
  });
};
