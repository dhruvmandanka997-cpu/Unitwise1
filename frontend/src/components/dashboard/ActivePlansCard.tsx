import React from 'react';
import { 
  Sparkles, 
  Flame, 
  ChevronRight, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  Layers,
  ArrowRight,
  BookOpen,
  X,
  Trash2
} from 'lucide-react';
import { LessonPlan } from '../../types/plan';
import { ActivePlanSummary } from '../../services/api';

interface ActivePlansCardProps {
  summary: ActivePlanSummary | null;
  plans: LessonPlan[];
  onSelectPlan: (plan: LessonPlan) => void;
  onOpenWizard: () => void;
  onViewLibrary?: (statusFilter?: string) => void;
  onDeactivatePlan: (planId: string, planTitle: string) => void;
  onDeletePlan?: (plan: LessonPlan, triggerEl?: HTMLElement) => void;
  onOpenOverLimitModal: () => void;
}

export const ActivePlansCard: React.FC<ActivePlansCardProps> = ({
  summary,
  plans,
  onSelectPlan,
  onOpenWizard,
  onViewLibrary,
  onDeactivatePlan,
  onDeletePlan,
  onOpenOverLimitModal,
}) => {
  const activeCount = summary?.activeCount ?? 0;
  const maxActive = summary?.maxActivePlans ?? 3;
  const isAtLimit = summary?.isAtLimit ?? (activeCount === maxActive);
  const isOverLimit = summary?.isOverLimit ?? (activeCount > maxActive);

  // Match active plans from the main plans array to get full objects
  const activePlanObjects = React.useMemo(() => {
    if (!summary?.activePlans) return [];
    return summary.activePlans.map((ap) => {
      const full = plans.find((p) => p.id === ap.id);
      return full || {
        id: ap.id,
        title: ap.title,
        subject: ap.subject,
        gradeLevel: ap.gradeLevel,
        curriculumFramework: 'General Standards',
        standardsFramework: '',
        durationWeeks: 1,
        sessionsPerWeek: 1,
        classDurationMinutes: 45,
        format: 'session_sequence' as const,
        unitOverview: '',
        unitObjectives: ['Objective'],
        prerequisiteKnowledge: [],
        studentNeeds: '',
        teachingMethods: [],
        weeklyPlans: [],
        finalAssessment: { title: '', type: '', description: '', rubric: [] },
        resourceList: [],
        references: [],
        referencesStatus: 'ready' as const,
        teacherNotes: '',
        status: 'active' as const,
        isDemo: false,
        createdAt: ap.updatedAt,
        updatedAt: ap.updatedAt,
      };
    });
  }, [summary, plans]);

  return (
    <div className="neu-card p-5 space-y-4 border border-[var(--border)] bg-[var(--surface)] w-full min-w-0">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-[var(--lavender-soft)] flex items-center justify-center text-[var(--primary)] shrink-0">
            <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-[var(--text)] truncate">
              Active Lesson Plans
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              Units currently under active instructional focus
            </p>
          </div>
        </div>

        {/* Dynamic Status Counter Badge */}
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            isOverLimit
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : isAtLimit
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          }`}
          title={`${activeCount} of maximum ${maxActive} active plans`}
        >
          {isOverLimit ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : isAtLimit ? (
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
          <span className="whitespace-nowrap">
            {activeCount}/{maxActive} Active
          </span>
          {isOverLimit && <span className="font-extrabold ml-0.5 whitespace-nowrap">· Action Needed</span>}
          {isAtLimit && !isOverLimit && <span className="font-normal ml-0.5 whitespace-nowrap">(Full)</span>}
        </span>
      </div>

      {/* Over-Limit Banner Alert */}
      {isOverLimit && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3.5 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 min-w-0 flex-1">
              <p className="font-bold text-rose-900 dark:text-rose-200">
                You have {activeCount} active plans (maximum limit is {maxActive}).
              </p>
              <p className="text-rose-700 dark:text-rose-300 leading-relaxed text-[11px]">
                All your active plans remain fully editable. However, you cannot activate or create additional plans until you choose which {maxActive} to keep active.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenOverLimitModal}
            className="neu-btn-primary w-full text-xs py-2 font-bold flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
          >
            <span>Choose {maxActive} Plans to Keep</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Plans List */}
      {activePlanObjects.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[var(--border)] p-5 text-center space-y-2">
          <BookOpen className="w-6 h-6 mx-auto text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">
            No active lesson plans. You can have up to 3 plans active at a time.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <button
              onClick={() => {
                if (onViewLibrary) onViewLibrary('draft');
              }}
              className="neu-btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] cursor-pointer"
            >
              <span>Activate a Draft</span>
            </button>
            <button
              onClick={onOpenWizard}
              className="neu-btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
            >
              <span>Create New</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activePlanObjects.map((plan) => (
            <div
              key={plan.id}
              className="group p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/60 transition-all shadow-sm space-y-3"
            >
              {/* Top: Plan Information Row with generous space */}
              <div
                onClick={() => onSelectPlan(plan)}
                className="flex items-start gap-3 min-w-0 cursor-pointer"
                title={`Open "${plan.title}"`}
              >
                {/* Active Indicator Icon */}
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 
                    className="text-xs sm:text-sm font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug line-clamp-2"
                    title={plan.title}
                  >
                    {plan.title}
                  </h4>
                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="font-semibold text-[var(--text)]">{plan.subject}</span>
                    <span>&bull;</span>
                    <span>{plan.gradeLevel}</span>
                    {plan.durationWeeks ? (
                      <>
                        <span>&bull;</span>
                        <span>{plan.durationWeeks} {plan.durationWeeks === 1 ? 'wk' : 'wks'}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Bottom: Dedicated Action Bar */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)]/70 gap-2">
                {/* Primary Open CTA */}
                <button
                  type="button"
                  onClick={() => onSelectPlan(plan)}
                  className="neu-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--primary)] hover:bg-[var(--lavender-soft)] min-h-[34px] rounded-lg cursor-pointer"
                  title={`Open "${plan.title}" in Lesson Plan Editor`}
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Secondary Actions: Deactivate & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDeactivatePlan(plan.id, plan.title)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors min-h-[34px] cursor-pointer"
                    title="Deactivate plan (keeps all content safe in library; frees active slot)"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Deactivate</span>
                  </button>

                  <div className="h-4 w-[1px] bg-[var(--border)] mx-0.5" aria-hidden="true" />

                  <button
                    type="button"
                    onClick={(e) => onDeletePlan?.(plan, e.currentTarget)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-lg transition-colors min-h-[34px] cursor-pointer"
                    title="Permanently delete this active lesson plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)] gap-2 flex-wrap sm:flex-nowrap">
        <span className="font-medium">
          Capacity: <strong className="text-[var(--text)]">{Math.max(0, maxActive - activeCount)}</strong> slot(s) free
        </span>
        <button
          type="button"
          onClick={() => {
            if (onViewLibrary) onViewLibrary('cancelled');
          }}
          className="text-xs font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>View inactive plans</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
