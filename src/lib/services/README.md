# 服务层架构说明

这个服务层提供了纯粹的业务逻辑处理，将数据处理与UI组件完全分离。

## 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   Custom Hooks  │    │    Services     │
│                 │    │                 │    │                 │
│  - ArrowManager │───▶│   useArrows     │───▶│  ArrowService   │
│  - GameBoard    │    │                 │    │  GridService    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │     Utils       │
                                              │                 │
                                              │  - arrow.ts     │
                                              │  - validation.ts│
                                              │  - GridManager  │
                                              └─────────────────┘
```

## 服务层组件

### ArrowService

负责箭头生成和验证相关的业务逻辑。

**主要功能：**
- 生成随机箭头布局
- 验证箭头放置的可行性
- 确保布局的可解性
- 处理箭头生成的重试逻辑

**接口：**
```typescript
class ArrowService {
  generateArrows(config: ArrowGenerationConfig): ArrowGenerationResult
  validateLayout(arrows: ArrowData[], config: ArrowGenerationConfig): boolean
}
```

### GridService

负责网格状态管理和碰撞检测相关的业务逻辑。

**主要功能：**
- 根据箭头位置更新网格状态
- 检测箭头之间的碰撞
- 创建和管理网格数据
- 提供网格状态查询接口

**接口：**
```typescript
class GridService {
  updateGridFromArrows(arrows: ArrowData[], gridManager: GridManager, config: GridConfig): number[][]
  checkArrowCollision(arrowId: number, arrows: ArrowData[], gridManager: GridManager, config: GridConfig, currentPixelPosition?: {x: number, y: number}): boolean
  createEmptyGrid(rows: number, cols: number): number[][]
}
```

## 自定义Hook层

### useArrows

封装箭头状态管理逻辑，连接服务层和UI层。

**主要功能：**
- 管理箭头数组状态
- 处理箭头生成和更新
- 协调网格状态同步
- 提供箭头操作接口

**接口：**
```typescript
interface UseArrowsReturn {
  arrows: ArrowData[];
  gridData: number[][];
  isGenerating: boolean;
  generateArrows: () => void;
  updateArrowPosition: (index: number, newPixelPosition: {x: number, y: number}) => void;
  removeArrow: (index: number) => void;
  setArrowMoving: (index: number, isMoving: boolean) => void;
  checkCollision: (arrowId: number, currentPixelPosition?: {x: number, y: number}) => boolean;
}
```

## 组件层

### ArrowManager

纯粹的UI渲染组件，不包含业务逻辑。

**职责：**
- 渲染箭头组件
- 处理UI事件
- 调用Hook提供的方法
- 管理本地UI状态（如移动状态）

### GameBoard

协调整体游戏界面的容器组件。

**职责：**
- 管理游戏配置
- 协调子组件
- 处理用户交互
- 同步Redux状态

## 数据流

1. **配置更新**: GameBoard → Redux → useArrows
2. **箭头生成**: useArrows → ArrowService → 返回箭头数据
3. **状态更新**: useArrows → GridService → Redux
4. **UI渲染**: ArrowManager ← useArrows ← 服务层

## 优势

### 1. 职责分离
- **服务层**: 纯业务逻辑，可单独测试
- **Hook层**: 状态管理和协调
- **组件层**: 纯UI渲染

### 2. 可测试性
- 服务层可以完全脱离React进行单元测试
- 业务逻辑与UI逻辑分离
- 更容易进行集成测试

### 3. 可复用性
- 服务层可以在不同组件间复用
- Hook可以在不同的UI实现中使用
- 业务逻辑与具体实现解耦

### 4. 可维护性
- 单一职责原则
- 依赖注入和控制反转
- 更清晰的代码结构

## 使用示例

### 直接使用服务层
```typescript
const arrowService = ArrowService.getInstance();
const result = arrowService.generateArrows(config);
```

### 在组件中使用Hook
```typescript
const { arrows, generateArrows, checkCollision } = useArrows(config, onGridUpdate);
```

### 在测试中使用
```typescript
test('箭头生成测试', () => {
  const service = ArrowService.getInstance();
  const result = service.generateArrows(testConfig);
  expect(result.success).toBe(true);
});
```
