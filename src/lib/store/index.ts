import { configureStore } from '@reduxjs/toolkit';
import levelReducer, { type LevelState } from './levelSlice';
import gameReducer, { type GameState } from './gameSlice';

export const store = configureStore({
  reducer: {
    level: levelReducer,
    game: gameReducer,
  },
});

export type RootState = {
  level: LevelState;
  game: GameState;
};

export type AppDispatch = typeof store.dispatch;
