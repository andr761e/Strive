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
      <DialogContent className="max-w-sm">
        {title && (
          <DialogTitle className="text-lg text-white mb-2">{title}</DialogTitle>
        )}
        <DialogDescription className="py-4 text-zinc-300 text-center leading-relaxed">
          {message}
        </DialogDescription>
        <div className="flex justify-center mt-2">
          <button
            onClick={onClose}
            className="premium-button premium-button-primary w-32 py-2.5"
          >
            OK
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
