'use client';

import { useState, useEffect } from 'react';
import BoardView from '@/components/BoardView';
import leverManager from '@/manager/LeverManager';

const BoardViewContainer = () => {
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

    const [levelData, setLevelData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        leverManager.init(() => {
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if (isLoading) return;
        setLevelData(leverManager.getLevelDataByIndex(currentLevelIndex));
    }, [currentLevelIndex, isLoading]);

    const nextLevel = () => {
        setCurrentLevelIndex(currentLevelIndex + 1);
    };

    if (isLoading) return <div>Loading...</div>;

    if (!levelData) return <div>No level data</div>;

    return <BoardView levelData={levelData} nextLevel={nextLevel} />;
};

export default BoardViewContainer;
