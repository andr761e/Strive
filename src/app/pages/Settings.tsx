import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { Switch } from '../components/ui/switch';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { userProfile } from '../data/mockData';

export function SettingsPage() {
  const navigate = useNavigate();
  const {
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
  } = useSettings();

  const [editStatsOpen, setEditStatsOpen] = useState(false);
  const [bodyWeight, setBodyWeight] = useState(userProfile.weight.toString());
  const [height, setHeight] = useState(userProfile.height.toString());
  const [experience, setExperience] = useState(userProfile.experience);
  const [goal, setGoal] = useState(userProfile.goal);

  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
  const goals = ['Strength', 'Hypertrophy', 'Endurance', 'General Fitness', 'Weight Loss'];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-zinc-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl flex-1">Settings & Preferences</h1>
        </div>
      </div>

      {/* Units Section */}
      <div className="px-4 py-4">
        <h2 className="text-sm text-zinc-400 mb-3">UNITS</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setWeightUnit('kg')}
            className={`w-full p-4 flex items-center justify-between border-b border-zinc-800 transition-colors ${
              weightUnit === 'kg' ? 'bg-zinc-800' : ''
            }`}
          >
            <span className="text-white">Kilograms (kg)</span>
            {weightUnit === 'kg' && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setWeightUnit('lbs')}
            className={`w-full p-4 flex items-center justify-between transition-colors ${
              weightUnit === 'lbs' ? 'bg-zinc-800' : ''
            }`}
          >
            <span className="text-white">Pounds (lbs)</span>
            {weightUnit === 'lbs' && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Weight Increment Section */}
      <div className="px-4 py-4">
        <h2 className="text-sm text-zinc-400 mb-3">DEFAULT WEIGHT INCREMENT</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setWeightIncrement(2.5)}
            className={`w-full p-4 flex items-center justify-between border-b border-zinc-800 transition-colors ${
              weightIncrement === 2.5 ? 'bg-zinc-800' : ''
            }`}
          >
            <span className="text-white">2.5 {weightUnit}</span>
            {weightIncrement === 2.5 && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setWeightIncrement(5)}
            className={`w-full p-4 flex items-center justify-between border-b border-zinc-800 transition-colors ${
              weightIncrement === 5 ? 'bg-zinc-800' : ''
            }`}
          >
            <span className="text-white">5 {weightUnit}</span>
            {weightIncrement === 5 && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setWeightIncrement(10)}
            className={`w-full p-4 flex items-center justify-between transition-colors ${
              weightIncrement === 10 ? 'bg-zinc-800' : ''
            }`}
          >
            <span className="text-white">10 {weightUnit}</span>
            {weightIncrement === 10 && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tracking Mode Section */}
      <div className="px-4 py-4">
        <h2 className="text-sm text-zinc-400 mb-3">TRACKING MODE</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setTrackingMode('rir')}
            className={`w-full p-4 flex items-center justify-between border-b border-zinc-800 transition-colors ${
              trackingMode === 'rir' ? 'bg-zinc-800' : ''
            }`}
          >
            <div>
              <div className="text-white mb-1">RIR (Reps in Reserve)</div>
              <div className="text-xs text-zinc-400">Track how many reps you had left</div>
            </div>
            {trackingMode === 'rir' && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setTrackingMode('rpe')}
            className={`w-full p-4 flex items-center justify-between border-b border-zinc-800 transition-colors ${
              trackingMode === 'rpe' ? 'bg-zinc-800' : ''
            }`}
          >
            <div>
              <div className="text-white mb-1">RPE (Rate of Perceived Exertion)</div>
              <div className="text-xs text-zinc-400">Track effort on a scale of 1-10</div>
            </div>
            {trackingMode === 'rpe' && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setTrackingMode('both')}
            className={`w-full p-4 flex items-center justify-between transition-colors ${
              trackingMode === 'both' ? 'bg-zinc-800' : ''
            }`}
          >
            <div>
              <div className="text-white mb-1">Both RIR & RPE</div>
              <div className="text-xs text-zinc-400">Track both metrics</div>
            </div>
            {trackingMode === 'both' && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Timer Section */}
      <div className="px-4 py-4">
        <h2 className="text-sm text-zinc-400 mb-3">TIMER</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-zinc-800">
            <div>
              <div className="text-white mb-1">Auto-start Timer</div>
              <div className="text-xs text-zinc-400">Start timer when workout begins</div>
            </div>
            <Switch
              checked={autoStartTimer}
              onCheckedChange={setAutoStartTimer}
            />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-white mb-1">Timer Notifications</div>
              <div className="text-xs text-zinc-400">Show notifications during workout</div>
            </div>
            <Switch
              checked={timerNotifications}
              onCheckedChange={setTimerNotifications}
            />
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="px-4 py-4">
        <h2 className="text-sm text-zinc-400 mb-3">NOTIFICATIONS</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-white mb-1">Workout Reminders</div>
              <div className="text-xs text-zinc-400">Get reminders to stay consistent</div>
            </div>
            <Switch
              checked={workoutReminders}
              onCheckedChange={setWorkoutReminders}
            />
          </div>
        </div>
      </div>

      {/* Personal Stats Section */}
      <div className="px-4 py-4">
        <h2 className="text-sm text-zinc-400 mb-3">PERSONAL STATS</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setEditStatsOpen(true)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="text-left">
              <div className="text-white mb-1">Body Stats & Goals</div>
              <div className="text-xs text-zinc-400">
                {bodyWeight} kg • {height} cm • {experience}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Data & Privacy Section */}
      <div className="px-4 py-4">
        <h2 className="text-sm text-zinc-400 mb-3">DATA & PRIVACY</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <button className="w-full p-4 flex items-center justify-between border-b border-zinc-800">
            <span className="text-white">Export Workout Data</span>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between border-b border-zinc-800">
            <span className="text-white">Clear Cache</span>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between">
            <span className="text-white">Privacy Policy</span>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Account Section */}
      <div className="px-4 py-4">
        <h2 className="text-sm text-zinc-400 mb-3">ACCOUNT</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <button className="w-full p-4 flex items-center justify-between border-b border-zinc-800">
            <span className="text-white">Change Email</span>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between border-b border-zinc-800">
            <span className="text-white">Change Password</span>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between text-red-400">
            <span>Delete Account</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="px-4 py-4 mb-6">
        <div className="text-center text-sm text-zinc-500">
          <p>Strive v1.0.0</p>
          <p className="mt-1">© 2026 Strive Fitness</p>
        </div>
      </div>

      {/* Edit Stats Dialog */}
      <Dialog open={editStatsOpen} onOpenChange={setEditStatsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Stats</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-zinc-400">Body Weight</label>
              <input
                type="number"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-white"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-zinc-400">Height</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-white"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-zinc-400">Experience Level</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-white"
              >
                {experienceLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-zinc-400">Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 text-white"
              >
                {goals.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}