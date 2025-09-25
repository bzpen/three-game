import { ElementData } from '@/types';
import { ArrowDirection } from './LevelGenerator';

/**
 * 检查新元素是否会与现有元素产生死锁
 */
export function wouldCauseDeadlock(newElement: ElementData, existingElements: ElementData[]): boolean {
    for (const existingElement of existingElements) {
        if (isDeadlock(newElement, existingElement)) {
            return true;
        }
    }
    return false;
}

/**
 * 判断两个箭头是否形成死锁
 */
function isDeadlock(arrow1: ElementData, arrow2: ElementData): boolean {
    // 只有相反方向且面对面的箭头才算死锁
    if (isOpposingArrows(arrow1, arrow2)) {
        return areArrowsAligned(arrow1, arrow2);
    }
    return false;
}

/**
 * 判断是否为相对方向的箭头
 */
function isOpposingArrows(arrow1: ElementData, arrow2: ElementData): boolean {
    const opposites = {
        [ArrowDirection.UP]: ArrowDirection.DOWN,
        [ArrowDirection.DOWN]: ArrowDirection.UP,
        [ArrowDirection.LEFT]: ArrowDirection.RIGHT,
        [ArrowDirection.RIGHT]: ArrowDirection.LEFT,
    };

    return opposites[arrow1.direction as ArrowDirection] === arrow2.direction;
}

/**
 * 判断两个箭头是否面对面（在同一行或同一列）
 */
function areArrowsAligned(arrow1: ElementData, arrow2: ElementData): boolean {
    const pos1 = arrow1.position;
    const pos2 = arrow2.position;

    // 垂直方向的箭头（上下）
    if (arrow1.direction === ArrowDirection.UP || arrow1.direction === ArrowDirection.DOWN) {
        // 检查是否在同一列
        return pos1.x === pos2.x;
    }
    // 水平方向的箭头（左右）
    else {
        // 检查是否在同一行
        return pos1.y === pos2.y;
    }
}

/**
 * 获取所有死锁的箭头对
 */
export function findDeadlocks(elements: ElementData[]): Array<{ arrow1: ElementData; arrow2: ElementData }> {
    const deadlocks: Array<{ arrow1: ElementData; arrow2: ElementData }> = [];

    for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
            if (isDeadlock(elements[i], elements[j])) {
                deadlocks.push({
                    arrow1: elements[i],
                    arrow2: elements[j],
                });
            }
        }
    }

    return deadlocks;
}

/**
 * 检查整个关卡是否存在死锁
 */
export function hasDeadlocks(elements: ElementData[]): boolean {
    return findDeadlocks(elements).length > 0;
}
