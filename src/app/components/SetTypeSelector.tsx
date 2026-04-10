import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

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
      <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Type</DialogTitle>
          <DialogDescription>
            Choose how to classify this set
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {setTypes.map((setType) => (
            <button
              key={setType.type}
              onClick={() => handleSelect(setType.type)}
              className={`w-full p-4 rounded-lg text-left transition-colors flex items-start gap-3 ${
                currentType === setType.type
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                currentType === setType.type
                  ? 'bg-blue-700'
                  : 'bg-zinc-900'
              }`}>
                {setType.icon}
              </div>
              <div className="flex-1">
                <div className="mb-0.5">{setType.label}</div>
                <div className={`text-xs ${
                  currentType === setType.type ? 'text-blue-100' : 'text-zinc-400'
                }`}>
                  {setType.description}
                </div>
              </div>
              {currentType === setType.type && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}