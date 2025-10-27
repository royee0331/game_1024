import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatScore } from '@shared/formatters/boardHash';
import { useSessionStore } from '../state/sessionStore';
import { useSessionRestart } from '../state/useSessionRestart';

/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

interface GameOverSnapshot {
  score: number;
  bestScore: number;
  moveCount: number;
  sessionId: string;
}

export const GameOverModal: React.FC = () => {
  const status = useSessionStore((state) => state.game.status);
  const score = useSessionStore((state) => state.game.score);
  const bestScore = useSessionStore((state) => state.game.bestScore);
  const moveCount = useSessionStore((state) => state.game.moveCount);
  const sessionId = useSessionStore((state) => state.game.sessionId ?? '');
  const acknowledgeGameOver = useSessionStore((state) => state.setGameOverAcknowledged);
  const restartGame = useSessionRestart('gameover-modal');

  const [snapshot, setSnapshot] = useState<GameOverSnapshot | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const beforeTrapRef = useRef<HTMLSpanElement | null>(null);
  const afterTrapRef = useRef<HTMLSpanElement | null>(null);
  const restartRef = useRef<HTMLButtonElement | null>(null);
  const dismissRef = useRef<HTMLButtonElement | null>(null);

  const titleId = useId();
  const bodyId = useId();

  const visible = status === 'gameOver' && !dismissed;

  const focusAfterClose = useCallback((delay: number) => {
    window.setTimeout(() => {
      const restartButton = document.querySelector<HTMLButtonElement>('[data-test="restart-button"]');
      if (restartButton && !restartButton.disabled) {
        restartButton.focus();
        return;
      }
      document.querySelector<HTMLButtonElement>('[data-test="mobile-controls-toggle"]')?.focus();
    }, delay);
  }, []);

  useEffect(() => {
    if (status === 'gameOver') {
      acknowledgeGameOver(false);
      setSnapshot((current) =>
        current ?? {
          score,
          bestScore,
          moveCount,
          sessionId
        }
      );
    } else {
      setSnapshot(null);
      setDismissed(false);
    }
  }, [status, score, bestScore, moveCount, sessionId, acknowledgeGameOver]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const frame = window.setTimeout(() => {
      restartRef.current?.focus();
    }, 32);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDismissed(true);
        acknowledgeGameOver(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(frame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, acknowledgeGameOver]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    acknowledgeGameOver(true);
    dismissRef.current?.blur();
    focusAfterClose(32);
  }, [acknowledgeGameOver, focusAfterClose]);

  const handleRestart = useCallback(() => {
    setDismissed(true);
    acknowledgeGameOver(true);
    restartGame();
    focusAfterClose(48);
  }, [acknowledgeGameOver, restartGame, focusAfterClose]);

  const handleTrapFocus = useCallback(
    (position: 'before' | 'after') => {
      if (position === 'before') {
        (dismissRef.current ?? restartRef.current)?.focus();
      } else {
        (restartRef.current ?? dismissRef.current)?.focus();
      }
    },
    []
  );

  const summary = useMemo(() => {
    if (!snapshot) {
      return '';
    }
    return `最终得分 ${formatScore(snapshot.score)} 分，最佳成绩 ${formatScore(
      snapshot.bestScore
    )} 分，共计 ${formatScore(snapshot.moveCount)} 步。`;
  }, [snapshot]);

  if (!snapshot || !visible) {
    return null;
  }

  return (
    <div className="game-modal" data-test="game-over-modal">
      <div className="game-modal__backdrop" aria-hidden="true" onClick={handleDismiss} />
      <div className="game-modal__dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId}>
        <span
          ref={beforeTrapRef}
          tabIndex={0}
          className="game-modal__sentinel"
          onFocus={() => handleTrapFocus('before')}
        />
        <div className="game-modal__content">
          <h2 id={titleId} className="game-modal__title">
            挑战完成
          </h2>
          <p id={bodyId} className="game-modal__lead">
            {summary}
          </p>
          <dl className="game-modal__metrics">
            <div className="game-modal__metric" role="group" aria-label="最终得分">
              <dt>最终得分</dt>
              <dd>{formatScore(snapshot.score)}</dd>
            </div>
            <div className="game-modal__metric" role="group" aria-label="最佳成绩">
              <dt>最佳成绩</dt>
              <dd>{formatScore(snapshot.bestScore)}</dd>
            </div>
            <div className="game-modal__metric" role="group" aria-label="总步数">
              <dt>总步数</dt>
              <dd>{formatScore(snapshot.moveCount)}</dd>
            </div>
          </dl>
          <div className="game-modal__actions">
            <button ref={restartRef} type="button" className="game-modal__primary" onClick={handleRestart}>
              重新开始
            </button>
            <button ref={dismissRef} type="button" className="game-modal__secondary" onClick={handleDismiss}>
              继续挑战
            </button>
          </div>
        </div>
        <span
          ref={afterTrapRef}
          tabIndex={0}
          className="game-modal__sentinel"
          onFocus={() => handleTrapFocus('after')}
        />
      </div>
    </div>
  );
};

/* eslint-enable jsx-a11y/no-noninteractive-tabindex */
