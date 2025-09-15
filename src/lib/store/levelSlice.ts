import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LevelConfig {
  rows: number;
  cols: number;
  gridGap: number;
  gridSize: number;
  arrowCount: number;
  offsetX: number;
  offsetY: number;
}

export interface LevelState {
  config: LevelConfig;
  gridData: number[][];
}

const initialState: LevelState = {
  config: {
    rows: 6,
    cols: 6,
    gridGap: 2,
    gridSize: 60,
    arrowCount: 3,
    offsetX: 20,
    offsetY: 20,
  },
  gridData: [],
};

// 初始化网格数据
export const initializeGrid = (rows: number, cols: number): number[][] => {
  return Array(rows).fill(null).map(() => Array(cols).fill(0));
};

const levelSlice = createSlice({
  name: 'level',
  initialState,
  reducers: {
    // 更新配置
    updateConfig: (state, action: PayloadAction<Partial<LevelConfig>>) => {
      state.config = { ...state.config, ...action.payload };
      // 配置更新时重新初始化网格
      state.gridData = initializeGrid(state.config.rows, state.config.cols);
    },
    
    // 更新网格数据
    updateGridData: (state, action: PayloadAction<number[][]>) => {
      state.gridData = action.payload;
    },
    
    // 重置网格
    resetGrid: (state) => {
      state.gridData = initializeGrid(state.config.rows, state.config.cols);
    },
  },
});

export const {
  updateConfig,
  updateGridData,
  resetGrid,
} = levelSlice.actions;

export default levelSlice.reducer;
