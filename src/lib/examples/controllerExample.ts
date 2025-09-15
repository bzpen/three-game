// ArrowController使用示例

import { ArrowController, type ArrowControllerConfig } from '../controllers/ArrowController';
import type { ArrowData } from '../types/game';

// 示例1: 基本的箭头生成
export const basicArrowGeneration = async () => {
  const controller = ArrowController.getInstance();
  
  const config: ArrowControllerConfig = {
    rows: 6,
    cols: 6,
    gridGap: 2,
    gridSize: 60,
    arrowCount: 3,
    offsetX: 20,
    offsetY: 20,
  };

  const result = await controller.generateArrows(config);
  
  if (result.success) {
    console.log('箭头生成成功:', result.arrows);
    console.log('尝试次数:', result.attempts);
    return result.arrows;
  } else {
    console.log('箭头生成失败');
    return [];
  }
};

// 示例2: 大型关卡生成
export const generateLargeLevel = async () => {
  const controller = ArrowController.getInstance();
  
  const config: ArrowControllerConfig = {
    rows: 10,
    cols: 10,
    gridGap: 3,
    gridSize: 40,
    arrowCount: 8,
    offsetX: 30,
    offsetY: 30,
  };

  return await controller.generateArrows(config);
};

// 示例3: 小型关卡生成
export const generateSmallLevel = async () => {
  const controller = ArrowController.getInstance();
  
  const config: ArrowControllerConfig = {
    rows: 4,
    cols: 4,
    gridGap: 2,
    gridSize: 80,
    arrowCount: 2,
    offsetX: 15,
    offsetY: 15,
  };

  return await controller.generateArrows(config);
};

// 示例4: 验证箭头布局
export const validateArrowLayout = (arrows: ArrowData[]) => {
  const controller = ArrowController.getInstance();
  
  const config: ArrowControllerConfig = {
    rows: 6,
    cols: 6,
    gridGap: 2,
    gridSize: 60,
    arrowCount: 3,
    offsetX: 20,
    offsetY: 20,
  };

  const isValid = controller.validateArrows(arrows, config);
  console.log('箭头布局是否有效:', isValid);
  
  return isValid;
};

// 示例5: 在React组件中使用
export const useInReactComponent = () => {
  /*
  const [arrows, setArrows] = useState<ArrowData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const controller = useRef(ArrowController.getInstance());

  const generateArrows = async () => {
    setIsGenerating(true);
    
    const config: ArrowControllerConfig = {
      rows: 6,
      cols: 6,
      gridGap: 2,
      gridSize: 60,
      arrowCount: 3,
      offsetX: 20,
      offsetY: 20,
    };

    const result = await controller.current.generateArrows(config);
    
    if (result.success) {
      setArrows(result.arrows);
    }
    
    setIsGenerating(false);
  };

  useEffect(() => {
    generateArrows();
  }, []);
  */
};

// 示例6: 批量生成和选择最佳布局
export const generateBestLayout = async (attempts: number = 5) => {
  const controller = ArrowController.getInstance();
  
  const config: ArrowControllerConfig = {
    rows: 6,
    cols: 6,
    gridGap: 2,
    gridSize: 60,
    arrowCount: 3,
    offsetX: 20,
    offsetY: 20,
  };

  let bestResult = null;
  let minAttempts = Infinity;

  for (let i = 0; i < attempts; i++) {
    const result = await controller.generateArrows(config);
    
    if (result.success && result.attempts < minAttempts) {
      minAttempts = result.attempts;
      bestResult = result;
    }
  }

  if (bestResult) {
    console.log(`最佳布局生成成功，用时 ${bestResult.attempts} 次尝试`);
    return bestResult.arrows;
  } else {
    console.log('所有尝试都失败了');
    return [];
  }
};
