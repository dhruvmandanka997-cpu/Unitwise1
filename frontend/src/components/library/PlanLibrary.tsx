import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Edit3, 
  Download, 
  Printer, 
  FileCode,
  ArrowRight,
  Plus,
  FolderKanban,
  CheckCircle2,
  Info,
  BookOpen,
  Flame,
  Pause,
  RotateCcw,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { LessonPlan, PlanStatus } from '../../types/plan';
import { SUBJECT_OPTIONS } from '../../data/templates';
import { api, ActivePlanSummary } from '../../services/api';

interface PlanLibraryProps {
  plans: LessonPlan[];
  onSelectPlan: (plan: LessonPlan) => void;
  onOpenWizard: () => void;
  onDuplicatePlan: (id: string) => void;
  onDeletePlan: (plan: LessonPlan, triggerEl?: HTMLElement) => void;
  onRenamePlan: (id: string, newTitle: string) => void;
  onUpdateStatus?: (id: string, status: PlanStatus) => void;
  activeSummary?: ActivePlanSummary | null;
  onActivatePlan?: (plan: LessonPlan) => Promise<void>;
  onDeactivatePlan?: (planId: string, planTitle: string) => void;
  initialStatusFilter?: string;
}

export const PlanLibrary: React.FC<PlanLibraryProps> = ({
  plans,
  onSelectPlan,
  onOpenWizard,
  onDuplicatePlan,
  onDeletePlan,
  onRenamePlan,
  onUpdateStatus,
  activeSummary,
  onActivatePlan,
  onDeactivatePlan,
  initialStatusFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState(initialStatusFilter || 'ALL');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'duration'>('updated');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameState, setRenameState] = useState<{ id: string; title: string } | null>(null);

  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) => {
        const matchesSearch =
          plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.unitOverview.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSubject = selectedSubject === 'ALL' || plan.subject === selectedSubject;
        const matchesStatus =
          selectedStatus === 'ALL' ||
          (selectedStatus === 'cancelled'
            ? plan.status === 'cancelled' || (plan as any).status === 'archived'
            : plan.status === selectedStatus);

        return matchesSearch && matchesSubject && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'duration') return b.durationWeeks - a.durationWeeks;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [plans, searchTerm, selectedSubject, selectedStatus, sortBy]);

  const handleExecuteRename = () => {
    if (renameState && renameState.title.trim()) {
      onRenamePlan(renameState.id, renameState.title.trim());
      setRenameState(null);
    }
  };

  // Close three-dot menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpenId) return;

    const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-plan-menu]')) {
        setMenuOpenId(null);
      }
    };

    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpenId(null);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [menuOpenId]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const items = Array.from(container.querySelectorAll<HTMLElement>('button, a'));
    const activeIdx = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
      items[nextIdx]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
      items[prevIdx]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMenuOpenId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
              My Learning Plans
            </h1>
            <span className="inline-flex items-center rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-3 py-0.5 text-xs font-semibold text-[var(--primary)]">
              {plans.length} total
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Curated repository of all generated and customized multi-week instructional units
          </p>
        </div>

        <button
          onClick={onOpenWizard}
          className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          Create lesson plan
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 neu-card p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plans, subjects, units..."
            className="w-full neu-input pl-9 pr-3.5 py-2 text-xs text-[var(--text)]"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="neu-input px-3.5 py-2 text-xs text-[var(--text)]"
        >
          <option value="ALL">All Subjects</option>
          {SUBJECT_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="neu-input px-3.5 py-2 text-xs text-[var(--text)]"
        >
          <option value="ALL">All Statuses</option>
          <option value="active">Active Plans</option>
          <option value="draft">Drafts</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Inactive</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'updated' | 'title' | 'duration')}
          className="neu-input px-3.5 py-2 text-xs text-[var(--text)]"
        >
          <option value="updated">Recently Updated</option>
          <option value="title">Title (A-Z)</option>
          <option value="duration">Duration (Weeks)</option>
        </select>
      </div>

      {/* Demo Notice Banner */}
      {plans.some((p) => p.isDemo) && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-[16px] bg-[var(--lavender-soft)]/60 border border-[var(--border)] text-xs text-[var(--primary)] font-medium">
          <Info className="h-4 w-4 text-[var(--primary)] shrink-0" />
          <span>Curriculum library includes pre-loaded demonstration units designed for reference.</span>
        </div>
      )}

      {/* Plan Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="neu-card p-12 text-center border-dashed border-[var(--border)]">
          <FolderKanban className="mx-auto h-10 w-10 text-[var(--text-muted)] mb-3" />
          <h3 className="text-sm font-bold text-[var(--text)]">
            No matching curriculum plans in your library
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)] max-w-sm mx-auto font-normal">
            Try adjusting your search criteria or create a new instructional plan.
          </p>
          <div className="mt-4">
            <button
              onClick={onOpenWizard}
              className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Generate New Plan
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredPlans.map((plan) => {
            const totalSessions = plan.weeklyPlans 
              ? plan.weeklyPlans.reduce((acc, w) => acc + w.sessions.length, 0)
              : 0;

            return (
              <div
                key={plan.id}
                onClick={() => onSelectPlan(plan)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'A') {
                      e.preventDefault();
                      onSelectPlan(plan);
                    }
                  }
                }}
                className={`group relative flex flex-col justify-between neu-card-interactive p-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  menuOpenId === plan.id ? 'z-30' : 'z-0'
                }`}
              >
                <div className="space-y-3">
                  {/* Row 1: Subject & Grade, Status Badge, and 3-dot Menu */}
                  <div className="flex items-center justify-between gap-2">
                    <div 
                      className="text-xs text-[var(--text-muted)] font-medium min-w-0 truncate"
                      title={`${plan.subject} • ${plan.gradeLevel}`}
                    >
                      <span className="font-bold text-[var(--text)]">{plan.subject}</span>
                      <span className="mx-1.5 text-[var(--border)]">&bull;</span>
                      <span>{plan.gradeLevel}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Status Indicator */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        plan.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-bold'
                          : plan.status === 'completed'
                          ? 'bg-[var(--lavender-soft)] text-[var(--primary)] border-[var(--border)]'
                          : plan.status === 'cancelled' || (plan as any).status === 'archived'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800 text-[var(--text-muted)] border-[var(--border)]'
                      }`}>
                        {plan.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {plan.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-[var(--primary)]" />}
                        {(plan.status === 'cancelled' || (plan as any).status === 'archived') && <Pause className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />}
                        {plan.status === 'draft' && <FileText className="w-2.5 h-2.5 text-[var(--text-muted)]" />}
                        {plan.status === 'active'
                          ? 'Active'
                          : plan.status === 'completed'
                          ? 'Completed'
                          : plan.status === 'cancelled' || (plan as any).status === 'archived'
                          ? 'Inactive'
                          : 'Draft'}
                      </span>

                      {/* Three-dot Secondary Actions Menu */}
                      <div className="relative" data-plan-menu>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === plan.id ? null : plan.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                              e.preventDefault();
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === plan.id ? null : plan.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                          aria-label={`More actions for ${plan.title}`}
                          aria-haspopup="true"
                          aria-expanded={menuOpenId === plan.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {menuOpenId === plan.id && (
                          <div 
                            role="menu"
                            aria-label={`Actions for ${plan.title}`}
                            onKeyDown={handleMenuKeyDown}
                            className="absolute right-0 top-full mt-1.5 z-40 w-52 max-h-[85vh] overflow-y-auto rounded-[16px] border border-[var(--border)] bg-[var(--surface)] py-1.5 shadow-neu-raised animate-fadeIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPlan(plan);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-[var(--primary)]" />
                              Open & Edit Workspace
                            </button>

                            {/* Canonical Status Actions */}
                            {plan.status === 'active' && onDeactivatePlan && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeactivatePlan(plan.id, plan.title);
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              >
                                <Pause className="h-3.5 w-3.5 text-amber-600" />
                                Deactivate Plan
                              </button>
                            )}

                            {plan.status === 'active' && onUpdateStatus && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(plan.id, 'completed');
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                                Mark as Completed
                              </button>
                            )}

                            {plan.status === 'draft' && onActivatePlan && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onActivatePlan(plan);
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              >
                                <Flame className="h-3.5 w-3.5 text-emerald-600" />
                                Activate Plan
                              </button>
                            )}

                            {(plan.status === 'cancelled' || (plan as any).status === 'archived') && onActivatePlan && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onActivatePlan(plan);
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              >
                                <Flame className="h-3.5 w-3.5 text-emerald-600" />
                                Reactivate Plan
                              </button>
                            )}

                            {plan.status === 'completed' && onActivatePlan && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onActivatePlan(plan);
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--lavender-soft)] transition-colors"
                              >
                                <RotateCcw className="h-3.5 w-3.5 text-[var(--primary)]" />
                                Reopen Plan
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenameState({ id: plan.id, title: plan.title });
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                              Rename Title
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicatePlan(plan.id);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                              Duplicate Plan
                            </button>

                            <div className="my-1 border-t border-[var(--border)]" />

                            <a
                              href={api.getExportDocxUrl(plan.id)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                            >
                              <Download className="h-3.5 w-3.5 text-[var(--primary)]" />
                              Export Word (.docx)
                            </a>
                            <a
                              href={api.getExportPdfUrl(plan.id)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                            >
                              <Download className="h-3.5 w-3.5 text-[var(--accent)]" />
                              Export PDF (.pdf)
                            </a>
                            <a
                              href={api.getExportPrintUrl(plan.id)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                            >
                              <Printer className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                              Print View
                            </a>
                            <a
                              href={api.getExportCsvUrl(plan.id)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                            >
                              <FileCode className="h-3.5 w-3.5 text-[var(--primary)]" />
                              Export CSV Tracker
                            </a>

                            <div className="my-1 border-t border-[var(--border)]" />

                            <button
                              type="button"
                              role="menuitem"
                              onClick={(e) => {
                                e.stopPropagation();
                                const btn = e.currentTarget;
                                onDeletePlan(plan, btn);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" />
                              <span>Delete Plan</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Prominent Plan Title */}
                  <h3 
                    className="text-base font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-snug break-words"
                  >
                    {plan.title}
                  </h3>

                  {/* Curriculum Snapshot Summary */}
                  {plan.curriculumContext?.labels?.summary ? (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--primary)] truncate">
                      <BookOpen className="w-3 h-3 text-[var(--accent)] shrink-0" />
                      <span className="truncate">{plan.curriculumContext.labels.summary}</span>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-normal text-[var(--text-muted)] truncate">
                      <span className="truncate">{plan.curriculumFramework || 'No curriculum set'}</span>
                    </div>
                  )}
                </div>

                {/* Row 3: Footer with Duration, Session Count, and Open Plan Action */}
                <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5 font-medium text-[var(--text-muted)] shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                    <span className="whitespace-nowrap">{plan.durationWeeks} {plan.durationWeeks === 1 ? 'wk' : 'wks'}</span>
                    <span className="text-[var(--border)]">&bull;</span>
                    <span className="whitespace-nowrap">{totalSessions} {totalSessions === 1 ? 'sess' : 'sessions'}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlan(plan);
                    }}
                    className="neu-btn-secondary inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] px-3 py-1 rounded-[12px] whitespace-nowrap"
                  >
                    <span>Open Plan</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Rename Modal */}
      {renameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md neu-card p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text)]">Rename Plan</h3>
            <input
              type="text"
              value={renameState.title}
              onChange={(e) => setRenameState({ ...renameState, title: e.target.value })}
              className="w-full neu-input px-3 py-2 text-xs font-medium text-[var(--text)]"
              autoFocus
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRenameState(null)}
                className="neu-btn-secondary px-3.5 py-1.5 text-xs font-semibold text-[var(--text-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRename}
                className="neu-btn-primary px-3.5 py-1.5 text-xs font-bold text-white"
              >
                Save Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
