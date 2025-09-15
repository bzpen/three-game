import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// 类型化的 dispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>();

// 类型化的 selector hook
export const useAppSelector = <T>(selector: (state: RootState) => T): T => {
  return useSelector(selector);
};
