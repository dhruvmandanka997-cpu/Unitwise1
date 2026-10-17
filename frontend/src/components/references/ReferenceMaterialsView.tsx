import React, { useState, useMemo } from 'react';
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
  ShieldCheck,
  ShieldAlert,
  Calendar
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

export const ReferenceMaterialsView: React.FC<ReferenceMaterialsViewProps> = ({
  plan,
  onUpdatePlan,
  compact = false,
  filterWeek,
  filterLesson,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const references = plan.references || [];
  const status = plan.referencesStatus || (references.length > 0 ? 'ready' : 'ready');

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

    try {
      const parsed = new URL(newUrl.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setAddFormError('URL must use http or https protocol.');
        return;
      }
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) {
        setAddFormError('Localhost addresses are not allowed.');
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

  // Filter references
  const filteredReferences = useMemo(() => {
    return references.filter((ref) => {
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

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inTitle = ref.title.toLowerCase().includes(q);
        const inDesc = ref.description.toLowerCase().includes(q);
        const inSource = ref.sourceName.toLowerCase().includes(q);
        const inType = ref.resourceType.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inSource && !inType) {
          return false;
        }
      }

      return true;
    });
  }, [references, filterWeek, filterLesson, selectedCategory, searchQuery]);

  // Group by category if displaying global list
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const def of CATEGORY_DEFINITIONS) {
      counts[def.id] = references.filter((r) => r.category === def.id).length;
    }
    return counts;
  }, [references]);

  // Render Skeleton Loading
  if (status === 'pending' || isFetching) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="neu-card p-6 border border-[var(--border)] bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--lavender-soft)] flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-[var(--primary)] animate-spin" />
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
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--lavender-soft)] text-[var(--primary)]">
              Verifying Links
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="neu-card-sm p-4 bg-slate-50/50 space-y-2.5">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render Empty / Error State
  if (references.length === 0) {
    return (
      <div className="neu-card p-8 border border-[var(--border)] bg-white text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--lavender-soft)] flex items-center justify-center text-[var(--primary)]">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-sm font-bold text-[var(--text)]">
            {fetchError ? 'Unable to Retrieve References' : 'No Reliable References Found Yet'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {fetchError
              ? fetchError
              : 'References are discovered from verified educational repositories and trusted curriculum standards. You can retrieve resources automatically or add your own trustworthy links.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleFetchReferences}
            disabled={isFetching}
            className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white transition-all"
            aria-label="Retrieve reference materials"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Searching...' : 'Find Reference Materials'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="neu-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[var(--text)]"
            aria-label="Add custom educational resource"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
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
        <div className="neu-card bg-white max-w-lg w-full p-6 space-y-4 text-left shadow-neu-raised border border-[var(--border)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 id="add-resource-heading" className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--primary)]" />
              Add Reference Material
            </h3>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)]"
              aria-label="Close add resource modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {addFormError && (
            <div className="rounded-[10px] bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
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
                placeholder="e.g. NCERT Grade 8 Science Chapter 1 - Crop Production"
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
                placeholder="https://ncert.nic.in/textbook.php..."
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
                  placeholder="e.g. NCERT, Khan Academy"
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
                className="neu-btn-secondary px-3.5 py-1.5 text-xs font-semibold text-[var(--text)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdd}
                className="neu-btn-primary px-4 py-1.5 text-xs font-bold text-white"
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
      <div className="neu-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--text)]">
                Curriculum Reference Materials
              </h2>
              <span className="rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                {filteredReferences.length} of {references.length} resources
              </span>
              {status === 'partial' && (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Partial Coverage
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Verified educational resources, official syllabi, and open textbook materials curated for this curriculum.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleFetchReferences}
              disabled={isFetching}
              className="neu-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
              title="Refresh and verify external references"
              aria-label="Refresh and verify external references"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[var(--primary)] ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="neu-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white"
              aria-label="Add custom educational resource"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference materials by title, domain, or topic..."
              className="w-full neu-input pl-9 pr-8 py-2 text-xs text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
              aria-label="Search reference materials"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] p-0.5"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Chips */}
        {!compact && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--border)]">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-neu-sm'
                  : 'bg-white text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--lavender-soft)]/50 font-semibold'
              }`}
              aria-label="Show all categories"
            >
              All Categories ({references.length})
            </button>

            {CATEGORY_DEFINITIONS.map((cat) => {
              const Icon = cat.icon;
              const count = categoryCounts[cat.id] || 0;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition-all ${
                    isSelected
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-neu-sm'
                      : 'bg-white text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--lavender-soft)]/50 font-semibold'
                  }`}
                  aria-label={`Filter by ${cat.label} (${count} resources)`}
                >
                  <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-[var(--primary)]'}`} />
                  <span>{cat.shortLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Resource Cards Grid / List */}
      {filteredReferences.length === 0 ? (
        <div className="neu-card p-6 text-center text-xs text-[var(--text-muted)] bg-white border border-[var(--border)]">
          No reference materials match your active search or category filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredReferences.map((ref) => {
            const isVerified = ref.verified === 'verified';
            const trustBadgeColor =
              ref.trustTier === 'official'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : ref.trustTier === 'reputable'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-slate-50 text-slate-700 border-slate-200';

            const trustLabel =
              ref.trustTier === 'official'
                ? 'Official Authority'
                : ref.trustTier === 'reputable'
                ? 'Reputable Portal'
                : 'Educational Resource';

            return (
              <div
                key={ref.id}
                className="neu-card-sm p-4 bg-white border border-[var(--border)] flex flex-col justify-between space-y-3 hover:shadow-neu-sm transition-all group"
              >
                <div className="space-y-2">
                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Trust Tier Badge */}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${trustBadgeColor}`}>
                        {trustLabel}
                      </span>

                      {/* Verified Badge */}
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold">
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                          Unverified
                        </span>
                      )}

                      {/* Resource Type Tag */}
                      <span className="rounded-full bg-[var(--lavender-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)] border border-[var(--border)] uppercase tracking-wider">
                        {ref.resourceType}
                      </span>
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={() => handleDeleteReference(ref.id)}
                      className="text-[var(--text-muted)] hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      title="Remove this reference from plan"
                      aria-label={`Remove reference ${ref.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Clickable Link */}
                  <div>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-xs sm:text-sm text-[var(--text)] hover:text-[var(--primary)] focus:text-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded leading-snug line-clamp-2 transition-colors block"
                      aria-label={`Open ${ref.title} on ${ref.sourceName} in a new tab`}
                    >
                      {ref.title}
                    </a>
                    <span className="text-[11px] font-medium text-[var(--primary)] mt-0.5 block">
                      {ref.sourceName}
                    </span>
                  </div>

                  {/* Description / Faithful Snippet */}
                  {ref.description && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {ref.description}
                    </p>
                  )}
                </div>

                {/* Footer Metadata & Open Button */}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    {ref.relatedWeek && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Week {ref.relatedWeek}
                      </span>
                    )}
                    {ref.relatedLesson && (
                      <span className="truncate max-w-[120px]" title={ref.relatedLesson}>
                        {ref.relatedLesson}
                      </span>
                    )}
                  </div>

                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neu-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[var(--primary)] hover:bg-[var(--lavender-soft)] transition-colors focus:ring-2 focus:ring-[var(--primary)] rounded-[10px]"
                    aria-label={`Open ${ref.title} on ${ref.sourceName} in a new tab`}
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && renderAddModal()}
    </div>
  );
};
