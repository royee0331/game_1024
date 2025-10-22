import React, { useEffect, useRef } from 'react';
import { useSessionStore } from '../state/sessionStore';

export const RestartButton: React.FC = () => {
  const restart = useSessionStore((state) => state.restart);
  const status = useSessionStore((state) => state.game.status);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (status !== 'gameOver') {
      return undefined;
    }
    const id = window.setTimeout(() => {
      buttonRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [status]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      restart();
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className="restart-button"
      onClick={restart}
      onKeyDown={handleKeyDown}
      disabled={status !== 'gameOver'}
      aria-disabled={status !== 'gameOver'}
      data-test="restart-button"
    >
      重新开始
    </button>
  );
};
