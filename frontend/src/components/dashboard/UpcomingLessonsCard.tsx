import React from 'react';
import { Calendar, Clock, ChevronRight, PlusCircle } from 'lucide-react';
import { LessonPlan } from '../../types/plan';

interface UpcomingLessonsCardProps {
  plans: LessonPlan[];
  onSelectPlan: (plan: LessonPlan) => void;
  onOpenWizard: () => void;
  onViewLibrary?: () => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const UpcomingLessonsCard: React.FC<UpcomingLessonsCardProps> = ({
  plans,
  onSelectPlan,
  onOpenWizard,
  onViewLibrary,
}) => {
  // Find first plan with weekly plans and sessions
  const planWithSessions = plans.find(p => p.weeklyPlans && p.weeklyPlans.some(w => w.sessions && w.sessions.length > 0));

  // Extract upcoming sessions
  const upcomingItems = React.useMemo(() => {
    if (!planWithSessions || !planWithSessions.weeklyPlans) return [];

    const week1 = planWithSessions.weeklyPlans[0];
    if (!week1 || !week1.sessions) return [];

    // Map sessions to upcoming day entries
    return week1.sessions.slice(0, 4).map((session, index) => {
      const dayIdx = (session.dayNumber ? session.dayNumber - 1 : index) % 5;
      const dayName = DAY_NAMES[dayIdx] || 'Mon';
      const dateNum = 19 + dayIdx;

      return {
        id: session.id || `sess-${index}`,
        dayLabel: `${dayName}, Oct ${dateNum}`,
        subject: planWithSessions.subject,
        title: session.title,
        grade: planWithSessions.gradeLevel,
        duration: `${session.durationMinutes || planWithSessions.classDurationMinutes || 50} min`,
        plan: planWithSessions,
      };
    });
  }, [planWithSessions]);

  return (
    <div className="neu-card p-5 space-y-3.5">
      {/* Header with Title and View All action */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <div className="neu-icon-box">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text)]">
              Upcoming This Week
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Scheduled class sessions
            </p>
          </div>
        </div>

        {upcomingItems.length > 0 && (
          <button
            onClick={() => {
              if (planWithSessions) onSelectPlan(planWithSessions);
              else if (onViewLibrary) onViewLibrary();
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:text-[var(--accent)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content list or honest empty state */}
      {upcomingItems.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[var(--border)] p-5 text-center space-y-2.5">
          <Calendar className="w-6 h-6 mx-auto text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            No scheduled lessons for this week yet. Generate your curriculum unit to schedule daily instructional sessions.
          </p>
          <button
            onClick={onOpenWizard}
            className="neu-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Lesson Plan</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcomingItems.map((item, idx) => {
            const dotColor = idx === 0 
              ? 'bg-[var(--primary)]' 
              : idx === 1 
              ? 'bg-[var(--accent)]' 
              : idx === 2 
              ? 'bg-[var(--accent)]' 
              : 'bg-[var(--border)]';

            return (
              <div
                key={item.id}
                onClick={() => onSelectPlan(item.plan)}
                className="group relative flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--lavender-soft)]/30 cursor-pointer transition-all"
              >
                {/* Marker / Timeline indicator */}
                <div className="mt-1 flex flex-col items-center">
                  <span className={`w-2 h-2 rounded-full ${dotColor} ring-4 ring-[var(--lavender-soft)]`} />
                  {idx < upcomingItems.length - 1 && (
                    <span className="w-px h-8 bg-[var(--border)] mt-1" />
                  )}
                </div>

                {/* Entry content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[11px] gap-1">
                    <span className="font-semibold text-[var(--text)]">
                      {item.dayLabel}
                    </span>
                    <span className="text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                      {item.duration}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--primary)] truncate mt-0.5 transition-colors">
                    {item.title}
                  </h4>

                  <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium text-[var(--primary)]">{item.subject}</span>
                    <span>&bull;</span>
                    <span>{item.grade}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
