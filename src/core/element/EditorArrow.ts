// EditorArrow.ts - 编辑器专用的箭头类
import Arrow from './Arrow';
import { ElementData } from '@/types';
import GameView from '../GameView';

class EditorArrow extends Arrow {
    constructor(props: ElementData, owner: unknown) {
        super(props, owner as GameView);
    }

    _addEventListener = () => {
        // 编辑器模式下不添加点击移动事件，只添加基本的DOM事件
        if (!this._elementDom) return;

        // 在编辑模式下，箭头不应该响应点击移动
        // 只保留基本的DOM结构，不添加游戏逻辑
    };

    // 重写startMove方法，编辑器模式下不执行移动
    startMove = () => {
        // 编辑器模式下不执行移动逻辑
        return;
    };

    // 重写stopMove方法，编辑器模式下不执行停止逻辑
    stopMove = () => {
        // 编辑器模式下不执行停止逻辑
        return;
    };
}

export default EditorArrow;
