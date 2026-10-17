import React from 'react';
import { 
  Calendar, 
  BookOpen, 
  ArrowRight, 
  CheckSquare, 
  ChevronRight
} from 'lucide-react';
import { TeacherTask } from '../../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';

interface TaskListItemProps {
  task: TeacherTask;
  onOpenDetails: (task: TeacherTask) => void;
  onContinueWorkflow: (planId: string, tab?: string) => void;
}

export const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  onOpenDetails,
  onContinueWorkflow,
}) => {
  const completedChecklistCount = task.checklist.filter((c) => c.completed).length;
  const totalChecklistCount = task.checklist.length;

  const formattedUpdated = new Date(task.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      onClick={() => onOpenDetails(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'A') {
            e.preventDefault();
            onOpenDetails(task);
          }
        }
      }}
      className="group flex flex-col justify-between p-4 sm:p-5 neu-card-interactive cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] space-y-3.5"
    >
      {/* Row 1: Plan context, Due Date, and Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[var(--text-muted)] font-medium min-w-0">
          <BookOpen className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
          <span className="truncate font-bold text-[var(--text)]">
            {task.planTitle}
          </span>
          <span className="text-[var(--border)]">&bull;</span>
          <span className="truncate text-[11px] text-[var(--text-muted)]">
            {task.subject} ({task.gradeLevel})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--lavender-soft)] border border-[var(--border)] px-2.5 py-0.5 rounded-full">
              <Calendar className="w-3 h-3 text-[var(--primary)]" />
              <span>Due: {task.dueDate}</span>
            </span>
          )}
          <TaskStatusBadge status={task.status} size="sm" />
        </div>
      </div>

      {/* Row 2: Task Title and Description */}
      <div className="space-y-1">
        <h3 className="text-sm sm:text-base font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug">
          {task.title}
        </h3>
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      </div>

      {/* Row 3: Grounded Unfinished Explanation or Completion Banner */}
      <div className="p-3 rounded-[16px] text-xs leading-relaxed bg-[var(--lavender-soft)]/40 border border-[var(--border)] text-[var(--text)]">
        <p className="line-clamp-2">{task.missingExplanation}</p>
      </div>

      {/* Row 4: Footer with Checklist Count, Last Updated, and Actions */}
      <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1 font-medium text-[var(--text-muted)]">
            <CheckSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{completedChecklistCount}/{totalChecklistCount} steps</span>
          </span>
          <span className="text-[var(--border)]">&bull;</span>
          <span className="text-[11px] text-[var(--text-muted)]">Updated {formattedUpdated}</span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onContinueWorkflow(task.planId, task.nextActionTab)}
            className="neu-btn-secondary inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-[var(--primary)]"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onOpenDetails(task)}
            className="neu-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]"
            title="Inspect checklist"
          >
            <span>Review</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
