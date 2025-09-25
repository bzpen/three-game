'use client';

import React from 'react';

interface LevelPaginationProps {
    currentLevel: number;
    totalLevels: number;
    onLevelChange: (level: number) => void;
}

const LevelPagination: React.FC<LevelPaginationProps> = ({ currentLevel, totalLevels, onLevelChange }) => {
    const canGoPrevious = currentLevel > 0;
    const canGoNext = currentLevel < totalLevels - 1;

    const handlePrevious = () => {
        if (canGoPrevious) {
            onLevelChange(currentLevel - 1);
        }
    };

    const handleNext = () => {
        if (canGoNext) {
            onLevelChange(currentLevel + 1);
        }
    };

    return (
        <div className='flex items-center gap-4 px-5 py-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-lg'>
            <button
                className='flex items-center justify-center w-9 h-9 border-0 rounded-lg bg-black/10 text-lg font-bold cursor-pointer transition-all duration-200 select-none hover:enabled:bg-black/20 hover:enabled:scale-105 active:enabled:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                aria-label='上一关'
            >
                ‹
            </button>

            <div className='flex items-center gap-2 text-base font-semibold min-w-[60px] justify-center'>
                <span className='text-white'>{currentLevel + 1}</span>
                <span className='opacity-60 font-normal'>/</span>
                <span className='opacity-80 text-gray-400'>{totalLevels}</span>
            </div>

            <button
                className='flex items-center justify-center w-9 h-9 border-0 rounded-lg bg-black/10 text-lg font-bold cursor-pointer transition-all duration-200 select-none hover:enabled:bg-black/20 hover:enabled:scale-105 active:enabled:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label='下一关'
            >
                ›
            </button>
        </div>
    );
};

export default LevelPagination;
