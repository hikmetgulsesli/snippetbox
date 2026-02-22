import { AlertTriangle } from 'lucide-react';

interface DeleteModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  isDeleting?: boolean;
}

export function DeleteModal({ title, message, onConfirm, onCancel, onClose, isDeleting }: DeleteModalProps) {
  const handleClose = onClose || onCancel;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] shadow-2xl animate-slide-up">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[var(--error)]/10 flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-[var(--error)]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-[var(--text)]">
                {title}
              </h3>
              <p className="text-[var(--text-muted)] mt-2">{message}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="btn bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
