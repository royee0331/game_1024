import { useEffect, useRef } from 'react';
import type { Direction } from '@core/types';
import { useSessionStore } from '../state/sessionStore';

interface SwipeState {
  pointerId: number | null;
  startX: number;
  startY: number;
  triggered: boolean;
}

const MIN_DISTANCE = 28;

function resolveDirection(deltaX: number, deltaY: number): Direction | null {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absX === 0 && absY === 0) {
    return null;
  }
  if (absX > absY) {
    if (absX < MIN_DISTANCE) {
      return null;
    }
    return deltaX > 0 ? 'right' : 'left';
  }
  if (absY < MIN_DISTANCE) {
    return null;
  }
  return deltaY > 0 ? 'down' : 'up';
}

export function useSwipeInput(): void {
  const enqueueMove = useSessionStore((state) => state.enqueueMove);
  const isAnimating = useSessionStore((state) => state.isAnimating);
  const lockRef = useRef(false);
  const swipeRef = useRef<SwipeState>({ pointerId: null, startX: 0, startY: 0, triggered: false });

  useEffect(() => {
    if (!isAnimating) {
      const id = requestAnimationFrame(() => {
        lockRef.current = false;
      });
      return () => cancelAnimationFrame(id);
    }
    lockRef.current = true;
    return undefined;
  }, [isAnimating]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') {
        return;
      }
      swipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        triggered: false
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const swipe = swipeRef.current;
      if (event.pointerType !== 'touch' || swipe.pointerId !== event.pointerId || swipe.triggered) {
        return;
      }
      const deltaX = event.clientX - swipe.startX;
      const deltaY = event.clientY - swipe.startY;
      const direction = resolveDirection(deltaX, deltaY);
      if (!direction || lockRef.current) {
        return;
      }
      swipe.triggered = true;
      lockRef.current = true;
      event.preventDefault();
      enqueueMove(direction, 'touch');
    };

    const resetSwipe = (event: PointerEvent) => {
      const swipe = swipeRef.current;
      if (swipe.pointerId !== event.pointerId) {
        return;
      }
      swipeRef.current = { pointerId: null, startX: 0, startY: 0, triggered: false };
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', resetSwipe, { passive: true });
    window.addEventListener('pointercancel', resetSwipe, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', resetSwipe);
      window.removeEventListener('pointercancel', resetSwipe);
    };
  }, [enqueueMove]);
}
