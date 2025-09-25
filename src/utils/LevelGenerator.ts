import { LevelConfig, ElementData } from '@/types';

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
 * 关卡生成器 - 基于二维表格填充
 *
 * 生成规则：
 * 1. 创建二维表格，从中心开始填充箭头占用
 * 2. 每个箭头占据2个相邻格子，已填充格子不可重复使用
 * 3. 填充完成后根据占用模式为每个箭头分配方向（仅2个可选）
 */
export class LevelGenerator {
    private rows: number;
    private cols: number;
    private grid: Grid;
    private centerX: number;
    private centerY: number;

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
     * 生成关卡数据 - 基于二维表格填充策略
     */
    generate(levelId: number, arrowCount: number = 3): LevelConfig {
        this.resetGrid();

        // 第一阶段：填充二维表格
        const arrowInfos = this.fillGridWithArrows(arrowCount);

        // 第二阶段：根据占用模式分配方向
        const elements = this.assignDirections(arrowInfos);

        // 检查并修复死锁 - 通过倒转方向解决
        this.resolveDeadlocksByReversing(elements);

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
    }

    /**
     * 第一阶段：填充二维表格
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

            // 在当前半径的圆周上查找位置
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
     * 获取指定半径上的所有可能位置
     */
    private getPositionsAtRadius(radius: number): Position[] {
        const positions: Position[] = [];

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                // 只取圆周上的点（曼哈顿距离等于radius的点）
                if (Math.abs(dx) + Math.abs(dy) === radius) {
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
        // 随机决定尝试顺序
        const tryHorizontalFirst = Math.random() < 0.5;

        if (tryHorizontalFirst) {
            // 先尝试水平布局
            if (this.canPlaceHorizontal(x, y)) {
                this.fillHorizontal(x, y, arrowId);
                return {
                    id: arrowId,
                    cells: [
                        { x, y },
                        { x: x + 1, y },
                    ],
                    layout: 'horizontal',
                };
            }

            // 再尝试垂直布局
            if (this.canPlaceVertical(x, y)) {
                this.fillVertical(x, y, arrowId);
                return {
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
                return {
                    id: arrowId,
                    cells: [
                        { x, y },
                        { x, y: y + 1 },
                    ],
                    layout: 'vertical',
                };
            }

            // 再尝试水平布局
            if (this.canPlaceHorizontal(x, y)) {
                this.fillHorizontal(x, y, arrowId);
                return {
                    id: arrowId,
                    cells: [
                        { x, y },
                        { x: x + 1, y },
                    ],
                    layout: 'horizontal',
                };
            }
        }

        return null;
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
     * 第二阶段：根据占用模式分配方向
     */
    private assignDirections(arrowInfos: ArrowInfo[]): ElementData[] {
        return arrowInfos.map(arrowInfo => {
            const direction = this.getDirectionForLayout(arrowInfo.layout);
            const { width, height } = this.getArrowDimensions(direction);
            const position = arrowInfo.cells[0]; // 使用第一个格子作为位置

            return {
                id: arrowInfo.id,
                type: 'arrow',
                direction,
                width,
                height,
                position,
            };
        });
    }

    /**
     * 根据布局模式获取方向
     */
    private getDirectionForLayout(layout: 'horizontal' | 'vertical'): ArrowDirection {
        if (layout === 'horizontal') {
            // 水平布局：随机选择左或右
            return Math.random() < 0.5 ? ArrowDirection.LEFT : ArrowDirection.RIGHT;
        } else {
            // 垂直布局：随机选择上或下
            return Math.random() < 0.5 ? ArrowDirection.UP : ArrowDirection.DOWN;
        }
    }

    /**
     * 根据箭头方向获取尺寸
     */
    private getArrowDimensions(direction: ArrowDirection): { width: number; height: number } {
        switch (direction) {
            case ArrowDirection.LEFT:
            case ArrowDirection.RIGHT:
                return { width: 2, height: 1 }; // 水平箭头
            case ArrowDirection.UP:
            case ArrowDirection.DOWN:
                return { width: 1, height: 2 }; // 垂直箭头
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

    /**
     * 通过倒转方向解决死锁问题
     */
    private resolveDeadlocksByReversing(elements: ElementData[]): void {
        const deadlockPairs = this.detectDeadlocks(elements);

        // 通过倒转其中一个箭头的方向来解决死锁
        deadlockPairs.forEach(pair => {
            const [arrow1, arrow2] = pair;

            // 随机选择其中一个箭头倒转方向
            const arrowToReverse = Math.random() < 0.5 ? arrow1 : arrow2;
            arrowToReverse.direction = this.reverseDirection(arrowToReverse.direction);
        });
    }

    /**
     * 倒转箭头方向
     */
    private reverseDirection(direction: string): string {
        const reverseMap: { [key: string]: string } = {
            [ArrowDirection.UP]: ArrowDirection.DOWN,
            [ArrowDirection.DOWN]: ArrowDirection.UP,
            [ArrowDirection.LEFT]: ArrowDirection.RIGHT,
            [ArrowDirection.RIGHT]: ArrowDirection.LEFT,
        };

        return reverseMap[direction] || direction;
    }

    /**
     * 检测死锁情况
     */
    private detectDeadlocks(elements: ElementData[]): ElementData[][] {
        const deadlocks: ElementData[][] = [];

        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                if (this.isDeadlock(elements[i], elements[j])) {
                    deadlocks.push([elements[i], elements[j]]);
                }
            }
        }

        return deadlocks;
    }

    /**
     * 判断两个箭头是否形成死锁
     */
    private isDeadlock(arrow1: ElementData, arrow2: ElementData): boolean {
        // 简单死锁：相对箭头
        if (this.isOpposingArrows(arrow1, arrow2)) {
            return this.areArrowsAligned(arrow1, arrow2);
        }

        // 四方向死锁检测可以在这里扩展
        return false;
    }

    /**
     * 判断是否为相对方向的箭头
     */
    private isOpposingArrows(arrow1: ElementData, arrow2: ElementData): boolean {
        const opposites = {
            [ArrowDirection.UP]: ArrowDirection.DOWN,
            [ArrowDirection.DOWN]: ArrowDirection.UP,
            [ArrowDirection.LEFT]: ArrowDirection.RIGHT,
            [ArrowDirection.RIGHT]: ArrowDirection.LEFT,
        };

        return opposites[arrow1.direction as ArrowDirection] === arrow2.direction;
    }

    /**
     * 判断两个箭头是否在同一条直线上
     */
    private areArrowsAligned(arrow1: ElementData, arrow2: ElementData): boolean {
        const pos1 = arrow1.position;
        const pos2 = arrow2.position;

        // 垂直对齐
        if (
            (arrow1.direction === ArrowDirection.UP || arrow1.direction === ArrowDirection.DOWN) &&
            (arrow2.direction === ArrowDirection.UP || arrow2.direction === ArrowDirection.DOWN)
        ) {
            return Math.abs(pos1.x - pos2.x) <= 2; // 考虑箭头宽度
        }

        // 水平对齐
        if (
            (arrow1.direction === ArrowDirection.LEFT || arrow1.direction === ArrowDirection.RIGHT) &&
            (arrow2.direction === ArrowDirection.LEFT || arrow2.direction === ArrowDirection.RIGHT)
        ) {
            return pos1.y === pos2.y;
        }

        return false;
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
