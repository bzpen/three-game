'use client';

import GameBoard from '../components/GameBoard';

export default function Home() {
  return (
    <GameBoard 
      rows={10}
      cols={10}
      gridSize={40}
      arrowCount={20}
      gridGap={2}
      showGridData={false}
    />
  );
}
