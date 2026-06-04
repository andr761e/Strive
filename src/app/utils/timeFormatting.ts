export type DurationStorageUnit = 'min' | 'sec';

export function getDurationStorageUnit(unit?: string): DurationStorageUnit {
  return unit === 'min' ? 'min' : 'sec';
}

export function durationValueToSeconds(value: number, unit?: string) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  return getDurationStorageUnit(unit) === 'min' ? Math.round(safeValue * 60) : Math.round(safeValue);
}

export function secondsToDurationValue(seconds: number, unit?: string) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  if (getDurationStorageUnit(unit) === 'min') {
    return Number((safeSeconds / 60).toFixed(safeSeconds % 60 === 0 ? 0 : 2));
  }

  return safeSeconds;
}

export function getDurationParts(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  return {
    hours: Math.floor(safeSeconds / 3600),
    minutes: Math.floor((safeSeconds % 3600) / 60),
    seconds: safeSeconds % 60,
  };
}

export function formatDurationClock(value: number, unit?: string) {
  const totalSeconds = durationValueToSeconds(value, unit);
  const parts = getDurationParts(totalSeconds);
  const minutes = parts.minutes.toString().padStart(2, '0');
  const seconds = parts.seconds.toString().padStart(2, '0');

  if (parts.hours > 0) {
    return `${parts.hours}:${minutes}:${seconds}`;
  }

  return `${parts.minutes}:${seconds}`;
}

