import React, { useEffect, useRef } from 'react';
import { Pause, AlertCircle, X } from 'lucide-react';

interface DeactivateConfirmModalProps {
  isOpen: boolean;
  planId: string;
  planTitle: string;
  onConfirm: (planId: string) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

export const DeactivateConfirmModal: React.FC<DeactivateConfirmModalProps> = ({
  isOpen,
  planId,
  planTitle,
  onConfirm,
  onClose,
  isSubmitting = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button on open
    setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-plan-title"
    >
      <div
        ref={modalRef}
        className="neu-card bg-[var(--surface)] max-w-md w-full p-6 space-y-4 text-left shadow-neu-raised border border-[var(--border)] rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-[var(--text)]">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Pause className="w-4 h-4" />
            </div>
            <h3 id="deactivate-plan-title" className="text-sm font-bold">
              Deactivate Lesson Plan?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg hover:bg-[var(--lavender-soft)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-[var(--text)] leading-relaxed">
          <p>
            Are you sure you want to deactivate <strong className="text-[var(--primary)] font-bold">"{planTitle}"</strong>?
          </p>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[var(--border)] space-y-1.5 text-[var(--text-muted)]">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[var(--text)]">Nothing will be deleted.</p>
                <p className="mt-0.5">
                  All lesson activities, standards alignments, assessments, and reference materials remain completely safe. This frees up an active plan slot, and you can reactivate this plan at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="neu-btn-secondary px-4 py-2 text-xs font-semibold text-[var(--text)] min-h-[44px] rounded-xl"
          >
            Keep Active
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onConfirm(planId)}
            disabled={isSubmitting}
            className="neu-btn-primary px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 min-h-[44px] rounded-xl flex items-center gap-1.5"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Deactivating...' : 'Deactivate Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
