'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import GameView from '@/core/GameView';
import { LevelConfig } from '@/types';
import { generateLevel } from '@/utils/LevelGenerator';

interface GeneratorBoardProps {
    levelConfig: LevelConfig;
    gridSize: number;
}

const GeneratorBoard = ({ levelConfig, gridSize }: GeneratorBoardProps) => {
    const boardViewRef = useRef<HTMLDivElement>(null);
    const gameViewRef = useRef<GameView | null>(null);

    const { cols, rows } = levelConfig;

    // 初始化 GameView
    useEffect(() => {
        if (!gameViewRef.current) {
            gameViewRef.current = new GameView();
        }
        const gameView = gameViewRef.current;
        gameView.initViewDom(boardViewRef.current as HTMLElement);
        gameView.init(gridSize, levelConfig);
    }, [levelConfig, gridSize]);

    const boardSize = useMemo(() => {
        return {
            width: cols * gridSize,
            height: rows * gridSize,
        };
    }, [gridSize, rows, cols]);

    return (
        <div
            ref={boardViewRef}
            className='relative rounded-xl border shadow-lg bg-white/90 border-black/10 shadow-black/10 dark:bg-neutral-800/90 dark:border-white/20 dark:shadow-black/30'
            style={{
                width: boardSize.width,
                height: boardSize.height,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, ${gridSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${gridSize}px)`,
            }}
        >
            {new Array(rows * cols).fill(0).map((_, index) => {
                return (
                    <div
                        className='border border-black/5 dark:border-white/10'
                        key={index}
                        style={{
                            gridColumn: (index % cols) + 1,
                            gridRow: Math.floor(index / cols) + 1,
                        }}
                    ></div>
                );
            })}
        </div>
    );
};

const LevelGeneratorView = () => {
    const [rows, setRows] = useState(10);
    const [cols, setCols] = useState(10);
    const [arrowCount, setArrowCount] = useState(3);
    const [gridSize, setGridSize] = useState(40);
    const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // 生成新关卡
    const generateNewLevel = async () => {
        setIsGenerating(true);
        try {
            // 添加延迟模拟生成过程
            await new Promise(resolve => setTimeout(resolve, 300));
            const newLevel = generateLevel(Date.now(), rows, cols, arrowCount);
            setCurrentLevel(newLevel);
        } catch (error) {
            console.error('生成关卡失败:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // 初始生成
    useEffect(() => {
        generateNewLevel();
    }, []);

    // 自适应 gridSize
    useEffect(() => {
        const updateGridSize = () => {
            const containerWidth = Math.min(window.innerWidth * 0.6, 600);
            const containerHeight = Math.min(window.innerHeight * 0.6, 600);
            const maxSize = Math.min(containerWidth, containerHeight);

            const maxCols = Math.max(cols, rows);
            const calculatedSize = Math.floor(maxSize / maxCols);
            setGridSize(Math.max(calculatedSize, 20));
        };

        updateGridSize();
        window.addEventListener('resize', updateGridSize);
        return () => window.removeEventListener('resize', updateGridSize);
    }, [rows, cols]);

    const exportLevel = () => {
        if (currentLevel) {
            const dataStr = JSON.stringify(currentLevel, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `level-${currentLevel.id}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className='w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* 控制面板 */}
            <div className='lg:col-span-1 space-y-6'>
                <div className='bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-black/10 dark:border-white/20'>
                    <h2 className='text-2xl font-bold mb-6 text-gray-800 dark:text-white'>关卡生成器</h2>

                    <div className='space-y-4'>
                        {/* 网格尺寸 */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                网格尺寸
                            </label>
                            <div className='flex gap-4'>
                                <div className='flex-1'>
                                    <label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>行数</label>
                                    <input
                                        type='number'
                                        min='5'
                                        max='20'
                                        value={rows}
                                        onChange={e => setRows(Number(e.target.value))}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                    />
                                </div>
                                <div className='flex-1'>
                                    <label className='block text-xs text-gray-600 dark:text-gray-400 mb-1'>列数</label>
                                    <input
                                        type='number'
                                        min='5'
                                        max='20'
                                        value={cols}
                                        onChange={e => setCols(Number(e.target.value))}
                                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 箭头数量 */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                                箭头数量: {arrowCount}
                            </label>
                            <input
                                type='range'
                                min='1'
                                max='10'
                                value={arrowCount}
                                onChange={e => setArrowCount(Number(e.target.value))}
                                className='w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer'
                            />
                            <div className='flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1'>
                                <span>1</span>
                                <span>10</span>
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className='space-y-3 pt-4'>
                            <button
                                onClick={generateNewLevel}
                                disabled={isGenerating}
                                className='w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2'
                            >
                                {isGenerating ? (
                                    <>
                                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                        生成中...
                                    </>
                                ) : (
                                    '🎲 生成新关卡'
                                )}
                            </button>

                            <button
                                onClick={exportLevel}
                                disabled={!currentLevel}
                                className='w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors'
                            >
                                📥 导出关卡
                            </button>
                        </div>
                    </div>
                </div>

                {/* 关卡信息 */}
                {currentLevel && (
                    <div className='bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 shadow-lg border border-black/10 dark:border-white/20'>
                        <h3 className='text-lg font-semibold mb-4 text-gray-800 dark:text-white'>关卡信息</h3>
                        <div className='space-y-2 text-sm'>
                            <div className='flex justify-between'>
                                <span className='text-gray-600 dark:text-gray-400'>ID:</span>
                                <span className='font-mono text-gray-800 dark:text-white'>{currentLevel.id}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-600 dark:text-gray-400'>尺寸:</span>
                                <span className='text-gray-800 dark:text-white'>
                                    {currentLevel.rows}×{currentLevel.cols}
                                </span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-gray-600 dark:text-gray-400'>箭头:</span>
                                <span className='text-gray-800 dark:text-white'>{currentLevel.elements.length} 个</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 预览区域 */}
            <div className='lg:col-span-2 flex items-center justify-center'>
                <div className='text-center'>
                    <h3 className='text-xl font-semibold mb-6 text-gray-800 dark:text-white'>实时预览</h3>
                    {currentLevel ? (
                        <GeneratorBoard levelConfig={currentLevel} gridSize={gridSize} />
                    ) : (
                        <div className='flex items-center justify-center h-96 bg-white/50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600'>
                            <div className='text-center'>
                                <div className='w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4'></div>
                                <p className='text-gray-600 dark:text-gray-400'>准备生成关卡...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LevelGeneratorView;
