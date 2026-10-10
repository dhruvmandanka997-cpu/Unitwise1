import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Edit3, 
  Download, 
  Printer, 
  FileCode,
  BookOpen,
  ArrowRight,
  PlusCircle,
  FileText
} from 'lucide-react';
import { LessonPlan } from '../../types/plan';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../../data/templates';
import { api } from '../../services/api';

interface PlanLibraryProps {
  plans: LessonPlan[];
  onSelectPlan: (plan: LessonPlan) => void;
  onOpenWizard: () => void;
  onDuplicatePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onRenamePlan: (id: string, newTitle: string) => void;
}

export const PlanLibrary: React.FC<PlanLibraryProps> = ({
  plans,
  onSelectPlan,
  onOpenWizard,
  onDuplicatePlan,
  onDeletePlan,
  onRenamePlan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
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
        const matchesGrade = selectedGrade === 'ALL' || plan.gradeLevel.includes(selectedGrade);
        const matchesStatus = selectedStatus === 'ALL' || plan.status === selectedStatus;

        return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'duration') return b.durationWeeks - a.durationWeeks;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [plans, searchTerm, selectedSubject, selectedGrade, selectedStatus, sortBy]);

  const handleExecuteRename = () => {
    if (renameState && renameState.title.trim()) {
      onRenamePlan(renameState.id, renameState.title.trim());
      setRenameState(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-navy-200 pb-5 dark:border-navy-800">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white">
            Saved Curriculum Plans Library
          </h1>
          <p className="mt-1 text-sm text-navy-600 dark:text-navy-300">
            Persistent archive of all generated instructional units ({plans.length} total)
          </p>
        </div>
        <button
          onClick={onOpenWizard}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Plan
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-navy-200/90 dark:bg-navy-900 dark:border-navy-800 shadow-subtle">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plans, subjects, units..."
            className="w-full rounded-lg border border-navy-200 bg-white pl-9 pr-3 py-1.5 text-xs text-navy-900 placeholder-navy-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
        >
          <option value="ALL">All Subjects</option>
          {SUBJECT_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
        >
          <option value="ALL">All Statuses</option>
          <option value="draft">Drafts</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'updated' | 'title' | 'duration')}
          className="rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
        >
          <option value="updated">Recently Updated</option>
          <option value="title">Title (A-Z)</option>
          <option value="duration">Duration (Weeks)</option>
        </select>
      </div>

      {/* Plan Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy-300 bg-white p-12 text-center dark:border-navy-700 dark:bg-navy-900/50">
          <BookOpen className="mx-auto h-12 w-12 text-navy-300 dark:text-navy-600 mb-3" />
          <h3 className="text-base font-bold text-navy-800 dark:text-navy-200">
            No matching curriculum plans in your library
          </h3>
          <p className="mt-1 text-xs text-navy-500 dark:text-navy-400 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new instructional plan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => {
            const totalSessions = plan.weeklyPlans.reduce((acc, w) => acc + w.sessions.length, 0);

            return (
              <div
                key={plan.id}
                className="group relative flex flex-col justify-between rounded-xl border border-navy-200/90 bg-white p-5 shadow-subtle transition-all hover:border-brand-300 hover:shadow-card dark:border-navy-800 dark:bg-navy-900"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-navy-800 dark:text-brand-300">
                        {plan.subject}
                      </span>
                      <span className="rounded-md bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-700 dark:bg-navy-800 dark:text-navy-300">
                        {plan.gradeLevel}
                      </span>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === plan.id ? null : plan.id)}
                        className="rounded p-1 text-navy-400 hover:text-navy-700 hover:bg-navy-100 dark:hover:text-navy-200"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {menuOpenId === plan.id && (
                        <div 
                          className="absolute right-0 top-6 z-20 w-48 rounded-lg border border-navy-200 bg-white py-1 shadow-lg dark:border-navy-700 dark:bg-navy-800"
                          onMouseLeave={() => setMenuOpenId(null)}
                        >
                          <button
                            onClick={() => {
                              onSelectPlan(plan);
                              setMenuOpenId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Open Workspace
                          </button>
                          <button
                            onClick={() => {
                              setRenameState({ id: plan.id, title: plan.title });
                              setMenuOpenId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Rename Plan
                          </button>
                          <button
                            onClick={() => {
                              onDuplicatePlan(plan.id);
                              setMenuOpenId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate Plan
                          </button>
                          <div className="my-1 border-t border-navy-100 dark:border-navy-700" />
                          <a
                            href={api.getExportDocxUrl(plan.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Export Word (.docx)
                          </a>
                          <a
                            href={api.getExportPdfUrl(plan.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Export PDF (.pdf)
                          </a>
                          <a
                            href={api.getExportPrintUrl(plan.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print View
                          </a>
                          <a
                            href={api.getExportCsvUrl(plan.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                          >
                            <FileCode className="h-3.5 w-3.5" />
                            Export CSV
                          </a>
                          <div className="my-1 border-t border-navy-100 dark:border-navy-700" />
                          <button
                            onClick={() => {
                              setDeleteConfirmId(plan.id);
                              setMenuOpenId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Plan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectPlan(plan)}
                    className="text-left w-full group/title focus:outline-none"
                  >
                    <h3 className="text-base font-bold text-navy-900 group-hover/title:text-brand-600 dark:text-white dark:group-hover/title:text-brand-400 line-clamp-2">
                      {plan.title}
                    </h3>
                  </button>

                  <p className="text-xs text-navy-500 dark:text-navy-400 line-clamp-2 leading-relaxed">
                    {plan.unitOverview}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between text-xs text-navy-500 dark:text-navy-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-navy-400" />
                      {plan.durationWeeks}w ({totalSessions} sess)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-navy-400" />
                      {plan.classDurationMinutes}m
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectPlan(plan)}
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Open Plan
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-navy-900 border border-navy-200 dark:border-navy-800 space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">Delete Curriculum Plan?</h3>
            <p className="text-sm text-navy-600 dark:text-navy-300">
              Are you sure you want to delete this curriculum plan? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-100 dark:text-navy-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeletePlan(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-navy-900 border border-navy-200 dark:border-navy-800 space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">Rename Plan</h3>
            <input
              type="text"
              value={renameState.title}
              onChange={(e) => setRenameState({ ...renameState, title: e.target.value })}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRenameState(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-100 dark:text-navy-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRename}
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-500"
              >
                Save New Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
