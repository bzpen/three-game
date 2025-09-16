import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { LevelData, LevelPack } from '../types/level';
import type { ArrowData } from '../types/game';
import { StaticLevelService } from '../services/StaticLevelService';

// 游戏状态接口
export interface GameState {
  // 关卡数据
  availableLevels: LevelData[];
  currentLevel: LevelData | null;
  currentArrows: ArrowData[];
  
  // 加载状态
  isLoading: boolean;
  loadingError: string | null;
  
  // 关卡包数据
  levelPacks: LevelPack[];
}

const initialState: GameState = {
  availableLevels: [],
  currentLevel: null,
  currentArrows: [],
  isLoading: false,
  loadingError: null,
  levelPacks: [],
};

// 异步actions
// 加载默认关卡
export const loadDefaultLevels = createAsyncThunk(
  'game/loadDefaultLevels',
  async (_, { rejectWithValue }) => {
    try {
      const service = StaticLevelService.getInstance();
      await service.loadDefaultLevels();
      
      const levels = service.getAllLevels();
      const levelPacks = service.getAllLevelPacks();
      
      return {
        levels,
        levelPacks,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      return rejectWithValue(`关卡系统加载失败: ${message}`);
    }
  }
);

// 加载指定关卡
export const loadLevel = createAsyncThunk(
  'game/loadLevel',
  async (
    { levelId, gridSize = 60, gridGap = 2 }: { levelId: string; gridSize?: number; gridGap?: number },
    { rejectWithValue }
  ) => {
    try {
      const service = StaticLevelService.getInstance();
      const level = service.getLevel(levelId);
      
      if (!level) {
        return rejectWithValue(`关卡不存在: ${levelId}`);
      }
      
      const arrows = service.convertLevelArrowsToRuntime(level, gridSize, gridGap);
      
      return {
        level,
        arrows,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      return rejectWithValue(`关卡加载失败: ${message}`);
    }
  }
);

// 加载第一个可用关卡
export const loadFirstAvailableLevel = createAsyncThunk(
  'game/loadFirstAvailableLevel',
  async (
    { gridSize = 60, gridGap = 2 }: { gridSize?: number; gridGap?: number } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { game: GameState };
      const { availableLevels } = state.game;
      
      if (availableLevels.length === 0) {
        return rejectWithValue('没有可用的关卡');
      }
      
      const firstLevel = availableLevels[0];
      const service = StaticLevelService.getInstance();
      const arrows = service.convertLevelArrowsToRuntime(firstLevel, gridSize, gridGap);
      
      return {
        level: firstLevel,
        arrows,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      return rejectWithValue(`首个关卡加载失败: ${message}`);
    }
  }
);

// 重新加载关卡数据
export const reloadLevels = createAsyncThunk(
  'game/reloadLevels',
  async (_, { rejectWithValue }) => {
    try {
      const service = StaticLevelService.getInstance();
      await service.reload();
      
      const levels = service.getAllLevels();
      const levelPacks = service.getAllLevelPacks();
      
      return {
        levels,
        levelPacks,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      return rejectWithValue(`关卡重新加载失败: ${message}`);
    }
  }
);

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // 设置当前箭头数据
    setCurrentArrows: (state, action: PayloadAction<ArrowData[]>) => {
      state.currentArrows = action.payload;
    },
    
    // 更新单个箭头
    updateArrow: (state, action: PayloadAction<{ id: number; arrow: Partial<ArrowData> }>) => {
      const { id, arrow } = action.payload;
      const index = state.currentArrows.findIndex(a => a.id === id);
      if (index !== -1) {
        state.currentArrows[index] = { ...state.currentArrows[index], ...arrow };
      }
    },
    
    // 添加箭头
    addArrow: (state, action: PayloadAction<ArrowData>) => {
      state.currentArrows.push(action.payload);
    },
    
    // 移除箭头
    removeArrow: (state, action: PayloadAction<number>) => {
      state.currentArrows = state.currentArrows.filter(arrow => arrow.id !== action.payload);
    },
    
    // 清除加载错误
    clearLoadingError: (state) => {
      state.loadingError = null;
    },
    
    // 重置游戏状态
    resetGameState: (state) => {
      state.currentLevel = null;
      state.currentArrows = [];
      state.loadingError = null;
    },
  },
  extraReducers: (builder) => {
    // 加载默认关卡
    builder
      .addCase(loadDefaultLevels.pending, (state) => {
        state.isLoading = true;
        state.loadingError = null;
      })
      .addCase(loadDefaultLevels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableLevels = action.payload.levels;
        state.levelPacks = action.payload.levelPacks;
        state.loadingError = null;
      })
      .addCase(loadDefaultLevels.rejected, (state, action) => {
        state.isLoading = false;
        state.loadingError = action.payload as string;
      });
    
    // 加载指定关卡
    builder
      .addCase(loadLevel.pending, (state) => {
        state.isLoading = true;
        state.loadingError = null;
      })
      .addCase(loadLevel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLevel = action.payload.level;
        state.currentArrows = action.payload.arrows;
        state.loadingError = null;
      })
      .addCase(loadLevel.rejected, (state, action) => {
        state.isLoading = false;
        state.loadingError = action.payload as string;
      });
    
    // 加载第一个可用关卡
    builder
      .addCase(loadFirstAvailableLevel.pending, (state) => {
        state.isLoading = true;
        state.loadingError = null;
      })
      .addCase(loadFirstAvailableLevel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLevel = action.payload.level;
        state.currentArrows = action.payload.arrows;
        state.loadingError = null;
      })
      .addCase(loadFirstAvailableLevel.rejected, (state, action) => {
        state.isLoading = false;
        state.loadingError = action.payload as string;
      });
    
    // 重新加载关卡数据
    builder
      .addCase(reloadLevels.pending, (state) => {
        state.isLoading = true;
        state.loadingError = null;
      })
      .addCase(reloadLevels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableLevels = action.payload.levels;
        state.levelPacks = action.payload.levelPacks;
        state.loadingError = null;
      })
      .addCase(reloadLevels.rejected, (state, action) => {
        state.isLoading = false;
        state.loadingError = action.payload as string;
      });
  },
});

export const {
  setCurrentArrows,
  updateArrow,
  addArrow,
  removeArrow,
  clearLoadingError,
  resetGameState,
} = gameSlice.actions;

export default gameSlice.reducer;
