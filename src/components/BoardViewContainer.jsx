'use client';

import { useState, useEffect } from 'react';
import BoardView from '@/components/BoardView';
import LevelPagination from '@/components/LevelPagination';
import leverManager from '@/manager/LeverManager';

const BoardViewContainer = () => {
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [totalLevels, setTotalLevels] = useState(0);
    const [levelData, setLevelData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        leverManager.init(() => {
            setTotalLevels(leverManager.getTotalLevels());
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if (isLoading) return;
        setLevelData(leverManager.getLevelDataByIndex(currentLevelIndex));
    }, [currentLevelIndex, isLoading]);

    const nextLevel = () => {
        if (currentLevelIndex < totalLevels - 1) {
            setCurrentLevelIndex(currentLevelIndex + 1);
        }
    };

    const handleLevelChange = newLevel => {
        if (newLevel >= 0 && newLevel < totalLevels) {
            setCurrentLevelIndex(newLevel);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    if (!levelData) return <div>No level data</div>;

    return (
        <div className='flex flex-col items-center gap-5 p-5'>
            <LevelPagination
                currentLevel={currentLevelIndex}
                totalLevels={totalLevels}
                onLevelChange={handleLevelChange}
            />
            <BoardView levelData={levelData} nextLevel={nextLevel} />
        </div>
    );
};

export default BoardViewContainer;
