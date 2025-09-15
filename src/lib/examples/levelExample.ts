// 关卡系统使用示例 - 更新为新的架构

import { LevelGenerator } from '../generators/LevelGenerator';
import { StaticLevelService } from '../services/StaticLevelService';
import type { LevelData } from '../types/level';

// 示例1: 基本关卡加载（用户模式）
export const basicLevelLoading = async () => {
  const staticLevelService = StaticLevelService.getInstance();
  
  // 加载默认关卡数据
  await staticLevelService.loadDefaultLevels();
  
  // 获取可用关卡列表
  const levels = staticLevelService.getAllLevels();
  console.log('可用关卡:', levels);
  
  if (levels.length > 0) {
    // 获取第一个关卡
    const level = levels[0];
    
    // 转换为运行时箭头数据
    const arrows = staticLevelService.convertLevelArrowsToRuntime(level);
    
    console.log('关卡加载成功:', level.name);
    console.log('箭头数据:', arrows);
    
    return { level, arrows };
  }
  
  return null;
};

// 示例2: 生成关卡（开发者模式）
export const generateLevel = async () => {
  const levelGenerator = LevelGenerator.getInstance();
  
  // 生成一个中等难度的关卡
  const level = await levelGenerator.generateLevel(
    'custom_level_001',
    'medium',
    'Custom Level Example'
  );
  
  if (level) {
    console.log('关卡生成成功:', level);
    
    // 可以将生成的关卡数据导出为JSON
    const jsonData = JSON.stringify(level, null, 2);
    console.log('JSON数据:', jsonData);
    
    return level;
  }
  
  return null;
};

// 示例3: 批量生成关卡（开发者模式）
export const generateMultipleLevels = async () => {
  const levelGenerator = LevelGenerator.getInstance();
  
  const levels = await levelGenerator.generateLevels({
    levelCount: 5,
    difficulty: 'medium',
    namePrefix: 'Batch Level',
  });
  
  console.log(`批量生成完成: ${levels.length} 个关卡`);
  
  // 创建关卡包
  const levelPack = {
    id: 'batch_pack_001',
    name: 'Batch Generated Pack',
    description: '批量生成的关卡包',
    version: '1.0.0',
    levels: levels,
    metadata: {
      createdAt: new Date().toISOString(),
      totalLevels: levels.length,
      difficultyDistribution: {
        easy: 0,
        medium: levels.length,
        hard: 0,
        expert: 0,
      },
    },
  };
  
  console.log('关卡包:', levelPack);
  return levelPack;
};

// 示例4: 按难度筛选关卡
export const getLevelsByDifficulty = async () => {
  const staticLevelService = StaticLevelService.getInstance();
  
  // 确保数据已加载
  await staticLevelService.loadDefaultLevels();
  
  const easyLevels = staticLevelService.getLevelsByDifficulty('easy');
  const mediumLevels = staticLevelService.getLevelsByDifficulty('medium');
  const hardLevels = staticLevelService.getLevelsByDifficulty('hard');
  const expertLevels = staticLevelService.getLevelsByDifficulty('expert');
  
  console.log('简单关卡:', easyLevels.length, '个');
  console.log('中等关卡:', mediumLevels.length, '个');
  console.log('困难关卡:', hardLevels.length, '个');
  console.log('专家关卡:', expertLevels.length, '个');
  
  return {
    easy: easyLevels,
    medium: mediumLevels,
    hard: hardLevels,
    expert: expertLevels,
  };
};

// 示例5: 获取关卡统计信息
export const getLevelStatistics = async () => {
  const staticLevelService = StaticLevelService.getInstance();
  
  // 确保数据已加载
  await staticLevelService.loadDefaultLevels();
  
  const stats = staticLevelService.getStatistics();
  console.log('关卡统计:', stats);
  
  return stats;
};

// 示例6: 加载特定关卡包
export const loadSpecificLevelPack = async (packFileName: string) => {
  const staticLevelService = StaticLevelService.getInstance();
  
  const levelPack = await staticLevelService.loadLevelPack(packFileName);
  
  if (levelPack) {
    console.log(`关卡包 ${levelPack.name} 加载成功`);
    console.log(`包含 ${levelPack.levels.length} 个关卡`);
    
    return levelPack;
  } else {
    console.error(`关卡包 ${packFileName} 加载失败`);
    return null;
  }
};

