// EditorGameView.ts - 编辑器专用的游戏视图类

import { GridData, GridConfig, LevelConfig, ElementData } from '@/types';
import EditorArrow from './element/EditorArrow';
import GameView from './GameView';
import { wouldCauseDeadlock } from '@/utils/DeadlockChecker';

// 编辑器专用的GameView接口，只包含Arrow需要的属性
interface EditorGameViewInterface {
    gridSize: number;
    _gridConfig: GridConfig;
}

// 位置坐标
interface Position {
    x: number;
    y: number;
}

// 网格单元类型
type GridCell = string | null;

// 二维网格类型
type Grid = GridCell[][];

// 箭头信息
interface ArrowInfo {
    id: string;
    cells: Position[];
    layout: 'horizontal' | 'vertical';
}

// 编辑器游戏界面视图相关对象
class EditorGameView implements EditorGameViewInterface {
    // 元素列表
    _elementList: EditorArrow[] = [];

    // 网格数据
    _gridData: GridData = [];

    // 网格固定配置
    _gridConfig: GridConfig = {
        rows: 10,
        cols: 10,
    };

    // 网格自适应参数
    _gridSize: number = 40; // 单个格子大小，单位px

    _viewDom: HTMLElement | null = null;

    // 编辑器模式
    _editMode: 'normal' | 'delete' = 'normal';

    // 当前拖拽的元素类型
    _draggingElementType: string | null = null;

    // 网格状态（用于智能填充）
    private _grid: Grid = [];
    private _centerX: number = 0;
    private _centerY: number = 0;
    private _lastPlacedLayout: 'horizontal' | 'vertical' | null = null;
    private _lastPlacedDirection: string | null = null;

    constructor() {}

    // 销毁所有元素
    destroy = () => {
        // 销毁所有元素
        this._elementList.forEach(element => {
            element.destroy();
        });

        // 清空元素列表
        this._elementList = [];

        // 清空网格数据
        this._gridData = [];
    };

    // 初始化数据
    init = (gridSize: number, config: LevelConfig) => {
        this.destroy();

        this._gridSize = gridSize;
        const { rows, cols, elements } = config;
        this._gridConfig = { rows, cols };
        this._initElements(elements);
    };

    // 初始化元素
    _initElements = (elementData: ElementData[]) => {
        elementData.forEach(itemData => {
            const newElement = new EditorArrow(
                {
                    ...itemData,
                },
                this as unknown as GameView,
            );
            newElement.addToGrid(this._viewDom as HTMLElement);
            this._elementList.push(newElement);
        });
        this.updateGridData();
    };

    // 初始化视图Dom
    initViewDom = (element: HTMLElement) => {
        this._viewDom = element;
    };

    // 设置编辑模式
    setEditMode = (mode: 'normal' | 'delete') => {
        this._editMode = mode;
        this._updateElementInteractions();
    };

    // 更新元素交互状态
    _updateElementInteractions = () => {
        this._elementList.forEach(element => {
            if (this._editMode === 'delete') {
                element._elementDom?.classList.add('delete-mode');
            } else {
                element._elementDom?.classList.remove('delete-mode');
            }
        });
    };

    // 添加新元素
    addElement = (elementData: ElementData) => {
        const newElement = new EditorArrow(elementData, this as unknown as GameView);
        newElement.addToGrid(this._viewDom as HTMLElement);
        this._elementList.push(newElement);
        this.updateGridData();
        this._updateElementInteractions();
        return newElement;
    };

    // 删除元素
    removeElement = (elementId: string) => {
        const elementIndex = this._elementList.findIndex(e => e._id === elementId);
        if (elementIndex !== -1) {
            const element = this._elementList[elementIndex];
            element.destroy();
            this._elementList.splice(elementIndex, 1);
            this.updateGridData();
        }
    };

    // 处理画布点击
    handleCanvasClick = (event: MouseEvent) => {
        if (this._editMode === 'delete') {
            // 删除模式下，点击元素会删除它
            const target = event.target as HTMLElement;
            const element = this._elementList.find(e => e._elementDom === target || e._elementDom?.contains(target));
            if (element) {
                this.removeElement(element._id);
            }
        }
    };

    // 处理画布拖拽
    handleCanvasDragOver = (event: DragEvent) => {
        event.preventDefault();
    };

