import { Minus, Plus } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface WeightInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function WeightInput({ value, onChange, disabled }: WeightInputProps) {
  const { weightIncrement } = useSettings();

  const handleIncrement = () => {
    onChange(Number((value + weightIncrement).toFixed(1)));
  };

  const handleDecrement = () => {
    const newValue = value - weightIncrement;
    onChange(Number((newValue < 0 ? 0 : newValue).toFixed(1)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(isNaN(newValue) ? 0 : newValue);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleDecrement}
        disabled={disabled || value <= 0}
        className={`p-1 rounded transition-colors ${
          disabled
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
        }`}
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="number"
        step={weightIncrement}
        value={value}
        disabled={disabled}
        onChange={handleInputChange}
        className={`w-16 border rounded px-2 py-1 text-center text-sm text-white ${
          disabled
            ? 'bg-zinc-800 border-zinc-700 cursor-not-allowed'
            : 'bg-zinc-800 border-zinc-700'
        }`}
      />
      <button
        onClick={handleIncrement}
        disabled={disabled}
        className={`p-1 rounded transition-colors ${
          disabled
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
        }`}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}
