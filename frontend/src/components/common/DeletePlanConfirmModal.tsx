import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, RefreshCw } from 'lucide-react';
import { LessonPlan } from '../../types/plan';

export interface DeletePlanConfirmModalProps {
  isOpen: boolean;
  plan: LessonPlan | null;
  onConfirm: (plan: LessonPlan) => Promise<void>;
  onClose: () => void;
  triggerElement?: HTMLElement | null;
}

export const DeletePlanConfirmModal: React.FC<DeletePlanConfirmModalProps> = ({
  isOpen,
  plan,
  onConfirm,
  onClose,
  triggerElement,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setErrorMessage(null);
      // Cancel is focused by default so Enter does not delete by accident
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsDeleting(false);
      setErrorMessage(null);
      // Restore focus to triggering element when closed
      if (triggerElement && typeof triggerElement.focus === 'function') {
        setTimeout(() => triggerElement.focus(), 50);
      }
    }
  }, [isOpen, triggerElement]);

  // Handle keyboard: Escape cancels; Tab traps focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isDeleting) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        // Focus trap
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !plan) return null;

  const isActive = plan.status === 'active';

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent duplicate requests
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirm(plan);
      // onClose is called by parent upon successful deletion
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Delete request failed:', error);
      setErrorMessage(error?.message || 'Failed to delete plan. Please check your network and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
      role="presentation"
    >
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className="w-full max-w-lg neu-card p-6 sm:p-7 space-y-5 border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-2xl relative animate-fadeIn transition-colors"
      >
        {/* Close icon button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-4 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)] flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 id="delete-dialog-title" className="text-lg sm:text-xl font-bold text-[var(--text)] leading-snug">
              Delete this lesson plan?
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
              Permanent deletion confirmation
            </p>
          </div>
        </div>

        {/* Dialog Body Description */}
        <div id="delete-dialog-description" className="space-y-3 text-xs leading-relaxed text-[var(--text-muted)]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 space-y-1">
            <p className="font-bold text-[var(--text)] text-sm break-words">
              {plan.title}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-[var(--primary)]">{plan.subject}</span>
              <span>&bull;</span>
              <span>{plan.gradeLevel}</span>
              <span>&bull;</span>
              <span>{plan.durationWeeks} weeks</span>
              {isActive && (
                <>
                  <span>&bull;</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Currently Active</span>
                </>
              )}
            </p>
          </div>

          <p className="text-xs text-[var(--text)] font-medium">
            Are you sure you want to permanently delete &ldquo;{plan.title}&rdquo;? This action cannot be undone.
          </p>

          {/* Active plan slot explanation */}
          {isActive && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 p-3 flex items-start gap-2.5 text-emerald-900 dark:text-emerald-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">
                <span className="font-bold">This plan is active.</span> Deleting it frees one active-plan slot.
              </p>
            </div>
          )}

          {/* Inline Error with Retry Option */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 p-3.5 space-y-2 text-xs text-rose-800 dark:text-rose-200"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed flex-1">{errorMessage}</p>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-200 bg-white dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer min-h-[44px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                  <span>Retry Deletion</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Buttons Action Area: Cancel focused by default */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="neu-btn-secondary w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors min-h-[44px] cursor-pointer"
          >
            Cancel
          </button>

          <button
            ref={deleteButtonRef}
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="neu-btn-danger w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white transition-all min-h-[44px] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
