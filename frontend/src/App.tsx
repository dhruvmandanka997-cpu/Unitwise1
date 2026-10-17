import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { PlanWizard } from './components/wizard/PlanWizard';
import { PlanWorkspace } from './components/workspace/PlanWorkspace';
import { PlanLibrary } from './components/library/PlanLibrary';
import { SettingsModal } from './components/settings/SettingsModal';
import { LessonPlan, GeneratePlanInput } from './types/plan';
import { TeacherTask, TaskStats } from './types/task';
import { api, HealthResponse } from './services/api';

const DEFAULT_TASK_STATS: TaskStats = {
  total: 0,
  completed: 0,
  inProgress: 0,
  incomplete: 0,
  pending: 0,
  completionPercentage: 0,
};

export const App: React.FC = () => {
  const getInitialView = (): 'dashboard' | 'wizard' | 'workspace' | 'library' => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('wizard') || path.includes('generate')) return 'wizard';
    if (path.includes('library') || path.includes('plans')) return 'library';
    if (path.includes('workspace')) return 'workspace';
    return 'dashboard';
  };

  const [currentView, setCurrentViewState] = useState<'dashboard' | 'wizard' | 'workspace' | 'library'>(getInitialView);

  const setCurrentView = useCallback((view: 'dashboard' | 'wizard' | 'workspace' | 'library') => {
    setCurrentViewState(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const targetPath = view === 'dashboard' ? '/' : `/${view === 'wizard' ? 'generate' : view}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentViewState(getInitialView());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tasks Tracker State
  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>(DEFAULT_TASK_STATS);
  const [initialWorkspaceTab, setInitialWorkspaceTab] = useState<string>('overview');

  // Global Search State across Dashboard and Library
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dark mode state with persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const loadPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const [fetchedTasks, fetchedStats] = await Promise.all([
        api.getTasks(),
        api.getTaskStats(),
      ]);
      setTasks(fetchedTasks);
      setTaskStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    loadTasks();
    loadHealth();
  }, [loadPlans, loadTasks, loadHealth]);

  const handleOpenWizard = (templateId?: string) => {
    setSelectedTemplateId(templateId);
    setGenerationError(null);
    setCurrentView('wizard');
  };

  const handleSelectPlan = (plan: LessonPlan, initialTab: string = 'overview') => {
    setActivePlan(plan);
    setInitialWorkspaceTab(initialTab);
    setCurrentView('workspace');
  };

  const handleContinueTaskWorkflow = (planId: string, tab: string = 'overview') => {
    const targetPlan = plans.find((p) => p.id === planId);
    if (targetPlan) {
      setActivePlan(targetPlan);
      setInitialWorkspaceTab(tab);
      setCurrentView('workspace');
    } else {
      // If plan not loaded in local list yet, fetch it
      api.getPlan(planId).then((fetchedPlan) => {
        setActivePlan(fetchedPlan);
        setInitialWorkspaceTab(tab);
        setCurrentView('workspace');
      }).catch((err) => {
        console.error('Could not locate plan for task workflow:', err);
      });
    }
  };

  const handleToggleChecklist = async (taskId: string, itemId: string, completed: boolean) => {
    try {
      const updated = await api.toggleTaskChecklist(taskId, itemId, completed);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      // Refresh stats
      const newStats = await api.getTaskStats();
      setTaskStats(newStats);
    } catch (err) {
      console.error('Failed to toggle checklist:', err);
      throw err;
    }
  };

  const handleUpdateTask = async (taskId: string, partial: Partial<TeacherTask>) => {
    try {
      const updated = await api.updateTask(taskId, partial);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      const newStats = await api.getTaskStats();
      setTaskStats(newStats);
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    }
  };

  const handleGeneratePlan = async (input: GeneratePlanInput) => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const newPlan = await api.generatePlan(input);
      setPlans((prev) => [newPlan, ...prev]);
      setActivePlan(newPlan);
      setInitialWorkspaceTab('overview');
      setCurrentView('workspace');
      setSuccessMessage(`Successfully generated "${newPlan.title}" (${newPlan.durationWeeks} weeks, ${newPlan.durationWeeks * newPlan.sessionsPerWeek} sessions)!`);
      setTimeout(() => setSuccessMessage(null), 6000);
      loadTasks();
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Generation failed:', error);
      setGenerationError(error?.message || 'Plan generation failed. Please check your inputs and retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async (updatedPlan: LessonPlan) => {
    try {
      const saved = await api.updatePlan(updatedPlan.id, updatedPlan);
      setActivePlan(saved);
      setPlans((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      loadTasks();
    } catch (err) {
      console.error('Save failed:', err);
      throw err;
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await api.deletePlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (activePlan?.id === id) {
        setActivePlan(null);
        setCurrentView('dashboard');
      }
      loadTasks();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete plan.');
    }
  };

  const handleDuplicatePlan = async (id: string) => {
    try {
      const clone = await api.duplicatePlan(id);
      setPlans((prev) => [clone, ...prev]);
      setActivePlan(clone);
      setInitialWorkspaceTab('overview');
      setCurrentView('workspace');
      loadTasks();
    } catch (err) {
      console.error('Duplicate failed:', err);
      alert('Failed to duplicate plan.');
    }
  };

  const handleRenamePlan = async (id: string, newTitle: string) => {
    try {
      const updated = await api.updatePlan(id, { title: newTitle });
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (activePlan?.id === id) {
        setActivePlan(updated);
      }
      loadTasks();
    } catch (err) {
      console.error('Rename failed:', err);
      alert('Failed to rename plan.');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'draft' | 'completed' | 'archived') => {
    try {
      const updated = await api.updatePlan(id, { status });
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (activePlan?.id === id) {
        setActivePlan(updated);
      }
      loadTasks();
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Failed to update status.');
    }
  };

  return (
    <AppShell
      currentView={currentView}
      activePlanTitle={activePlan?.title}
      onNavigate={(view) => {
        setSelectedTemplateId(undefined);
        if (view === 'workspace' && !activePlan && plans.length > 0) {
          setActivePlan(plans[0]);
        }
        setCurrentView(view);
      }}
      onOpenSettings={() => setIsSettingsOpen(true)}
      isDark={isDark}
      onToggleTheme={() => setIsDark(!isDark)}
      liveAiAvailable={health?.liveAiAvailable ?? false}
      planCount={plans.length}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {currentView === 'dashboard' && (
        <Dashboard
          plans={plans}
          isLoading={isLoading}
          onSelectPlan={handleSelectPlan}
          onOpenWizard={handleOpenWizard}
          onRefreshPlans={loadPlans}
          onDuplicatePlan={handleDuplicatePlan}
          onDeletePlan={handleDeletePlan}
          onRenamePlan={handleRenamePlan}
          onUpdateStatus={handleUpdateStatus}
          onViewLibrary={() => setCurrentView('library')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          tasks={tasks}
          taskStats={taskStats}
          onToggleChecklist={handleToggleChecklist}
          onUpdateTask={handleUpdateTask}
          onContinueTaskWorkflow={handleContinueTaskWorkflow}
          onRefreshTasks={loadTasks}
          searchFilter={searchQuery}
        />
      )}

      {currentView === 'wizard' && (
        <PlanWizard
          initialTemplateId={selectedTemplateId}
          onCancel={() => setCurrentView('dashboard')}
          onGenerate={handleGeneratePlan}
          isGenerating={isGenerating}
          generationError={generationError}
          onClearError={() => setGenerationError(null)}
        />
      )}

      {currentView === 'workspace' && activePlan && (
        <PlanWorkspace
          plan={activePlan}
          initialTab={initialWorkspaceTab as any}
          onBack={() => setCurrentView('dashboard')}
          onSavePlan={handleSavePlan}
          onDuplicatePlan={handleDuplicatePlan}
          tasks={tasks.filter((t) => t.planId === activePlan.id)}
          onToggleChecklist={handleToggleChecklist}
          onUpdateTask={handleUpdateTask}
          onRefreshTasks={loadTasks}
        />
      )}

      {currentView === 'library' && (
        <PlanLibrary
          plans={plans}
          onSelectPlan={handleSelectPlan}
          onOpenWizard={() => handleOpenWizard()}
          onDuplicatePlan={handleDuplicatePlan}
          onDeletePlan={handleDeletePlan}
          onRenamePlan={handleRenamePlan}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={() => {
          loadHealth();
          loadPlans();
          loadTasks();
        }}
      />

      {/* Floating Success Notification Toast */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 shadow-xl dark:border-emerald-800/80 dark:bg-emerald-950/90 dark:text-emerald-200 transition-all"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-2 text-emerald-700 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100 font-bold"
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}
    </AppShell>
  );
};

export default App;
