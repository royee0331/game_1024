import { useEffect, useRef } from 'react';
import type { Direction } from '@core/types';
import { useSessionStore } from '../state/sessionStore';

interface SwipeState {
  pointerId: number | null;
  startX: number;
  startY: number;
  startTime: number;
  resolvedDirection: Direction | null;
  triggered: boolean;
}

const MIN_DISTANCE = 60;
const NO_MOVE_THRESHOLD = 40;

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
  const orientation = useSessionStore((state) => state.orientation);
  const setNoMovePrompt = useSessionStore((state) => state.setNoMovePrompt);
  const lockRef = useRef(false);
  const swipeRef = useRef<SwipeState>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    resolvedDirection: null,
    triggered: false
  });

  const resetSwipe = () => {
    swipeRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      startTime: 0,
      resolvedDirection: null,
      triggered: false
    };
  };

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
      const swipe = swipeRef.current;
      if (swipe.pointerId !== null && swipe.pointerId !== event.pointerId) {
        return;
      }
      swipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
        resolvedDirection: null,
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
      swipe.resolvedDirection = direction;
      lockRef.current = true;
      event.preventDefault();
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const latency = Math.max(0, now - swipe.startTime);
      enqueueMove(direction, 'touch', {
        gestureType: 'swipe',
        startedAt: swipe.startTime,
        latencyMs: latency,
        deviceCategory: 'mobile',
        orientation
      });
      setNoMovePrompt(null);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const swipe = swipeRef.current;
      if (swipe.pointerId !== event.pointerId) {
        return;
      }
      if (!swipe.triggered) {
        const deltaX = event.clientX - swipe.startX;
        const deltaY = event.clientY - swipe.startY;
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= NO_MOVE_THRESHOLD) {
          event.preventDefault();
          setNoMovePrompt(Date.now());
        }
      }
      resetSwipe();
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerEnd, { passive: true });
    window.addEventListener('pointercancel', handlePointerEnd, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [enqueueMove, orientation, setNoMovePrompt]);
}
