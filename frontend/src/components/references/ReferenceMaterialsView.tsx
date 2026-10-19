import React, { useState, useMemo, useEffect } from 'react';
import {
  ExternalLink,
  Search,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Plus,
  Trash2,
  BookOpen,
  FileCheck,
  Video,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Filter,
  X,
  Calendar,
  Layers,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LessonPlan, ReferenceMaterial, ReferenceCategory, ReferenceResourceType } from '../../types/plan';
import { api } from '../../services/api';

interface ReferenceMaterialsViewProps {
  plan: LessonPlan;
  onUpdatePlan: (updatedPlan: LessonPlan) => void;
  compact?: boolean;
  filterWeek?: number;
  filterLesson?: string;
}

export const CATEGORY_DEFINITIONS: {
  id: ReferenceCategory;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    id: 'standards',
    label: 'Curriculum Standards & Syllabus',
    shortLabel: 'Standards',
    icon: FileCheck,
    description: 'Official board syllabi, academic framework documents, and learning outcomes',
  },
  {
    id: 'textbooks',
    label: 'Textbooks & Reading Materials',
    shortLabel: 'Textbooks',
    icon: BookOpen,
    description: 'Open-access chapters, core texts, and primary source literature',
  },
  {
    id: 'articles',
    label: 'Articles & Research',
    shortLabel: 'Articles',
    icon: GraduationCap,
    description: 'Pedagogical research, peer-reviewed articles, and disciplinary reference guides',
  },
  {
    id: 'videos',
    label: 'Videos & Interactive Learning',
    shortLabel: 'Videos & Media',
    icon: Video,
    description: 'Demonstrations, interactive simulations, and multimedia lessons',
  },
  {
    id: 'worksheets',
    label: 'Worksheets & Assessments',
    shortLabel: 'Worksheets',
    icon: FileSpreadsheet,
    description: 'Diagnostic worksheets, practice sets, and formative assessment printables',
  },
  {
    id: 'teacher-guides',
    label: 'Teacher Guides & Additional Resources',
    shortLabel: 'Teacher Guides',
    icon: Sparkles,
    description: 'Instructional strategies, lesson pacing toolkits, and classroom resources',
  },
];

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  'standard': 'Curriculum Standard',
  'textbook': 'Textbook Chapter',
  'article': 'Academic Article',
  'research': 'Research Paper',
  'video': 'Instructional Video',
  'worksheet': 'Printable Worksheet',
  'teacher-guide': 'Teacher Guide',
  'other': 'Educational Resource',
};

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function isSafeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('about:')
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const ReferenceMaterialsView: React.FC<ReferenceMaterialsViewProps> = ({
  plan,
  onUpdatePlan,
  compact = false,
  filterWeek,
  filterLesson,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'type' | 'week'>('type');
  const [showUnavailable, setShowUnavailable] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Add custom reference modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newSourceName, setNewSourceName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<ReferenceCategory>('articles');
  const [newResourceType, setNewResourceType] = useState<ReferenceResourceType>('article');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newRelatedWeek, setNewRelatedWeek] = useState<number | undefined>(filterWeek || undefined);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);

  const rawReferences = plan.references || [];
  const status = plan.referencesStatus || (rawReferences.length > 0 ? 'ready' : 'ready');

  // Polling for background retrieval if status is pending
  useEffect(() => {
    if (status !== 'pending') return;

    let attempts = 0;
    const maxAttempts = 5;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const latestPlan = await api.getPlan(plan.id);
        if (latestPlan && latestPlan.referencesStatus !== 'pending') {
          onUpdatePlan(latestPlan);
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [plan.id, status, onUpdatePlan]);

  // Separate valid references from broken/unavailable legacy references
  const { validReferences, unavailableReferences } = useMemo(() => {
    const valid: ReferenceMaterial[] = [];
    const unavailable: ReferenceMaterial[] = [];

    for (const ref of rawReferences) {
      if (!isSafeUrl(ref.url) || ref.linkStatus === 'broken') {
        unavailable.push(ref);
      } else {
        valid.push(ref);
      }
    }

    return { validReferences: valid, unavailableReferences: unavailable };
  }, [rawReferences]);

  // Trigger server-side live reference retrieval & verification
  const handleFetchReferences = async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await api.fetchReferences(plan.id);
      onUpdatePlan(res.plan);
    } catch (err) {
      setFetchError((err as Error).message || 'Failed to fetch references');
    } finally {
      setIsFetching(false);
    }
  };

  // Delete a reference
  const handleDeleteReference = async (refId: string) => {
    try {
      const res = await api.deleteReference(plan.id, refId);
      onUpdatePlan(res.plan);
    } catch (err) {
      alert('Could not delete reference: ' + (err as Error).message);
    }
  };

  // Submit adding a custom reference
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    // Client validation
    if (!newTitle.trim()) {
      setAddFormError('Please enter a title for the reference material.');
      return;
    }
    if (!newUrl.trim()) {
      setAddFormError('Please enter a valid URL.');
      return;
    }

    if (!isSafeUrl(newUrl.trim())) {
      setAddFormError('Invalid URL. Must be a valid public http:// or https:// address.');
      return;
    }

    try {
      const parsed = new URL(newUrl.trim());
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname.toLowerCase())) {
        setAddFormError('Localhost and private IP addresses are not allowed.');
        return;
      }
    } catch {
      setAddFormError('Invalid URL format. Please include https://');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const res = await api.addReference(plan.id, {
        title: newTitle.trim(),
        url: newUrl.trim(),
        sourceName: newSourceName.trim() || undefined,
        category: newCategory,
        resourceType: newResourceType,
        description: newDescription.trim() || undefined,
        relatedWeek: newRelatedWeek ? Number(newRelatedWeek) : undefined,
      });

      onUpdatePlan(res.plan);
      setIsAddModalOpen(false);
      // Reset form
      setNewTitle('');
      setNewUrl('');
      setNewSourceName('');
      setNewDescription('');
    } catch (err) {
      setAddFormError((err as Error).message || 'Failed to add reference');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Filter valid references
  const filteredReferences = useMemo(() => {
    return validReferences.filter((ref) => {
      // Week / Lesson filter
      if (filterWeek !== undefined && ref.relatedWeek && ref.relatedWeek !== filterWeek) {
        return false;
      }
      if (filterLesson && ref.relatedLesson && ref.relatedLesson !== filterLesson) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && ref.category !== selectedCategory) {
        return false;
      }

      // Resource Type filter
      if (selectedType !== 'ALL' && ref.resourceType !== selectedType) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inTitle = ref.title.toLowerCase().includes(q);
        const inDesc = ref.description.toLowerCase().includes(q);
        const inSource = ref.sourceName.toLowerCase().includes(q);
        const inDomain = extractDomain(ref.url).toLowerCase().includes(q);
        const inType = (RESOURCE_TYPE_LABELS[ref.resourceType] || ref.resourceType).toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inSource && !inDomain && !inType) {
          return false;
        }
      }

      return true;
    });
  }, [validReferences, filterWeek, filterLesson, selectedCategory, selectedType, searchQuery]);

  // Group by category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const def of CATEGORY_DEFINITIONS) {
      counts[def.id] = validReferences.filter((r) => r.category === def.id).length;
    }
    return counts;
  }, [validReferences]);

  // Clear all active filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedType('ALL');
  };

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategory !== 'ALL' || selectedType !== 'ALL';

  // Render Link Status Badge
  const renderLinkStatusBadge = (ref: ReferenceMaterial) => {
    const status = ref.linkStatus || (ref.verified === 'verified' ? 'reachable' : 'not_checked');

    if (status === 'reachable') {
      const formattedDate = ref.lastCheckedAt ? new Date(ref.lastCheckedAt).toLocaleDateString() : '';
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-bold"
          title={formattedDate ? `Reachable destination confirmed on ${formattedDate}` : 'Reachable destination confirmed'}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Link checked</span>
        </span>
      );
    }

    if (status === 'blocked') {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 text-[10px] font-semibold"
          title="Automated check was blocked by rate-limiting or anti-bot defense; link remains active for manual browser navigation"
        >
          <HelpCircle className="w-3 h-3 text-amber-500" aria-hidden="true" />
          <span>Unverified link</span>
        </span>
      );
    }

    if (status === 'broken' || !isSafeUrl(ref.url)) {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 px-2 py-0.5 text-[10px] font-bold"
          title="Destination URL returned 404/DNS resolution failure"
        >
          <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" aria-hidden="true" />
          <span>Broken link</span>
        </span>
      );
    }

    // Default neutral status
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-medium"
        title="Reachability check has not yet been executed"
      >
        <HelpCircle className="w-3 h-3 text-slate-400" aria-hidden="true" />
        <span>Not checked</span>
      </span>
    );
  };

  // Render a Single Reference Card
  const renderReferenceCard = (ref: ReferenceMaterial) => {
    const domain = extractDomain(ref.url);
    const typeLabel = RESOURCE_TYPE_LABELS[ref.resourceType] || ref.resourceType || 'Resource';

    return (
      <div
        key={ref.id}
        className="neu-card-sm p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col justify-between space-y-3 hover:shadow-neu-sm transition-all group"
      >
        <div className="space-y-2">
          {/* Top Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Resource Type Tag */}
              <span className="rounded-full bg-[var(--lavender-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)] border border-[var(--border)]">
                {typeLabel}
              </span>

              {/* Link Status Label */}
              {renderLinkStatusBadge(ref)}

              {/* Origin Tag */}
              {ref.origin === 'user-added' && (
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[10px] font-semibold">
                  Teacher Added
                </span>
              )}
            </div>

            {/* Delete Action */}
            <button
              onClick={() => handleDeleteReference(ref.id)}
              className="text-[var(--text-muted)] hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 opacity-70 group-hover:opacity-100 focus:opacity-100 transition-opacity min-w-[32px] min-h-[32px] flex items-center justify-center"
              title="Remove this reference from plan"
              aria-label={`Remove reference ${ref.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Title & Clickable Link */}
          <div>
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-xs sm:text-sm text-[var(--text)] hover:text-[var(--primary)] focus:text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] rounded-md leading-snug line-clamp-2 transition-colors block"
              aria-label={`Open ${ref.title} on ${ref.sourceName || domain}, opens in a new tab`}
            >
              {ref.title}
            </a>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--primary)] mt-1">
              <span>{ref.sourceName || domain}</span>
              {domain && ref.sourceName && domain !== ref.sourceName && (
                <>
                  <span className="text-[var(--text-muted)]">&bull;</span>
                  <span className="text-[var(--text-muted)]">{domain}</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {ref.description && (
            <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
              {ref.description}
            </p>
          )}
        </div>

        {/* Footer Metadata & Open Button */}
        <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            {ref.relatedWeek && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[var(--accent)]" aria-hidden="true" />
                <span>Week {ref.relatedWeek}</span>
              </span>
            )}
            {ref.relatedLesson && (
              <span className="truncate max-w-[140px]" title={ref.relatedLesson}>
                {ref.relatedLesson}
              </span>
            )}
            {ref.relatedStandard && (
              <span className="truncate max-w-[120px] font-mono text-[10px]" title={ref.relatedStandard}>
                {ref.relatedStandard}
              </span>
            )}
          </div>

          <a
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="neu-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[var(--primary)] hover:bg-[var(--lavender-soft)] transition-colors focus:ring-2 focus:ring-[var(--primary)] rounded-[12px] min-h-[36px]"
            aria-label={`Open ${ref.title} on ${ref.sourceName || domain}, opens in a new tab`}
          >
            <span>Open Resource</span>
            <ExternalLink className="w-3 h-3 text-[var(--primary)]" aria-hidden="true" />
          </a>
        </div>
      </div>
    );
  };

  // Render Skeleton Loading State
  if (status === 'pending' || isFetching) {
    return (
      <div className="space-y-4 animate-pulse" role="status" aria-live="polite">
        <div className="neu-card p-6 border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--lavender-soft)] flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-[var(--primary)] animate-spin" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Retrieving Trustworthy Educational Resources...
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Gathering curriculum-aligned references, running URL verification, and assessing source reputation.
                </p>
              </div>
            </div>
            <button
              onClick={handleFetchReferences}
              disabled={isFetching}
              className="neu-btn-secondary px-3 py-1.5 text-xs font-semibold text-[var(--primary)]"
            >
              Refresh Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="neu-card-sm p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render Empty / Error State
  if (rawReferences.length === 0) {
    return (
      <div className="neu-card p-8 border border-[var(--border)] bg-[var(--surface)] text-center space-y-4 rounded-2xl">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--lavender-soft)] flex items-center justify-center text-[var(--primary)]">
          <BookOpen className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-sm font-bold text-[var(--text)]">
            {fetchError ? 'Unable to Retrieve References' : 'No References Found Yet'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {fetchError
              ? fetchError
              : 'References are discovered from verified educational repositories, textbooks, and official curriculum standards. You can retrieve resources automatically or add your own trustworthy links.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleFetchReferences}
            disabled={isFetching}
            className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white transition-all min-h-[44px]"
            aria-label="Retrieve reference materials"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isFetching ? 'Searching...' : 'Find Reference Materials'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="neu-btn-secondary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[var(--text)] min-h-[44px]"
            aria-label="Add custom educational resource"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden="true" />
            Add Custom Link
          </button>
        </div>

        {/* Add Modal */}
        {isAddModalOpen && renderAddModal()}
      </div>
    );
  }

  function renderAddModal() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-resource-heading"
      >
        <div className="neu-card bg-[var(--surface)] max-w-lg w-full p-6 space-y-4 text-left shadow-neu-raised border border-[var(--border)] rounded-2xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 id="add-resource-heading" className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--primary)]" aria-hidden="true" />
              Add Reference Material
            </h3>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)] min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close add resource modal"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {addFormError && (
            <div className="rounded-[12px] bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{addFormError}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text)] mb-1">
                Resource Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. NCERT Grade 9 Mathematics Chapter 4 - Linear Equations"
                className="w-full neu-input p-2.5 text-xs text-[var(--text)]"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text)] mb-1">
                Verified Web URL * (https://)
              </label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://openstax.org/details/books/..."
                className="w-full neu-input p-2.5 text-xs text-[var(--text)]"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Must be an active, trustworthy educational website.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--text)] mb-1">
                  Source / Publisher Name
                </label>
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="e.g. OpenStax, Khan Academy, NCERT"
                  className="w-full neu-input p-2.5 text-xs text-[var(--text)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--text)] mb-1">
                  Resource Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ReferenceCategory)}
                  className="w-full neu-input p-2.5 text-xs text-[var(--text)]"
                >
                  {CATEGORY_DEFINITIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--text)] mb-1">
                  Format / Resource Type
                </label>
                <select
                  value={newResourceType}
                  onChange={(e) => setNewResourceType(e.target.value as ReferenceResourceType)}
                  className="w-full neu-input p-2.5 text-xs text-[var(--text)]"
                >
                  <option value="standard">Curriculum Standard</option>
                  <option value="textbook">Textbook Chapter</option>
                  <option value="article">Academic Article</option>
                  <option value="research">Research Paper</option>
                  <option value="video">Instructional Video</option>
                  <option value="worksheet">Printable Worksheet</option>
                  <option value="teacher-guide">Teacher Guide</option>
                  <option value="other">Other Reference</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text)] mb-1">
                  Associate With Week (Optional)
                </label>
                <select
                  value={newRelatedWeek || ''}
                  onChange={(e) => setNewRelatedWeek(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full neu-input p-2.5 text-xs text-[var(--text)]"
                >
                  <option value="">General Unit Reference</option>
                  {plan.weeklyPlans.map((w) => (
                    <option key={w.weekNumber} value={w.weekNumber}>
                      Week {w.weekNumber}: {w.theme.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text)] mb-1">
                Instructional Notes / Description
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief summary of how this resource supports classroom instruction..."
                className="w-full neu-input p-2.5 text-xs text-[var(--text)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="neu-btn-secondary px-3.5 py-2 text-xs font-semibold text-[var(--text)] min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdd}
                className="neu-btn-primary px-4 py-2 text-xs font-bold text-white min-h-[44px]"
              >
                {isSubmittingAdd ? 'Validating...' : 'Save Reference'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header & Search Controls */}
      <div className="neu-card p-5 sm:p-6 space-y-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--text)]">
                Curriculum Reference Materials
              </h2>
              <span className="rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                {filteredReferences.length} of {validReferences.length} resources
              </span>
              {status === 'partial' && (
                <span className="rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  Partial Coverage
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Verified educational resources, official syllabi, and open textbook materials curated for this curriculum.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {/* Group By Toggle */}
            <div className="inline-flex rounded-xl p-0.5 bg-[var(--lavender-soft)] border border-[var(--border)] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setGroupBy('type')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  groupBy === 'type'
                    ? 'bg-[var(--surface)] text-[var(--primary)] font-bold shadow-neu-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                title="Group by resource format/type"
              >
                By Type
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('week')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  groupBy === 'week'
                    ? 'bg-[var(--surface)] text-[var(--primary)] font-bold shadow-neu-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                title="Group by instructional week"
              >
                By Week
              </button>
            </div>

            <button
              onClick={handleFetchReferences}
              disabled={isFetching}
              className="neu-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text)] min-h-[36px]"
              title="Refresh and verify external references"
              aria-label="Refresh and verify external references"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[var(--primary)] ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="neu-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white min-h-[36px]"
              aria-label="Add custom educational resource"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Search & Type Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference materials by title, domain, or topic..."
              className="w-full neu-input pl-9 pr-8 py-2 text-xs text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] min-h-[40px]"
              aria-label="Search reference materials"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Resource Type Dropdown Filter */}
          <div className="sm:w-56">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full neu-input py-2 px-3 text-xs text-[var(--text)] min-h-[40px]"
              aria-label="Filter by resource type"
            >
              <option value="ALL">All Resource Types</option>
              <option value="standard">Curriculum Standards</option>
              <option value="textbook">Textbook Chapters</option>
              <option value="article">Academic Articles</option>
              <option value="research">Research Papers</option>
              <option value="video">Instructional Videos</option>
              <option value="worksheet">Printable Worksheets</option>
              <option value="teacher-guide">Teacher Guides</option>
              <option value="other">Other References</option>
            </select>
          </div>
        </div>

        {/* Category Chips */}
        {!compact && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--border)]">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all min-h-[36px] ${
                selectedCategory === 'ALL'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-neu-sm'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--lavender-soft)]/50 font-semibold'
              }`}
              aria-label="Show all categories"
            >
              All Categories ({validReferences.length})
            </button>

            {CATEGORY_DEFINITIONS.map((cat) => {
              const Icon = cat.icon;
              const count = categoryCounts[cat.id] || 0;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all min-h-[36px] ${
                    isSelected
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-neu-sm'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--lavender-soft)]/50 font-semibold'
                  }`}
                  aria-label={`Filter by ${cat.label} (${count} resources)`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[var(--primary)]'}`} aria-hidden="true" />
                  <span>{cat.shortLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legacy / Unavailable Links Notification Banner */}
      {unavailableReferences.length > 0 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span>{unavailableReferences.length} legacy link(s) failed reachability or security validation</span>
            </div>
            <button
              onClick={() => setShowUnavailable(!showUnavailable)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline min-h-[36px] px-2"
              aria-expanded={showUnavailable}
            >
              <span>{showUnavailable ? 'Hide unavailable links' : `Show ${unavailableReferences.length} unavailable links`}</span>
              {showUnavailable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showUnavailable && (
            <div className="pt-2 border-t border-amber-200 dark:border-amber-800 space-y-2">
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                These references were preserved from older saved plans but their destination URLs failed validation (404/DNS or protocol issue). You can review or remove them below:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {unavailableReferences.map((ref) => (
                  <div key={ref.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-[var(--text)] truncate">{ref.title}</p>
                      <p className="text-[10px] text-red-600 dark:text-red-400 truncate">{ref.url || 'No URL specified'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteReference(ref.id)}
                      className="neu-btn-secondary p-1.5 text-red-600 hover:text-red-700 min-w-[32px] min-h-[32px] flex items-center justify-center shrink-0"
                      title="Remove broken reference"
                      aria-label={`Remove broken reference ${ref.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Mismatch Empty State */}
      {filteredReferences.length === 0 ? (
        <div className="neu-card p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-[var(--text)]">No reference materials match your active filters.</p>
          {hasActiveFilters && (
            <div>
              <button
                onClick={handleClearFilters}
                className="neu-btn-primary px-3.5 py-1.5 text-xs font-bold text-white min-h-[40px]"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      ) : groupBy === 'type' ? (
        /* Grouped By Type/Category View */
        <div className="space-y-6">
          {(['standards', 'textbooks', 'articles', 'videos', 'worksheets', 'teacher-guides'] as const).map((catId) => {
            const groupItems = filteredReferences.filter((r) => r.category === catId);
            if (groupItems.length === 0) return null;

            const catDef = CATEGORY_DEFINITIONS.find((c) => c.id === catId);
            const Icon = catDef?.icon || BookOpen;

            return (
              <div key={catId} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
                  <div className="p-1 rounded-lg bg-[var(--lavender-soft)] text-[var(--primary)]">
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    {catDef?.label || catId}
                  </h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)] px-2 py-0.5 text-[10px] font-semibold">
                    {groupItems.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {groupItems.map(renderReferenceCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grouped By Week / Lesson View */
        <div className="space-y-6">
          {Array.from({ length: plan.durationWeeks }, (_, idx) => idx + 1).map((weekNum) => {
            const weekItems = filteredReferences.filter((r) => r.relatedWeek === weekNum);
            if (weekItems.length === 0) return null;

            return (
              <div key={weekNum} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
                  <div className="p-1 rounded-lg bg-[var(--lavender-soft)] text-[var(--primary)]">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    Week {weekNum} Instructional References
                  </h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)] px-2 py-0.5 text-[10px] font-semibold">
                    {weekItems.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {weekItems.map(renderReferenceCard)}
                </div>
              </div>
            );
          })}

          {/* General Unit References (no week specified) */}
          {(() => {
            const generalItems = filteredReferences.filter((r) => !r.relatedWeek);
            if (generalItems.length === 0) return null;

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
                  <div className="p-1 rounded-lg bg-[var(--lavender-soft)] text-[var(--primary)]">
                    <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    General Unit References
                  </h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)] px-2 py-0.5 text-[10px] font-semibold">
                    {generalItems.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {generalItems.map(renderReferenceCard)}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && renderAddModal()}
    </div>
  );
};
