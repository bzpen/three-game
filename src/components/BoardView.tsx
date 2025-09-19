'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import GameView from '@/core/GameView';
import { LEVELS_LIST } from '@/config/LevelConfig';
import { LevelConfig } from '@/types';

const BoardView = () => {
    const [currentLevelIndex] = useState(0);

    // 自适应状态
    const [gridSize, setGridSize] = useState(40);

    const boardViewRef = useRef<HTMLDivElement>(null);
    const gameViewRef = useRef<GameView | null>(null);

    const { cols, rows } = useMemo(() => {
        return { cols: LEVELS_LIST[currentLevelIndex].cols, rows: LEVELS_LIST[currentLevelIndex].rows };
    }, [currentLevelIndex]);

    // 初始化 GameView
    useEffect(() => {
        gameViewRef.current = new GameView();
        const gameView = gameViewRef.current;
        gameView.initView(boardViewRef.current as HTMLElement);
        gameView.init(gridSize, LEVELS_LIST[currentLevelIndex] as LevelConfig);
    }, [currentLevelIndex, gridSize]);

    // 根据父容器尺寸自适应计算 gridSize
    useEffect(() => {
        const __onWinResize = () => {
            const documentSize = { width: window.innerWidth, height: window.innerHeight };

            const maxSize = Math.min(documentSize.width, documentSize.height);

            const padding = Math.max(maxSize * 0.1, 20);

            const gridSize = Math.floor((maxSize - padding * 2) / cols);

            setGridSize(gridSize);
        };

        window.addEventListener('resize', __onWinResize);
        __onWinResize();
        return () => {
            window.removeEventListener('resize', __onWinResize);
        };
    }, [rows, cols]);

    const boardSize = useMemo(() => {
        return {
            width: cols * gridSize,
            height: rows * gridSize,
        };
    }, [gridSize, rows, cols]);

    return (
        <div
            ref={boardViewRef}
            className='relative rounded-xl border shadow-lg bg-white/80 border-black/5 shadow-black/5 dark:bg-neutral-800/80 dark:border-white/10 dark:shadow-black/20'
            style={{
                width: boardSize.width,
                height: boardSize.height,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, ${gridSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${gridSize}px)`,
            }}
        >
            {new Array(rows * cols).fill(0).map((_, row) => {
                return (
                    <div
                        className='border border-black/5'
                        key={`${row}`}
                        style={{
                            gridColumn: row % cols,
                            gridRow: Math.floor(row / cols),
                        }}
                    ></div>
                );
            })}
        </div>
    );
};

export default BoardView;
