import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  AlertCircle, 
  BookOpen, 
  ArrowRight, 
  CheckSquare, 
  Square, 
  Save, 
  FileText,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { TeacherTask, TaskStatus } from '../../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';

interface TaskDetailsModalProps {
  task: TeacherTask | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleChecklist: (taskId: string, itemId: string, completed: boolean) => Promise<void>;
  onUpdateTask: (taskId: string, partial: Partial<TeacherTask>) => Promise<void>;
  onContinueWorkflow: (planId: string, tab?: string) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onToggleChecklist,
  onUpdateTask,
  onContinueWorkflow,
}) => {
  if (!isOpen || !task) return null;

  const [dueDate, setDueDate] = useState<string>(task.dueDate || '');
  const [teacherNotes, setTeacherNotes] = useState<string>(task.teacherNotes || '');
  const [manualStatus, setManualStatus] = useState<TaskStatus>(task.status);
  const [isSavingDetails, setIsSavingDetails] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (task) {
      setDueDate(task.dueDate || '');
      setTeacherNotes(task.teacherNotes || '');
      setManualStatus(task.status);
      setSaveSuccess(false);
      setShowOverrideConfirm(false);
    }
  }, [task]);

  const handleSaveMetadata = async () => {
    setIsSavingDetails(true);
    try {
      await onUpdateTask(task.id, {
        dueDate: dueDate || undefined,
        teacherNotes: teacherNotes || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save task metadata:', err);
      alert('Could not save notes or due date.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleStatusChangeRequest = (newStatus: TaskStatus) => {
    const hasUncheckedRequired = task.checklist.some((c) => c.isRequired && !c.completed);
    if (newStatus === 'completed' && hasUncheckedRequired) {
      setShowOverrideConfirm(true);
    } else {
      executeStatusOverride(newStatus);
    }
  };

  const executeStatusOverride = async (newStatus: TaskStatus) => {
    try {
      await onUpdateTask(task.id, {
        status: newStatus,
        manualOverride: true,
      });
      setManualStatus(newStatus);
      setShowOverrideConfirm(false);
    } catch (err) {
      console.error('Failed to override status:', err);
    }
  };

  const handleResetToAutoValidation = async () => {
    try {
      await onUpdateTask(task.id, {
        manualOverride: false,
      });
      setManualStatus(task.status);
    } catch (err) {
      console.error('Failed to reset manual override:', err);
    }
  };

  const completedChecklistCount = task.checklist.filter((c) => c.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl neu-card p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={task.status} size="md" />
              <span className="text-xs text-[var(--text-muted)]">
                {task.subject} &bull; {task.gradeLevel}
              </span>
              {task.manualOverride && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--lavender-soft)] text-[var(--primary)] px-2.5 py-0.5 rounded-full font-semibold border border-[var(--border)]">
                  Manual Override
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] leading-snug">
              {task.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-semibold truncate">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Plan: {task.planTitle}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[12px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description & Grounded Explanation */}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {task.description}
          </p>

          {/* Grounded Status Explanation Banner */}
          <div className="p-4 rounded-[16px] border border-[var(--border)] text-xs leading-relaxed bg-[var(--lavender-soft)]/40 text-[var(--text)]">
            <div className="font-bold mb-1 flex items-center gap-1.5 text-[var(--primary)]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Current Status Analysis</span>
            </div>
            <p>{task.missingExplanation}</p>
          </div>
        </div>

        {/* Validation Issues */}
        {task.validationIssues && task.validationIssues.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-[16px] bg-amber-50/70 border border-amber-200">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Field Validation & Guidance</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-amber-800 pl-1">
              {task.validationIssues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono uppercase mt-0.5 ${
                    issue.severity === 'error'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {issue.field}
                  </span>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Interactive Checklist Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
              <span>Required Checklist Steps ({completedChecklistCount}/{task.checklist.length})</span>
            </h3>
            <span className="text-xs text-[var(--text-muted)]">
              Checking items dynamically updates status
            </span>
          </div>

          <div className="space-y-2">
            {task.checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => onToggleChecklist(task.id, item.id, !item.completed)}
                role="checkbox"
                aria-checked={item.completed}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleChecklist(task.id, item.id, !item.completed);
                  }
                }}
                className={`flex items-start gap-3 p-3.5 rounded-[16px] border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                  item.completed
                    ? 'bg-[var(--lavender-soft)]/60 border-[var(--border)] text-[var(--text)]'
                    : 'bg-white border-[var(--border)] hover:bg-[var(--lavender-soft)]/20 text-[var(--text-muted)]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                  ) : (
                    <Square className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className={`font-semibold ${item.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
                    {item.label}
                  </div>
                  {item.isRequired && (
                    <span className="text-[10px] text-[var(--primary)] font-normal">
                      Required for completion
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Due Date & Teacher Notes Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Target Due Date</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full neu-input px-3 py-1.5 text-xs text-[var(--text)]"
            />
          </div>

          {/* Manual Status Control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text)]">
                Manual Status Setting
              </label>
              {task.manualOverride && (
                <button
                  type="button"
                  onClick={handleResetToAutoValidation}
                  className="text-[10px] text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset to Auto
                </button>
              )}
            </div>
            <select
              value={manualStatus}
              onChange={(e) => handleStatusChangeRequest(e.target.value as TaskStatus)}
              className="w-full neu-input px-2.5 py-1.5 text-xs text-[var(--text)]"
            >
              <option value="pending">Pending (Not started or awaiting prerequisite)</option>
              <option value="in_progress">In Progress (Work underway)</option>
              <option value="incomplete">Incomplete (Missing required items / validation)</option>
              <option value="completed">Completed (All work verified)</option>
            </select>
          </div>
        </div>

        {/* Confirmation Modal if manually forcing Complete */}
        {showOverrideConfirm && (
          <div className="p-4 rounded-[16px] bg-amber-50 border border-amber-300 space-y-2">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Confirm Manual Completion</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Some checklist items remain unchecked. Are you sure you want to manually mark this task as Completed?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => executeStatusOverride('completed')}
                className="neu-btn-primary px-3 py-1 text-xs font-bold text-white"
              >
                Yes, Mark Completed
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOverrideConfirm(false);
                  setManualStatus(task.status);
                }}
                className="neu-btn-secondary px-3 py-1 text-xs font-semibold text-[var(--text-muted)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Teacher Notes Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Teacher Notes & Custom Documentation</span>
          </label>
          <textarea
            rows={2}
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            placeholder="Add personal reminders, pedagogical decisions, co-teacher notes, or materials to prepare..."
            className="w-full neu-input p-2.5 text-xs text-[var(--text)] leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveMetadata}
              disabled={isSavingDetails}
              className="neu-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--text)]"
            >
              <Save className="w-3.5 h-3.5 text-[var(--primary)]" />
              {isSavingDetails ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Notes & Due Date'}
            </button>
            {saveSuccess && (
              <span className="text-xs text-[var(--primary)] font-bold">
                Changes saved
              </span>
            )}
          </div>

          <button
            onClick={() => {
              onClose();
              onContinueWorkflow(task.planId, task.nextActionTab);
            }}
            className="neu-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white"
          >
            <span>Continue in Workspace ({task.nextActionLabel})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
