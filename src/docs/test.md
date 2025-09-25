# 数据生成工具

这是一个游戏关卡数据的生成工具

数据格式 types/index -> LevelConfig

参考 LevelConfig.ts LEVELS_LIST 数组的第一个

## 请记住规则

1. 生成的箭头会占据位置 参考 GameView 中的 updateGridData，每个箭头占据的位置唯一，不可重叠
2. 箭头不能有死锁情况简单死锁情况如下

--> <-- 上下也是
另一种 成四个方向上的互相牵制死锁

3. 箭头占据区域不能超过界面区域
