import { useEffect } from 'react';
import { useSessionStore } from '../state/sessionStore';

export function useSessionLifecycle(): void {
  const setResumeAt = useSessionStore((state) => state.setResumeAt);
  const setLastVisible = useSessionStore((state) => state.setLastVisible);
  const persistSnapshot = useSessionStore((state) => state.persistSnapshot);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const timestamp = Date.now();
        setLastVisible(timestamp);
        persistSnapshot();
      } else if (document.visibilityState === 'visible') {
        setResumeAt(Date.now());
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleVisibility);
    };
  }, [persistSnapshot, setLastVisible, setResumeAt]);
}
