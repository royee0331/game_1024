import React from 'react';
import type { Direction, Orientation } from '@core/types';
import { useSessionStore } from '../state/sessionStore';
import '../styles/mobile.css';

interface MobileControlsProps {
  orientation: Orientation;
  visible: boolean;
}

const LABELS: Record<Direction, { label: string; glyph: string }> = {
  up: { label: '向上移动', glyph: '↑' },
  down: { label: '向下移动', glyph: '↓' },
  left: { label: '向左移动', glyph: '←' },
  right: { label: '向右移动', glyph: '→' }
};

const ORDER: Direction[] = ['up', 'left', 'right', 'down'];

export const MobileControls: React.FC<MobileControlsProps> = ({ orientation, visible }) => {
  const enqueueMove = useSessionStore((state) => state.enqueueMove);
  const setNoMovePrompt = useSessionStore((state) => state.setNoMovePrompt);

  const handleTap = (direction: Direction) => () => {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    enqueueMove(direction, 'tap', {
      gestureType: 'tap',
      startedAt,
      deviceCategory: 'mobile',
      orientation
    });
    setNoMovePrompt(null);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  };

  return (
    <div
      className={`mobile-controls mobile-controls--${orientation}`}
      role="group"
      aria-label="移动控制"
      aria-hidden={!visible}
      data-visible={visible ? 'true' : 'false'}
      data-test="mobile-controls"
    >
      {ORDER.map((direction, index) => {
        const config = LABELS[direction];
        return (
          <button
            key={direction}
            type="button"
            className="mobile-controls__button"
            data-test={`mobile-control-${direction}`}
            aria-label={config.label}
            onClick={handleTap(direction)}
          >
            {config.glyph}
          </button>
        );
      })}
    </div>
  );
};
