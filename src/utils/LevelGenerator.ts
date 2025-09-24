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
 * 关卡生成器
 *
 * 生成规则：
 * 1. 生成的箭头会占据位置，每个箭头占据的位置唯一，不可重叠
 * 2. 箭头不能有死锁情况（相对箭头或四方向互相牵制死锁）
 * 3. 箭头占据区域不能超过界面区域
 */
export class LevelGenerator {
    private rows: number;
    private cols: number;
    private occupiedGrid: boolean[][];

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.occupiedGrid = Array(rows)
            .fill(null)
            .map(() => Array(cols).fill(false));
    }

    /**
     * 生成关卡数据
     */
    generate(levelId: number, arrowCount: number = 3): LevelConfig {
        this.resetGrid();
        const elements: ElementData[] = [];

        for (let i = 0; i < arrowCount; i++) {
            const arrow = this.generateArrow(`arrow-${i + 1}`);
            if (arrow) {
                elements.push(arrow);
                this.markOccupied(arrow);
            }
        }

        // 检查并修复死锁
        this.resolveDeadlocks(elements);

        return {
            id: levelId,
            rows: this.rows,
            cols: this.cols,
            elements,
        };
    }

    /**
     * 重置网格占用状态
     */
    private resetGrid(): void {
        this.occupiedGrid = Array(this.rows)
            .fill(null)
            .map(() => Array(this.cols).fill(false));
    }

    /**
     * 生成单个箭头
     */
    private generateArrow(id: string): ElementData | null {
        const maxAttempts = 100;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const direction = this.getRandomDirection();
            const { width, height } = this.getArrowDimensions(direction);
            const position = this.getRandomPosition(width, height);

            const arrow: ElementData = {
                id,
                type: 'arrow',
                direction,
                width,
                height,
                position,
            };

            if (this.isValidPosition(arrow)) {
                return arrow;
            }
            attempts++;
        }

        return null;
    }

    /**
     * 获取随机方向
     */
    private getRandomDirection(): ArrowDirection {
        const directions = Object.values(ArrowDirection);
        return directions[Math.floor(Math.random() * directions.length)];
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
     * 获取随机位置
     */
    private getRandomPosition(width: number = 2, height: number = 1): Position {
        return {
            x: Math.floor(Math.random() * (this.cols - width + 1)), // 确保箭头不超出边界
            y: Math.floor(Math.random() * (this.rows - height + 1)), // 确保箭头不超出边界
        };
    }

    /**
     * 验证位置是否有效（规则1：不重叠，规则3：不超出界面区域）
     */
    private isValidPosition(arrow: ElementData): boolean {
        const { position, width, height } = arrow;
        const { x, y } = position;

        // 规则3：检查箭头占据区域不能超过界面区域
        if (!this.isWithinBoundary(x, y, width, height)) {
            return false;
        }

        // 规则1：检查占用情况（箭头不能重叠）
        for (let row = y; row < y + height; row++) {
            for (let col = x; col < x + width; col++) {
                if (this.occupiedGrid[row][col]) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 检查箭头是否在界面边界内（规则3：箭头占据区域不能超过界面区域）
     */
    private isWithinBoundary(x: number, y: number, width: number, height: number): boolean {
        // 检查左上角和右下角都在有效范围内
        return (
            x >= 0 && // 左边界
            y >= 0 && // 上边界
            x + width <= this.cols && // 右边界
            y + height <= this.rows // 下边界
        );
    }

    /**
     * 标记网格为已占用
     */
    private markOccupied(arrow: ElementData): void {
        const { position, width, height } = arrow;
        const { x, y } = position;

        for (let row = y; row < y + height; row++) {
            for (let col = x; col < x + width; col++) {
                this.occupiedGrid[row][col] = true;
            }
        }
    }

    /**
     * 检测并解决死锁问题
     */
    private resolveDeadlocks(elements: ElementData[]): void {
        const deadlockPairs = this.detectDeadlocks(elements);

        // 移动冲突的箭头到新位置
        deadlockPairs.forEach(pair => {
            const [arrow1, arrow2] = pair;

            // 选择其中一个箭头重新定位
            const arrowToMove = Math.random() < 0.5 ? arrow1 : arrow2;
            this.clearOccupied(arrowToMove);

            const newPosition = this.findSafePosition(arrowToMove);
            if (newPosition) {
                arrowToMove.position = newPosition;
                this.markOccupied(arrowToMove);
            }
        });
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

    /**
     * 清除箭头占用的网格
     */
    private clearOccupied(arrow: ElementData): void {
        const { position, width, height } = arrow;
        const { x, y } = position;

        for (let row = y; row < y + height; row++) {
            for (let col = x; col < x + width; col++) {
                this.occupiedGrid[row][col] = false;
            }
        }
    }

    /**
     * 为箭头寻找安全位置（遵循所有生成规则）
     */
    private findSafePosition(arrow: ElementData): Position | null {
        const maxAttempts = 50;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const position = this.getRandomPosition(arrow.width, arrow.height);
            const testArrow = { ...arrow, position };

            // 验证位置是否满足所有规则（边界检查 + 不重叠）
            if (this.isValidPosition(testArrow)) {
                return position;
            }
            attempts++;
        }

        return null;
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
