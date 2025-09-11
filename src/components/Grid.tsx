'use client';

import React from 'react';

interface GridProps {
  rows: number;
  cols: number;
  gridSize: number;
  gridData?: number[][];
  showGridData?: boolean;
}

const Grid: React.FC<GridProps> = ({ 
  rows, 
  cols, 
  gridSize, 
  gridData, 
  showGridData = false 
}) => {
  const totalCells = rows * cols;

  return (
    <div 
      className="grid gap-0.5 p-5 h-full w-full"
      style={{ 
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`
      }}
    >
      {Array.from({ length: totalCells }).map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const cellValue = gridData?.[row]?.[col] || 0;
        
        return (
          <div 
            key={index}
            className={`border border-gray-200 flex items-center justify-center text-xs font-mono ${
              cellValue === 1 ? 'bg-blue-200' : 
              cellValue === 2 ? 'bg-green-200' : 
              cellValue === 3 ? 'bg-yellow-200' : 
              cellValue > 0 ? 'bg-red-200' : 'bg-gray-50'
            }`}
            style={{ 
              width: `${gridSize}px`, 
              height: `${gridSize}px` 
            }}
          >
            {showGridData && cellValue}
          </div>
        );
      })}
    </div>
  );
};

export default Grid;
