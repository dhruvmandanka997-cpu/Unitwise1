import React, { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { LessonPlan } from '../../types/plan';

interface PlanningProgressChartProps {
  plans: LessonPlan[];
}

interface SubjectStat {
  subject: string;
  shortName: string;
  totalSessions: number;
  completedSessions: number;
  unitCount: number;
}

export const PlanningProgressChart: React.FC<PlanningProgressChartProps> = ({ plans }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Derive real statistics grouped by subject
  const data: SubjectStat[] = useMemo(() => {
    if (!plans || plans.length === 0) return [];

    const map = new Map<string, { totalSessions: number; completedSessions: number; unitCount: number }>();

    for (const plan of plans) {
      const subject = plan.subject || 'General Studies';
      const sessions = plan.weeklyPlans
        ? plan.weeklyPlans.reduce((sum, w) => sum + (w.sessions ? w.sessions.length : 0), 0)
        : (plan.durationWeeks || 1) * 3;

      const isCompleted = plan.status === 'completed';
      const current = map.get(subject) || { totalSessions: 0, completedSessions: 0, unitCount: 0 };
      map.set(subject, {
        totalSessions: current.totalSessions + sessions,
        completedSessions: current.completedSessions + (isCompleted ? sessions : 0),
        unitCount: current.unitCount + 1,
      });
    }

    // Convert map to sorted array (top subjects first)
    return Array.from(map.entries())
      .map(([subject, stats]) => {
        let shortName = subject;
        if (subject.includes('English Language Arts')) shortName = 'ELA';
        else if (subject.includes('Environmental Systems')) shortName = 'Ecology';
        else if (subject.includes('Computer Science')) shortName = 'CompSci';
        else if (subject.length > 12) shortName = subject.slice(0, 10) + '…';

        return {
          subject,
          shortName,
          totalSessions: stats.totalSessions,
          completedSessions: stats.completedSessions,
          unitCount: stats.unitCount,
        };
      })
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, 6); // Top 6 disciplines for a clean, spacious presentation
  }, [plans]);

  // Overall totals
  const totalAllSessions = useMemo(() => data.reduce((acc, d) => acc + d.totalSessions, 0), [data]);

  // Max value for scale
  const maxSessions = useMemo(() => {
    if (data.length === 0) return 20;
    const peak = Math.max(...data.map(d => d.totalSessions));
    return Math.max(Math.ceil(peak / 5) * 5, 10);
  }, [data]);

  // Empty state handling
  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white dark:bg-[var(--surface)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-6 text-center space-y-3 shadow-card">
        <div className="inline-flex p-3 rounded-2xl bg-[var(--lavender-soft)] dark:bg-[var(--lavender-soft)] text-[var(--primary)] dark:text-[var(--accent)]">
          <BarChart3 className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-[var(--text)] dark:text-[var(--text)]">
          No Learning Progress Data Yet
        </h3>
        <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
          Create or generate your first multi-week instructional plan to visualize planned teaching sessions and subject distributions.
        </p>
      </div>
    );
  }

  const chartHeight = 160;
  const yTicks = [0, Math.round(maxSessions * 0.33), Math.round(maxSessions * 0.66), maxSessions];

  return (
    <div className="bg-white dark:bg-[var(--surface)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-5 shadow-card transition-all">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[var(--text)] dark:text-[var(--text)]">
              Curriculum Progress
            </h3>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--lavender-soft)] text-[var(--primary)] dark:bg-[var(--lavender-soft)] dark:text-[var(--accent)]">
              {totalAllSessions} sessions mapped
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] dark:text-[var(--text-muted)]">
            Instructional session volume across core disciplines
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)] self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)] dark:bg-[var(--accent)]" />
            <span>Planned Sessions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary-hover)] dark:bg-[var(--accent)]" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="relative pt-2">
        {/* Y-Axis Grid Lines & Labels */}
        <div className="relative h-[160px] w-full flex flex-col justify-between pointer-events-none">
          {yTicks.slice().reverse().map((tick) => (
            <div key={tick} className="w-full flex items-center gap-2">
              <span className="w-6 text-[10px] font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)] text-right">
                {tick}
              </span>
              <div className="flex-1 border-b border-[var(--border)] dark:border-[var(--border)]/60" />
            </div>
          ))}
        </div>

        {/* Bar Columns Container */}
        <div className="absolute inset-0 pl-8 pr-2 flex items-end justify-around">
          {data.map((item, index) => {
            const plannedHeight = (item.totalSessions / maxSessions) * chartHeight;
            const completedHeight = (item.completedSessions / maxSessions) * chartHeight;
            const isHovered = hoveredIdx === index;

            return (
              <div
                key={item.subject}
                className="relative flex flex-col items-center group cursor-pointer h-full justify-end"
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 whitespace-nowrap bg-[var(--text)] dark:bg-[var(--surface)] border border-[var(--border)] text-white text-[11px] px-2.5 py-1.5 rounded-xl shadow-lg pointer-events-none transform -translate-y-1 transition-all">
                    <div className="font-semibold">{item.subject}</div>
                    <div className="text-[10px] text-slate-300">
                      {item.totalSessions} sessions ({item.unitCount} {item.unitCount === 1 ? 'unit' : 'units'}) &bull; {item.completedSessions} completed
                    </div>
                  </div>
                )}

                {/* Bars Pair */}
                <div className="flex items-end gap-1.5 px-2">
                  {/* Primary Planned Bar */}
                  <div
                    style={{ height: `${Math.max(plannedHeight, 4)}px` }}
                    className={`w-4 sm:w-6 rounded-t-md transition-all duration-200 ${
                      isHovered
                        ? 'bg-[var(--primary-hover)] dark:bg-[var(--accent)]'
                        : 'bg-[var(--primary)] dark:bg-[var(--primary-hover)]'
                    }`}
                  />

                  {/* Completed Bar */}
                  <div
                    style={{ height: `${Math.max(completedHeight, 4)}px` }}
                    className={`w-3 sm:w-4 rounded-t-md transition-all duration-200 ${
                      item.completedSessions > 0
                        ? isHovered
                          ? 'bg-[var(--accent)] dark:bg-[var(--accent)]'
                          : 'bg-[var(--primary-hover)] dark:bg-[var(--accent)]'
                        : 'bg-[var(--border)] dark:bg-[var(--border)]/50'
                    }`}
                  />
                </div>

                {/* X-Axis Category Label */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-[11px] font-medium transition-colors ${
                      isHovered
                        ? 'text-[var(--primary)] dark:text-[var(--accent)]'
                        : 'text-[var(--text-muted)] dark:text-[var(--text-muted)]'
                    }`}
                  >
                    {item.shortName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accessible Table for Screen Readers */}
      <table className="sr-only">
        <caption>Curriculum Planning Progress Table by Discipline</caption>
        <thead>
          <tr>
            <th scope="col">Discipline</th>
            <th scope="col">Total Sessions Planned</th>
            <th scope="col">Completed Sessions</th>
            <th scope="col">Units</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.subject}>
              <td>{item.subject}</td>
              <td>{item.totalSessions}</td>
              <td>{item.completedSessions}</td>
              <td>{item.unitCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
