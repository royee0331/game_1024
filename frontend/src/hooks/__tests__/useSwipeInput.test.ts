import React from 'react';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { useSwipeInput } from '../useSwipeInput';
import { useSessionStore, type SessionStoreState } from '../../state/sessionStore';

function TestHarness(): null {
  useSwipeInput();
  return null;
}

function mountHook(): Root {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(TestHarness));
  });
  return root;
}

describe('useSwipeInput', () => {
  let root: Root | null = null;

  beforeEach(() => {
    const enqueueMock = vi.fn() as unknown as SessionStoreState['enqueueMove'];
    useSessionStore.setState((state) => ({
      ...state,
      enqueueMove: enqueueMock,
      isAnimating: false
    }));
    root = mountHook();
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('requires a 60px movement threshold before dispatching a swipe', () => {
    const enqueueMove = useSessionStore.getState().enqueueMove as unknown as ReturnType<typeof vi.fn>;

    const down = new PointerEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 200,
      clientY: 160
    });
    window.dispatchEvent(down);

    const shortMove = new PointerEvent('pointermove', {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 160,
      clientY: 158
    });
    window.dispatchEvent(shortMove);
    expect(enqueueMove).not.toHaveBeenCalled();

    const longMove = new PointerEvent('pointermove', {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 120,
      clientY: 158
    });
    window.dispatchEvent(longMove);

    expect(enqueueMove).toHaveBeenCalledTimes(1);
    expect(enqueueMove).toHaveBeenCalledWith('left', 'touch', expect.objectContaining({ gestureType: 'swipe' }));
  });

  it('ignores secondary touch points while a swipe is active', () => {
    const enqueueMove = useSessionStore.getState().enqueueMove as unknown as ReturnType<typeof vi.fn>;

    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerType: 'touch',
        pointerId: 1,
        clientX: 240,
        clientY: 200
      })
    );

    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'touch',
        pointerId: 2,
        clientX: 180,
        clientY: 200
      })
    );

    expect(enqueueMove).not.toHaveBeenCalled();

    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'touch',
        pointerId: 1,
        clientX: 160,
        clientY: 200
      })
    );

    expect(enqueueMove).toHaveBeenCalledTimes(1);
  });

  it('captures latency metadata when dispatching a swipe', () => {
    const enqueueMove = useSessionStore.getState().enqueueMove as unknown as ReturnType<typeof vi.fn>;
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValueOnce(100);
    now.mockReturnValueOnce(188);

    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerType: 'touch',
        pointerId: 7,
        clientX: 320,
        clientY: 120
      })
    );

    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'touch',
        pointerId: 7,
        clientX: 200,
        clientY: 118
      })
    );

    expect(enqueueMove).toHaveBeenCalledTimes(1);
    const [, , metadata] = enqueueMove.mock.calls[0];
    expect(metadata?.gestureType).toBe('swipe');
    expect(metadata?.latencyMs).toBeCloseTo(88, 0);
  });
});
