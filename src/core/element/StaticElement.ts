// 元素基类

import { ElementData } from '../../types';
import GameView from '../GameView';

class StaticElement {
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
    constructor(props: ElementData, owner: GameView) {
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
    }

    /**
     * @description 添加到网格
     * @param grid
     * @returns
     */
    addToGrid = (grid: HTMLElement) => {
        if (!this._elementDom) return;

        this._elementDom.style.left = `${this.position?.x}px`;
        this._elementDom.style.top = `${this.position?.y}px`;
        this._elementDom.style.width = `${this.width}px`;
        this._elementDom.style.height = `${this.height}px`;

        grid.appendChild(this._elementDom);
    };

    // #region 熟悉获取 设置

    get position() {
        const gridSize = this._owner?.gridSize;
        if (!gridSize) return this._position;

        switch (this._direction) {
            case 'up':
                return {
                    x: this._position.x * gridSize,
                    y: (this._position.y - 1) * gridSize,
                };
            case 'right':
            case 'down':
                return {
                    x: this._position.x * gridSize,
                    y: this._position.y * gridSize,
                };
            case 'left':
                return {
                    x: (this._position.x - 1) * gridSize,
                    y: this._position.y * gridSize,
                };
        }
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
    // #endregion
}

export default StaticElement;