// 示例7: 在React组件中使用关卡系统（用户模式）
export const useInReactComponent = () => {
  /*
  // 用户模式下的React组件使用示例
  const [currentLevel, setCurrentLevel] = useState<LevelData | null>(null);
  const [availableLevels, setAvailableLevels] = useState<LevelData[]>([]);
  const [currentArrows, setCurrentArrows] = useState<ArrowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const staticLevelService = useRef(StaticLevelService.getInstance());

  // 加载可用关卡列表
  useEffect(() => {
    const loadLevels = async () => {
      setIsLoading(true);
      try {
        await staticLevelService.current.loadDefaultLevels();
        const levels = staticLevelService.current.getAllLevels();
        setAvailableLevels(levels);
        
        // 默认加载第一个关卡
        if (levels.length > 0) {
          loadLevel(levels[0]);
        }
      } catch (error) {
        console.error('加载关卡失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLevels();
  }, []);

  // 加载特定关卡
  const loadLevel = (level: LevelData) => {
    setCurrentLevel(level);
    
    // 转换为运行时箭头数据
    const arrows = staticLevelService.current.convertLevelArrowsToRuntime(level);
    setCurrentArrows(arrows);
    
    console.log('关卡加载成功:', level.name);
  };

  // 按难度筛选
  const filterByDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'expert') => {
    const filtered = staticLevelService.current.getLevelsByDifficulty(difficulty);
    setAvailableLevels(filtered);
  };
  */
};

// 示例8: 关卡数据结构示例
export const levelDataStructure = {
  // 这是一个关卡数据的示例结构
  sampleLevel: {
    id: "medium_001",
    name: "Sample Level 1",
    difficulty: "medium",
    config: {
      rows: 6,
      cols: 6,
      gridGap: 2,
      gridSize: 60,
      offsetX: 20,
      offsetY: 20,
    },
    arrows: [
      {
        id: 1,
        direction: "right",
        gridPosition: { row: 1, col: 1 },
      },
      {
        id: 2,
        direction: "down",
        gridPosition: { row: 3, col: 2 },
      },
      {
        id: 3,
        direction: "left",
        gridPosition: { row: 4, col: 4 },
      },
    ],
    metadata: {
      createdAt: "2024-01-01T00:00:00.000Z",
      generationAttempts: 5,
      isValid: true,
      tags: ["example"],
    },
  } as LevelData,

  // 关卡包结构示例
  sampleLevelPack: {
    id: "sample_pack_v1",
    name: "Sample Level Pack",
    description: "示例关卡包",
    version: "1.0.0",
    levels: [
      // ... 关卡数据数组
    ],
    metadata: {
      createdAt: "2024-01-01T00:00:00.000Z",
      totalLevels: 3,
      difficultyDistribution: {
        easy: 1,
        medium: 1,
        hard: 1,
        expert: 0,
      },
    },
  },
};

// 示例9: 开发者工具使用示例
export const developerToolsExample = async () => {
  // 这些功能只在开发环境的关卡编辑器中使用
  
  console.log('开发者工具示例:');
  console.log('1. 访问 /level-editor 进行关卡制作');
  console.log('2. 使用 LevelGenerator 生成关卡');
  console.log('3. 导出JSON文件到 public/levels/ 目录');
  console.log('4. 在用户模式下通过 StaticLevelService 加载');
  
  // 生成一个示例关卡
  const level = await generateLevel();
  
  if (level) {
    console.log('生成的关卡可以通过以下方式保存:');
    console.log('- 复制JSON数据到 .json 文件');
    console.log('- 放入 public/levels/ 目录');
    console.log('- 在 StaticLevelService.loadDefaultLevels() 中添加加载逻辑');
  }
  
  return level;
};

// 示例10: 用户模式完整工作流
export const userModeWorkflow = async () => {
  const staticLevelService = StaticLevelService.getInstance();
  
  console.log('用户模式工作流:');
  
  // 1. 加载关卡数据
  console.log('1. 加载关卡数据...');
  await staticLevelService.loadDefaultLevels();
  
  // 2. 获取可用关卡
  console.log('2. 获取可用关卡...');
  const levels = staticLevelService.getAllLevels();
  console.log(`找到 ${levels.length} 个关卡`);
  
  // 3. 选择一个关卡
  if (levels.length > 0) {
    console.log('3. 选择关卡...');
    const selectedLevel = levels[0];
    console.log(`选择关卡: ${selectedLevel.name}`);
    
    // 4. 转换为游戏数据
    console.log('4. 转换为游戏数据...');
    const arrows = staticLevelService.convertLevelArrowsToRuntime(selectedLevel);
    console.log(`转换完成，包含 ${arrows.length} 个箭头`);
    
    // 5. 开始游戏
    console.log('5. 游戏开始！');
    
    return {
      level: selectedLevel,
      arrows: arrows,
      statistics: staticLevelService.getStatistics(),
    };
  }
  
  console.log('没有可用关卡');
  return null;
};