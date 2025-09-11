'use client';

import GameBoard from '../components/GameBoard';

export default function Home() {
  return (
    <GameBoard 
      rows={6}
      cols={6}
      gridSize={60}
      arrowCount={10}
      showGridData={false}
    />
  );
}
