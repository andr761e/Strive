import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export function getSetTypeStyles(type: SetType) {
  switch (type) {
    case 'warmup':
      return {
        selectedCard: 'set-type-option set-type-warmup',
        selectedIcon: 'set-type-icon',
        selectedDescription: 'set-type-description',
        dot: 'set-type-dot',
        compact: 'set-type-compact set-type-warmup',
      };
    case 'drop':
      return {
        selectedCard: 'set-type-option set-type-drop',
        selectedIcon: 'set-type-icon',
        selectedDescription: 'set-type-description',
        dot: 'set-type-dot',
        compact: 'set-type-compact set-type-drop',
      };
    case 'failure':
      return {
        selectedCard: 'set-type-option set-type-failure',
        selectedIcon: 'set-type-icon',
        selectedDescription: 'set-type-description',
        dot: 'set-type-dot',
        compact: 'set-type-compact set-type-failure',
      };
    default:
      return {
        selectedCard: 'set-type-option set-type-normal',
        selectedIcon: 'set-type-icon',
        selectedDescription: 'set-type-description',
        dot: 'set-type-dot',
        compact: 'set-type-compact',
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
                    : 'set-type-option-unselected'
                }`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isSelected ? styles.selectedIcon : 'set-type-icon-unselected'
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
