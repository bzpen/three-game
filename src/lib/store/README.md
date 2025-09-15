# Redux 关卡数据管理

这个模块提供了一个轻量级的Redux解决方案来管理游戏关卡的网格数据和配置，箭头状态由ArrowManager子组件独立管理。

## 文件结构

```
src/lib/store/
├── index.ts          # Redux store配置和类型导出
├── levelSlice.ts     # 关卡数据的slice，包含actions和reducers
└── README.md         # 使用说明（本文件）
```

## 主要功能

### 1. 关卡配置管理
- 网格尺寸 (rows, cols)
- 视觉样式 (gridSize, gridGap, offsetX, offsetY)
- 箭头数量配置 (arrowCount)

### 2. 网格状态管理
- 网格占用情况实时更新
- 网格重置功能
- 响应配置变化自动调整

### 3. 组件协作
- 与ArrowManager组件配合工作
- ArrowManager独立管理箭头生成和移动
- Redux只负责网格数据和配置管理

## 使用方法

### 基本使用

```typescript
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { updateConfig, resetGrid } from './levelSlice';
import ArrowManager from '../components/ArrowManager';

function GameComponent() {
  const dispatch = useAppDispatch();
  const { config, gridData } = useAppSelector(state => state.level);

  // 更新游戏配置
  const updateGameConfig = () => {
    dispatch(updateConfig({
      rows: 8,
      cols: 8,
      arrowCount: 5,
      gridSize: 50,
    }));
  };

  // 重置网格
  const resetGameGrid = () => {
    dispatch(resetGrid());
  };

  return (
    <div>
      <button onClick={updateGameConfig}>更新配置</button>
      <button onClick={resetGameGrid}>重置网格</button>
      
      {/* ArrowManager独立管理箭头 */}
      <ArrowManager onGridUpdate={(gridData) => console.log('Grid updated:', gridData)} />
    </div>
  );
}
```

### 配置选项

```typescript
interface LevelConfig {
  rows: number;        // 网格行数
  cols: number;        // 网格列数
  gridGap: number;     // 网格间距
  gridSize: number;    // 网格单元大小
  arrowCount: number;  // 箭头数量
  offsetX: number;     // X轴偏移
  offsetY: number;     // Y轴偏移
}
```

### 可用的Actions

1. **updateConfig(config)** - 更新关卡配置（自动重置网格）
2. **updateGridData(gridData)** - 更新网格占用数据
3. **resetGrid()** - 重置网格为空状态

### ArrowManager组件

ArrowManager组件独立管理箭头状态，提供以下功能：
- 箭头生成和布局验证
- 箭头移动和碰撞检测
- 实时更新Redux中的网格数据
- 响应配置变化重新生成箭头

### State结构

```typescript
interface LevelState {
  config: LevelConfig;   // 关卡配置
  gridData: number[][];  // 网格占用状态（由ArrowManager更新）
}

interface LevelConfig {
  rows: number;        // 网格行数
  cols: number;        // 网格列数
  gridGap: number;     // 网格间距
  gridSize: number;    // 网格单元大小
  arrowCount: number;  // 箭头数量配置
  offsetX: number;     // X轴偏移
  offsetY: number;     // Y轴偏移
}
```

## 架构设计

### 职责分离
- **Redux Store**: 管理网格数据和配置
- **ArrowManager组件**: 管理箭头状态和生成逻辑
- **GameBoard组件**: 协调整体游戏界面

### 数据流
1. GameBoard更新配置到Redux
2. ArrowManager监听配置变化
3. ArrowManager生成箭头并更新网格数据到Redux
4. 所有组件响应Redux状态变化

## 性能考虑

- 箭头状态与网格状态分离，减少Redux状态复杂度
- ArrowManager使用本地状态管理箭头，减少不必要的Redux更新
- 网格数据定时更新而非实时更新，平衡性能与准确性
- 使用useMemo优化配置对象，避免不必要的重渲染
- 通过key值强制重新渲染ArrowManager来实现重新生成功能
