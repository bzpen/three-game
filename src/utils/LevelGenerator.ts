import { LevelConfig, ElementData } from '@/types';
import { wouldCauseDeadlock } from './DeadlockChecker';

/**
 * 箭头方向枚举
 */
export enum ArrowDirection {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right',
}

/**
 * 位置坐标
 */
interface Position {
    x: number;
    y: number;
}

/**
 * 网格单元类型
 */
type GridCell = string | null;

/**
 * 二维网格类型
 */
type Grid = GridCell[][];

/**
 * 箭头信息
 */
interface ArrowInfo {
    id: string;
    cells: Position[];
    layout: 'horizontal' | 'vertical';
}

/**
 * 关卡生成器 - 简化版本
 */
export class LevelGenerator {
    private rows: number;
    private cols: number;
    private grid: Grid;
    private centerX: number;
    private centerY: number;
    private lastPlacedLayout: 'horizontal' | 'vertical' | null = null;
    private lastPlacedDirection: string | null = null;

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.centerX = Math.floor(cols / 2);
        this.centerY = Math.floor(rows / 2);
        this.grid = Array(rows)
            .fill(null)
            .map(() => Array(cols).fill(null));
    }

    /**
     * 生成关卡数据
     */
    generate(levelId: number, arrowCount: number = 3): LevelConfig {
        this.resetGrid();

        // 第一阶段：填充二维表格
        const arrowInfos = this.fillGridWithArrows(arrowCount);

        // 简单分配方向
        let elements = this.assignDirections(arrowInfos);

        // 补充填充机制：如果由于死锁检测导致元素不足，继续填充
        if (elements.length < arrowCount) {
            const deletedCount = arrowCount - elements.length;
            console.log(`由于死锁检测删除了 ${deletedCount} 个箭头，开始补充填充`);
            elements = this.supplementArrows(elements, arrowCount);
        }

        return {
            id: levelId,
            rows: this.rows,
            cols: this.cols,
            elements,
        };
    }

    /**
     * 重置网格状态
     */
    private resetGrid(): void {
        this.grid = Array(this.rows)
            .fill(null)
            .map(() => Array(this.cols).fill(null));
        this.lastPlacedLayout = null; // 重置上一个布局记录
        this.lastPlacedDirection = null; // 重置上一个方向记录
    }

    /**
     * 填充二维表格
     */
    private fillGridWithArrows(arrowCount: number): ArrowInfo[] {
        const arrowInfos: ArrowInfo[] = [];
        let placedCount = 0;
        let radius = 0;

        while (placedCount < arrowCount && radius < Math.max(this.rows, this.cols)) {
            if (radius === 0) {
                // 尝试在中心点放置箭头
                const centerResult = this.tryPlaceArrowAt(this.centerX, this.centerY, `arrow-${placedCount + 1}`);
                if (centerResult) {
                    arrowInfos.push(centerResult);
                    placedCount++;
                }
                radius++;
                continue;
            }

            // 在当前半径的正方形边界上查找位置
            const radiusPositions = this.getPositionsAtRadius(radius);

            for (const pos of radiusPositions) {
                if (placedCount >= arrowCount) break;

                const arrowInfo = this.tryPlaceArrowAt(pos.x, pos.y, `arrow-${placedCount + 1}`);
                if (arrowInfo) {
                    arrowInfos.push(arrowInfo);
                    placedCount++;
                }
            }

            radius++;
        }

        return arrowInfos;
    }

    /**
     * 获取指定半径上的所有可能位置（正方形外扩）
     */
    private getPositionsAtRadius(radius: number): Position[] {
        const positions: Position[] = [];

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                // 只取正方形边界上的点
                if (Math.max(Math.abs(dx), Math.abs(dy)) === radius) {
                    const x = this.centerX + dx;
                    const y = this.centerY + dy;

                    if (this.isWithinBounds(x, y)) {
                        positions.push({ x, y });
                    }
                }
            }
        }

        return positions;
    }

    /**
     * 尝试在指定位置放置箭头
     */
    private tryPlaceArrowAt(x: number, y: number, arrowId: string): ArrowInfo | null {
        // 根据上一个放置的箭头布局决定优先方向
        let tryHorizontalFirst: boolean;

        if (this.lastPlacedLayout === null) {
            // 第一个箭头随机选择
            tryHorizontalFirst = Math.random() < 0.5;
        } else if (this.lastPlacedLayout === 'horizontal') {
            // 如果上一个是水平的，优先尝试垂直
            tryHorizontalFirst = false;
        } else {
            // 如果上一个是垂直的，优先尝试水平
            tryHorizontalFirst = true;
        }

        let result: ArrowInfo | null = null;

        if (tryHorizontalFirst) {
            // 先尝试水平布局
            if (this.canPlaceHorizontal(x, y)) {
                this.fillHorizontal(x, y, arrowId);
                result = {
                    id: arrowId,
                    cells: [
                        { x, y },
                        { x: x + 1, y },
                    ],
                    layout: 'horizontal',
                };
            }
            // 再尝试垂直布局
            else if (this.canPlaceVertical(x, y)) {
                this.fillVertical(x, y, arrowId);
                result = {
                    id: arrowId,
                    cells: [
                        { x, y },
                        { x, y: y + 1 },
                    ],
                    layout: 'vertical',
                };
            }
        } else {
            // 先尝试垂直布局
            if (this.canPlaceVertical(x, y)) {
                this.fillVertical(x, y, arrowId);
                result = {
                    id: arrowId,
                    cells: [
                        { x, y },
                        { x, y: y + 1 },
                    ],
                    layout: 'vertical',
                };
            }
            // 再尝试水平布局
            else if (this.canPlaceHorizontal(x, y)) {
                this.fillHorizontal(x, y, arrowId);
                result = {
                    id: arrowId,
                    cells: [
                        { x, y },
                        { x: x + 1, y },
                    ],
                    layout: 'horizontal',
                };
            }
        }

        // 更新上一个放置的布局记录
        if (result) {
            this.lastPlacedLayout = result.layout;
        }

        return result;
    }

    /**
     * 检查是否可以水平放置
     */
    private canPlaceHorizontal(x: number, y: number): boolean {
        return x + 1 < this.cols && this.grid[y][x] === null && this.grid[y][x + 1] === null;
    }

    /**
     * 检查是否可以垂直放置
     */
    private canPlaceVertical(x: number, y: number): boolean {
        return y + 1 < this.rows && this.grid[y][x] === null && this.grid[y + 1][x] === null;
    }

    /**
     * 填充水平箭头
     */
    private fillHorizontal(x: number, y: number, arrowId: string): void {
        this.grid[y][x] = arrowId;
        this.grid[y][x + 1] = arrowId;
    }

    /**
     * 填充垂直箭头
     */
    private fillVertical(x: number, y: number, arrowId: string): void {
        this.grid[y][x] = arrowId;
        this.grid[y + 1][x] = arrowId;
    }

    /**
     * 简单分配方向
     */
    private assignDirections(arrowInfos: ArrowInfo[]): ElementData[] {
        const elements: ElementData[] = [];

        for (const arrowInfo of arrowInfos) {
            const direction = this.getDirectionForLayout(arrowInfo.layout);
            const { width, height } = this.getArrowDimensions(direction);

            const element: ElementData = {
                id: arrowInfo.id,
                type: 'arrow',
                direction,
                width,
                height,
                position: arrowInfo.cells[0],
            };

            // 添加死锁的判断
            if (!wouldCauseDeadlock(element, elements)) {
                elements.push(element);
                // 更新最后放置的方向记录
                this.lastPlacedDirection = direction;
            } else {
                console.log(`箭头 ${element.id} 会造成死锁，跳过添加`);
            }
        }

        return elements;
    }

    /**
     * 补充填充箭头，从内向外寻找空位置填充
     */
    private supplementArrows(existingElements: ElementData[], targetCount: number): ElementData[] {
        const elements = [...existingElements];
        let placedCount = elements.length;
        let radius = 0;
        let nextArrowId = elements.length + 1;

        // 重新构建网格状态，标记已占用的位置
        this.rebuildGridFromElements(elements);

        while (placedCount < targetCount && radius < Math.max(this.rows, this.cols)) {
            if (radius === 0) {
                // 检查中心点
                const arrowInfo = this.tryPlaceArrowAt(this.centerX, this.centerY, `arrow-${nextArrowId}`);
                if (arrowInfo) {
                    const element = this.createElementFromArrowInfo(arrowInfo);
                    if (!wouldCauseDeadlock(element, elements)) {
                        elements.push(element);
                        placedCount++;
                        nextArrowId++;
                    } else {
                        // 如果会造成死锁，需要从网格中移除
                        this.removeArrowFromGrid(arrowInfo);
                    }
                }
            } else {
                // 在当前半径查找空位置
                const radiusPositions = this.getPositionsAtRadius(radius);

                for (const pos of radiusPositions) {
                    if (placedCount >= targetCount) break;

                    const arrowInfo = this.tryPlaceArrowAt(pos.x, pos.y, `arrow-${nextArrowId}`);
                    if (arrowInfo) {
                        const element = this.createElementFromArrowInfo(arrowInfo);
                        if (!wouldCauseDeadlock(element, elements)) {
                            elements.push(element);
                            placedCount++;
                            nextArrowId++;
                        } else {
                            // 如果会造成死锁，需要从网格中移除
                            this.removeArrowFromGrid(arrowInfo);
                        }
                    }
                }
            }

            radius++;
        }

        console.log(`补充填充完成，最终箭头数量: ${elements.length}/${targetCount}`);
        return elements;
    }

    /**
     * 根据现有元素重新构建网格状态
     */
    private rebuildGridFromElements(elements: ElementData[]): void {
        // 先清空网格（但不重置 lastPlacedLayout）
        this.grid = Array(this.rows)
            .fill(null)
            .map(() => Array(this.cols).fill(null));

        // 从现有元素中恢复最后的布局和方向状态
        if (elements.length > 0) {
            const lastElement = elements[elements.length - 1];
            this.lastPlacedLayout = lastElement.width === 2 ? 'horizontal' : 'vertical';
            this.lastPlacedDirection = lastElement.direction;
        }

        // 标记已占用的位置
        for (const element of elements) {
            const { x, y } = element.position;
            const { width, height } = element;

            for (let dy = 0; dy < height; dy++) {
                for (let dx = 0; dx < width; dx++) {
                    if (this.isWithinBounds(x + dx, y + dy)) {
                        this.grid[y + dy][x + dx] = element.id;
                    }
                }
            }
        }
    }

    /**
     * 从 ArrowInfo 创建 ElementData
     */
    private createElementFromArrowInfo(arrowInfo: ArrowInfo): ElementData {
        const direction = this.getDirectionForLayout(arrowInfo.layout);
        const { width, height } = this.getArrowDimensions(direction);

        // 更新最后放置的方向记录
        this.lastPlacedDirection = direction;

        return {
            id: arrowInfo.id,
            type: 'arrow',
            direction,
            width,
            height,
            position: arrowInfo.cells[0],
        };
    }

    /**
     * 从网格中移除箭头
     */
    private removeArrowFromGrid(arrowInfo: ArrowInfo): void {
        for (const cell of arrowInfo.cells) {
            if (this.isWithinBounds(cell.x, cell.y)) {
                this.grid[cell.y][cell.x] = null;
            }
        }
    }

    /**
     * 根据布局模式智能获取方向，避免连续相同方向
     */
    private getDirectionForLayout(layout: 'horizontal' | 'vertical'): ArrowDirection {
        if (layout === 'horizontal') {
            // 如果上一个方向是水平方向，尝试选择不同的方向
            if (this.lastPlacedDirection === 'left') {
                return ArrowDirection.RIGHT;
            } else if (this.lastPlacedDirection === 'right') {
                return ArrowDirection.LEFT;
            } else {
                // 如果上一个不是水平方向或者是第一个箭头，随机选择
                return Math.random() < 0.5 ? ArrowDirection.LEFT : ArrowDirection.RIGHT;
            }
        } else {
            // 如果上一个方向是垂直方向，尝试选择不同的方向
            if (this.lastPlacedDirection === 'up') {
                return ArrowDirection.DOWN;
            } else if (this.lastPlacedDirection === 'down') {
                return ArrowDirection.UP;
            } else {
                // 如果上一个不是垂直方向或者是第一个箭头，随机选择
                return Math.random() < 0.5 ? ArrowDirection.UP : ArrowDirection.DOWN;
            }
        }
    }

    /**
     * 根据箭头方向获取尺寸
     */
    private getArrowDimensions(direction: ArrowDirection): { width: number; height: number } {
        switch (direction) {
            case ArrowDirection.LEFT:
            case ArrowDirection.RIGHT:
                return { width: 2, height: 1 };
            case ArrowDirection.UP:
            case ArrowDirection.DOWN:
                return { width: 1, height: 2 };
            default:
                return { width: 2, height: 1 };
        }
    }

    /**
     * 检查坐标是否在边界内
     */
    private isWithinBounds(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
    }
}

/**
 * 创建关卡生成器实例
 */
export function createLevelGenerator(rows: number = 10, cols: number = 10): LevelGenerator {
    return new LevelGenerator(rows, cols);
}

/**
 * 快速生成关卡
 */
export function generateLevel(
    levelId: number,
    rows: number = 10,
    cols: number = 10,
    arrowCount: number = 3,
): LevelConfig {
    const generator = createLevelGenerator(rows, cols);
    return generator.generate(levelId, arrowCount);
}
