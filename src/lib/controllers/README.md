# 控制器层架构说明

控制器层位于服务层和组件层之间，负责协调业务逻辑和状态管理。

## 设计原则

### 职责分离
- **控制器层**: 协调业务逻辑，处理复杂的业务流程
- **服务层**: 纯业务逻辑，无状态处理
- **Hook层**: 状态管理和React生命周期
- **组件层**: 纯UI渲染

### 数据流向
```
GameBoard(控制器调用) → ArrowController → ArrowService → 返回结果
    ↓
ArrowManager(接收数据) → useArrows(状态管理) → 渲染箭头
```

## ArrowController

### 功能概述
ArrowController是箭头相关业务的控制器，负责：
- 协调箭头生成流程
- 管理生成配置
- 处理生成结果
- 提供验证功能

### 主要方法

#### `generateArrows(config: ArrowControllerConfig): Promise<GenerateArrowsResult>`
异步生成箭头布局。

**参数:**
- `config`: 箭头生成配置，包含网格尺寸、箭头数量等

**返回值:**
```typescript
interface GenerateArrowsResult {
  arrows: ArrowData[];    // 生成的箭头数组
  success: boolean;       // 是否生成成功
  attempts: number;       // 尝试次数
}
```

**使用示例:**
```typescript
const controller = ArrowController.getInstance();
const result = await controller.generateArrows({
  rows: 6,
  cols: 6,
  gridGap: 2,
  gridSize: 60,
  arrowCount: 3,
  offsetX: 20,
  offsetY: 20,
});

if (result.success) {
  console.log('生成成功:', result.arrows);
} else {
  console.log('生成失败');
}
```

#### `validateArrows(arrows: ArrowData[], config: ArrowControllerConfig): boolean`
验证箭头布局的有效性。

**参数:**
- `arrows`: 要验证的箭头数组
- `config`: 验证配置

**返回值:**
- `boolean`: 布局是否有效

## 架构优势

### 1. 关注点分离
```typescript
// GameBoard: 负责UI协调和用户交互
const generateArrows = async () => {
  const result = await controller.generateArrows(config);
  setCurrentArrows(result.arrows);
};

// ArrowController: 负责业务流程协调
async generateArrows(config) {
  return this.arrowService.generateArrows(config);
}

// ArrowService: 负责纯业务逻辑
generateArrows(config) {
  // 具体的生成算法实现
}

// useArrows: 负责状态管理
const { arrows, setArrows } = useArrows(config);
```

### 2. 易于测试
控制器层可以独立测试，不依赖React组件：

```typescript
// 单元测试示例
test('箭头生成测试', async () => {
  const controller = ArrowController.getInstance();
  const result = await controller.generateArrows(testConfig);
  
  expect(result.success).toBe(true);
  expect(result.arrows.length).toBe(3);
});
```

### 3. 可复用性
控制器可以在不同的组件中使用：

```typescript
// 在GameBoard中使用
const gameController = ArrowController.getInstance();

// 在其他组件中也可以使用同一个实例
const settingsController = ArrowController.getInstance();
```

### 4. 状态管理清晰
- **GameBoard**: 管理生成状态和当前箭头
- **ArrowManager**: 接收箭头数据进行渲染
- **useArrows**: 管理箭头的运行时状态（位置、移动等）

## 最佳实践

### 1. 单例模式
控制器使用单例模式，确保全局唯一：

```typescript
const controller = ArrowController.getInstance();
```

### 2. 异步处理
生成操作是异步的，避免阻塞UI：

```typescript
const result = await controller.generateArrows(config);
```

### 3. 错误处理
控制器层处理错误，提供友好的错误信息：

```typescript
try {
  const result = await controller.generateArrows(config);
} catch (error) {
  console.error('生成失败:', error);
}
```

### 4. 配置管理
使用统一的配置接口：

```typescript
interface ArrowControllerConfig {
  rows: number;
  cols: number;
  gridGap: number;
  gridSize: number;
  arrowCount: number;
  offsetX: number;
  offsetY: number;
}
```

## 扩展性

控制器层的设计便于扩展新功能：

1. **新的生成策略**: 在控制器中添加新方法
2. **批量操作**: 在控制器中协调多个服务调用
3. **缓存机制**: 在控制器中添加结果缓存
4. **性能监控**: 在控制器中添加性能统计
