import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type WeightUnit = 'kg' | 'lbs';
export type WeightIncrement = 2.5 | 5 | 10;
export type TrackingMode = 'rir' | 'rpe' | 'both';

interface SettingsContextType {
  weightUnit: WeightUnit;
  weightIncrement: WeightIncrement;
  trackingMode: TrackingMode;
  autoStartTimer: boolean;
  timerNotifications: boolean;
  workoutReminders: boolean;
  setWeightUnit: (unit: WeightUnit) => void;
  setWeightIncrement: (increment: WeightIncrement) => void;
  setTrackingMode: (mode: TrackingMode) => void;
  setAutoStartTimer: (enabled: boolean) => void;
  setTimerNotifications: (enabled: boolean) => void;
  setWorkoutReminders: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weightIncrement, setWeightIncrement] = useState<WeightIncrement>(2.5);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('rir');
  const [autoStartTimer, setAutoStartTimer] = useState(true);
  const [timerNotifications, setTimerNotifications] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('striveSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setWeightUnit(settings.weightUnit || 'kg');
      setWeightIncrement(settings.weightIncrement || 2.5);
      setTrackingMode(settings.trackingMode || 'rir');
      setAutoStartTimer(settings.autoStartTimer ?? true);
      setTimerNotifications(settings.timerNotifications ?? true);
      setWorkoutReminders(settings.workoutReminders ?? false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      weightUnit,
      weightIncrement,
      trackingMode,
      autoStartTimer,
      timerNotifications,
      workoutReminders,
    };
    localStorage.setItem('striveSettings', JSON.stringify(settings));
  }, [weightUnit, weightIncrement, trackingMode, autoStartTimer, timerNotifications, workoutReminders]);

  return (
    <SettingsContext.Provider
      value={{
        weightUnit,
        weightIncrement,
        trackingMode,
        autoStartTimer,
        timerNotifications,
        workoutReminders,
        setWeightUnit,
        setWeightIncrement,
        setTrackingMode,
        setAutoStartTimer,
        setTimerNotifications,
        setWorkoutReminders,
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
