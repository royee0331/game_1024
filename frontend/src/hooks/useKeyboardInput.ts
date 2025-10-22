import { useEffect, useRef } from 'react';
import type { Direction } from '@core/types';
import { useSessionStore } from '../state/sessionStore';

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  a: 'left',
  A: 'left',
  s: 'down',
  S: 'down',
  d: 'right',
  D: 'right'
};

function isInteractiveElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const interactiveTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
  return interactiveTags.includes(target.tagName) || target.isContentEditable;
}

export function useKeyboardInput(): void {
  const enqueueMove = useSessionStore((state) => state.enqueueMove);
  const isAnimating = useSessionStore((state) => state.isAnimating);
  const lockRef = useRef(isAnimating);

  useEffect(() => {
    lockRef.current = isAnimating;
  }, [isAnimating]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) {
        return;
      }

      if (isInteractiveElement(event.target)) {
        return;
      }

      event.preventDefault();

      if (lockRef.current) {
        return;
      }

      lockRef.current = true;
      enqueueMove(direction, 'keyboard');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enqueueMove]);

  useEffect(() => {
    if (!isAnimating) {
      const id = requestAnimationFrame(() => {
        lockRef.current = false;
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [isAnimating]);
}
