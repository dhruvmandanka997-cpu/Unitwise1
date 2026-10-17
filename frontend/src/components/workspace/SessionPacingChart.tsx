import React from 'react';
import { Clock, Layers, CheckCircle2, Award, Info } from 'lucide-react';
import { SessionPlan, BloomLevel } from '../../types/plan';

interface SessionPacingChartProps {
  session: SessionPlan;
}

export const SessionPacingChart: React.FC<SessionPacingChartProps> = ({ session }) => {
  const totalPhaseMinutes = session.lessonSequence.reduce(
    (sum, act) => sum + (act.durationMinutes || 0),
    0
  );

  // Phase color mapping
  const getPhaseColor = (index: number) => {
    const colors = [
      { bg: 'bg-[var(--primary)]', text: 'text-[var(--primary)]', label: 'Opening' },
      { bg: 'bg-[var(--accent)]', text: 'text-[var(--accent)]', label: 'Direct Instruction' },
      { bg: 'bg-[var(--accent)]', text: 'text-[var(--accent)]', label: 'Guided Practice' },
      { bg: 'bg-[var(--accent)]', text: 'text-[var(--accent)]', label: 'Collaborative / Independent' },
      { bg: 'bg-[var(--lavender-soft)]', text: 'text-[var(--lavender-soft)]', label: 'Assessment' },
      { bg: 'bg-[var(--text-muted)]', text: 'text-[var(--text-muted)]', label: 'Closure' },
    ];
    return colors[index % colors.length];
  };

  // Bloom's taxonomy grouping from real objectives
  const bloomCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      'Foundational (Remember/Understand)': 0,
      'Application & Analysis (Apply/Analyze)': 0,
      'Higher-Order (Evaluate/Create)': 0,
    };

    session.objectives.forEach((obj) => {
      const level = obj.bloomLevel as BloomLevel;
      if (level === 'Remembering' || level === 'Understanding') {
        counts['Foundational (Remember/Understand)'] += 1;
      } else if (level === 'Applying' || level === 'Analyzing') {
        counts['Application & Analysis (Apply/Analyze)'] += 1;
      } else if (level === 'Evaluating' || level === 'Creating') {
        counts['Higher-Order (Evaluate/Create)'] += 1;
      }
    });

    return counts;
  }, [session.objectives]);

  const totalObjectives = session.objectives.length;

  return (
    <div className="neu-card-sm p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="neu-icon-box">
            <Clock className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text)]">
              Instructional Pacing & Rigor
            </h4>
            <p className="text-[10px] text-[var(--text-muted)]">
              Real lesson time distribution & Bloom’s balance
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary)]">
          {totalPhaseMinutes} min total
        </span>
      </div>

      {/* 1. Phase Pacing Distribution Stacked Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-[var(--text)]">
            Phase Allocation ({session.lessonSequence.length} phases)
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            Target: {session.durationMinutes} min
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div 
          className="flex h-3 w-full overflow-hidden rounded-full neu-track p-0.5"
          role="progressbar"
          aria-valuenow={totalPhaseMinutes}
          aria-valuemin={0}
          aria-valuemax={session.durationMinutes}
          aria-label="Lesson phase duration pacing bar"
        >
          {session.lessonSequence.map((act, idx) => {
            const pct = totalPhaseMinutes > 0 ? (act.durationMinutes / totalPhaseMinutes) * 100 : 0;
            const style = getPhaseColor(idx);
            return (
              <div
                key={idx}
                style={{ width: `${pct}%` }}
                className={`${style.bg} h-full transition-all duration-300 relative group first:rounded-l-full last:rounded-r-full`}
                title={`${act.title}: ${act.durationMinutes}m (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>

        {/* Phase Breakdown Legend Chips */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 sm:grid-cols-2 text-[10px]">
          {session.lessonSequence.map((act, idx) => {
            const pct = totalPhaseMinutes > 0 ? Math.round((act.durationMinutes / totalPhaseMinutes) * 100) : 0;
            const style = getPhaseColor(idx);
            return (
              <div
                key={idx}
                className="flex items-center justify-between rounded-[10px] bg-[var(--lavender-soft)]/40 px-2 py-1 border border-[var(--border)]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${style.bg}`} />
                  <span className="truncate font-semibold text-[var(--text)]">
                    {act.title}
                  </span>
                </div>
                <span className="font-bold text-[var(--text-muted)] flex-shrink-0 ml-1">
                  {act.durationMinutes}m ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Bloom's Taxonomy Cognitive Distribution */}
      <div className="pt-2 border-t border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-[var(--primary)]" />
            Cognitive Rigor Distribution
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {totalObjectives} objective{totalObjectives === 1 ? '' : 's'}
          </span>
        </div>

        <div className="space-y-1.5 text-[10px]">
          {Object.entries(bloomCounts).map(([tier, count]) => {
            const pct = totalObjectives > 0 ? (count / totalObjectives) * 100 : 0;
            return (
              <div key={tier} className="space-y-0.5">
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span className="font-medium">{tier}</span>
                  <span className="font-bold text-[var(--text)]">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full neu-track overflow-hidden p-0.5">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full ${
                      tier.includes('Foundational')
                        ? 'bg-[var(--primary)]'
                        : tier.includes('Application')
                        ? 'bg-[var(--accent)]'
                        : 'bg-[var(--accent)]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Formative Assessment Alignment Snapshot */}
      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] rounded-[12px] bg-[var(--lavender-soft)]/40 border border-[var(--border)] p-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)] flex-shrink-0" />
          <span className="text-[var(--text)] font-bold truncate">
            {session.formativeAssessment?.type || 'Exit Slip Check'}
          </span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-medium truncate ml-2">
          {session.formativeAssessment?.measures ? `Measures: ${session.formativeAssessment.measures}` : 'Target check'}
        </span>
      </div>
    </div>
  );
};
