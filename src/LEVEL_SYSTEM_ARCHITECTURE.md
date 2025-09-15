# 关卡系统架构说明

## 概述

关卡系统现在分为两个明确的模式：

1. **开发者模式**: 关卡制作工具，用于创建和导出关卡JSON文件
2. **用户模式**: 游戏运行时，只读取预制的关卡数据

## 架构分离

### 🛠️ 开发者模式 (Level Editor)

**位置**: `/level-editor` 页面

**功能**:
- 生成关卡（单个或批量）
- 预览关卡数据
- 导出关卡为JSON文件
- 导入关卡文件进行编辑
- 关卡统计和管理

**核心组件**:
- `LevelEditor.tsx` - 关卡制作界面
- `LevelGenerator.ts` - 关卡生成算法
- `ArrowService.ts` - 箭头生成服务

**使用流程**:
1. 访问 `/level-editor`
2. 选择难度和参数
3. 生成关卡
4. 预览和调整
5. 导出JSON文件
6. 将JSON文件放入 `public/levels/` 目录

### 🎮 用户模式 (Game)

**位置**: 主游戏页面

**功能**:
- 加载预制关卡数据
- 关卡选择和切换
- 随机模式作为备选
- 纯游戏体验，无关卡创建功能

**核心组件**:
- `GameBoard.tsx` - 游戏主界面
- `StaticLevelService.ts` - 静态关卡加载服务
- `ArrowManager.tsx` - 箭头渲染和管理

**数据流**:
1. 从 `public/levels/*.json` 加载关卡数据
2. 用户选择关卡
3. 转换为运行时箭头数据
4. 渲染游戏界面

## 文件结构

```
src/
├── app/
│   ├── page.tsx                    # 用户游戏页面
│   └── level-editor/
│       └── page.tsx                # 开发者关卡编辑器页面
├── components/
│   ├── GameBoard.tsx               # 用户模式游戏界面
│   └── ArrowManager.tsx            # 箭头管理组件
├── tools/
│   └── LevelEditor.tsx             # 开发者关卡制作工具
├── lib/
│   ├── generators/
│   │   └── LevelGenerator.ts       # 关卡生成器（开发者用）
│   ├── services/
│   │   ├── StaticLevelService.ts   # 静态关卡服务（用户用）
│   │   └── ArrowService.ts         # 箭头生成服务
│   └── types/
│       └── level.ts                # 关卡数据类型定义
└── public/
    └── levels/
        └── sample_pack.json        # 预制关卡数据
```

## 关卡数据格式

### 关卡文件 (LevelPack)
```json
{
  "id": "sample_pack_v1",
  "name": "Sample Level Pack",
  "description": "示例关卡包",
  "version": "1.0.0",
  "levels": [
    {
      "id": "easy_001",
      "name": "Easy Level 1", 
      "difficulty": "easy",
      "config": {
        "rows": 4,
        "cols": 4,
        "gridGap": 3,
        "gridSize": 80,
        "offsetX": 20,
        "offsetY": 20
      },
      "arrows": [
        {
          "id": 1,
          "direction": "right",
          "gridPosition": { "row": 1, "col": 1 }
        }
      ],
      "metadata": {
        "createdAt": "2024-01-01T00:00:00.000Z",
        "generationAttempts": 3,
        "isValid": true,
        "tags": ["tutorial"]
      }
    }
  ],
  "metadata": {
    "createdAt": "2024-01-01T00:00:00.000Z",
    "totalLevels": 1,
    "difficultyDistribution": {
      "easy": 1,
      "medium": 0,
      "hard": 0,
      "expert": 0
    }
  }
}
```

## 工作流程

### 开发者工作流

1. **制作关卡**:
   ```bash
   # 启动开发服务器
   npm run dev
   
   # 访问关卡编辑器
   http://localhost:3001/level-editor
   ```

2. **生成关卡**:
   - 选择难度和数量
   - 批量生成关卡
   - 预览和调整

3. **导出关卡**:
   - 导出单个关卡JSON
   - 或导出整个关卡包

4. **部署关卡**:
   ```bash
   # 将导出的JSON文件放入public目录
   cp exported_pack.json public/levels/new_pack.json
   ```

5. **更新加载逻辑** (如需要):
   ```typescript
   // 在StaticLevelService.ts中添加新关卡包
   await this.loadLevelPack('new_pack.json');
   ```

### 用户体验

1. **启动游戏**: 自动加载所有预制关卡
2. **选择关卡**: 从下拉框选择想玩的关卡
3. **随机模式**: 如果想要随机挑战
4. **纯游戏体验**: 没有任何关卡创建功能

## 部署配置

### 开发环境
- 包含关卡编辑器
- 显示开发者提示
- 完整功能

### 生产环境
- 只包含游戏功能
- 隐藏关卡编辑器入口
- 只读关卡数据

可以通过环境变量控制：
```typescript
// 只在开发环境显示编辑器链接
{process.env.NODE_ENV === 'development' && (
  <a href="/level-editor">关卡编辑器</a>
)}
```

## 扩展性

### 添加新关卡包
1. 在关卡编辑器中制作
2. 导出JSON文件
3. 放入 `public/levels/`
4. 在 `StaticLevelService.loadDefaultLevels()` 中添加加载逻辑

### 自定义关卡格式
- 修改 `level.ts` 类型定义
- 更新验证逻辑
- 调整转换函数

### 关卡包管理
- 可以支持多个关卡包
- 按主题或难度分类
- 版本控制和更新机制

## 优势

1. **明确分离**: 开发工具和游戏完全分离
2. **性能优化**: 用户模式没有复杂的生成逻辑
3. **易于维护**: 各模块职责清晰
4. **部署友好**: 生产环境只包含必要功能
5. **扩展性好**: 易于添加新关卡和功能
6. **数据安全**: 关卡数据为只读，不会被用户修改
