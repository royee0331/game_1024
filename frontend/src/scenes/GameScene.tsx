import React from 'react';
import { TileGrid } from '../components/TileGrid';
import { Hud } from '../components/Hud';
import { GameAnnouncements } from '../components/GameAnnouncements';
import { RestartButton } from '../components/RestartButton';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { useSwipeInput } from '../hooks/useSwipeInput';
import { useSessionStore } from '../state/sessionStore';
import { useTelemetryQueue } from '../hooks/useTelemetryQueue';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';

export const GameScene: React.FC = () => {
  useKeyboardInput();
  usePerformanceMetrics();
  useTelemetryQueue();
  useSwipeInput();
  const board = useSessionStore((state) => state.game.board);
  const score = useSessionStore((state) => state.game.score);
  const bestScore = useSessionStore((state) => state.game.bestScore);
  const moveCount = useSessionStore((state) => state.game.moveCount);

  return (
    <main className="game-scene">
      <header className="game-scene__header">
        <h1>1024</h1>
        <Hud score={score} bestScore={bestScore} moveCount={moveCount} />
      </header>
      <GameAnnouncements />
      <TileGrid board={board} />
      <div className="game-scene__actions">
        <RestartButton />
      </div>
    </main>
  );
};
