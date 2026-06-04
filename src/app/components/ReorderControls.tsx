import { ArrowDown, ArrowUp } from 'lucide-react';

interface ReorderControlsProps {
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md';
  className?: string;
}

export function ReorderControls({
  label,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  orientation = 'vertical',
  size = 'sm',
  className = '',
}: ReorderControlsProps) {
  const buttonSize = size === 'sm' ? 'h-7 w-8' : 'h-8 w-8';

  return (
    <div className={`${orientation === 'vertical' ? 'flex flex-col gap-1' : 'flex gap-1'} ${className}`}>
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        className={`premium-button premium-button-secondary flex ${buttonSize} min-h-0 items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-35`}
        aria-label={`Move ${label} up`}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        className={`premium-button premium-button-secondary flex ${buttonSize} min-h-0 items-center justify-center p-0 disabled:cursor-not-allowed disabled:opacity-35`}
        aria-label={`Move ${label} down`}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
