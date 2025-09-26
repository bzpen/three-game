// Arrow.ts
// 箭头类
import { getRandomColor } from '@/utils/ColorUtils';
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

        const contentDom = document.createElement('div');
        contentDom.className = 'arrow-content';
        this._elementDom.appendChild(contentDom);

        contentDom.style.borderRadius =
            this._direction === 'left' || this._direction === 'right' ? '10% / 20%' : '20% / 10%';

        contentDom.style.background = getRandomColor();

        // 根据方向设置箭头符号
        const arrowSymbols = {
            up: '↑',
            down: '↓',
            left: '←',
            right: '→',
        };
        contentDom.textContent = arrowSymbols[this._direction as keyof typeof arrowSymbols] || '→';

        this._addEventListener();
    }
}

export default Arrow;