    // 处理画布放置
    handleCanvasDrop = (event: DragEvent) => {
        event.preventDefault();

        if (this._draggingElementType) {
            const rect = this._viewDom?.getBoundingClientRect();
            if (!rect) return;

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // 计算网格位置
            const gridX = Math.floor(x / this._gridSize);
            const gridY = Math.floor(y / this._gridSize);

            // 确保在网格范围内
            if (gridX >= 0 && gridX < this._gridConfig.cols && gridY >= 0 && gridY < this._gridConfig.rows) {
                const elementId = `arrow-${Date.now()}`;
                const elementData: ElementData = {
                    id: elementId,
                    type: 'arrow',
                    direction: this._draggingElementType,
                    width: this._draggingElementType === 'left' || this._draggingElementType === 'right' ? 2 : 1,
                    height: this._draggingElementType === 'up' || this._draggingElementType === 'down' ? 2 : 1,
                    position: { x: gridX, y: gridY },
                };

                this.addElement(elementData);
            }
        }
    };

    // 设置拖拽元素类型
    setDraggingElementType = (type: string | null) => {
        this._draggingElementType = type;
    };

    /**
     * @description 更新网格数据
     */
    updateGridData = () => {
        // 初始化网格数据为二维数组，默认填充0
        const gridArray: (string | number)[][] = Array(this._gridConfig.rows)
            .fill(null)
            .map(() => Array(this._gridConfig.cols).fill(0));

        // 遍历所有元素，在元素占用的网格位置设置元素id
        this._elementList.forEach(element => {
            const gridRange = element.getGridRange();
            if (!gridRange) {
                return;
            }
            const { minX, maxX, minY, maxY } = gridRange;

            if (minX === maxX) {
                for (let row = minY; row <= maxY; row++) {
                    gridArray[row][minX] = element._id;
                }
            } else {
                for (let col = minX; col <= maxX; col++) {
                    gridArray[minY][col] = element._id;
                }
            }
        });
        // 将二维数组转换为GridData数组格式
        this._gridData = gridArray as GridData;
    };

    // 填充箭头元素 - 1:1参考LevelGenerator的supplementArrows方法
    fillArrows = (count: number) => {
        // 获取当前所有元素的数据
        const currentElements = this._elementList.map(element => ({
            id: element._id,
            type: element._type,
            direction: element._direction,
            width: element._width,
            height: element._height,
            position: element._position,
        }));

        // 初始化网格状态
        this._initializeGrid();

        // 使用supplementArrows算法
        const targetCount = currentElements.length + count;
        const newElements = this._supplementArrows(currentElements, targetCount);

        // 找出新增的元素
        const existingIds = new Set(currentElements.map(el => el.id));
        const addedElementsData = newElements.filter(el => !existingIds.has(el.id));

        // 创建新的EditorArrow元素
        const addedElements: EditorArrow[] = [];
        for (const elementData of addedElementsData) {
            const newElement = new EditorArrow(elementData, this as unknown as GameView);
            newElement.addToGrid(this._viewDom as HTMLElement);
            this._elementList.push(newElement);
            addedElements.push(newElement);
        }

        this.updateGridData();
        this._updateElementInteractions();
        return addedElements;
    };

    // 寻找空位置
    _findEmptyPosition = (): { x: number; y: number } | null => {
        const maxAttempts = this._gridConfig.rows * this._gridConfig.cols;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this._gridConfig.cols);
            const y = Math.floor(Math.random() * this._gridConfig.rows);

            // 检查位置是否被占用
            const isOccupied = this._elementList.some(element => {
                const gridRange = element.getGridRange();
                if (!gridRange) return false;

                const { minX, maxX, minY, maxY } = gridRange;
                return x >= minX && x <= maxX && y >= minY && y <= maxY;
            });

            if (!isOccupied) {
                return { x, y };
            }

