// 动画基类
import { animate } from 'animejs';

abstract class AnimeBase {
    // 动画相关属性
    protected _currentAnime: ReturnType<typeof animate> | null = null;

    /**
     * @description 停止当前动画
     */
    protected _stopCurrentAnime = () => {
        if (this._currentAnime) {
            this._currentAnime.pause();
            this._currentAnime = null;
        }
    };

    /**
     * @description 碰撞挤压动画
     */
    protected _playSqueezeAnime = (element: HTMLElement | null) => {
        if (!element) return;

        this._stopCurrentAnime();

        this._currentAnime = animate(element, {
            scaleX: [1, 0.8, 1],
            scaleY: [1, 1.2, 1],
            duration: 200,
            ease: 'spring(1, 80, 10, 0)',
            onComplete: () => {
                this._currentAnime = null;
            },
        });
    };

    /**
     * @description 销毁动画
     */
    protected _destroyAnime = () => {
        this._stopCurrentAnime();
    };
}

export default AnimeBase;
