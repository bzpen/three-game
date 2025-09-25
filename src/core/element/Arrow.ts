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
        super._createElementDom();
        if (!this._elementDom) return;
        this._elementDom.classList.add('arrow-element');

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
