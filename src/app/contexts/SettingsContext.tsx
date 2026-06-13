import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type WeightUnit = 'kg' | 'lbs';
export type WeightIncrement = 2.5 | 5 | 10;
export type TrackingMode = 'rir' | 'rpe' | 'both';

export const appThemes = [
  {
    id: 'strive',
    name: 'Strive Original',
    description: 'The current Strive look: deep black surfaces with a crisp blue training accent.',
    preview: {
      background: '#06070a',
      surface: '#101217',
      accent: '#3b82f6',
      accentStrong: '#2563eb',
    },
  },
  {
    id: 'iron',
    name: 'Iron',
    description: 'Graphite, steel, and low-glow contrast for a colder strength-room feel.',
    preview: {
      background: '#050606',
      surface: '#121517',
      accent: '#cbd5e1',
      accentStrong: '#94a3b8',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Warm dark surfaces with restrained orange highlights and heavier atmosphere.',
    preview: {
      background: '#080504',
      surface: '#17100d',
      accent: '#f97316',
      accentStrong: '#ea580c',
    },
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Cleaner black, quieter borders, and teal accents for a calmer analytics feel.',
    preview: {
      background: '#050607',
      surface: '#101315',
      accent: '#2dd4bf',
      accentStrong: '#14b8a6',
    },
  },
  {
    id: 'vault',
    name: 'Vault',
    description: 'Obsidian surfaces with restrained gold accents for a heavy premium look.',
    preview: {
      background: '#050505',
      surface: '#141312',
      accent: '#f5c542',
      accentStrong: '#d99b16',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep green-black surfaces with emerald highlights and softer contrast.',
    preview: {
      background: '#03100b',
      surface: '#101a15',
      accent: '#34d399',
      accentStrong: '#059669',
    },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'A light cool-gray theme with blue accents and sharp analytics contrast.',
    preview: {
      background: '#eef3f8',
      surface: '#ffffff',
      accent: '#2563eb',
      accentStrong: '#1d4ed8',
    },
  },
  {
    id: 'chalk',
    name: 'Chalk',
    description: 'A clean light theme with ink text, soft borders, and teal training accents.',
    preview: {
      background: '#f4f7f6',
      surface: '#ffffff',
      accent: '#0f766e',
      accentStrong: '#115e59',
    },
  },
] as const;

export type AppTheme = (typeof appThemes)[number]['id'];

interface PersistedSettings {
  weightUnit: WeightUnit;
  weightIncrement: WeightIncrement;
  trackingMode: TrackingMode;
  autoStartTimer: boolean;
  timerNotifications: boolean;
  workoutReminders: boolean;
  restTimers: boolean;
  theme: AppTheme;
}

interface SettingsContextType {
  weightUnit: WeightUnit;
  weightIncrement: WeightIncrement;
  trackingMode: TrackingMode;
  theme: AppTheme;
  autoStartTimer: boolean;
  timerNotifications: boolean;
  workoutReminders: boolean;
  restTimers: boolean;
  setWeightUnit: (unit: WeightUnit) => void;
  setWeightIncrement: (increment: WeightIncrement) => void;
  setTrackingMode: (mode: TrackingMode) => void;
  setTheme: (theme: AppTheme) => void;
  setAutoStartTimer: (enabled: boolean) => void;
  setTimerNotifications: (enabled: boolean) => void;
  setWorkoutReminders: (enabled: boolean) => void;
  setRestTimers: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const isWeightUnit = (value: unknown): value is WeightUnit => value === 'kg' || value === 'lbs';
const isWeightIncrement = (value: unknown): value is WeightIncrement => value === 2.5 || value === 5 || value === 10;
const isTrackingMode = (value: unknown): value is TrackingMode => value === 'rir' || value === 'rpe' || value === 'both';
const isAppTheme = (value: unknown): value is AppTheme => typeof value === 'string' && appThemes.some((theme) => theme.id === value);

function readSavedSettings(): Partial<PersistedSettings> {
  if (typeof window === 'undefined') return {};

  try {
    const savedSettings = localStorage.getItem('striveSettings');
    if (!savedSettings) return {};
    const parsed = JSON.parse(savedSettings) as Partial<PersistedSettings>;

    return {
      weightUnit: isWeightUnit(parsed.weightUnit) ? parsed.weightUnit : undefined,
      weightIncrement: isWeightIncrement(parsed.weightIncrement) ? parsed.weightIncrement : undefined,
      trackingMode: isTrackingMode(parsed.trackingMode) ? parsed.trackingMode : undefined,
      autoStartTimer: typeof parsed.autoStartTimer === 'boolean' ? parsed.autoStartTimer : undefined,
      timerNotifications: typeof parsed.timerNotifications === 'boolean' ? parsed.timerNotifications : undefined,
      workoutReminders: typeof parsed.workoutReminders === 'boolean' ? parsed.workoutReminders : undefined,
      restTimers: typeof parsed.restTimers === 'boolean' ? parsed.restTimers : undefined,
      theme: isAppTheme(parsed.theme) ? parsed.theme : undefined,
    };
  } catch {
    return {};
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [initialSettings] = useState(readSavedSettings);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialSettings.weightUnit ?? 'kg');
  const [weightIncrement, setWeightIncrement] = useState<WeightIncrement>(initialSettings.weightIncrement ?? 2.5);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>(initialSettings.trackingMode ?? 'rir');
  const [theme, setTheme] = useState<AppTheme>(initialSettings.theme ?? 'strive');
  const [autoStartTimer, setAutoStartTimer] = useState(initialSettings.autoStartTimer ?? true);
  const [timerNotifications, setTimerNotifications] = useState(initialSettings.timerNotifications ?? true);
  const [workoutReminders, setWorkoutReminders] = useState(initialSettings.workoutReminders ?? true);
  const [restTimers, setRestTimers] = useState(initialSettings.restTimers ?? true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      weightUnit,
      weightIncrement,
      trackingMode,
      theme,
      autoStartTimer,
      timerNotifications,
      workoutReminders,
      restTimers,
    };
    localStorage.setItem('striveSettings', JSON.stringify(settings));
  }, [weightUnit, weightIncrement, trackingMode, theme, autoStartTimer, timerNotifications, workoutReminders, restTimers]);

  return (
    <SettingsContext.Provider
      value={{
        weightUnit,
        weightIncrement,
        trackingMode,
        theme,
        autoStartTimer,
        timerNotifications,
        workoutReminders,
        restTimers,
        setWeightUnit,
        setWeightIncrement,
        setTrackingMode,
        setTheme,
        setAutoStartTimer,
        setTimerNotifications,
        setWorkoutReminders,
        setRestTimers,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
