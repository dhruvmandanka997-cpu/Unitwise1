import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Hourglass, 
  ListChecks, 
  TrendingUp 
} from 'lucide-react';
import { TaskStats, TaskStatus } from '../../types/task';

interface TaskOverviewPanelProps {
  stats: TaskStats;
  selectedStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
  title?: string;
  subtitle?: string;
}

export const TaskOverviewPanel: React.FC<TaskOverviewPanelProps> = ({
  stats,
  selectedStatusFilter,
  onSelectStatusFilter,
  title = 'Curriculum Task Progress & Completion',
  subtitle = 'Track action items, review standards, and monitor lesson plan completion milestones',
}) => {
  const {
    total,
    completed,
    inProgress,
    incomplete,
    pending,
    completionPercentage,
  } = stats;

  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const inProgressPct = total > 0 ? (inProgress / total) * 100 : 0;
  const incompletePct = total > 0 ? (incomplete / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;

  const cards = [
    {
      id: 'ALL',
      label: 'Total Tasks',
      count: total,
      subtext: 'Trackable milestones',
      icon: ListChecks,
      accent: 'text-[var(--text)]',
    },
    {
      id: 'completed' as TaskStatus,
      label: 'Completed',
      count: completed,
      subtext: 'Finished & verified',
      icon: CheckCircle2,
      accent: 'text-[var(--primary)]',
    },
    {
      id: 'in_progress' as TaskStatus,
      label: 'In Progress',
      count: inProgress,
      subtext: 'Work underway',
      icon: Clock,
      accent: 'text-[var(--accent)]',
    },
    {
      id: 'incomplete' as TaskStatus,
      label: 'Incomplete',
      count: incomplete,
      subtext: 'Missing or failed checks',
      icon: AlertCircle,
      accent: 'text-[var(--text-muted)]',
    },
    {
      id: 'pending' as TaskStatus,
      label: 'Pending',
      count: pending,
      subtext: 'Waiting or not started',
      icon: Hourglass,
      accent: 'text-[var(--primary)]',
    },
  ];

  return (
    <section 
      aria-label="Curriculum Task Overview & Progress Tracker" 
      className="neu-card p-5 sm:p-6 space-y-6"
    >
      {/* Header with Title and Overall Completion Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="neu-icon-box">
              <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <h2 className="text-base font-bold text-[var(--text)]">
              {title}
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {subtitle}
          </p>
        </div>

        {/* Overall Completion Percentage Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-[var(--lavender-soft)]/50 px-4 py-2 rounded-[16px] border border-[var(--border)]">
          <div className="text-right">
            <div className="text-xs font-semibold text-[var(--text-muted)]">
              Completion Rate
            </div>
            <div className="text-lg font-bold text-[var(--text)]">
              {total === 0 ? '0%' : `${completionPercentage}%`}
            </div>
          </div>
          <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs bg-white border border-[var(--border)] text-[var(--primary)] shadow-neu-sm">
            {total === 0 ? '0/0' : `${completed}/${total}`}
          </div>
        </div>
      </div>

      {/* Segmented Visual Progress Bar with Inset Track */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="font-semibold">Workflow Distribution</span>
          <span className="text-[11px] font-normal text-[var(--text-muted)]">
            {total === 0 ? 'No tasks registered' : `${completed} of ${total} tasks completed`}
          </span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full neu-track flex">
          {total === 0 ? (
            <div className="h-full w-full bg-[var(--border)]" title="No tasks" />
          ) : (
            <>
              {completedPct > 0 && (
                <div
                  style={{ width: `${completedPct}%` }}
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  title={`Completed: ${completed} (${Math.round(completedPct)}%)`}
                />
              )}
              {inProgressPct > 0 && (
                <div
                  style={{ width: `${inProgressPct}%` }}
                  className="h-full bg-[var(--accent)] transition-all duration-300"
                  title={`In Progress: ${inProgress} (${Math.round(inProgressPct)}%)`}
                />
              )}
              {incompletePct > 0 && (
                <div
                  style={{ width: `${incompletePct}%` }}
                  className="h-full bg-[var(--border)] transition-all duration-300"
                  title={`Incomplete: ${incomplete} (${Math.round(incompletePct)}%)`}
                />
              )}
              {pendingPct > 0 && (
                <div
                  style={{ width: `${pendingPct}%` }}
                  className="h-full bg-[var(--lavender-soft)] transition-all duration-300"
                  title={`Pending: ${pending} (${Math.round(pendingPct)}%)`}
                />
              )}
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)] pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
            <span>Completed ({completed})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            <span>In Progress ({inProgress})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
            <span>Incomplete ({incomplete})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--lavender-soft)]" />
            <span>Pending ({pending})</span>
          </div>
        </div>
      </div>

      {/* Clickable Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const isSelected = selectedStatusFilter === card.id;
          const IconComp = card.icon;

          return (
            <button
              key={card.id}
              onClick={() => onSelectStatusFilter(card.id)}
              className={`flex flex-col text-left p-3.5 rounded-[16px] border transition-all duration-150 focus:outline-none ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--lavender-soft)] text-[var(--primary)] shadow-neu-inset font-semibold'
                  : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:bg-[var(--lavender-soft)]/30 shadow-neu-sm'
              }`}
              title={`Filter task list by ${card.label}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  {card.label}
                </span>
                <div className="neu-icon-box">
                  <IconComp className="w-3.5 h-3.5 text-[var(--primary)]" />
                </div>
              </div>

              <div className={`text-2xl font-bold tracking-tight ${card.accent}`}>
                {card.count}
              </div>

              <p className="mt-1 text-[11px] text-[var(--text-muted)] leading-tight">
                {card.subtext}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
