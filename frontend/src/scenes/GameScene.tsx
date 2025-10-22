import React from 'react';
import { TileGrid } from '../components/TileGrid';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { useSessionStore } from '../state/sessionStore';
import { useTelemetryQueue } from '../hooks/useTelemetryQueue';
import { formatScore } from '@shared/formatters/boardHash';

export const GameScene: React.FC = () => {
  useKeyboardInput();
  useTelemetryQueue();
  const board = useSessionStore((state) => state.game.board);
  const score = useSessionStore((state) => state.game.score);
  const bestScore = useSessionStore((state) => state.game.bestScore);

  return (
    <main className="game-scene">
      <header className="game-scene__header">
        <h1>1024</h1>
        <div className="game-scene__scores">
          <div className="game-scene__score" data-test="score-value">
            Score: {formatScore(score)}
          </div>
          <div className="game-scene__score" data-test="best-score-value">
            Best: {formatScore(bestScore)}
          </div>
        </div>
      </header>
      <TileGrid board={board} />
    </main>
  );
};
