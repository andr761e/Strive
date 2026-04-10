import { useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown, Check, AlertCircle } from 'lucide-react';

interface BottomInputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  value: number;
  onChange: (value: number) => void;
  label: string;
  step: number;
  unit?: string;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
}

export function BottomInputPanel({
  isOpen,
  onClose,
  value,
  onChange,
  label,
  step,
  unit = '',
  min = 0,
  max = 999,
  allowDecimal = false,
}: BottomInputPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const isValid = value > 0;

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(Number(newValue.toFixed(1)));
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(Number(newValue.toFixed(1)));
  };

  const handleNumberClick = (num: number) => {
    const currentString = value.toString();
    
    // If current value is 0, replace it
    if (value === 0) {
      onChange(num);
      return;
    }
    
    const newString = currentString + num.toString();
    const newValue = parseFloat(newString);
    
    if (newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecimalClick = () => {
    if (!allowDecimal) return;
    
    const currentString = value.toString();
    
    // Don't add decimal if already exists
    if (currentString.includes('.')) return;
    
    // Add decimal point
    const newString = currentString + '.';
    onChange(parseFloat(newString));
  };

  const handleBackspace = () => {
    const currentString = value.toString();
    if (currentString.length <= 1) {
      onChange(0);
    } else {
      const newString = currentString.slice(0, -1);
      const newValue = parseFloat(newString);
      onChange(isNaN(newValue) ? 0 : newValue);
    }
  };

  const handleClear = () => {
    onChange(0);
  };

  const handleDone = () => {
    // Always allow closing, regardless of value
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50 rounded-t-2xl animate-slide-up">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-white text-sm">{label}</h3>
              <p className="text-xs text-zinc-400">Tap numbers or use controls</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Value Display */}
          <div className="px-4 py-6 bg-zinc-950/50">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleDecrement}
                className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center transition-colors active:scale-95"
              >
                <ChevronDown className="w-6 h-6 text-white" />
              </button>
              
              <div className="flex-1 max-w-[180px]">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    if (newValue <= max) {
                      onChange(newValue);
                    }
                  }}
                  className={`w-full text-center text-4xl font-bold bg-transparent border-b-2 outline-none ${
                    isValid
                      ? 'text-white border-zinc-700 focus:border-blue-500'
                      : 'text-red-400 border-red-500'
                  }`}
                />
                {unit && (
                  <p className="text-center text-sm text-zinc-400 mt-1">{unit}</p>
                )}
                {!isValid && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Must be greater than 0</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleIncrement}
                className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center transition-colors active:scale-95"
              >
                <ChevronUp className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Number Pad */}
          <div className="px-4 py-4">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="h-14 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white text-xl transition-colors active:scale-95"
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleClear}
                className="h-14 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 text-sm transition-colors active:scale-95"
              >
                Clear
              </button>
              <button
                onClick={() => handleNumberClick(0)}
                className="h-14 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white text-xl transition-colors active:scale-95"
              >
                0
              </button>
              {allowDecimal ? (
                <button
                  onClick={handleDecimalClick}
                  disabled={value.toString().includes('.')}
                  className={`h-14 rounded-xl text-white text-xl transition-colors active:scale-95 ${
                    value.toString().includes('.')
                      ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  .
                </button>
              ) : (
                <button
                  onClick={handleBackspace}
                  className="h-14 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 text-sm transition-colors active:scale-95"
                >
                  ⌫
                </button>
              )}
            </div>
            {allowDecimal && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="col-span-2"></div>
                <button
                  onClick={handleBackspace}
                  className="h-14 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 text-sm transition-colors active:scale-95"
                >
                  ⌫
                </button>
              </div>
            )}
          </div>

          {/* Done Button */}
          <div className="px-4 pb-6">
            <button
              onClick={handleDone}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Check className="w-5 h-5" />
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}