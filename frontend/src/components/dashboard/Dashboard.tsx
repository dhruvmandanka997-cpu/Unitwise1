import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  FileText, 
  GraduationCap, 
  Sparkles, 
  Compass, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { LessonPlan } from '../../types/plan';
import { TeacherTask, TaskStats } from '../../types/task';
import { QUICK_START_TEMPLATES } from '../../data/templates';
import { BRAND } from '../../config/brand';
import { AcademicHeroIllustration } from './AcademicHeroIllustration';
import { PlanningProgressCard } from './PlanningProgressCard';
import { UpcomingLessonsCard } from './UpcomingLessonsCard';
import { QuickActionsCard } from './QuickActionsCard';
import { RecentPlansCard } from './RecentPlansCard';
import { 
  MathCoordinatePlaneVisual, 
  ScienceEcosystemVisual, 
  HumanitiesRhetoricVisual, 
  ComputerScienceFlowchartVisual 
} from './BlueprintCardVisuals';

interface DashboardProps {
  plans: LessonPlan[];
  isLoading: boolean;
  onSelectPlan: (plan: LessonPlan) => void;
  onOpenWizard: (templateId?: string) => void;
  onRefreshPlans: () => void;
  onDuplicatePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onRenamePlan: (id: string, newTitle: string) => void;
  onUpdateStatus?: (id: string, status: 'draft' | 'completed' | 'archived') => void;
  onViewLibrary?: () => void;
  onOpenSettings?: () => void;
  tasks: TeacherTask[];
  taskStats: TaskStats;
  onToggleChecklist: (taskId: string, itemId: string, completed: boolean) => Promise<void>;
  onUpdateTask: (taskId: string, partial: Partial<TeacherTask>) => Promise<void>;
  onContinueTaskWorkflow: (planId: string, tab?: string) => void;
  onRefreshTasks?: () => void;
  searchFilter?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  plans,
  isLoading: _isLoading,
  onSelectPlan,
  onOpenWizard,
  onDuplicatePlan: _onDuplicatePlan,
  onDeletePlan: _onDeletePlan,
  onRenamePlan: _onRenamePlan,
  onUpdateStatus: _onUpdateStatus,
  onViewLibrary,
  onOpenSettings,
  tasks: _tasks,
  taskStats,
  onToggleChecklist: _onToggleChecklist,
  onUpdateTask: _onUpdateTask,
  onContinueTaskWorkflow: _onContinueTaskWorkflow,
  onRefreshTasks: _onRefreshTasks,
  searchFilter: _searchFilter = '',
}) => {
  const [selectedTaskStatusFilter, setSelectedTaskStatusFilter] = useState<string>('ALL');

  // Real calculated summary metrics connected to saved plan data
  const stats = useMemo(() => {
    const totalPlans = plans.length;
    const totalWeeks = plans.reduce((acc, p) => acc + (p.durationWeeks || 0), 0);
    const totalSessions = plans.reduce(
      (acc, p) => acc + (p.weeklyPlans ? p.weeklyPlans.reduce((sAcc, w) => sAcc + (w.sessions ? w.sessions.length : 0), 0) : 0),
      0
    );
    const uniqueSubjects = new Set(plans.map((p) => p.subject)).size;
    return { totalPlans, totalWeeks, totalSessions, uniqueSubjects };
  }, [plans]);

  // Starter Blueprints with subject-specific diagram mapping
  const starterBlueprints = useMemo(() => {
    return QUICK_START_TEMPLATES.map((tmpl) => {
      let visualComponent: React.ReactNode = null;

      if (tmpl.subject.toLowerCase().includes('math')) {
        visualComponent = <MathCoordinatePlaneVisual />;
      } else if (tmpl.subject.toLowerCase().includes('computer') || tmpl.subject.toLowerCase().includes('python')) {
        visualComponent = <ComputerScienceFlowchartVisual />;
      } else if (tmpl.subject.toLowerCase().includes('science')) {
        visualComponent = <ScienceEcosystemVisual />;
      } else {
        visualComponent = <HumanitiesRhetoricVisual />;
      }

      return {
        ...tmpl,
        visual: visualComponent,
      };
    });
  }, []);

  const handleBrowseTemplates = () => {
    const el = document.getElementById('templates');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onViewLibrary) {
      onViewLibrary();
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-7 min-w-0">
          
          {/* Hero Welcome Banner */}
          <section className="relative overflow-hidden rounded-[24px] neu-hero-glow border border-[var(--border)] p-6 sm:p-8 neu-card">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left Text & CTA Area */}
              <div className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)]">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {BRAND.name} Curriculum Studio
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)] leading-tight">
                    Plan engaging, standards-aligned lessons with {BRAND.name}
                  </h1>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Create high-quality lesson plans, save your work, and bring instructional ideas to life with gentle AI scaffolding.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => onOpenWizard()}
                    className="neu-btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  >
                    <Plus className="h-4 w-4" />
                    Create Lesson Plan
                  </button>

                  <button
                    onClick={handleBrowseTemplates}
                    className="neu-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  >
                    <Compass className="h-4 w-4 text-[var(--accent)]" />
                    Browse Templates
                  </button>
                </div>
              </div>

              {/* Right Educational Illustration */}
              <div className="w-full md:w-auto flex justify-center md:justify-end shrink-0">
                <AcademicHeroIllustration className="max-w-[240px] sm:max-w-[280px]" />
              </div>
            </div>
          </section>

          {/* Summary Metrics: One horizontal neumorphic card with 4 metrics */}
          <section aria-label="Curriculum Summary Metrics">
            <div className="neu-card overflow-hidden">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
                {/* Metric 1: Total Plans */}
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="neu-icon-box shrink-0">
                    <FileText className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
                      {stats.totalPlans}
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-muted)]">
                      Total Plans
                    </div>
                  </div>
                </div>

                {/* Metric 2: Weeks Planned */}
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="neu-icon-box shrink-0">
                    <Calendar className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
                      {stats.totalWeeks}
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-muted)]">
                      Weeks Planned
                    </div>
                  </div>
                </div>

                {/* Metric 3: Daily Sessions */}
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="neu-icon-box shrink-0">
                    <Clock className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
                      {stats.totalSessions}
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-muted)]">
                      Daily Sessions
                    </div>
                  </div>
                </div>

                {/* Metric 4: Active Disciplines */}
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="neu-icon-box shrink-0">
                    <GraduationCap className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
                      {stats.uniqueSubjects}
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-muted)]">
                      Active Disciplines
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Curriculum Starter Blueprints */}
          <section id="templates" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-base font-bold tracking-tight text-[var(--text)]">
                  Curriculum Starter Blueprints
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Pre-designed frameworks for common subjects and grade bands.
                </p>
              </div>

              <button
                onClick={() => onOpenWizard()}
                className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--accent)] hover:underline inline-flex items-center gap-1 self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                <span>View all templates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {starterBlueprints.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="group flex flex-col justify-between neu-card-interactive p-5"
                >
                  <div className="space-y-3">
                    {/* Subject Category Label & Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)]">
                        {tmpl.subject}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--text-muted)]">
                        {tmpl.gradeLevel} &bull; {tmpl.classDurationMinutes} min
                      </span>
                    </div>

                    {/* Relevant Subject-Specific Diagram / Visual */}
                    <div className="pt-1">
                      {tmpl.visual}
                    </div>

                    {/* Concise Title */}
                    <h3 className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                      {tmpl.title}
                    </h3>

                    {/* Readable Description */}
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                      {tmpl.description}
                    </p>
                  </div>

                  {/* Footer with Load Plan Action */}
                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {tmpl.durationWeeks} weeks &bull; {tmpl.sessionsPerWeek * tmpl.durationWeeks} sessions
                    </span>

                    <button
                      onClick={() => onOpenWizard(tmpl.id)}
                      className="neu-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                    >
                      <span>Load Plan</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          
          {/* Planning Progress Card with circular completion chart */}
          <PlanningProgressCard
            stats={taskStats}
            selectedStatusFilter={selectedTaskStatusFilter}
            onSelectStatusFilter={setSelectedTaskStatusFilter}
          />

          {/* Upcoming Lessons: "Upcoming This Week" */}
          <UpcomingLessonsCard
            plans={plans}
            onSelectPlan={onSelectPlan}
            onOpenWizard={() => onOpenWizard()}
            onViewLibrary={onViewLibrary}
          />

          {/* Quick Actions */}
          <QuickActionsCard
            onOpenWizard={() => onOpenWizard()}
            onBrowseTemplates={handleBrowseTemplates}
            onViewLibrary={() => {
              if (onViewLibrary) onViewLibrary();
            }}
            onManageSubjects={() => {
              if (onOpenSettings) onOpenSettings();
            }}
          />

          {/* Recent Lesson Plans */}
          <RecentPlansCard
            plans={plans}
            onSelectPlan={onSelectPlan}
            onViewLibrary={onViewLibrary}
            onOpenWizard={() => onOpenWizard()}
          />
        </div>
      </div>
    </div>
  );
};
