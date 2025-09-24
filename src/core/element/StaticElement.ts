// 元素基类

import { ElementData } from '../../types';
import GameView from '../GameView';
import AnimeBase from './AnimeBase';

class StaticElement extends AnimeBase {
    _id: string = '';

    _type: string;
    _direction: string;
    _width: number;
    _height: number;
    _position: { x: number; y: number };

    // 元素DOM
    _elementDom: HTMLElement | null = null;

    // 元素所有者
    _owner: GameView | null = null;

    // 移动相关属性
    _isMoving: boolean = false;
    _animationId: number | null = null;
    _moveSpeed: number = 10; // 每帧移动的像素数

    // 元素激活状态
    _active: boolean = true;

    constructor(props: ElementData, owner: GameView) {
        super();
        this._id = props.id || '';
        this._type = props.type;
        this._direction = props.direction;
        this._width = props.width;
        this._height = props.height;
        this._position = props.position;
        this._owner = owner;

        this._createElementDom();
    }

    protected _createElementDom(): void {
        this._elementDom = document.createElement('div');
        this._elementDom.style.position = 'absolute';
        this._elementDom.style.backgroundColor = 'red';

        this._addEventListener();
    }

    _addEventListener = () => {
        this._elementDom?.addEventListener('click', () => {
            this.startMove();
        });
    };

    /**
     * @description 添加到网格
     * @param grid
     * @returns
     */
    addToGrid = (grid: HTMLElement) => {
        if (!this._elementDom) return;

        grid.appendChild(this._elementDom);
        this._updateDOMStyle();
    };

    /**
     * @description 开始移动，按箭头方向匀速移动
     */
    startMove = () => {
        if (this._isMoving) return; // 如果已在移动中，直接返回

        this._isMoving = true;
        this._animate();
    };

    /**
     * @description 停止移动
     */
    stopMove = (isAnime: boolean = true) => {
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        this._isMoving = false;

        this._stopAnimeAfterFixPosition();

        // 挤压碰撞动画
        if (isAnime) {
            this._playSqueezeAnime(this._elementDom);
        }
    };

    /**
     * @description 停止移动后并适配固定位置
     */
    _stopAnimeAfterFixPosition = () => {
        this._position = {
            x: Math.round(this._position.x) || 0,
            y: Math.round(this._position.y) || 0,
        };
        this._updateDOMStyle();
    };

    /**
     * @description 销毁元素
     */
    destroy = () => {
        // 停止动画
        this._destroyAnime();

        // 停止移动动画
        this.stopMove();

        // 移除事件监听器
        if (this._elementDom) {
            this._elementDom.removeEventListener('click', this.startMove);

            // 从父元素中移除DOM
            if (this._elementDom.parentNode) {
                this._elementDom.parentNode.removeChild(this._elementDom);
            }

            this._elementDom = null;
        }

        // 清理引用
        this._owner = null;
    };

    /**
     * @description 移动动画帧函数
     */
    private _animate = () => {
        if (!this._isMoving || !this._elementDom) return;

        const { dx, dy } = this._getDirectionVector();
        const newX = this._position.x + (dx * this._moveSpeed) / (this._owner?.gridSize || 40);
        const newY = this._position.y + (dy * this._moveSpeed) / (this._owner?.gridSize || 40);

        // 边界检查
        if (this._owner?.checkOutOfBounds(this)) {
            this._active = false;
            this.stopMove(false);
            return;
        }

        // 更新位置
        this._position.x = newX;
        this._position.y = newY;

        // 更新DOM样式
        this._updateDOMStyle();

        this._owner?.updateGridData();
        const isColliding = this._owner?.checkInAnimeElementStatus(this);

        // 继续动画
        if (!isColliding) {
            this._animationId = requestAnimationFrame(this._animate);
        }
    };

