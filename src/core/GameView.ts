// GameView.ts

import StaticElement from '@/core/element/StaticElement';
import { GridData, GridConfig, LevelConfig, ElementData } from '@/types';
import Arrow from './element/Arrow';

// 游戏界面视图相关对象
class GameView {
    // 元素列表
    _elementList: StaticElement[] = [];

    // 网格数据
    _gridData: GridData[] = [];

    // 网格固定配置
    _gridConfig: GridConfig = {
        rows: 10,
        cols: 10,
    };

    // 网格自适应参数
    _gridSize: number = 40; // 单个格子大小，单位px

    _viewDom: HTMLElement | null = null;

    constructor() {}

    // 初始化数据
    init = (gridSize: number, config: LevelConfig) => {
        this._gridSize = gridSize;
        const { rows, cols, elements } = config;
        this._gridConfig = { rows, cols };
        this._initElements(elements);
    };

    // 初始化元素
    _initElements = (elementData: ElementData[]) => {
        elementData.forEach(itemData => {
            const newElement = new Arrow(
                {
                    ...itemData,
                },
                this,
            );
            newElement.addToGrid(this._viewDom as HTMLElement);
            this._elementList.push(newElement);
        });
    };

    // 初始化视图
    initView = (element: HTMLElement) => {
        this._viewDom = element;
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
            const { x, y } = element._position;
            const width = element._width;
            const height = element._height;

            // 计算元素在网格中的起始位置
            const gridX = Math.floor(x / this._gridSize);
            const gridY = Math.floor(y / this._gridSize);

            // 计算元素占用的网格范围
            const gridWidth = Math.ceil(width / this._gridSize);
            const gridHeight = Math.ceil(height / this._gridSize);

            // 在元素占用的所有网格位置设置元素id
            for (let row = gridY; row < gridY + gridHeight && row < this._gridConfig.rows; row++) {
                for (let col = gridX; col < gridX + gridWidth && col < this._gridConfig.cols; col++) {
                    if (row >= 0 && col >= 0) {
                        gridArray[row][col] = element._id;
                    }
                }
            }
        });

        // 将二维数组转换为GridData数组格式
        this._gridData = [];
        for (let row = 0; row < this._gridConfig.rows; row++) {
            for (let col = 0; col < this._gridConfig.cols; col++) {
                this._gridData.push({
                    x: col,
                    y: row,
                    elementType: gridArray[row][col].toString(),
                });
            }
        }
    };

    // #region 熟悉获取 设置
    get gridSize() {
        return this._gridSize;
    }
    // #endregion
}

export default GameView;
