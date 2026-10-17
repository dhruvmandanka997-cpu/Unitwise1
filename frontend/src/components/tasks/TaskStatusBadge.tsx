import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Hourglass } from 'lucide-react';
import { TaskStatus } from '../../types/task';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = {
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      classes: 'bg-[var(--lavender-soft)] text-[var(--primary)] border-[var(--border)]',
    },
    in_progress: {
      label: 'In Progress',
      icon: Clock,
      classes: 'bg-[var(--lavender-soft)] text-[var(--accent)] border-[var(--border)]',
    },
    incomplete: {
      label: 'Incomplete',
      icon: AlertCircle,
      classes: 'bg-slate-100 text-[var(--text-muted)] border-[var(--border)]',
    },
    pending: {
      label: 'Pending',
      icon: Hourglass,
      classes: 'bg-white text-[var(--text-muted)] border-[var(--border)]',
    },
  }[status];

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-semibold',
    lg: 'text-xs px-3 py-1 gap-1.5 font-bold',
  }[size];

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${sizeClasses} ${config.classes}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
