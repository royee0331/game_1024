import React, { useEffect, useRef, useState } from 'react';
import { TileGrid } from '../components/TileGrid';
import { Hud, type HudLayoutVariant } from '../components/Hud';
import { GameAnnouncements } from '../components/GameAnnouncements';
import { RestartButton } from '../components/RestartButton';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { useSwipeInput } from '../hooks/useSwipeInput';
import { useSessionStore } from '../state/sessionStore';
import { useTelemetryQueue } from '../hooks/useTelemetryQueue';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';
import { MobileControls } from '../components/MobileControls';
import { useMobileViewport } from '../hooks/useMobileViewport';
import { useSessionLifecycle } from '../hooks/useSessionLifecycle';
import { GameOverModal } from '../components/GameOverModal';

export const GameScene: React.FC = () => {
  useKeyboardInput();
  usePerformanceMetrics();
  useTelemetryQueue();
  useSwipeInput();
  useSessionLifecycle();
  const layout = useMobileViewport();
  const board = useSessionStore((state) => state.game.board);
  const score = useSessionStore((state) => state.game.score);
  const bestScore = useSessionStore((state) => state.game.bestScore);
  const moveCount = useSessionStore((state) => state.game.moveCount);
  const status = useSessionStore((state) => state.game.status);
  const gameOverAcknowledged = useSessionStore((state) => state.gameOverAcknowledged);
  const [controlsVisible, setControlsVisible] = useState(false);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const hasInteractedRef = useRef(false);

  const safeWidth = Math.max(0, layout.width - layout.safeAreaInsets.left - layout.safeAreaInsets.right);
  const hudVariant: HudLayoutVariant = layout.width <= 480 || safeWidth <= 400 ? 'stacked' : 'wide';
  const modalVisible = status === 'gameOver' && !gameOverAcknowledged;

  useEffect(() => {
    if (!controlsVisible && hasInteractedRef.current) {
      toggleRef.current?.focus();
    }
    hasInteractedRef.current = true;
  }, [controlsVisible]);

  const toggleControls = () => {
    setControlsVisible((current) => !current);
  };

  return (
    <main className="game-scene">
      <header className="game-scene__header" data-layout={hudVariant}>
        <div className="game-scene__hud">
          <Hud score={score} bestScore={bestScore} moveCount={moveCount} variant={hudVariant} />
        </div>
        <h1 className="game-scene__title">1024</h1>
      </header>
      <GameAnnouncements suppressGameOverMessage={modalVisible} />
      <GameOverModal />
      <TileGrid board={board} layout={layout} />
      <div className="game-scene__actions">
        <RestartButton />
        <button
          type="button"
          ref={toggleRef}
          className="mobile-controls-toggle"
          data-test="mobile-controls-toggle"
          aria-pressed={controlsVisible}
          onClick={toggleControls}
        >
          {controlsVisible ? '隐藏触控按键' : '显示触控按键'}
        </button>
      </div>
      <MobileControls orientation={layout.orientation} visible={controlsVisible} />
    </main>
  );
};
