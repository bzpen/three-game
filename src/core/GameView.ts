// GameView.ts

import StaticElement from '@/core/element/StaticElement';
import { GridData, GridConfig, LevelConfig, ElementData } from '@/types';
import Arrow from './element/Arrow';

// 游戏界面视图相关对象
class GameView {
    // 元素列表
    _elementList: StaticElement[] = [];

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
            const newElement = new Arrow(
                {
                    ...itemData,
                },
                this,
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

    /**
     * @description 判断运动中的元素状态
     */
    checkInAnimeElementStatus = (element: StaticElement) => {
        // 获取元素占用的网格范围
        const gridRange = element.getGridRange();
        if (!gridRange) {
            return false;
        }

        let isColliding = false;
        const collidedElementId = new Set<string>();

        const { minX, maxX, minY, maxY } = gridRange;

        if (minX === maxX) {
            for (let row = minY; row <= maxY; row++) {
                if (
                    this._gridData[row][minX] &&
                    this._gridData[row][minX] !== 0 &&
                    this._gridData[row][minX] !== element._id
                ) {
                    isColliding = true;
                    collidedElementId.add(this._gridData[row][minX] as string);
                }
            }
        } else {
            for (let col = minX; col <= maxX; col++) {
                if (
                    this._gridData[minY][col] &&
                    this._gridData[minY][col] !== 0 &&
                    this._gridData[minY][col] !== element._id
                ) {
                    isColliding = true;
                    collidedElementId.add(this._gridData[minY][col] as string);
                    break;
                }
            }
        }

        if (isColliding && collidedElementId.size > 0) {
            collidedElementId.forEach(id => {
                const element = this._elementList.find(e => e._id === id);
                if (element) {
                    element.stopMove();
                }
            });
            element.stopMove();
        }

        return isColliding;
    };

    checkOutOfBounds = (element: StaticElement) => {
        const position = element.position;
        if (!position) {
            return false;
        }

        const viewDomRect = this._viewDom?.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const width = element.width;
        const height = element.height;

        if (!viewDomRect || !windowWidth || !windowHeight || !width || !height) {
            return false;
        }
        const { x, y } = position;

        const elementRect = {
            x: x + viewDomRect.left,
            y: y + viewDomRect.top,
            width,
            height,
        };

        return (
            elementRect.x + elementRect.width <= 0 ||
            elementRect.y + elementRect.height <= 0 ||
            elementRect.x >= windowWidth ||
            elementRect.y >= windowHeight
        );
    };

    // #region 熟悉获取 设置
    get gridSize() {
        return this._gridSize;
    }
    // #endregion
}

export default GameView;
