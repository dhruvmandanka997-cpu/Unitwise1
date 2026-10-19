import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, AlertCircle, CheckCircle2, Flame, X, Pause } from 'lucide-react';
import { LessonPlan } from '../../types/plan';

export interface ActivePlanItem {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
}

interface SwapActivePlanModalProps {
  isOpen: boolean;
  planToActivate: { id: string; title: string; subject: string; gradeLevel: string } | null;
  activePlans: ActivePlanItem[];
  onSwapConfirm: (deactivatePlanId: string, activatePlanId: string) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

export const SwapActivePlanModal: React.FC<SwapActivePlanModalProps> = ({
  isOpen,
  planToActivate,
  activePlans,
  onSwapConfirm,
  onClose,
  isSubmitting = false,
}) => {
  const [selectedDeactivateId, setSelectedDeactivateId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activePlans.length > 0 && !selectedDeactivateId) {
      setSelectedDeactivateId(activePlans[0].id);
    }
  }, [activePlans, selectedDeactivateId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !planToActivate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeactivateId) {
      setErrorMessage('Please select an active plan to deactivate.');
      return;
    }
    setErrorMessage(null);
    try {
      await onSwapConfirm(selectedDeactivateId, planToActivate.id);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to complete swap. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-plans-heading"
    >
      <div
        ref={modalRef}
        className="neu-card bg-[var(--surface)] max-w-lg w-full p-6 space-y-5 text-left shadow-neu-raised border border-[var(--border)] rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 id="swap-plans-heading" className="text-sm font-bold text-[var(--text)]">
                Active Limit Reached (3/3)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Choose a plan to deactivate to activate your new unit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg hover:bg-[var(--lavender-soft)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Explanation */}
        <div className="text-xs text-[var(--text-muted)] space-y-2">
          <p>
            Each educator account may have at most <strong className="text-[var(--text)]">3 active lesson plans</strong> at a time. To activate <strong className="text-[var(--primary)]">"{planToActivate.title}"</strong>, select which currently active unit to deactivate:
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {activePlans.map((ap) => {
              const isSelected = selectedDeactivateId === ap.id;
              return (
                <label
                  key={ap.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--lavender-soft)]/40 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--lavender-soft)]/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="deactivatePlan"
                    value={ap.id}
                    checked={isSelected}
                    onChange={() => setSelectedDeactivateId(ap.id)}
                    className="mt-0.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[var(--text)] truncate">
                        {ap.title}
                      </p>
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full shrink-0">
                        Will be Inactive
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {ap.subject} &bull; {ap.gradeLevel}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Safety Reminder */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1">
            <p className="font-semibold text-[var(--text)] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Zero data loss guarantee</span>
            </p>
            <p>
              The deactivated plan is saved safely as <strong>Inactive</strong>. None of your lesson sessions, rubrics, or references are touched, and you can reactivate it at any time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="neu-btn-secondary px-4 py-2 text-xs font-semibold text-[var(--text)] min-h-[44px] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDeactivateId}
              className="neu-btn-primary px-4 py-2 text-xs font-bold text-white bg-[var(--primary)] min-h-[44px] rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Swapping Plans...' : 'Swap & Activate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
