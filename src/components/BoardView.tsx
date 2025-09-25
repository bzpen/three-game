'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import GameView from '@/core/GameView';
import { LevelConfig } from '@/types';

const BoardView = ({ levelData, nextLevel }: { levelData: LevelConfig; nextLevel: () => void }) => {
    // 自适应状态
    const [gridSize, setGridSize] = useState(40);
    const [elementNum, setElementNum] = useState(9999);

    const boardViewRef = useRef<HTMLDivElement>(null);
    const gameViewRef = useRef<GameView | null>(null);

    const { cols, rows } = useMemo(() => {
        return { cols: levelData.cols, rows: levelData.rows };
    }, [levelData]);

    // 初始化 GameView
    useEffect(() => {
        if (!gameViewRef.current) {
            gameViewRef.current = new GameView();
        }
        const gameView = gameViewRef.current;
        gameView.initViewDom(boardViewRef.current as HTMLElement);
        gameView.init(gridSize, levelData);
        setElementNum(levelData.elements.length);
        gameView.setElementNumChangeCallback(setElementNum);
    }, [levelData, gridSize]);

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

    useEffect(() => {
        if (elementNum === 0) {
            nextLevel();
            setElementNum(9999);
        }
    }, [elementNum, nextLevel]);

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
