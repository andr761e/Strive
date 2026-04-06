import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { progressDataBenchPress, progressDataSquat, muscleAnalysis } from '../data/mockData';
import { AnatomicalBodyDiagram } from '../components/AnatomicalBodyDiagram';

type TimeRange = '7d' | '30d' | '90d' | 'all';

export function ProgressPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedExercise, setSelectedExercise] = useState<'bench' | 'squat'>('bench');

  const progressData = selectedExercise === 'bench' ? progressDataBenchPress : progressDataSquat;

  const filterDataByTimeRange = (data: typeof progressData) => {
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, all: 9999 };
    const days = daysMap[timeRange];

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      const diffTime = now.getTime() - itemDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= days;
    });
  };

  const filteredData = filterDataByTimeRange(progressData);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-zinc-800">
        <h1 className="text-2xl mb-1">Progress</h1>
        <p className="text-zinc-400 text-sm">Track your training evolution</p>
      </div>

      {/* Time Range Filter */}
      <div className="px-4 py-4 flex gap-2">
        {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            {range === 'all' ? 'All Time' : range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Exercise Selector */}
      <div className="px-4 py-2 flex gap-2">
        <button
          onClick={() => setSelectedExercise('bench')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            selectedExercise === 'bench'
              ? 'bg-zinc-800 text-white border border-zinc-700'
              : 'bg-zinc-900 text-zinc-400'
          }`}
        >
          Bench Press
        </button>
        <button
          onClick={() => setSelectedExercise('squat')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            selectedExercise === 'squat'
              ? 'bg-zinc-800 text-white border border-zinc-700'
              : 'bg-zinc-900 text-zinc-400'
          }`}
        >
          Squat
        </button>
      </div>

      {/* Progress Chart */}
      <div className="px-4 py-4">
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h2 className="text-lg mb-4">
            {selectedExercise === 'bench' ? 'Bench Press' : 'Squat'} Progress
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Muscle Group Analysis */}
      <div className="px-4 py-2">
        <h2 className="text-lg mb-3">Muscle Group Analysis</h2>
        <div className="space-y-2">
          {muscleAnalysis.map((item, idx) => {
            let icon;
            let statusText;
            let statusColor;

            if (item.status === 'progressing') {
              icon = <TrendingUp className="w-5 h-5" />;
              statusText = 'Progressing well';
              statusColor = 'text-blue-400';
            } else if (item.status === 'balanced') {
              icon = <Minus className="w-5 h-5" />;
              statusText = 'Balanced';
              statusColor = 'text-green-400';
            } else if (item.status === 'watch') {
              icon = <TrendingDown className="w-5 h-5" />;
              statusText = 'Watch closely';
              statusColor = 'text-yellow-400';
            } else {
              icon = <TrendingDown className="w-5 h-5" />;
              statusText = 'Undertrained';
              statusColor = 'text-orange-400';
            }

            return (
              <div
                key={idx}
                className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-white">{item.muscle}</span>
                </div>
                <div className={`flex items-center gap-2 ${statusColor}`}>
                  {icon}
                  <span className="text-sm">{statusText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body Diagram with Color Coding */}
      <div className="px-4 py-4 mb-4">
        <h2 className="text-lg mb-3">Muscle Status Overview</h2>
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <AnatomicalBodyDiagram 
            onMuscleSelect={() => {}} 
            selectedMuscles={[]} 
            colorMode="status"
            muscleStatuses={muscleAnalysis.reduce((acc, item) => {
              acc[item.muscle] = { status: item.status, color: item.color };
              return acc;
            }, {} as Record<string, { status: string; color: string }>)}
          />
        </div>
      </div>

      {/* Most Improved & Plateaus */}
      <div className="px-4 py-2 space-y-4 mb-6">
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h3 className="text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Most Improved Exercises
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-zinc-300">Squat</span>
              <span className="text-green-400">+22% (90 → 110 kg)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-zinc-300">Overhead Press</span>
              <span className="text-green-400">+18% (50 → 59 kg)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-300">Pull-ups</span>
              <span className="text-green-400">+15% (10 → 11.5 reps)</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h3 className="text-white mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-400" />
            Potential Plateaus
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
              <span className="text-zinc-300">Bench Press</span>
              <span className="text-orange-400">Stable for 4 weeks</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-300">Barbell Curl</span>
              <span className="text-orange-400">Stable for 3 weeks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}