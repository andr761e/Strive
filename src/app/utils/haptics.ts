type HapticIntensity = 'tiny' | 'light' | 'medium' | 'strong' | 'heavy' | 'success' | 'warning' | 'none';

const hapticPatterns: Record<Exclude<HapticIntensity, 'none'>, number | number[]> = {
  tiny: 6,
  light: 10,
  medium: 18,
  strong: [24, 18, 24],
  heavy: [36, 24, 42],
  success: [18, 24, 32],
  warning: [30, 32, 30],
};

const defaultButtonHaptic: HapticIntensity = 'light';
const hapticCooldownMs = 45;
let lastHapticAt = 0;

function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function triggerHaptic(intensity: HapticIntensity = defaultButtonHaptic, options?: { force?: boolean }) {
  if (intensity === 'none' || !canVibrate()) return;

  const now = Date.now();
  if (!options?.force && now - lastHapticAt < hapticCooldownMs) return;

  lastHapticAt = now;
  navigator.vibrate(hapticPatterns[intensity]);
}

function getHapticIntensity(element: Element): HapticIntensity {
  const configuredIntensity = element.getAttribute('data-haptic') as HapticIntensity | null;
  return configuredIntensity ?? defaultButtonHaptic;
}

export function installGlobalButtonHaptics() {
  const handleClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;

    const target = event.target.closest('button, a[href], [role="button"], [data-haptic]');
    if (!(target instanceof HTMLElement)) return;
    if (target.hasAttribute('disabled') || target.getAttribute('aria-disabled') === 'true') return;

    triggerHaptic(getHapticIntensity(target));
  };

  document.addEventListener('click', handleClick, { capture: true });

  return () => {
    document.removeEventListener('click', handleClick, { capture: true });
  };
}
