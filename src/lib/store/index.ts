import { configureStore } from '@reduxjs/toolkit';
import levelReducer, { type LevelState } from './levelSlice';

export const store = configureStore({
  reducer: {
    level: levelReducer,
  },
});

export type RootState = {
  level: LevelState;
};

export type AppDispatch = typeof store.dispatch;
