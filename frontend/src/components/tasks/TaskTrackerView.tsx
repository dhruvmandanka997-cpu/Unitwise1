import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ListChecks, 
  RefreshCw
} from 'lucide-react';
import { TeacherTask, TaskStats } from '../../types/task';
import { LessonPlan } from '../../types/plan';
import { TaskListItem } from './TaskListItem';
import { TaskDetailsModal } from './TaskDetailsModal';

interface TaskTrackerViewProps {
  tasks: TeacherTask[];
  stats: TaskStats;
  plans: LessonPlan[];
  selectedStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
  onToggleChecklist: (taskId: string, itemId: string, completed: boolean) => Promise<void>;
  onUpdateTask: (taskId: string, partial: Partial<TeacherTask>) => Promise<void>;
  onContinueWorkflow: (planId: string, tab?: string) => void;
  onRefreshTasks?: () => void;
  initialPlanFilter?: string;
  showPlanFilter?: boolean;
}

export const TaskTrackerView: React.FC<TaskTrackerViewProps> = ({
  tasks,
  stats,
  plans,
  selectedStatusFilter,
  onSelectStatusFilter,
  onToggleChecklist,
  onUpdateTask,
  onContinueWorkflow,
  onRefreshTasks,
  initialPlanFilter = 'ALL',
  showPlanFilter = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanFilter);
  const [activeTaskForModal, setActiveTaskForModal] = useState<TeacherTask | null>(null);

  // Sync active task for modal if tasks array updates
  const currentModalTask = useMemo(() => {
    if (!activeTaskForModal) return null;
    return tasks.find((t) => t.id === activeTaskForModal.id) || activeTaskForModal;
  }, [tasks, activeTaskForModal]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        selectedStatusFilter === 'ALL' || task.status === selectedStatusFilter;

      const matchesPlan =
        selectedPlanId === 'ALL' || task.planId === selectedPlanId;

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.planTitle.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.subject.toLowerCase().includes(q) ||
        task.checklist.some((c) => c.label.toLowerCase().includes(q));

      return matchesStatus && matchesPlan && matchesSearch;
    });
  }, [tasks, selectedStatusFilter, selectedPlanId, searchTerm]);

  const filterTabs = [
    { id: 'ALL', label: 'All Tasks', count: stats.total },
    { id: 'completed', label: 'Completed', count: stats.completed },
    { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
    { id: 'incomplete', label: 'Incomplete', count: stats.incomplete },
    { id: 'pending', label: 'Pending', count: stats.pending },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 neu-card">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => {
            const isActive = selectedStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)] shadow-neu-inset font-bold'
                    : 'neu-btn-secondary text-[var(--text-muted)] font-semibold'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-[var(--primary)] text-white font-bold' : 'bg-[var(--lavender-soft)] text-[var(--text-muted)]'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Plan Selector */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks or plan..."
              className="w-full neu-input pl-8 pr-3 py-1.5 text-xs text-[var(--text)]"
            />
          </div>

          {showPlanFilter && (
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="neu-input px-3 py-1.5 text-xs text-[var(--text)] max-w-[170px] truncate"
            >
              <option value="ALL">All Curriculum Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {onRefreshTasks && (
            <button
              onClick={onRefreshTasks}
              className="neu-btn-secondary p-2 text-[var(--text-muted)] hover:text-[var(--primary)]"
              title="Refresh task statuses"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="neu-card p-10 text-center border-dashed border-[var(--border)] space-y-2">
          <ListChecks className="w-8 h-8 mx-auto text-[var(--text-muted)]" />
          <h4 className="text-sm font-bold text-[var(--text)]">
            No tasks found in this view
          </h4>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Try choosing a different status filter or clearing your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onOpenDetails={setActiveTaskForModal}
              onContinueWorkflow={onContinueWorkflow}
            />
          ))}
        </div>
      )}

      {/* Interactive Modal for Checklist items */}
      {currentModalTask && (
        <TaskDetailsModal
          task={currentModalTask}
          isOpen={!!activeTaskForModal}
          onClose={() => setActiveTaskForModal(null)}
          onToggleChecklist={onToggleChecklist}
          onUpdateTask={onUpdateTask}
          onContinueWorkflow={onContinueWorkflow}
        />
      )}
    </div>
  );
};
