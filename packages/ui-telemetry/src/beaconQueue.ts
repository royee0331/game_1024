import type { TelemetryPayload } from '@core/types';

type SendBeaconFn = (url: string, data: BodyInit) => boolean;

export interface BeaconQueueOptions {
  endpoint: string;
  maxBatchSize?: number;
  flushIntervalMs?: number;
  sendBeacon?: SendBeaconFn;
  fetchImpl?: typeof fetch;
}

export interface BeaconQueue {
  enqueue(payload: TelemetryPayload): void;
  flush(): Promise<void>;
  size(): number;
  stop(): void;
}

const DEFAULT_FLUSH_INTERVAL = 4_000;
const DEFAULT_BATCH_SIZE = 25;

function resolveSendBeacon(custom?: SendBeaconFn): SendBeaconFn | null {
  if (custom) {
    return custom;
  }

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    return navigator.sendBeacon.bind(navigator);
  }

  return null;
}

export function createBeaconQueue(options: BeaconQueueOptions): BeaconQueue {
  const endpoint = options.endpoint;
  const maxBatchSize = options.maxBatchSize ?? DEFAULT_BATCH_SIZE;
  const flushInterval = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL;
  const sendBeacon = resolveSendBeacon(options.sendBeacon);
  const fetchImpl = options.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : undefined);
  const queue: TelemetryPayload[] = [];

  let interval: ReturnType<typeof setInterval> | null = null;

  const schedule = () => {
    if (interval || flushInterval <= 0) {
      return;
    }
    interval = setInterval(() => {
      void flush();
    }, flushInterval);
  };

  const clearSchedule = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  const deliver = async (batch: TelemetryPayload[]): Promise<void> => {
    if (batch.length === 0) {
      return;
    }

    const body = JSON.stringify({ events: batch });
    if (sendBeacon && sendBeacon(endpoint, body)) {
      return;
    }

    if (fetchImpl) {
      await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body
      });
    }
  };

  const flush = async (): Promise<void> => {
    if (queue.length === 0) {
      return;
    }

    const batch = queue.splice(0, queue.length);
    try {
      await deliver(batch);
    } catch (error) {
      console.error('[beaconQueue] Failed to deliver telemetry batch', error);
      queue.unshift(...batch);
    }
  };

  const enqueue = (payload: TelemetryPayload): void => {
    queue.push(payload);
    if (queue.length >= maxBatchSize) {
      void flush();
    } else {
      schedule();
    }
  };

  const stop = (): void => {
    clearSchedule();
    void flush();
  };

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.addEventListener('beforeunload', stop);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flush();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
  }

  schedule();

  return {
    enqueue,
    flush,
    size: () => queue.length,
    stop
  };
}
