import React, { useState } from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { LessonPlan } from '../../types/plan';

interface WeeklyTimelinePanelProps {
  plans: LessonPlan[];
  onSelectPlan: (plan: LessonPlan) => void;
  onOpenWizard: () => void;
}

export const WeeklyTimelinePanel: React.FC<WeeklyTimelinePanelProps> = ({
  plans,
  onSelectPlan,
  onOpenWizard,
}) => {
  // Select active plan to display schedule from
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    return plans.length > 0 ? plans[0].id : '';
  });

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || null;

  if (!activePlan || !activePlan.weeklyPlans || activePlan.weeklyPlans.length === 0) {
    return (
      <div className="bg-white dark:bg-[var(--surface)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-6 space-y-3 shadow-card">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[var(--lavender-soft)] dark:bg-[var(--lavender-soft)] text-[var(--primary)] dark:text-[var(--accent)]">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text)] dark:text-[var(--text)]">
            Teaching Timeline
          </h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)] leading-relaxed">
          No weekly lesson schedules loaded yet. Generate a curriculum sequence to view your upcoming day-by-day lesson timeline.
        </p>
        <button
          onClick={onOpenWizard}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_4px_14px_rgba(37, 99, 235,0.22)] hover:-translate-y-0.5 transition-all"
        >
          Create First Unit
        </button>
      </div>
    );
  }

  // Take Week 1
  const week1 = activePlan.weeklyPlans[0];
  const sessions = week1?.sessions || [];

  return (
    <div className="bg-white dark:bg-[var(--surface)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-card transition-all">
      {/* Header with Plan Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] dark:border-[var(--border)] pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[var(--lavender-soft)] dark:bg-[var(--lavender-soft)] text-[var(--primary)] dark:text-[var(--accent)] shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[var(--text)] dark:text-[var(--text)] truncate">
              Week 1: {week1.theme || 'Foundational Exploration'}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] dark:text-[var(--text-muted)] truncate">
              {activePlan.subject} &bull; {activePlan.gradeLevel}
            </p>
          </div>
        </div>

        {plans.length > 1 && (
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="text-[11px] font-medium border border-[var(--border)] dark:border-[var(--border)] rounded-xl px-2.5 py-1 bg-white dark:bg-[var(--surface)] text-[var(--text)] dark:text-[var(--text)] focus:outline-none focus:border-[var(--primary)] shrink-0 max-w-[130px] truncate"
            title="Switch unit timeline"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Clean Timeline Nodes */}
      <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--border)] dark:before:bg-[var(--border)]">
        {sessions.map((session, sIdx) => {
          const bloomObjective = session.objectives?.[0]?.bloomLevel || 'Concept';

          return (
            <div
              key={session.id || sIdx}
              onClick={() => onSelectPlan(activePlan)}
              className="group relative flex items-start gap-3 pl-1 cursor-pointer transition-all"
            >
              {/* Timeline Indicator Dot */}
              <div className="z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-[var(--surface)] border-2 border-[var(--primary)] dark:border-[var(--accent)] group-hover:scale-110 group-hover:bg-[var(--lavender-soft)] dark:group-hover:bg-[var(--surface)] transition-all shadow-xs">
                <span className="text-[10px] font-bold text-[var(--primary)] dark:text-[var(--accent)]">
                  {session.dayNumber || sIdx + 1}
                </span>
              </div>

              {/* Session Content Box */}
              <div className="flex-1 rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-white dark:bg-[var(--surface)] p-3.5 group-hover:border-[var(--primary)]/50 group-hover:shadow-[0_4px_16px_rgba(37, 99, 235,0.08)] group-hover:-translate-y-0.5 transition-all">
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="font-semibold text-[var(--primary)] dark:text-[var(--accent)]">
                    Day {session.dayNumber || sIdx + 1}
                  </span>
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                    <Clock className="w-3 h-3" />
                    <span>{session.durationMinutes || activePlan.classDurationMinutes}m</span>
                  </div>
                </div>

                <h4 className="mt-1 text-xs font-semibold text-[var(--text)] dark:text-[var(--text)] group-hover:text-[var(--primary)] dark:group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                  {session.title}
                </h4>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--lavender-soft)] dark:bg-[var(--lavender-soft)] text-[var(--primary)] dark:text-[var(--accent)] font-medium border border-[var(--primary)]/20">
                    {bloomObjective}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[var(--primary)] dark:text-[var(--accent)] font-semibold group-hover:translate-x-0.5 transition-transform">
                    Open lesson
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link to view full plan workspace */}
      <div className="pt-2 text-center">
        <button
          onClick={() => onSelectPlan(activePlan)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] dark:text-[var(--accent)] hover:text-[var(--primary-hover)] hover:underline"
        >
          View all {activePlan.durationWeeks} weeks in workspace
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
