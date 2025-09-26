// EditorGameView.ts - 编辑器专用的游戏视图类

import { GridData, GridConfig, LevelConfig, ElementData } from '@/types';
import EditorArrow from './element/EditorArrow';
import GameView from './GameView';

// 编辑器专用的GameView接口，只包含Arrow需要的属性
interface EditorGameViewInterface {
    gridSize: number;
    _gridConfig: GridConfig;
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
