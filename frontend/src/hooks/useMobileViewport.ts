import { useEffect, useMemo, useState } from 'react';
import type { Orientation } from '@core/types';
import { useSessionStore } from '../state/sessionStore';

export interface ViewportLayoutProfile {
  orientation: Orientation;
  width: number;
  height: number;
  safeAreaInsets: { top: number; right: number; bottom: number; left: number };
  tileSize: number;
  gridGap: number;
  hudScale: number;
  controlsPlacement: 'bottom' | 'side';
}

const DEFAULT_PROFILE: ViewportLayoutProfile = {
  orientation: 'portrait',
  width: 360,
  height: 640,
  safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  tileSize: 72,
  gridGap: 12,
  hudScale: 1,
  controlsPlacement: 'bottom'
};

function readSafeAreaInset(variable: string): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  const computed = getComputedStyle(document.documentElement).getPropertyValue(variable);
  const parsed = parseFloat(computed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function computeProfile(): ViewportLayoutProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_PROFILE;
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const orientation: Orientation = width > height ? 'landscape' : 'portrait';
  const safeAreaInsets = {
    top: readSafeAreaInset('env(safe-area-inset-top)'),
    right: readSafeAreaInset('env(safe-area-inset-right)'),
    bottom: readSafeAreaInset('env(safe-area-inset-bottom)'),
    left: readSafeAreaInset('env(safe-area-inset-left)')
  };
  const availableWidth = width - safeAreaInsets.left - safeAreaInsets.right - 48;
  const availableHeight = height - safeAreaInsets.top - safeAreaInsets.bottom - 160;
  const baseSize = Math.max(availableWidth, 280);
  const limitingSize = Math.min(baseSize, availableHeight);
  const tileSize = Math.max(52, Math.min(96, limitingSize / 4));
  const gridGap = Math.max(10, Math.round(tileSize * 0.18));
  const hudScale = orientation === 'portrait' ? 1 : 1.08;
  const controlsPlacement = orientation === 'portrait' ? 'bottom' : 'side';
  return {
    orientation,
    width,
    height,
    safeAreaInsets,
    tileSize,
    gridGap,
    hudScale,
    controlsPlacement
  };
}

export function useMobileViewport(): ViewportLayoutProfile {
  const setOrientation = useSessionStore((state) => state.setOrientation);
  const [profile, setProfile] = useState<ViewportLayoutProfile>(() => computeProfile());

  useEffect(() => {
    setOrientation(profile.orientation);
  }, [profile.orientation, setOrientation]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    let frame = 0;
    const handleResize = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        setProfile(computeProfile());
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  return useMemo(() => profile, [profile]);
}
