'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import EditorGameView from '@/core/EditorGameView';
import { LevelConfig } from '@/types';

const LevelEditor = () => {
    // 编辑器状态
    const [gridSize, setGridSize] = useState(40);
    const [editMode, setEditMode] = useState<'normal' | 'delete'>('normal');
    const [draggingElement, setDraggingElement] = useState<string | null>(null);
    const [levelData, setLevelData] = useState<LevelConfig | null>(null);

    const boardViewRef = useRef<HTMLDivElement>(null);
    const editorGameViewRef = useRef<EditorGameView | null>(null);

    // 默认网格配置
    const { cols, rows } = useMemo(() => {
        return { cols: levelData?.cols || 5, rows: levelData?.rows || 5 };
    }, [levelData]);

    // 初始化编辑器GameView
    useEffect(() => {
        if (!editorGameViewRef.current) {
            editorGameViewRef.current = new EditorGameView();
        }
        const editorGameView = editorGameViewRef.current;
        editorGameView.initViewDom(boardViewRef.current as HTMLElement);

        // 加载示例关卡数据
        const loadExampleLevel = async () => {
            try {
                const response = await fetch('/example-level.json');
                const exampleLevelData = await response.json();
                editorGameView.init(gridSize, exampleLevelData);
                setLevelData(exampleLevelData);
            } catch (error) {
                console.error('加载示例关卡失败:', error);
                // 如果加载失败，使用默认关卡数据
                const defaultLevelData: LevelConfig = {
                    id: Date.now(),
                    rows: 5,
                    cols: 5,
                    elements: [],
                };
                editorGameView.init(gridSize, defaultLevelData);
                setLevelData(defaultLevelData);
            }
        };

        loadExampleLevel();
    }, [gridSize]);

    // 根据父容器尺寸自适应计算 gridSize
    useEffect(() => {
        const __onWinResize = () => {
            const documentSize = { width: window.innerWidth, height: window.innerHeight };
            const maxSize = Math.min(documentSize.width, documentSize.height);
            const padding = Math.max(maxSize * 0.1, 20);
            const newGridSize = Math.floor((maxSize - padding * 2) / cols);
            setGridSize(newGridSize);
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

    // 处理工具栏拖拽开始
    const handleToolbarDragStart = (direction: string) => {
        setDraggingElement(direction);
        if (editorGameViewRef.current) {
            editorGameViewRef.current.setDraggingElementType(direction);
        }
    };

    // 处理工具栏拖拽结束
    const handleToolbarDragEnd = () => {
        setDraggingElement(null);
        if (editorGameViewRef.current) {
            editorGameViewRef.current.setDraggingElementType(null);
        }
    };

    // 处理画布事件
    const handleCanvasClick = (event: React.MouseEvent) => {
        if (editorGameViewRef.current) {
            editorGameViewRef.current.handleCanvasClick(event.nativeEvent);
        }
    };

    const handleCanvasDragOver = (event: React.DragEvent) => {
        if (editorGameViewRef.current) {
            editorGameViewRef.current.handleCanvasDragOver(event.nativeEvent);
        }
    };

    const handleCanvasDrop = (event: React.DragEvent) => {
        if (editorGameViewRef.current) {
            editorGameViewRef.current.handleCanvasDrop(event.nativeEvent);
        }
    };

    // 切换删除模式
    const toggleDeleteMode = () => {
        const newMode = editMode === 'normal' ? 'delete' : 'normal';
        setEditMode(newMode);
        if (editorGameViewRef.current) {
            editorGameViewRef.current.setEditMode(newMode);
        }
    };

    // 加载关卡数据
    const loadLevelData = (data: LevelConfig) => {
        setLevelData(data);
        if (editorGameViewRef.current) {
            editorGameViewRef.current.init(gridSize, data);
        }
    };

    // 保存关卡数据
    const saveLevelData = () => {
        if (editorGameViewRef.current) {
            const data = editorGameViewRef.current.getLevelData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `level-${data.id}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className='flex gap-6'>
            {/* 左侧画布区域 */}
            <div className='flex-1'>
                <div className='bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg'>
                    <div className='flex justify-between items-center mb-4'>
                        <h2 className='text-xl font-semibold text-gray-800 dark:text-white'>关卡画布</h2>
                        <div className='flex gap-2'>
                            <button
                                onClick={toggleDeleteMode}
                                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                    editMode === 'delete'
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                {editMode === 'delete' ? '退出删除模式' : '删除模式'}
                            </button>
                            <button
                                onClick={saveLevelData}
                                className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors'
                            >
                                保存关卡
                            </button>
                        </div>
                    </div>

                    <div className='flex justify-center'>
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
                            onClick={handleCanvasClick}
                            onDragOver={handleCanvasDragOver}
                            onDrop={handleCanvasDrop}
                        >
                            {new Array(rows * cols).fill(0).map((_, index) => {
                                return <div key={index} className='border border-black/5 dark:border-white/10'></div>;
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* 右侧工具栏 */}
            <div className='w-64'>
                <div className='bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg'>
                    <h3 className='text-lg font-semibold mb-4 text-gray-800 dark:text-white'>工具栏</h3>

                    {/* 箭头工具 */}
                    <div className='mb-6'>
                        <h4 className='text-sm font-medium mb-3 text-gray-600 dark:text-gray-400'>方向箭头</h4>
                        <div className='grid grid-cols-2 gap-2'>
                            {[
                                { direction: 'up', symbol: '↑', label: '向上' },
                                { direction: 'down', symbol: '↓', label: '向下' },
                                { direction: 'left', symbol: '←', label: '向左' },
                                { direction: 'right', symbol: '→', label: '向右' },
                            ].map(({ direction, symbol, label }) => (
                                <div
                                    key={direction}
                                    draggable
                                    onDragStart={() => handleToolbarDragStart(direction)}
                                    onDragEnd={handleToolbarDragEnd}
                                    className={`p-3 border-2 border-dashed rounded-lg cursor-move transition-colors ${
                                        draggingElement === direction
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <div className='text-center'>
                                        <div className='text-2xl mb-1'>{symbol}</div>
                                        <div className='text-xs text-gray-600 dark:text-gray-400'>{label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 关卡数据加载 */}
                    <div className='mb-6'>
                        <h4 className='text-sm font-medium mb-3 text-gray-600 dark:text-gray-400'>关卡数据</h4>
                        <div className='space-y-2'>
                            <button
                                onClick={async () => {
                                    // 加载示例关卡
                                    try {
                                        const response = await fetch('/example-level.json');
                                        const exampleData = await response.json();
                                        loadLevelData(exampleData);
                                    } catch (error) {
                                        console.error('加载示例关卡失败:', error);
                                        // 如果加载失败，使用默认关卡数据
                                        const defaultData: LevelConfig = {
                                            id: Date.now(),
                                            rows: 5,
                                            cols: 5,
                                            elements: [],
                                        };
                                        loadLevelData(defaultData);
                                    }
                                }}
                                className='w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors'
                            >
                                加载示例关卡
                            </button>
                            <input
                                type='file'
                                accept='.json'
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = event => {
                                            try {
                                                const data = JSON.parse(event.target?.result as string);
                                                loadLevelData(data);
                                            } catch (error) {
                                                console.error('加载关卡数据失败:', error);
                                            }
                                        };
                                        reader.readAsText(file);
                                    }
                                }}
                                className='w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors'
                            />
                        </div>
                    </div>

                    {/* 当前关卡信息 */}
                    <div>
                        <h4 className='text-sm font-medium mb-3 text-gray-600 dark:text-gray-400'>关卡信息</h4>
                        <div className='text-sm text-gray-600 dark:text-gray-400 space-y-1'>
                            <div>
                                网格: {cols} × {rows}
                            </div>
                            <div>元素数量: {editorGameViewRef.current?.elementList.length || 0}</div>
                            <div>模式: {editMode === 'delete' ? '删除模式' : '正常模式'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelEditor;
