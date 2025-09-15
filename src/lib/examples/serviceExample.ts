// 服务层使用示例

import { ArrowService, type ArrowGenerationConfig } from '../services/ArrowService';
import { GridService, type GridConfig } from '../services/GridService';
import type { ArrowData } from '../types/game';

// 示例1: 使用ArrowService生成箭头
export const generateArrowsExample = () => {
  const arrowService = ArrowService.getInstance();
  
  const config: ArrowGenerationConfig = {
    rows: 6,
    cols: 6,
    gridGap: 2,
    gridSize: 60,
    arrowCount: 3,
    offsetX: 20,
    offsetY: 20,
  };

  const result = arrowService.generateArrows(config);
  
  if (result.success) {
    console.log('箭头生成成功:', result.arrows);
    console.log('尝试次数:', result.attempts);
    return result.arrows;
  } else {
    console.log('箭头生成失败，尝试次数:', result.attempts);
    return [];
  }
};

// 示例2: 使用GridService处理网格
export const gridServiceExample = (arrows: ArrowData[]) => {
  const gridService = GridService.getInstance();
  
  const config: GridConfig = {
    rows: 6,
    cols: 6,
    gridSize: 60,
    gridGap: 2,
    offsetX: 20,
    offsetY: 20,
  };

  // 创建空网格
  const emptyGrid = gridService.createEmptyGrid(config.rows, config.cols);
  console.log('空网格:', emptyGrid);

  // 这里需要GridManager实例，实际使用中会从组件或Hook中获取
  // const gridManager = new GridManager(config.rows, config.cols);
  // const updatedGrid = gridService.updateGridFromArrows(arrows, gridManager, config);
  // console.log('更新后的网格:', updatedGrid);
  
  return emptyGrid;
};

// 示例3: 验证箭头布局
export const validateArrowsExample = (arrows: ArrowData[]) => {
  const arrowService = ArrowService.getInstance();
  
  const config: ArrowGenerationConfig = {
    rows: 6,
    cols: 6,
    gridGap: 2,
    gridSize: 60,
    arrowCount: 3,
    offsetX: 20,
    offsetY: 20,
  };

  const isValid = arrowService.validateLayout(arrows, config);
  console.log('箭头布局是否有效:', isValid);
  
  return isValid;
};

// 示例4: 完整的箭头管理流程
export const completeArrowManagementExample = () => {
  const arrowService = ArrowService.getInstance();
  const gridService = GridService.getInstance();
  
  // 1. 配置
  const config: ArrowGenerationConfig = {
    rows: 8,
    cols: 8,
    gridGap: 3,
    gridSize: 50,
    arrowCount: 5,
    offsetX: 25,
    offsetY: 25,
  };

  // 2. 生成箭头
  const result = arrowService.generateArrows(config);
  
  if (!result.success) {
    console.error('无法生成有效的箭头布局');
    return null;
  }

  // 3. 验证布局
  const isValid = arrowService.validateLayout(result.arrows, config);
  
  // 4. 创建网格
  const gridData = gridService.createEmptyGrid(config.rows, config.cols);
  
  return {
    arrows: result.arrows,
    gridData,
    isValid,
    attempts: result.attempts,
    config,
  };
};
