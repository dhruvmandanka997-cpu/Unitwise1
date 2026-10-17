import React from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  Calculator, 
  FlaskConical, 
  Terminal, 
  GraduationCap, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { LessonPlan } from '../../types/plan';

interface RecentPlansCardProps {
  plans: LessonPlan[];
  onSelectPlan: (plan: LessonPlan) => void;
  onViewLibrary?: () => void;
  onOpenWizard: () => void;
}

export const RecentPlansCard: React.FC<RecentPlansCardProps> = ({
  plans,
  onSelectPlan,
  onViewLibrary,
  onOpenWizard,
}) => {
  // Sort by updatedAt descending and take top 4
  const recentPlans = React.useMemo(() => {
    return [...plans]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [plans]);

  const getSubjectThumbnail = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('math')) {
      return Calculator;
    }
    if (s.includes('science') || s.includes('bio') || s.includes('chem') || s.includes('phys')) {
      return FlaskConical;
    }
    if (s.includes('computer') || s.includes('code')) {
      return Terminal;
    }
    if (s.includes('english') || s.includes('history') || s.includes('humanities') || s.includes('language')) {
      return BookOpen;
    }
    return GraduationCap;
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="neu-card p-5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)]">
            Recent Lesson Plans
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Active instructional units
          </p>
        </div>

        {plans.length > 0 && (
          <button
            onClick={onViewLibrary}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:text-[var(--accent)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List or Empty State */}
      {recentPlans.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[var(--border)] p-5 text-center space-y-2">
          <BookOpen className="w-6 h-6 mx-auto text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">
            No lesson plans created yet.
          </p>
          <button
            onClick={onOpenWizard}
            className="neu-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
          >
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {recentPlans.map((plan) => {
            const ThumbIcon = getSubjectThumbnail(plan.subject);
            const isCompleted = plan.status === 'completed';

            return (
              <div
                key={plan.id}
                onClick={() => onSelectPlan(plan)}
                className="group flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--lavender-soft)]/30 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Topic-Relevant Thumbnail in soft lavender */}
                  <div className="neu-icon-box shrink-0">
                    <ThumbIcon className="w-4 h-4 text-[var(--accent)]" />
                  </div>

                  {/* Title and Metadata */}
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] truncate transition-colors">
                      {plan.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
                      <span className="font-medium text-[var(--primary)]">{plan.subject}</span>
                      <span>&bull;</span>
                      <span>{plan.gradeLevel}</span>
                      <span>&bull;</span>
                      <span>{formatDate(plan.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Status Badge & Open Icon */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-[var(--border)] ${
                    isCompleted
                      ? 'bg-[var(--lavender-soft)] text-[var(--primary)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)]'
                  }`}>
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5 text-[var(--primary)]" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                        <span>Draft</span>
                      </>
                    )}
                  </span>

                  <div className="p-1 rounded text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
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
