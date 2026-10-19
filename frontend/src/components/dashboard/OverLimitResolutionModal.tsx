import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Pause, 
  Layers, 
  X, 
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export interface ActivePlanItem {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
}

interface OverLimitResolutionModalProps {
  isOpen: boolean;
  activePlans: ActivePlanItem[];
  maxActivePlans?: number;
  onResolve: (keepPlanIds: string[], expectedActivePlanIds: string[]) => Promise<void>;
  onClose: () => void;
  onViewInactivePlans?: () => void;
}

export const OverLimitResolutionModal: React.FC<OverLimitResolutionModalProps> = ({
  isOpen,
  activePlans,
  maxActivePlans = 3,
  onResolve,
  onClose,
  onViewInactivePlans,
}) => {
  const [selectedKeepIds, setSelectedKeepIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ keptCount: number; deactivatedCount: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize selection: pre-select the first `maxActivePlans` plans
  useEffect(() => {
    if (isOpen && activePlans.length > 0) {
      const initial = activePlans.slice(0, maxActivePlans).map(p => p.id);
      setSelectedKeepIds(initial);
      setErrorMessage(null);
      setSuccessInfo(null);
    }
  }, [isOpen, activePlans, maxActivePlans]);

  // Trap escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const toggleKeep = (id: string) => {
    if (selectedKeepIds.includes(id)) {
      setSelectedKeepIds(selectedKeepIds.filter(item => item !== id));
    } else {
      if (selectedKeepIds.length >= maxActivePlans) {
        // Can't select more than maxActivePlans
        return;
      }
      setSelectedKeepIds([...selectedKeepIds, id]);
    }
  };

  const keepCount = selectedKeepIds.length;
  const totalCount = activePlans.length;
  const deactivateCount = totalCount - keepCount;
  const isValid = keepCount >= 1 && keepCount <= maxActivePlans;

  const plansToDeactivate = activePlans.filter(p => !selectedKeepIds.includes(p.id));
  const plansToKeep = activePlans.filter(p => selectedKeepIds.includes(p.id));

  const handleConfirm = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const expectedActivePlanIds = activePlans.map(p => p.id);

    try {
      await onResolve(selectedKeepIds, expectedActivePlanIds);
      setSuccessInfo({ keptCount: keepCount, deactivatedCount: deactivateCount });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to resolve active plans. The active plan list may have changed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="over-limit-title"
    >
      <div
        ref={modalRef}
        className="neu-card bg-[var(--surface)] max-w-xl w-full p-6 space-y-5 text-left shadow-neu-raised border border-[var(--border)] rounded-2xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="over-limit-title" className="text-base font-bold text-[var(--text)]">
                Active Plan Limit: Action Needed
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                You have {totalCount} active plans (maximum limit is {maxActivePlans})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg hover:bg-[var(--lavender-soft)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successInfo ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Active plans successfully updated!</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                You now have {successInfo.keptCount} active {successInfo.keptCount === 1 ? 'plan' : 'plans'}. {successInfo.deactivatedCount} {successInfo.deactivatedCount === 1 ? 'plan was' : 'plans were'} safely moved to <strong>Inactive</strong>. All content, assessments, and references remain intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {onViewInactivePlans && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewInactivePlans();
                  }}
                  className="neu-btn-secondary px-4 py-2 text-xs font-semibold text-[var(--primary)] min-h-[44px] rounded-xl"
                >
                  View Inactive Plans
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="neu-btn-primary px-5 py-2 text-xs font-bold text-white bg-[var(--primary)] min-h-[44px] rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Normal Selection Form */
          <>
            <div className="text-xs text-[var(--text-muted)] space-y-2">
              <p>
                Each educator account may have at most <strong className="text-[var(--text)]">{maxActivePlans} active plans</strong>. None of your plans have been cancelled or deleted automatically. Please select <strong>up to {maxActivePlans}</strong> plans to keep active.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Selection Status Summary */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-[var(--border)] text-xs">
              <span className="font-semibold text-[var(--text)]">
                Selected: <span className={keepCount > maxActivePlans ? 'text-rose-600 font-bold' : 'text-[var(--primary)] font-bold'}>{keepCount} / {maxActivePlans}</span>
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {isValid ? `Keep ${keepCount}, deactivate ${deactivateCount}` : 'Please select 1 to 3 plans'}
              </span>
            </div>

            {/* Checklist of Active Plans */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activePlans.map((plan) => {
                const isSelected = selectedKeepIds.includes(plan.id);
                const canSelectMore = selectedKeepIds.length < maxActivePlans;

                return (
                  <label
                    key={plan.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--lavender-soft)]/40 shadow-sm'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--lavender-soft)]/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isSelected && !canSelectMore}
                      onChange={() => toggleKeep(plan.id)}
                      className="mt-0.5 rounded text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[var(--text)] truncate">
                          {plan.title}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                            isSelected
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                              : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isSelected ? 'Keep Active' : 'Will Deactivate'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {plan.subject} &bull; {plan.gradeLevel}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Reassurance & Guarantee */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1">
              <p className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Zero data loss guarantee</span>
              </p>
              <p>
                Deactivated plans are preserved in full and marked as <strong>Inactive</strong>. They are never deleted, and you can reactivate any of them whenever an active slot is free.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="neu-btn-secondary px-4 py-2 text-xs font-semibold text-[var(--text)] min-h-[44px] rounded-xl"
              >
                Cancel (Keep As Is)
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isValid || isSubmitting}
                className="neu-btn-primary px-5 py-2 text-xs font-bold text-white bg-[var(--primary)] min-h-[44px] rounded-xl flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting 
                    ? 'Updating Plans...' 
                    : `Confirm (Keep ${keepCount}, Deactivate ${deactivateCount})`
                  }
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