    /**
     * @description 获取方向向量
     */
    private _getDirectionVector = () => {
        switch (this._direction) {
            case 'up':
                return { dx: 0, dy: -1 };
            case 'down':
                return { dx: 0, dy: 1 };
            case 'left':
                return { dx: -1, dy: 0 };
            case 'right':
                return { dx: 1, dy: 0 };
            default:
                return { dx: 0, dy: 0 };
        }
    };

    /**
     * @description 检查是否超出边界（浏览器窗口边界）
     */
    private _isOutOfBounds = (x: number, y: number) => {
        const gridSize = this._owner?.gridSize;
        if (!gridSize) return false;

        // 获取浏览器窗口尺寸
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // 将网格坐标转换为像素坐标
        const position = this._convertGridToPixelPosition({ x, y }, gridSize, this._direction);
        const elementWidth = this.width;
        const elementHeight = this.height;

        return (
            position.x + elementWidth! <= 0 ||
            position.y + elementHeight! <= 0 ||
            position.x >= screenWidth ||
            position.y >= screenHeight
        );
    };

    /**
     * @description 更新DOM位置
     */
    private _updateDOMStyle = () => {
        if (!this._elementDom) return;

        this._elementDom.style.width = `${this.width}px`;
        this._elementDom.style.height = `${this.height}px`;
        this._elementDom.style.opacity = this.active ? '1' : '0';

        if (this.position) {
            this._elementDom.style.left = `${this.position?.x}px`;
            this._elementDom.style.top = `${this.position?.y}px`;
        }
    };

    /**
     * @description 计算元素占用的网格范围
     */
    getGridRange() {
        if (!this._owner) return null;
        const gridConfig = this._owner?._gridConfig;
        if (!gridConfig) return null;

        const gridSize = this._owner?.gridSize;

        const position = this.position;
        if (!position) return null;

        const x = position.x / gridSize;
        const y = position.y / gridSize;

        const width = this.width! / gridSize;
        const height = this.height! / gridSize;

        const minX = Math.max(0, Math.floor(x));
        const maxX = Math.min(gridConfig.cols - 1, Math.ceil(x + width - 1));
        const minY = Math.max(0, Math.floor(y));
        const maxY = Math.min(gridConfig.rows - 1, Math.ceil(y + height - 1));

        return { minX, maxX, minY, maxY };
    }

    /**
     * 根据方向转换网格坐标到像素坐标
     */
    private _convertGridToPixelPosition(
        gridPosition: { x: number; y: number },
        gridSize: number,
        direction: string,
    ): { x: number; y: number } {
        switch (direction) {
            case 'up':
                return {
                    x: gridPosition.x * gridSize,
                    y: (gridPosition.y - 1) * gridSize,
                };
            case 'right':
            case 'down':
                return {
                    x: gridPosition.x * gridSize,
                    y: gridPosition.y * gridSize,
                };
            case 'left':
                return {
                    x: (gridPosition.x - 1) * gridSize,
                    y: gridPosition.y * gridSize,
                };
            default:
                return {
                    x: gridPosition.x * gridSize,
                    y: gridPosition.y * gridSize,
                };
        }
    }

    // #region 熟悉获取 设置
    get position() {
        const gridSize = this._owner?.gridSize;
        if (!gridSize) return this._position;

        return this._convertGridToPixelPosition(this._position, gridSize, this._direction);
    }

    get width() {
        const gridSize = this._owner?.gridSize;
        if (!gridSize) return this._width;

        switch (this._direction) {
            case 'down':
            case 'up':
                return this._height * gridSize;
            case 'right':
            case 'left':
                return this._width * gridSize;
        }
    }

    get height() {
        const gridSize = this._owner?.gridSize;
        if (!gridSize) return this._height;

        switch (this._direction) {
            case 'down':
            case 'up':
                return this._width * gridSize;
            case 'right':
            case 'left':
                return this._height * gridSize;
        }
    }

    get active() {
        return this._active;
    }

    set active(value: boolean) {
        this._active = value;
        this._updateDOMStyle();
    }

    get direction() {
        return this._direction;
    }

    // #endregion
}

export default StaticElement;