            attempts++;
        }

        return null; // 没有找到空位置
    };

    // 初始化网格状态
    private _initializeGrid = () => {
        this._grid = Array(this._gridConfig.rows)
            .fill(null)
            .map(() => Array(this._gridConfig.cols).fill(null));

        this._centerX = Math.floor(this._gridConfig.cols / 2);
        this._centerY = Math.floor(this._gridConfig.rows / 2);
    };

    // 1:1参考LevelGenerator的supplementArrows方法
    private _supplementArrows = (existingElements: ElementData[], targetCount: number): ElementData[] => {
        const elements = [...existingElements];
        let placedCount = elements.length;
        let radius = 0;
        let nextArrowId = elements.length + 1;

        // 重新构建网格状态，标记已占用的位置
        this._rebuildGridFromElements(elements);

        while (placedCount < targetCount && radius < Math.max(this._gridConfig.rows, this._gridConfig.cols)) {
            if (radius === 0) {
                // 检查中心点
                const arrowInfo = this._tryPlaceArrowAt(this._centerX, this._centerY, `arrow-${nextArrowId}`);
                if (arrowInfo) {
                    const element = this._createElementFromArrowInfo(arrowInfo);
                    if (!wouldCauseDeadlock(element, elements)) {
                        elements.push(element);
                        placedCount++;
                        nextArrowId++;
                    } else {
                        // 如果会造成死锁，需要从网格中移除
                        this._removeArrowFromGrid(arrowInfo);
                    }
                }
            } else {
                // 在当前半径查找空位置
                const radiusPositions = this._getPositionsAtRadius(radius);

                for (const pos of radiusPositions) {
                    if (placedCount >= targetCount) break;

                    const arrowInfo = this._tryPlaceArrowAt(pos.x, pos.y, `arrow-${nextArrowId}`);
                    if (arrowInfo) {
                        const element = this._createElementFromArrowInfo(arrowInfo);
                        if (!wouldCauseDeadlock(element, elements)) {
                            elements.push(element);
                            placedCount++;
                            nextArrowId++;
                        } else {
                            // 如果会造成死锁，需要从网格中移除
                            this._removeArrowFromGrid(arrowInfo);
                        }
                    }
                }
            }

            radius++;
        }

        console.log(`补充填充完成，最终箭头数量: ${elements.length}/${targetCount}`);
        return elements;
    };

    // 根据现有元素重新构建网格状态
    private _rebuildGridFromElements = (elements: ElementData[]): void => {
        // 先清空网格（但不重置 lastPlacedLayout）
        this._grid = Array(this._gridConfig.rows)
            .fill(null)
            .map(() => Array(this._gridConfig.cols).fill(null));

        // 从现有元素中恢复最后的布局和方向状态
        if (elements.length > 0) {
            const lastElement = elements[elements.length - 1];
            this._lastPlacedLayout = lastElement.width === 2 ? 'horizontal' : 'vertical';
            this._lastPlacedDirection = lastElement.direction;
        }

        // 重新标记所有现有元素占用的网格位置
        for (const element of elements) {
            const { x, y } = element.position;
            const width = element.width;
            const height = element.height;

            for (let dy = 0; dy < height; dy++) {
                for (let dx = 0; dx < width; dx++) {
                    const gridX = x + dx;
                    const gridY = y + dy;
                    if (this._isWithinBounds(gridX, gridY)) {
                        this._grid[gridY][gridX] = element.id;
                    }
                }
            }
        }
    };

    // 获取指定半径上的所有可能位置（正方形外扩）
    private _getPositionsAtRadius = (radius: number): Position[] => {
        const positions: Position[] = [];

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                // 只取正方形边界上的点
                if (Math.max(Math.abs(dx), Math.abs(dy)) === radius) {
                    const x = this._centerX + dx;
                    const y = this._centerY + dy;

                    if (this._isWithinBounds(x, y)) {
                        positions.push({ x, y });
                    }
                }
            }
        }

        return positions;
    };

    // 检查坐标是否在边界内
    private _isWithinBounds = (x: number, y: number): boolean => {
        return x >= 0 && x < this._gridConfig.cols && y >= 0 && y < this._gridConfig.rows;
    };

    // 尝试在指定位置放置箭头
    private _tryPlaceArrowAt = (x: number, y: number, arrowId: string): ArrowInfo | null => {
        // 根据上一个放置的箭头布局决定优先方向
        let tryHorizontalFirst: boolean;

        if (this._lastPlacedLayout === null) {
            // 第一个箭头随机选择
            tryHorizontalFirst = Math.random() < 0.5;
        } else if (this._lastPlacedLayout === 'horizontal') {
            // 如果上一个是水平的，优先尝试垂直
            tryHorizontalFirst = false;
        } else {
            // 如果上一个是垂直的，优先尝试水平
            tryHorizontalFirst = true;
        }

        // 尝试水平布局
        if (tryHorizontalFirst) {
            const horizontalInfo = this._tryHorizontalLayout(x, y, arrowId);
            if (horizontalInfo) {
                this._lastPlacedLayout = 'horizontal';
                return horizontalInfo;
            }
        }

        // 尝试垂直布局
        const verticalInfo = this._tryVerticalLayout(x, y, arrowId);
        if (verticalInfo) {
            this._lastPlacedLayout = 'vertical';
            return verticalInfo;
        }

        // 如果垂直布局也失败，再尝试水平布局
        if (!tryHorizontalFirst) {
            const horizontalInfo = this._tryHorizontalLayout(x, y, arrowId);
            if (horizontalInfo) {
                this._lastPlacedLayout = 'horizontal';
                return horizontalInfo;
            }
        }

        return null;
    };

    // 尝试水平布局
    private _tryHorizontalLayout = (x: number, y: number, arrowId: string): ArrowInfo | null => {
        // 检查是否有足够的空间放置2格宽的箭头
        if (x + 1 >= this._gridConfig.cols) return null;

        // 检查两个格子是否都被占用
        if (this._grid[y][x] !== null || this._grid[y][x + 1] !== null) return null;

        // 标记网格
        this._grid[y][x] = arrowId;
        this._grid[y][x + 1] = arrowId;

        return {
            id: arrowId,
            cells: [
                { x, y },
                { x: x + 1, y },
            ],
            layout: 'horizontal',
        };
    };

    // 尝试垂直布局
    private _tryVerticalLayout = (x: number, y: number, arrowId: string): ArrowInfo | null => {
        // 检查是否有足够的空间放置2格高的箭头
        if (y + 1 >= this._gridConfig.rows) return null;

        // 检查两个格子是否都被占用
        if (this._grid[y][x] !== null || this._grid[y + 1][x] !== null) return null;

        // 标记网格
        this._grid[y][x] = arrowId;
        this._grid[y + 1][x] = arrowId;

        return {
            id: arrowId,
            cells: [
                { x, y },
                { x, y: y + 1 },
            ],
            layout: 'vertical',
        };
    };

    // 从 ArrowInfo 创建 ElementData
    private _createElementFromArrowInfo = (arrowInfo: ArrowInfo): ElementData => {
        const direction = this._getDirectionForLayout(arrowInfo.layout);
        const { width, height } = this._getArrowDimensions(direction);

        // 更新最后放置的方向记录
        this._lastPlacedDirection = direction;

        return {
            id: arrowInfo.id,
            type: 'arrow',
            direction,
            width,
            height,
            position: { x: arrowInfo.cells[0].x, y: arrowInfo.cells[0].y },
        };
    };

    // 从网格中移除箭头
    private _removeArrowFromGrid = (arrowInfo: ArrowInfo): void => {
        for (const cell of arrowInfo.cells) {
            if (this._isWithinBounds(cell.x, cell.y)) {
                this._grid[cell.y][cell.x] = null;
            }
        }
    };

    // 根据布局模式智能获取方向，避免连续相同方向
    private _getDirectionForLayout = (layout: 'horizontal' | 'vertical'): string => {
        const horizontalDirections = ['left', 'right'];
        const verticalDirections = ['up', 'down'];

        if (layout === 'horizontal') {
            // 避免连续相同方向
            if (this._lastPlacedDirection === 'left') {
                return Math.random() < 0.7 ? 'right' : 'left';
            } else if (this._lastPlacedDirection === 'right') {
                return Math.random() < 0.7 ? 'left' : 'right';
            }
            return horizontalDirections[Math.floor(Math.random() * horizontalDirections.length)];
        } else {
            // 避免连续相同方向
            if (this._lastPlacedDirection === 'up') {
                return Math.random() < 0.7 ? 'down' : 'up';
            } else if (this._lastPlacedDirection === 'down') {
                return Math.random() < 0.7 ? 'up' : 'down';
            }
            return verticalDirections[Math.floor(Math.random() * verticalDirections.length)];
        }
    };

    // 获取箭头尺寸
    private _getArrowDimensions = (direction: string): { width: number; height: number } => {
        if (direction === 'left' || direction === 'right') {
            return { width: 2, height: 1 };
        } else {
            return { width: 1, height: 2 };
        }
    };

    // 获取当前关卡数据
    getLevelData = (): LevelConfig => {
        return {
            id: Date.now(),
            rows: this._gridConfig.rows,
            cols: this._gridConfig.cols,
            elements: this._elementList.map(element => ({
                id: element._id,
                type: element._type,
                direction: element._direction,
                width: element._width,
                height: element._height,
                position: element._position,
            })),
        };
    };

    // #region 属性获取
    get gridSize() {
        return this._gridSize;
    }

    get gridConfig() {
        return this._gridConfig;
    }

    get elementList() {
        return this._elementList;
    }
    // #endregion
}

export default EditorGameView;
