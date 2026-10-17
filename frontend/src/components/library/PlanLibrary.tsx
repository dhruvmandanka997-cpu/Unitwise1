import React, { useState, useMemo } from 'react';
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
  Info
} from 'lucide-react';
import { LessonPlan } from '../../types/plan';
import { SUBJECT_OPTIONS } from '../../data/templates';
import { api } from '../../services/api';

interface PlanLibraryProps {
  plans: LessonPlan[];
  onSelectPlan: (plan: LessonPlan) => void;
  onOpenWizard: () => void;
  onDuplicatePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onRenamePlan: (id: string, newTitle: string) => void;
  onUpdateStatus?: (id: string, status: 'draft' | 'completed' | 'archived') => void;
}

export const PlanLibrary: React.FC<PlanLibraryProps> = ({
  plans,
  onSelectPlan,
  onOpenWizard,
  onDuplicatePlan,
  onDeletePlan,
  onRenamePlan,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'duration'>('updated');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
        const matchesStatus = selectedStatus === 'ALL' || plan.status === selectedStatus;

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
          <option value="draft">Drafts</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
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
                className="group relative flex flex-col justify-between neu-card-interactive p-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-[var(--border)] ${
                        plan.status === 'completed'
                          ? 'bg-[var(--lavender-soft)] text-[var(--primary)]'
                          : plan.status === 'archived'
                          ? 'bg-slate-100 text-[var(--text-muted)]'
                          : 'bg-white text-[var(--text-muted)]'
                      }`}>
                        {plan.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-[var(--primary)]" />}
                        {plan.status === 'completed' ? 'Completed' : plan.status === 'archived' ? 'Archived' : 'Draft'}
                      </span>

                      {/* Three-dot Secondary Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === plan.id ? null : plan.id);
                          }}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          aria-label="More actions"
                          aria-expanded={menuOpenId === plan.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {menuOpenId === plan.id && (
                          <div 
                            className="absolute right-0 top-7 z-30 w-52 rounded-[16px] border border-[var(--border)] bg-white py-2 shadow-neu-raised"
                            onMouseLeave={() => setMenuOpenId(null)}
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
                            {onUpdateStatus && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(plan.id, plan.status === 'completed' ? 'draft' : 'completed');
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                                {plan.status === 'completed' ? 'Mark as Draft' : 'Mark as Completed'}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(plan.id);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Plan
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md neu-card p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text)]">Delete Curriculum Plan?</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to permanently delete this curriculum plan? All generated weekly sequences, daily sessions, and differentiation strategies will be removed.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="neu-btn-secondary px-3.5 py-1.5 text-xs font-semibold text-[var(--text-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeletePlan(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-[16px] bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
              >
                Delete Plan
              </button>
            </div>
          </div>
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
