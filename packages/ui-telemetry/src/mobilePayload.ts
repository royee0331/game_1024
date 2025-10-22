import type {
  DeviceCategory,
  GestureType,
  Orientation,
  TelemetryPayload
} from '@core/types';

export interface MobileInteractionLog extends TelemetryPayload {
  deviceCategory: DeviceCategory;
  gestureType: GestureType;
  orientation: Orientation;
  latencyMs: number;
  resumeAt?: number;
}

export function isMobileInteractionLog(
  payload: TelemetryPayload
): payload is MobileInteractionLog {
  return (
    payload.deviceCategory === 'mobile' &&
    (payload.gestureType === 'swipe' || payload.gestureType === 'tap') &&
    (payload.orientation === 'portrait' || payload.orientation === 'landscape')
  );
}
