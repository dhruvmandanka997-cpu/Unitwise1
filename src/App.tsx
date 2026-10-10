import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { PlanWizard } from './components/wizard/PlanWizard';
import { PlanWorkspace } from './components/workspace/PlanWorkspace';
import { PlanLibrary } from './components/library/PlanLibrary';
import { SettingsModal } from './components/settings/SettingsModal';
import { LessonPlan, GeneratePlanInput } from './types/plan';
import { api, HealthResponse } from './services/api';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'wizard' | 'workspace' | 'library'>('dashboard');
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Dark mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  useEffect(() => {
    loadPlans();
    loadHealth();
  }, []);

  const handleOpenWizard = (templateId?: string) => {
    setSelectedTemplateId(templateId);
    setGenerationError(null);
    setCurrentView('wizard');
  };

  const handleSelectPlan = (plan: LessonPlan) => {
    setActivePlan(plan);
    setCurrentView('workspace');
  };

  const handleGeneratePlan = async (input: GeneratePlanInput) => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const newPlan = await api.generatePlan(input);
      setPlans((prev) => [newPlan, ...prev]);
      setActivePlan(newPlan);
      setCurrentView('workspace');
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
      setCurrentView('workspace');
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
    } catch (err) {
      console.error('Rename failed:', err);
      alert('Failed to rename plan.');
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 text-navy-900 dark:bg-navy-950 dark:text-navy-100 flex flex-col transition-colors">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setSelectedTemplateId(undefined);
          setCurrentView(view);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        liveAiAvailable={health?.liveAiAvailable ?? false}
        planCount={plans.length}
      />

      <main className="flex-1 pb-16">
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
            onBack={() => setCurrentView('dashboard')}
            onSavePlan={handleSavePlan}
            onDuplicatePlan={handleDuplicatePlan}
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
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-200/80 bg-white py-6 dark:border-navy-800 dark:bg-navy-900 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-navy-500 dark:text-navy-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-800 dark:text-white">LessonCraft AI</span>
            <span>&bull;</span>
            <span>Intelligent Multi-Week Instructional Planning Assistant</span>
          </div>
          <div>
            Built with Backward Design (UbD) &bull; Bloom’s Taxonomy Alignment &bull; Verified Curricula
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={() => {
          loadHealth();
          loadPlans();
        }}
      />
    </div>
  );
};

export default App;
