import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function InfoModal({ isOpen, onClose, title, message }: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-sm">
        {title && (
          <DialogTitle className="text-lg text-white mb-2">{title}</DialogTitle>
        )}
        <DialogDescription className="py-4 text-zinc-300 text-center leading-relaxed">
          {message}
        </DialogDescription>
        <div className="flex justify-center mt-2">
          <button
            onClick={onClose}
            className="w-32 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}