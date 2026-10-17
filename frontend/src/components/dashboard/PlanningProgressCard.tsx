import React from 'react';
import { Filter, ListChecks } from 'lucide-react';
import { TaskStats } from '../../types/task';

interface PlanningProgressCardProps {
  stats: TaskStats;
  selectedStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export const PlanningProgressCard: React.FC<PlanningProgressCardProps> = ({
  stats,
  selectedStatusFilter,
  onSelectStatusFilter,
}) => {
  const {
    total,
    completed,
    inProgress,
    pending,
    completionPercentage,
  } = stats;

  // Safe percentage calculations for circular donut chart
  // Circumference of circle with r=36 is 2 * PI * 36 = 226.195
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const completedPct = total > 0 ? completed / total : 0;
  const inProgressPct = total > 0 ? inProgress / total : 0;
  const pendingPct = total > 0 ? pending / total : 0;

  const completedStroke = completedPct * circumference;
  const inProgressStroke = inProgressPct * circumference;
  const pendingStroke = pendingPct * circumference;

  // Offsets for stacked multi-color donut
  const completedOffset = 0;
  const inProgressOffset = -completedStroke;
  const pendingOffset = -(completedStroke + inProgressStroke);

  return (
    <div className="neu-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)]">
            Planning Progress
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Curriculum mastery & task completion
          </p>
        </div>

        {selectedStatusFilter !== 'ALL' && (
          <button
            onClick={() => onSelectStatusFilter('ALL')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:text-[var(--accent)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            title="Clear filter"
          >
            <Filter className="w-3 h-3" />
            <span>Reset filter</span>
          </button>
        )}
      </div>

      {/* Circular Completion Donut & Metrics */}
      <div className="flex items-center gap-5">
        {/* SVG Circular Donut Chart */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background track with soft lavender */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--lavender-soft)"
              strokeWidth="10"
            />

            {/* Completed Segment (Primary) */}
            {completedStroke > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="var(--primary)"
                strokeWidth="10"
                strokeDasharray={`${completedStroke} ${circumference}`}
                strokeDashoffset={completedOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}

            {/* In Progress Segment (Accent) */}
            {inProgressStroke > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="var(--accent)"
                strokeWidth="10"
                strokeDasharray={`${inProgressStroke} ${circumference}`}
                strokeDashoffset={inProgressOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}

            {/* Pending Segment (Muted border/track) */}
            {pendingStroke > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="var(--border)"
                strokeWidth="10"
                strokeDasharray={`${pendingStroke} ${circumference}`}
                strokeDashoffset={pendingOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-extrabold text-[var(--text)] tracking-tight">
              {total === 0 ? '0%' : `${completionPercentage}%`}
            </span>
            <span className="text-[9px] font-medium text-[var(--text-muted)]">
              Done
            </span>
          </div>
        </div>

        {/* Breakdown with Numbers & Interactive Filters */}
        <div className="flex-1 space-y-1.5">
          {/* Completed */}
          <button
            onClick={() => onSelectStatusFilter(selectedStatusFilter === 'completed' ? 'ALL' : 'completed')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all text-left focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              selectedStatusFilter === 'completed'
                ? 'bg-[var(--lavender-soft)] text-[var(--primary)] ring-1 ring-[var(--accent)] font-semibold shadow-inner'
                : 'hover:bg-[var(--lavender-soft)]/50 text-[var(--text-muted)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] shrink-0" />
              <span>Completed</span>
            </div>
            <span className="font-bold text-[var(--text)]">{completed}</span>
          </button>

          {/* In Progress */}
          <button
            onClick={() => onSelectStatusFilter(selectedStatusFilter === 'in_progress' ? 'ALL' : 'in_progress')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all text-left focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              selectedStatusFilter === 'in_progress'
                ? 'bg-[var(--lavender-soft)] text-[var(--accent)] ring-1 ring-[var(--accent)] font-semibold shadow-inner'
                : 'hover:bg-[var(--lavender-soft)]/50 text-[var(--text-muted)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shrink-0" />
              <span>In Progress</span>
            </div>
            <span className="font-bold text-[var(--text)]">{inProgress}</span>
          </button>

          {/* Pending */}
          <button
            onClick={() => onSelectStatusFilter(selectedStatusFilter === 'pending' ? 'ALL' : 'pending')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all text-left focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              selectedStatusFilter === 'pending'
                ? 'bg-[var(--lavender-soft)] text-[var(--primary)] ring-1 ring-[var(--border)] font-semibold shadow-inner'
                : 'hover:bg-[var(--lavender-soft)]/50 text-[var(--text-muted)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)] shrink-0" />
              <span>Pending</span>
            </div>
            <span className="font-bold text-[var(--text)]">{pending}</span>
          </button>
        </div>
      </div>

      {/* Footer Total */}
      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>Total Trackable Tasks</span>
        </div>
        <button
          onClick={() => onSelectStatusFilter('ALL')}
          className="font-bold text-[var(--text)] hover:text-[var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          {total}
        </button>
      </div>
    </div>
  );
};
