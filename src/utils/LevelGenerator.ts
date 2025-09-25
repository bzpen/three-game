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

        // 第二阶段：从中心开始分配方向，内置死锁检测和解决
        const elements = this.assignDirections(arrowInfos);

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
     * 第二阶段：从中心开始分配方向，考虑死锁问题
     */
    private assignDirections(arrowInfos: ArrowInfo[]): ElementData[] {
        // 按距离中心的距离排序，从中心开始处理
        const sortedArrowInfos = this.sortArrowsByDistanceFromCenter(arrowInfos);
        const elements: ElementData[] = [];

        for (const arrowInfo of sortedArrowInfos) {
            const element = this.assignDirectionWithDeadlockCheck(arrowInfo, elements);
            if (element) {
                elements.push(element);
            }
            // 如果element为null，说明无法找到合适的方向，箭头被删除
        }

        return elements;
    }

    /**
     * 按距离中心的距离排序箭头
     */
    private sortArrowsByDistanceFromCenter(arrowInfos: ArrowInfo[]): ArrowInfo[] {
        return arrowInfos.sort((a, b) => {
            const distA = this.getDistanceFromCenter(a.cells[0]);
            const distB = this.getDistanceFromCenter(b.cells[0]);
            return distA - distB;
        });
    }

    /**
     * 计算位置距离中心的曼哈顿距离
     */
    private getDistanceFromCenter(position: Position): number {
        return Math.abs(position.x - this.centerX) + Math.abs(position.y - this.centerY);
    }

    /**
     * 为单个箭头分配方向，考虑死锁检测
     */
    private assignDirectionWithDeadlockCheck(
        arrowInfo: ArrowInfo,
        existingElements: ElementData[],
    ): ElementData | null {
        const possibleDirections = this.getPossibleDirections(arrowInfo.layout);

        // 优先尝试随机方向，降低死锁检测的影响
        const shuffledDirections = this.shuffleArray([...possibleDirections]);

        // 先尝试第一个随机方向，如果没有严重死锁就使用
        for (const direction of shuffledDirections) {
            const element = this.createElementWithDirection(arrowInfo, direction);

            // 只检查真正严重的死锁（面对面的相反方向）
            if (!this.wouldCauseSeriousDeadlock(element, existingElements)) {
                return element;
            }
        }

        // 如果所有方向都会导致严重死锁，尝试探索其他位置
        return this.exploreAlternativePositions(arrowInfo, existingElements);
    }

    /**
     * 获取布局对应的可能方向
     */
    private getPossibleDirections(layout: 'horizontal' | 'vertical'): ArrowDirection[] {
        if (layout === 'horizontal') {
            return [ArrowDirection.LEFT, ArrowDirection.RIGHT];
        } else {
            return [ArrowDirection.UP, ArrowDirection.DOWN];
        }
    }

    /**
     * 洗牌数组
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 创建带有指定方向的元素
     */
    private createElementWithDirection(arrowInfo: ArrowInfo, direction: ArrowDirection): ElementData {
        const { width, height } = this.getArrowDimensions(direction);
        return {
            id: arrowInfo.id,
            type: 'arrow',
            direction,
            width,
            height,
            position: arrowInfo.cells[0], // 使用第一个格子作为位置
        };
    }

    /**
     * 检查新元素是否会与现有元素产生死锁（保留兼容性）
     */
    private wouldCauseDeadlock(newElement: ElementData, existingElements: ElementData[]): boolean {
        for (const existingElement of existingElements) {
            if (this.isDeadlock(newElement, existingElement)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查新元素是否会与现有元素产生严重死锁（更宽松的检测）
     */
    private wouldCauseSeriousDeadlock(newElement: ElementData, existingElements: ElementData[]): boolean {
        for (const existingElement of existingElements) {
            if (this.isSeriousDeadlock(newElement, existingElement)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 判断是否为严重死锁（只检测真正面对面的情况）
     */
    private isSeriousDeadlock(arrow1: ElementData, arrow2: ElementData): boolean {
        // 必须是相反方向
        if (!this.isOpposingArrows(arrow1, arrow2)) {
            return false;
        }

        const pos1 = arrow1.position;
        const pos2 = arrow2.position;

        // 检查垂直方向的严重死锁
        if (
            (arrow1.direction === ArrowDirection.UP && arrow2.direction === ArrowDirection.DOWN) ||
            (arrow1.direction === ArrowDirection.DOWN && arrow2.direction === ArrowDirection.UP)
        ) {
            // 必须在完全相同的列且距离很近
            if (pos1.x === pos2.x) {
                const distance = Math.abs(pos1.y - pos2.y);
                return distance <= 3; // 只有很近的才算严重死锁
            }
        }

        // 检查水平方向的严重死锁
        if (
            (arrow1.direction === ArrowDirection.LEFT && arrow2.direction === ArrowDirection.RIGHT) ||
            (arrow1.direction === ArrowDirection.RIGHT && arrow2.direction === ArrowDirection.LEFT)
        ) {
            // 必须在完全相同的行且距离很近
            if (pos1.y === pos2.y) {
                const distance = Math.abs(pos1.x - pos2.x);
                return distance <= 3; // 只有很近的才算严重死锁
            }
        }

        return false;
    }

    /**
     * 根据布局模式获取方向（保留原方法作为备用）
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
     * 探索其他位置的箭头放置方案
     */
    private exploreAlternativePositions(arrowInfo: ArrowInfo, existingElements: ElementData[]): ElementData | null {
        // 1. 尝试调整起始方块的其他方向
        const alternativeStartPositions = this.getAlternativeStartPositions(arrowInfo);

        for (const altArrowInfo of alternativeStartPositions) {
            const possibleDirections = this.getPossibleDirections(altArrowInfo.layout);
            const shuffledDirections = this.shuffleArray([...possibleDirections]);

            for (const direction of shuffledDirections) {
                const element = this.createElementWithDirection(altArrowInfo, direction);
                if (!this.wouldCauseDeadlock(element, existingElements)) {
                    return element;
                }
            }
        }

        // 2. 尝试切换终点方块
        const alternativeEndPositions = this.getAlternativeEndPositions(arrowInfo);

        for (const altArrowInfo of alternativeEndPositions) {
            const possibleDirections = this.getPossibleDirections(altArrowInfo.layout);
            const shuffledDirections = this.shuffleArray([...possibleDirections]);

            for (const direction of shuffledDirections) {
                const element = this.createElementWithDirection(altArrowInfo, direction);
                if (!this.wouldCauseDeadlock(element, existingElements)) {
                    return element;
                }
            }
        }

        // 3. 如果所有探索都失败，返回null，箭头将被删除
        return null;
    }

    /**
     * 获取起始方块的其他方向选项
     */
    private getAlternativeStartPositions(arrowInfo: ArrowInfo): ArrowInfo[] {
        const alternatives: ArrowInfo[] = [];
        const startPos = arrowInfo.cells[0];

        // 先清空原箭头占用的位置
        this.clearArrowCells(arrowInfo);

        // 如果原来是水平布局，尝试以起始点为基础的垂直布局
        if (arrowInfo.layout === 'horizontal') {
            // 向上延伸
            if (startPos.y > 0 && this.canPlaceVertical(startPos.x, startPos.y - 1)) {
                alternatives.push({
                    id: arrowInfo.id,
                    cells: [
                        { x: startPos.x, y: startPos.y - 1 },
                        { x: startPos.x, y: startPos.y },
                    ],
                    layout: 'vertical',
                });
            }
            // 原位置向下延伸
            if (this.canPlaceVertical(startPos.x, startPos.y)) {
                alternatives.push({
                    id: arrowInfo.id,
                    cells: [
                        { x: startPos.x, y: startPos.y },
                        { x: startPos.x, y: startPos.y + 1 },
                    ],
                    layout: 'vertical',
                });
            }
        }

        // 如果原来是垂直布局，尝试以起始点为基础的水平布局
        if (arrowInfo.layout === 'vertical') {
            // 向左延伸
            if (startPos.x > 0 && this.canPlaceHorizontal(startPos.x - 1, startPos.y)) {
                alternatives.push({
                    id: arrowInfo.id,
                    cells: [
                        { x: startPos.x - 1, y: startPos.y },
                        { x: startPos.x, y: startPos.y },
                    ],
                    layout: 'horizontal',
                });
            }
            // 原位置向右延伸
            if (this.canPlaceHorizontal(startPos.x, startPos.y)) {
                alternatives.push({
                    id: arrowInfo.id,
                    cells: [
                        { x: startPos.x, y: startPos.y },
                        { x: startPos.x + 1, y: startPos.y },
                    ],
                    layout: 'horizontal',
                });
            }
        }

        // 恢复原箭头占用的位置
        this.restoreArrowCells(arrowInfo);

        return alternatives;
    }

    /**
     * 获取终点方块的其他方向选项
     */
    private getAlternativeEndPositions(arrowInfo: ArrowInfo): ArrowInfo[] {
        const alternatives: ArrowInfo[] = [];
        const endPos = arrowInfo.cells[1]; // 终点位置

        // 先清空原箭头占用的位置
        this.clearArrowCells(arrowInfo);

        // 如果原来是水平布局，尝试以终点为基础的垂直布局
        if (arrowInfo.layout === 'horizontal') {
            // 向上延伸
            if (endPos.y > 0 && this.canPlaceVertical(endPos.x, endPos.y - 1)) {
                alternatives.push({
                    id: arrowInfo.id,
                    cells: [
                        { x: endPos.x, y: endPos.y - 1 },
                        { x: endPos.x, y: endPos.y },
                    ],
                    layout: 'vertical',
                });
            }
            // 向下延伸
            if (this.canPlaceVertical(endPos.x, endPos.y)) {
                alternatives.push({
                    id: arrowInfo.id,
                    cells: [
                        { x: endPos.x, y: endPos.y },
                        { x: endPos.x, y: endPos.y + 1 },
                    ],
                    layout: 'vertical',
                });
            }
        }

        // 如果原来是垂直布局，尝试以终点为基础的水平布局
        if (arrowInfo.layout === 'vertical') {
            // 向左延伸
            if (endPos.x > 0 && this.canPlaceHorizontal(endPos.x - 1, endPos.y)) {
                alternatives.push({
                    id: arrowInfo.id,
                    cells: [
                        { x: endPos.x - 1, y: endPos.y },
                        { x: endPos.x, y: endPos.y },
                    ],
                    layout: 'horizontal',
                });
            }
            // 向右延伸
            if (this.canPlaceHorizontal(endPos.x, endPos.y)) {
                alternatives.push({
                    id: arrowInfo.id,
                    cells: [
                        { x: endPos.x, y: endPos.y },
                        { x: endPos.x + 1, y: endPos.y },
                    ],
                    layout: 'horizontal',
                });
            }
        }

        // 恢复原箭头占用的位置
        this.restoreArrowCells(arrowInfo);

        return alternatives;
    }

    /**
     * 清空箭头占用的网格位置
     */
    private clearArrowCells(arrowInfo: ArrowInfo): void {
        for (const cell of arrowInfo.cells) {
            if (this.isWithinBounds(cell.x, cell.y)) {
                this.grid[cell.y][cell.x] = null;
            }
        }
    }

    /**
     * 恢复箭头占用的网格位置
     */
    private restoreArrowCells(arrowInfo: ArrowInfo): void {
        for (const cell of arrowInfo.cells) {
            if (this.isWithinBounds(cell.x, cell.y)) {
                this.grid[cell.y][cell.x] = arrowInfo.id;
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
     * 判断两个箭头是否形成真正的死锁
     */
    private isDeadlock(arrow1: ElementData, arrow2: ElementData): boolean {
        // 只有相对方向且面对面的箭头才算死锁
        if (this.isOpposingArrows(arrow1, arrow2)) {
            return this.areArrowsAligned(arrow1, arrow2);
        }

        // 同方向的箭头不算死锁，允许并存
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
     * 判断两个箭头是否面对面且会发生死锁
     */
    private areArrowsAligned(arrow1: ElementData, arrow2: ElementData): boolean {
        const pos1 = arrow1.position;
        const pos2 = arrow2.position;

        // 检查垂直方向的面对面死锁
        if (
            (arrow1.direction === ArrowDirection.UP && arrow2.direction === ArrowDirection.DOWN) ||
            (arrow1.direction === ArrowDirection.DOWN && arrow2.direction === ArrowDirection.UP)
        ) {
            // 必须在同一列或相邻列，且箭头之间有重叠区域
            if (Math.abs(pos1.x - pos2.x) <= 1) {
                // 检查垂直距离，确保箭头面对面
                const distance = Math.abs(pos1.y - pos2.y);
                const totalHeight = arrow1.height + arrow2.height;
                return distance <= totalHeight;
            }
        }

        // 检查水平方向的面对面死锁
        if (
            (arrow1.direction === ArrowDirection.LEFT && arrow2.direction === ArrowDirection.RIGHT) ||
            (arrow1.direction === ArrowDirection.RIGHT && arrow2.direction === ArrowDirection.LEFT)
        ) {
            // 必须在同一行或相邻行，且箭头之间有重叠区域
            if (Math.abs(pos1.y - pos2.y) <= 1) {
                // 检查水平距离，确保箭头面对面
                const distance = Math.abs(pos1.x - pos2.x);
                const totalWidth = arrow1.width + arrow2.width;
                return distance <= totalWidth;
            }
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
