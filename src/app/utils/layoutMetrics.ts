export const COLLAPSED_WORKOUT_BAR_HEIGHT = 68;
export const BOTTOM_NAV_CONTENT_HEIGHT = 68;

function readPixelValue(value: string | null | undefined) {
  const parsedValue = Number.parseFloat(value ?? '');
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function readRootPixelProperty(propertyName: string) {
  if (typeof document === 'undefined') return 0;
  return readPixelValue(window.getComputedStyle(document.documentElement).getPropertyValue(propertyName));
}

export function getAppSafeAreaTop() {
  if (typeof document === 'undefined') return 0;

  const appShell = document.querySelector<HTMLElement>('.strive-app');
  if (!appShell) return readRootPixelProperty('--strive-safe-area-top');

  return readPixelValue(window.getComputedStyle(appShell).paddingTop) || readRootPixelProperty('--strive-safe-area-top');
}

export function getBottomSafeAreaInset() {
  return readRootPixelProperty('--strive-safe-area-bottom');
}

export function getBottomNavHeight() {
  if (typeof document === 'undefined') return BOTTOM_NAV_CONTENT_HEIGHT;

  const bottomNav = document.querySelector<HTMLElement>('.bottom-nav');
  const measuredHeight = bottomNav?.getBoundingClientRect().height ?? 0;
  return measuredHeight > 0 ? measuredHeight : BOTTOM_NAV_CONTENT_HEIGHT + getBottomSafeAreaInset();
}

export function getCollapsedWorkoutOffset() {
  if (typeof window === 'undefined') return 560;

  return Math.max(0, window.innerHeight - getAppSafeAreaTop() - getBottomNavHeight() - COLLAPSED_WORKOUT_BAR_HEIGHT);
}
