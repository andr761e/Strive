import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export function getSetTypeStyles(type: SetType) {
  switch (type) {
    case 'warmup':
      return {
        selectedCard: 'bg-amber-500/14 border-amber-400/40 text-white',
        selectedIcon: 'bg-amber-500/25 text-amber-100',
        selectedDescription: 'text-amber-100',
        dot: 'bg-amber-300',
        compact: 'border-amber-400/35 bg-amber-500/14 text-amber-200',
      };
    case 'drop':
      return {
        selectedCard: 'bg-violet-500/14 border-violet-400/40 text-white',
        selectedIcon: 'bg-violet-500/25 text-violet-100',
        selectedDescription: 'text-violet-100',
        dot: 'bg-violet-300',
        compact: 'border-violet-400/35 bg-violet-500/14 text-violet-200',
      };
    case 'failure':
      return {
        selectedCard: 'bg-red-500/14 border-red-400/40 text-white',
        selectedIcon: 'bg-red-500/25 text-red-100',
        selectedDescription: 'text-red-100',
        dot: 'bg-red-300',
        compact: 'border-red-400/35 bg-red-500/14 text-red-200',
      };
    default:
      return {
        selectedCard: 'bg-blue-500/15 border-blue-400/40 text-white',
        selectedIcon: 'bg-blue-500/25 text-blue-100',
        selectedDescription: 'text-blue-100',
        dot: 'bg-white',
        compact: 'border-white/10 bg-white/5 text-zinc-300',
      };
  }
}

interface SetTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: SetType;
  onSelectType: (type: SetType) => void;
}

export function SetTypeSelector({
  isOpen,
  onClose,
  currentType,
  onSelectType,
}: SetTypeSelectorProps) {
  const setTypes = [
    { type: 'normal' as SetType, label: 'Normal Set', description: 'Standard working set', icon: '#' },
    { type: 'warmup' as SetType, label: 'Warm-Up', description: 'Preparation set', icon: 'W' },
    { type: 'drop' as SetType, label: 'Drop Set', description: 'Reduced weight continuation', icon: 'D' },
    { type: 'failure' as SetType, label: 'Failure Set', description: 'Taken to absolute failure', icon: 'F' },
  ];

  const handleSelect = (type: SetType) => {
    onSelectType(type);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Type</DialogTitle>
          <DialogDescription>
            Choose how to classify this set
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {setTypes.map((setType) => {
            const isSelected = currentType === setType.type;
            const styles = getSetTypeStyles(setType.type);

            return (
              <button
                key={setType.type}
                onClick={() => handleSelect(setType.type)}
                className={`w-full p-4 rounded-xl text-left transition-colors flex items-start gap-3 border ${
                  isSelected
                    ? styles.selectedCard
                    : 'bg-white/[0.035] hover:bg-white/[0.06] border-white/10 text-white'
                }`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isSelected ? styles.selectedIcon : 'bg-black/20 text-zinc-300'
                }`}>
                  {setType.icon}
                </div>
                <div className="flex-1">
                  <div className="mb-0.5">{setType.label}</div>
                  <div className={`text-xs ${isSelected ? styles.selectedDescription : 'text-zinc-400'}`}>
                    {setType.description}
                  </div>
                </div>
                {isSelected && (
                  <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
