import React, { useState, useEffect, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { PlanWizard } from './components/wizard/PlanWizard';
import { PlanWorkspace } from './components/workspace/PlanWorkspace';
import { PlanLibrary } from './components/library/PlanLibrary';
import { SettingsModal } from './components/settings/SettingsModal';
import { CurriculumDirectoryModal } from './components/directory/CurriculumDirectoryModal';
import { LessonPlan, GeneratePlanInput, PlanStatus } from './types/plan';
import { TeacherTask, TaskStats } from './types/task';
import { api, HealthResponse, ActivePlanSummary } from './services/api';
import { DeactivateConfirmModal } from './components/dashboard/DeactivateConfirmModal';
import { SwapActivePlanModal, ActivePlanItem } from './components/workspace/SwapActivePlanModal';
import { OverLimitResolutionModal } from './components/dashboard/OverLimitResolutionModal';
import { DeletePlanConfirmModal } from './components/common/DeletePlanConfirmModal';
import { normalizeError } from './utils/errorUtils';

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

  // Active Plans Management State (Max 3 Active Plans Single Source of Truth)
  const [activeSummary, setActiveSummary] = useState<ActivePlanSummary | null>(null);
  const [deactivateModalState, setDeactivateModalState] = useState<{
    isOpen: boolean;
    planId: string;
    planTitle: string;
  }>({ isOpen: false, planId: '', planTitle: '' });
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);

  const [swapModalState, setSwapModalState] = useState<{
    isOpen: boolean;
    planToActivate: { id: string; title: string; subject: string; gradeLevel: string } | null;
    activePlans: ActivePlanItem[];
  }>({ isOpen: false, planToActivate: null, activePlans: [] });
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const [isOverLimitModalOpen, setIsOverLimitModalOpen] = useState<boolean>(false);
  const [initialLibraryStatusFilter, setInitialLibraryStatusFilter] = useState<string | undefined>(undefined);

  // Delete Plan Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    plan: LessonPlan | null;
    triggerElement?: HTMLElement | null;
  }>({ isOpen: false, plan: null, triggerElement: null });

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

  const loadActiveSummary = useCallback(async () => {
    try {
      const summary = await api.getActiveSummary();
      setActiveSummary(summary);
    } catch (err) {
      console.error('Failed to load active plans summary:', err);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    loadTasks();
    loadHealth();
    loadActiveSummary();
  }, [loadPlans, loadTasks, loadHealth, loadActiveSummary]);

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

  // Directory Modal state triggered from Global Search or cards
  const [directoryModalState, setDirectoryModalState] = useState<{
    isOpen: boolean;
    curriculumId: string | null;
  }>({ isOpen: false, curriculumId: null });

  const handleSelectPlanById = (planId: string) => {
    const targetPlan = plans.find((p) => p.id === planId);
    if (targetPlan) {
      handleSelectPlan(targetPlan, 'overview');
    } else {
      api.getPlan(planId).then((fetchedPlan) => {
        handleSelectPlan(fetchedPlan, 'overview');
      }).catch((err) => {
        console.error('Could not locate plan for search navigation:', err);
      });
    }
  };

  const handleSelectCurriculum = (curriculumId: string) => {
    setDirectoryModalState({ isOpen: true, curriculumId });
  };

  const handleSelectStandard = (curriculumId: string, _standardId: string) => {
    setDirectoryModalState({ isOpen: true, curriculumId });
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

  const handleActivatePlan = async (plan: LessonPlan) => {
    try {
      const res = await api.activatePlan(plan.id);
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? res.plan : p)));
      if (activePlan?.id === plan.id) {
        setActivePlan(res.plan);
      }
      await loadActiveSummary();
      setSuccessMessage(`Activated "${plan.title}"! (${res.summary.activeCount}/${res.summary.maxActivePlans} active)`);
      setTimeout(() => setSuccessMessage(null), 5000);
      loadTasks();
    } catch (err: any) {
      if (err.code === 'ACTIVE_LIMIT_REACHED') {
        const activeList = err.activePlans || activeSummary?.activePlans || [];
        setSwapModalState({
          isOpen: true,
          planToActivate: {
            id: plan.id,
            title: plan.title,
            subject: plan.subject,
            gradeLevel: plan.gradeLevel,
          },
          activePlans: activeList,
        });
      } else {
        alert(err.message || 'Failed to activate plan.');
      }
    }
  };

  const handleOpenDeactivateModal = (planId: string, planTitle: string) => {
    setDeactivateModalState({ isOpen: true, planId, planTitle });
  };

  const handleDeactivateConfirm = async (planId: string) => {
    try {
      setIsDeactivating(true);
      const res = await api.deactivatePlan(planId);
      setPlans((prev) => prev.map((p) => (p.id === planId ? res.plan : p)));
      if (activePlan?.id === planId) {
        setActivePlan(res.plan);
      }
      await loadActiveSummary();
      setDeactivateModalState({ isOpen: false, planId: '', planTitle: '' });
      setSuccessMessage(`Plan deactivated and saved safely as Inactive.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate plan.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleSwapConfirm = async (deactivatePlanId: string, activatePlanId: string) => {
    try {
      setIsSwapping(true);
      const res = await api.swapActivePlans(deactivatePlanId, activatePlanId);
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id === deactivatePlanId) return res.deactivatedPlan;
          if (p.id === activatePlanId) return res.activatedPlan;
          return p;
        })
      );
      if (activePlan?.id === deactivatePlanId) {
        setActivePlan(res.deactivatedPlan);
      } else if (activePlan?.id === activatePlanId) {
        setActivePlan(res.activatedPlan);
      }
      await loadActiveSummary();
      setSwapModalState({ isOpen: false, planToActivate: null, activePlans: [] });
      setSuccessMessage(`Swapped active plans: "${res.activatedPlan.title}" is now active.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      loadTasks();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSwapping(false);
    }
  };

  const handleResolveOverLimit = async (keepPlanIds: string[], expectedActivePlanIds: string[]) => {
    const res = await api.resolveOverLimitActivePlans(keepPlanIds, expectedActivePlanIds);
    setPlans((prev) =>
      prev.map((p) => {
        const kept = res.keptPlans.find((kp) => kp.id === p.id);
        if (kept) return kept;
        const deactivated = res.deactivatedPlans.find((dp) => dp.id === p.id);
        if (deactivated) return deactivated;
        return p;
      })
    );
    if (activePlan) {
      const refreshed =
        res.keptPlans.find((kp) => kp.id === activePlan.id) ||
        res.deactivatedPlans.find((dp) => dp.id === activePlan.id);
      if (refreshed) setActivePlan(refreshed);
    }
    await loadActiveSummary();
    setSuccessMessage(`Active plans updated: ${res.keptPlans.length} active.`);
    setTimeout(() => setSuccessMessage(null), 5000);
    loadTasks();
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
      if (newPlan.savedAsDraftDueToLimit) {
        setSuccessMessage(`"${newPlan.title}" saved as draft because you have 3 active plans. You can deactivate an existing plan to activate this one.`);
      } else {
        setSuccessMessage(`Successfully generated "${newPlan.title}" (${newPlan.durationWeeks} weeks, ${newPlan.durationWeeks * newPlan.sessionsPerWeek} sessions)!`);
      }
      setTimeout(() => setSuccessMessage(null), 7000);
      await loadActiveSummary();
      loadTasks();
    } catch (err: unknown) {
      const normalized = normalizeError(err, 'Plan generation could not complete. The AI service is temporarily unavailable. Please try again.');
      setGenerationError(normalized.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async (updatedPlan: LessonPlan) => {
    try {
      const saved = await api.updatePlan(updatedPlan.id, updatedPlan);
      setActivePlan(saved);
      setPlans((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      await loadActiveSummary();
      loadTasks();
    } catch (err) {
      console.error('Save failed:', err);
      throw err;
    }
  };

  const handleOpenDeleteModal = (planOrId: LessonPlan | string, triggerEl?: HTMLElement) => {
    let targetPlan: LessonPlan | undefined;
    if (typeof planOrId === 'string') {
      targetPlan = plans.find((p) => p.id === planOrId);
    } else {
      targetPlan = planOrId;
    }
    if (targetPlan) {
      setDeleteModalState({
        isOpen: true,
        plan: targetPlan,
        triggerElement: triggerEl || null,
      });
    }
  };

  const handleConfirmDeletePlan = async (planToDelete: LessonPlan) => {
    try {
      const res = await api.deletePlan(planToDelete.id);
      const deletedId = res?.id || planToDelete.id;

      // Immediately remove from plans list
      setPlans((prev) => prev.filter((p) => p.id !== deletedId));

      // If the deleted plan is currently active or open in the workspace, navigate to Saved Plans (library)
      if (activePlan?.id === deletedId) {
        setActivePlan(null);
        setCurrentView('library');
      }

      // Close the confirmation modal
      setDeleteModalState({ isOpen: false, plan: null, triggerElement: null });

      // Show success toast only after server confirms
      setSuccessMessage('Lesson plan deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 5000);

      // Refresh active count, dashboard stats, and tasks
      await Promise.all([
        loadActiveSummary(),
        loadTasks(),
      ]);
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      // Re-throw so DeletePlanConfirmModal keeps the dialog open and displays inline error + Retry button
      throw err;
    }
  };

  const handleDuplicatePlan = async (id: string) => {
    try {
      const clone = await api.duplicatePlan(id);
      setPlans((prev) => [clone, ...prev]);
      setActivePlan(clone);
      setInitialWorkspaceTab('overview');
      setCurrentView('workspace');
      await loadActiveSummary();
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
      await loadActiveSummary();
      loadTasks();
    } catch (err) {
      console.error('Rename failed:', err);
      alert('Failed to rename plan.');
    }
  };

  const handleUpdateStatus = async (id: string, status: PlanStatus) => {
    try {
      if (status === 'active') {
        const plan = plans.find((p) => p.id === id);
        if (plan) {
          await handleActivatePlan(plan);
          return;
        }
      }
      const res = await api.updatePlanStatus(id, status);
      setPlans((prev) => prev.map((p) => (p.id === id ? res.plan : p)));
      if (activePlan?.id === id) {
        setActivePlan(res.plan);
      }
      await loadActiveSummary();
      loadTasks();
    } catch (err: any) {
      if (err.code === 'ACTIVE_LIMIT_REACHED') {
        const plan = plans.find((p) => p.id === id);
        if (plan) {
          setSwapModalState({
            isOpen: true,
            planToActivate: {
              id: plan.id,
              title: plan.title,
              subject: plan.subject,
              gradeLevel: plan.gradeLevel,
            },
            activePlans: err.activePlans || activeSummary?.activePlans || [],
          });
          return;
        }
      }
      console.error('Status update failed:', err);
      alert(err.message || 'Failed to update status.');
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
      onSelectPlan={handleSelectPlanById}
      onSelectCurriculum={handleSelectCurriculum}
      onSelectStandard={handleSelectStandard}
    >
      {currentView === 'dashboard' && (
        <Dashboard
          plans={plans}
          isLoading={isLoading}
          onSelectPlan={handleSelectPlan}
          onOpenWizard={handleOpenWizard}
          onRefreshPlans={loadPlans}
          onDuplicatePlan={handleDuplicatePlan}
          onDeletePlan={handleOpenDeleteModal}
          onRenamePlan={handleRenamePlan}
          onUpdateStatus={handleUpdateStatus}
          onViewLibrary={(statusFilter) => {
            setInitialLibraryStatusFilter(statusFilter);
            setCurrentView('library');
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          tasks={tasks}
          taskStats={taskStats}
          onToggleChecklist={handleToggleChecklist}
          onUpdateTask={handleUpdateTask}
          onContinueTaskWorkflow={handleContinueTaskWorkflow}
          onRefreshTasks={loadTasks}
          searchFilter={searchQuery}
          activeSummary={activeSummary}
          onDeactivatePlan={handleOpenDeactivateModal}
          onOpenOverLimitModal={() => setIsOverLimitModalOpen(true)}
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
          activeSummary={activeSummary}
          onActivatePlan={handleActivatePlan}
          onDeactivatePlan={handleOpenDeactivateModal}
          onUpdateStatus={handleUpdateStatus}
          onDeletePlan={handleOpenDeleteModal}
        />
      )}

      {currentView === 'library' && (
        <PlanLibrary
          plans={plans}
          onSelectPlan={handleSelectPlan}
          onOpenWizard={() => handleOpenWizard()}
          onDuplicatePlan={handleDuplicatePlan}
          onDeletePlan={handleOpenDeleteModal}
          onRenamePlan={handleRenamePlan}
          onUpdateStatus={handleUpdateStatus}
          activeSummary={activeSummary}
          onActivatePlan={handleActivatePlan}
          onDeactivatePlan={handleOpenDeactivateModal}
          initialStatusFilter={initialLibraryStatusFilter}
        />
      )}

      {/* Delete Plan Confirmation Modal */}
      <DeletePlanConfirmModal
        isOpen={deleteModalState.isOpen}
        plan={deleteModalState.plan}
        onConfirm={handleConfirmDeletePlan}
        onClose={() => setDeleteModalState({ isOpen: false, plan: null, triggerElement: null })}
        triggerElement={deleteModalState.triggerElement}
      />

      {/* Deactivate Plan Confirmation Modal */}
      <DeactivateConfirmModal
        isOpen={deactivateModalState.isOpen}
        planId={deactivateModalState.planId}
        planTitle={deactivateModalState.planTitle}
        onConfirm={handleDeactivateConfirm}
        onClose={() => setDeactivateModalState({ isOpen: false, planId: '', planTitle: '' })}
        isSubmitting={isDeactivating}
      />

      {/* Swap Active Plan Modal (When At 3/3 Limit) */}
      <SwapActivePlanModal
        isOpen={swapModalState.isOpen}
        planToActivate={swapModalState.planToActivate}
        activePlans={swapModalState.activePlans}
        onSwapConfirm={handleSwapConfirm}
        onClose={() => setSwapModalState({ isOpen: false, planToActivate: null, activePlans: [] })}
        isSubmitting={isSwapping}
      />

      {/* Over-Limit Resolution Modal (For Accounts With >3 Active Plans) */}
      <OverLimitResolutionModal
        isOpen={isOverLimitModalOpen}
        activePlans={activeSummary?.activePlans || []}
        maxActivePlans={activeSummary?.maxActivePlans || 3}
        onResolve={handleResolveOverLimit}
        onClose={() => setIsOverLimitModalOpen(false)}
        onViewInactivePlans={() => {
          setInitialLibraryStatusFilter('cancelled');
          setCurrentView('library');
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={() => {
          loadHealth();
          loadPlans();
          loadTasks();
          loadActiveSummary();
        }}
      />

      {/* Curriculum Directory Modal for Global Search & Exploration */}
      <CurriculumDirectoryModal
        isOpen={directoryModalState.isOpen}
        initialCurriculumId={directoryModalState.curriculumId}
        onClose={() => setDirectoryModalState({ isOpen: false, curriculumId: null })}
        onOpenSuggestModal={() => setDirectoryModalState({ isOpen: false, curriculumId: null })}
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
