// Arrow.ts
// 箭头类
import GameView from '../GameView';
import StaticElement from './StaticElement';
import { ElementData } from '@/types';

class Arrow extends StaticElement {
    constructor(props: ElementData, owner: GameView) {
        super(props, owner);
    }

    protected _createElementDom(): void {
        this._elementDom = document.createElement('div');
        this._elementDom.style.position = 'absolute';
        this._elementDom.style.display = 'flex';
        this._elementDom.style.alignItems = 'center';
        this._elementDom.style.justifyContent = 'center';
        this._elementDom.style.fontSize = '24px';
        this._elementDom.style.color = '#333';
        this._elementDom.style.backgroundColor = '#e0e0e0';
        this._elementDom.style.borderRadius = '4px';

        // 根据方向设置箭头符号
        const arrowSymbols = {
            up: '↑',
            down: '↓',
            left: '←',
            right: '→',
        };
        this._elementDom.textContent = arrowSymbols[this._direction as keyof typeof arrowSymbols] || '→';

        this._addEventListener();
    }
}

export default Arrow;
