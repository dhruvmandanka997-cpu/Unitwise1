import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import { 
  BookOpen, 
  Check, 
  ChevronDown, 
  Edit3, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  X, 
  HelpCircle,
  Globe,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { 
  CURRICULUM_CATALOG, 
  CountryCatalogEntry, 
  CurriculumOption, 
  CurriculumRegion,
  resolveCurriculumLabels,
  ResolvedCurriculumLabels
} from '../../config/curriculumCatalog';
import { CurriculumPreferences } from '../../types/curriculum';
import { api } from '../../services/api';

interface CurriculumPreferencesCardProps {
  onPreferencesUpdated?: (prefs: CurriculumPreferences, labels: ResolvedCurriculumLabels) => void;
  className?: string;
}

export const CurriculumPreferencesCard: React.FC<CurriculumPreferencesCardProps> = ({
  onPreferencesUpdated,
  className = '',
}) => {
  // Persistence & Data States
  const [preferences, setPreferences] = useState<CurriculumPreferences | null>(null);
  const [resolvedLabels, setResolvedLabels] = useState<ResolvedCurriculumLabels | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showFirstTimeHint, setShowFirstTimeHint] = useState<boolean>(() => {
    return localStorage.getItem('dismissed_curriculum_hint') !== 'true';
  });

  // Draft Form States
  const [countryId, setCountryId] = useState<string>('in');
  const [curriculumId, setCurriculumId] = useState<string>('cbse');
  const [regionId, setRegionId] = useState<string>('');
  const [defaultGrade, setDefaultGrade] = useState<string>('');
  const [otherCountryText, setOtherCountryText] = useState<string>('');
  const [otherCurriculumText, setOtherCurriculumText] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Search Combobox States for Countries
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [isCountryComboboxOpen, setIsCountryComboboxOpen] = useState<boolean>(false);
  const countryComboboxRef = useRef<HTMLDivElement>(null);
  const countryInputId = useId();

  // Search Combobox States for Regions
  const [regionSearch, setRegionSearch] = useState<string>('');
  const [isRegionComboboxOpen, setIsRegionComboboxOpen] = useState<boolean>(false);
  const regionComboboxRef = useRef<HTMLDivElement>(null);
  const regionInputId = useId();

  // Load preferences on mount
  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      setSaveError(null);
      const res = await api.getCurriculumPreferences();
      if (res && res.preferences) {
        setPreferences(res.preferences);
        setResolvedLabels(res.resolvedLabels);
        setCountryId(res.preferences.countryId);
        setCurriculumId(res.preferences.curriculumId);
        setRegionId(res.preferences.regionId || '');
        setDefaultGrade(res.preferences.defaultGrade || '');
        setOtherCountryText(res.preferences.otherCountryText || '');
        setOtherCurriculumText(res.preferences.otherCurriculumText || '');
        setIsEditing(false);
      } else {
        // First-time user: default to India CBSE or empty
        setPreferences(null);
        setResolvedLabels(null);
        setCountryId('in');
        setCurriculumId('cbse');
        setRegionId('');
        setDefaultGrade('Class 8');
        setIsEditing(false); // Show compact prompt
      }
    } catch (err: unknown) {
      console.warn('Failed to load curriculum preferences:', err);
      // Fallback without crashing
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Close comboboxes on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryComboboxRef.current && !countryComboboxRef.current.contains(e.target as Node)) {
        setIsCountryComboboxOpen(false);
      }
      if (regionComboboxRef.current && !regionComboboxRef.current.contains(e.target as Node)) {
        setIsRegionComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derived current country and curriculum catalog items
  const currentCountry = useMemo(() => {
    return CURRICULUM_CATALOG.countries.find((c) => c.id === countryId) || CURRICULUM_CATALOG.countries[0];
  }, [countryId]);

  const currentCurriculum = useMemo(() => {
    return currentCountry.curricula.find((c) => c.id === curriculumId) || currentCountry.curricula[0];
  }, [currentCountry, curriculumId]);

  const availableRegions = useMemo(() => {
    return currentCurriculum?.regions || [];
  }, [currentCurriculum]);

  const availableGrades = useMemo(() => {
    return currentCurriculum?.gradeOptions || [];
  }, [currentCurriculum]);

  // Handle Country Change: Reset curriculum, region, grade, and combobox query
  const handleCountrySelect = (newCountryId: string) => {
    setCountryId(newCountryId);
    setIsCountryComboboxOpen(false);
    setCountrySearch('');

    const newCountry = CURRICULUM_CATALOG.countries.find((c) => c.id === newCountryId);
    const firstCurr = newCountry?.curricula[0];

    if (firstCurr) {
      setCurriculumId(firstCurr.id);
      setRegionId('');
      setDefaultGrade(firstCurr.gradeOptions[0] || '');
    } else {
      setCurriculumId('');
      setRegionId('');
      setDefaultGrade('');
    }

    setFieldErrors({});
  };

  // Handle Curriculum Change: Reset region & update grade defaults
  const handleCurriculumSelect = (newCurrId: string) => {
    setCurriculumId(newCurrId);
    setRegionId('');

    const selectedCurr = currentCountry.curricula.find((c) => c.id === newCurrId);
    if (selectedCurr) {
      // Pick sensible default grade or retain if exists in options
      if (defaultGrade && selectedCurr.gradeOptions.includes(defaultGrade)) {
        // retain
      } else {
        setDefaultGrade(selectedCurr.gradeOptions[0] || '');
      }
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.curriculumId;
      delete next.regionId;
      return next;
    });
  };

  // Inline Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!countryId) {
      errors.countryId = 'Please choose a country.';
    }

    if (countryId === 'other' && !otherCountryText.trim()) {
      errors.otherCountryText = 'Please specify your country name.';
    }

    if (!curriculumId) {
      errors.curriculumId = 'Please choose a curriculum or board.';
    }

    if (
      (curriculumId.endsWith('other') || curriculumId === 'other-custom') &&
      !otherCurriculumText.trim()
    ) {
      errors.otherCurriculumText = 'Please describe your curriculum or syllabus.';
    }

    if (currentCurriculum?.requiresRegion) {
      if (!regionId || !regionId.trim()) {
        errors.regionId = `Please choose a ${currentCurriculum.regionLabel || 'region/state'}.`;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if form is dirty compared to saved preferences
  const isDirty = useMemo(() => {
    if (!preferences) return true;
    return (
      preferences.countryId !== countryId ||
      preferences.curriculumId !== curriculumId ||
      (preferences.regionId || '') !== regionId ||
      (preferences.defaultGrade || '') !== defaultGrade ||
      (preferences.otherCountryText || '') !== otherCountryText.trim() ||
      (preferences.otherCurriculumText || '') !== otherCurriculumText.trim()
    );
  }, [preferences, countryId, curriculumId, regionId, defaultGrade, otherCountryText, otherCurriculumText]);

  // Save Preferences Handler
  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const payload: CurriculumPreferences = {
      countryId,
      curriculumId,
      regionId: currentCurriculum?.requiresRegion ? regionId : undefined,
      defaultGrade: defaultGrade || undefined,
      otherCountryText: countryId === 'other' ? otherCountryText.trim() : undefined,
      otherCurriculumText:
        curriculumId.endsWith('other') || curriculumId === 'other-custom'
          ? otherCurriculumText.trim()
          : undefined,
      catalogVersion: CURRICULUM_CATALOG.catalogVersion,
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await api.saveCurriculumPreferences(payload);
      setPreferences(res.preferences);
      setResolvedLabels(res.resolvedLabels);
      setSaveSuccess(true);
      setIsEditing(false);

      if (onPreferencesUpdated) {
        onPreferencesUpdated(res.preferences, res.resolvedLabels);
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to save curriculum preferences:', error);
      setSaveError(error?.message || 'Failed to save preferences. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismissHint = () => {
    setShowFirstTimeHint(false);
    localStorage.setItem('dismissed_curriculum_hint', 'true');
  };

  // Filtered lists for comboboxes
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return CURRICULUM_CATALOG.countries;
    return CURRICULUM_CATALOG.countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const filteredRegions = useMemo(() => {
    const q = regionSearch.trim().toLowerCase();
    if (!q) return availableRegions;
    return availableRegions.filter((r) => r.name.toLowerCase().includes(q));
  }, [availableRegions, regionSearch]);

  // ================= RENDER SKELETON LOADING STATE =================
  if (isLoading) {
    return (
      <div className={`neu-card p-4 sm:p-5 border border-[var(--border)] animate-pulse space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--lavender-soft)]" />
            <div className="space-y-1.5">
              <div className="w-32 h-3.5 bg-[var(--lavender-soft)] rounded" />
              <div className="w-48 h-2.5 bg-[var(--lavender-soft)] rounded" />
            </div>
          </div>
          <div className="w-16 h-7 bg-[var(--lavender-soft)] rounded-xl" />
        </div>
      </div>
    );
  }

  // ================= RENDER COMPACT SUMMARY MODE (WHEN SAVED & NOT EDITING) =================
  if (preferences && resolvedLabels && !isEditing) {
    return (
      <div 
        role="region"
        aria-label="Teacher Curriculum Preferences"
        className={`neu-card p-4 sm:p-5 border border-[var(--border)] transition-all ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="neu-icon-box shrink-0 mt-0.5 sm:mt-0" aria-hidden="true">
              <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[var(--text)] tracking-tight">
                  Curriculum Preferences
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3 h-3 mr-0.5" />
                  Active Default
                </span>
              </div>

              {/* Formatted Summary: e.g. "India · CBSE · Grade 8" */}
              <div className="text-xs sm:text-sm font-semibold text-[var(--primary)] mt-0.5 truncate">
                {resolvedLabels.summary}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
            <button
              onClick={() => {
                setIsEditing(true);
                setFieldErrors({});
              }}
              className="neu-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              title="Edit curriculum preferences"
            >
              <Edit3 className="w-3.5 h-3.5 text-[var(--primary)]" />
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER FIRST-TIME UNSET PROMPT (COMPACT) =================
  if (!preferences && !isEditing) {
    return (
      <div 
        role="region"
        aria-label="Curriculum Preferences Setup"
        className={`neu-card p-4 sm:p-5 border border-dashed border-[var(--primary)]/40 bg-[var(--lavender-soft)]/20 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="neu-icon-box shrink-0 mt-0.5 text-[var(--accent)]" aria-hidden="true">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text)]">
                  Set Your Curriculum Preferences
                </span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                  Optional
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Set your country, board, and grade once to automatically align every lesson plan and AI generation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {showFirstTimeHint && (
              <button
                onClick={handleDismissHint}
                className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] px-2 py-1"
                title="Dismiss hint"
              >
                Dismiss
              </button>
            )}
            <button
              onClick={() => {
                setIsEditing(true);
                setFieldErrors({});
              }}
              className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Set Preferences
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER EDIT / CONFIGURATION FORM =================
  return (
    <div 
      role="region"
      aria-label="Configure Curriculum Preferences"
      className={`neu-card p-5 sm:p-6 border border-[var(--border)] space-y-5 transition-all ${className}`}
    >
      {/* Header bar with title and cancel/close */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <div className="neu-icon-box" aria-hidden="true">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-[var(--text)]">
              Curriculum Preferences
            </h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              Applied automatically to future lesson plans. Changes never affect previously saved plans.
            </p>
          </div>
        </div>

        {preferences && (
          <button
            onClick={() => {
              setIsEditing(false);
              setFieldErrors({});
              setSaveError(null);
            }}
            className="neu-btn-secondary p-1.5 text-[var(--text-muted)] hover:text-[var(--text)]"
            title="Cancel editing"
            aria-label="Cancel editing"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Alert Banner with Retry */}
      {saveError && (
        <div 
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/60 dark:border-red-800 p-3 text-red-900 dark:text-red-200 flex items-start gap-2.5 text-xs animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">{saveError}</p>
            <button
              onClick={() => handleSavePreferences()}
              className="text-[11px] underline font-bold hover:text-red-800 dark:hover:text-red-100 inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Save
            </button>
          </div>
        </div>
      )}

      {/* Form Fields Grid */}
      <form onSubmit={handleSavePreferences} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* FIELD 1: COUNTRY SELECT / COMBOBOX */}
          <div className="space-y-1 relative" ref={countryComboboxRef}>
            <label 
              htmlFor={countryInputId}
              className="block text-xs font-semibold text-[var(--text)]"
            >
              Country <span className="text-red-500">*</span>
            </label>

            {/* Custom accessible searchable combobox */}
            <div className="relative">
              <button
                type="button"
                id={countryInputId}
                onClick={() => setIsCountryComboboxOpen(!isCountryComboboxOpen)}
                aria-haspopup="listbox"
                aria-expanded={isCountryComboboxOpen}
                className={`w-full neu-input px-3 py-2 text-xs text-left text-[var(--text)] flex items-center justify-between min-h-[44px] ${
                  fieldErrors.countryId ? '!border-red-500' : ''
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{currentCountry.flagEmoji || '🌐'}</span>
                  <span className="font-semibold">{currentCountry.name}</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 ml-1" />
              </button>

              {/* Combobox Dropdown Popover */}
              {isCountryComboboxOpen && (
                <div 
                  role="listbox" 
                  className="absolute left-0 top-full mt-1.5 w-full z-40 neu-card border border-[var(--border)] shadow-xl p-2 space-y-1 max-h-56 overflow-y-auto"
                >
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full neu-input px-2.5 py-1.5 text-xs text-[var(--text)] mb-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsCountryComboboxOpen(false);
                    }}
                  />
                  {filteredCountries.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={c.id === countryId}
                      onClick={() => handleCountrySelect(c.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors min-h-[38px] ${
                        c.id === countryId
                          ? 'bg-[var(--lavender-soft)] text-[var(--primary)] font-bold'
                          : 'hover:bg-[var(--surface)] text-[var(--text)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.flagEmoji || '🌐'}</span>
                        <span>{c.name}</span>
                      </span>
                      {c.id === countryId && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {fieldErrors.countryId && (
              <p className="text-[11px] text-red-500 font-medium">{fieldErrors.countryId}</p>
            )}
          </div>

          {/* FIELD 2: CURRICULUM / BOARD SELECT */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[var(--text)]">
              Curriculum / Board <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={curriculumId}
                onChange={(e) => handleCurriculumSelect(e.target.value)}
                className={`w-full neu-input px-3 py-2 text-xs text-[var(--text)] min-h-[44px] ${
                  fieldErrors.curriculumId ? '!border-red-500' : ''
                }`}
              >
                {currentCountry.curricula.map((curr) => (
                  <option key={curr.id} value={curr.id}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Neutral Type Badge */}
            {currentCurriculum && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)]">
                  {currentCurriculum.typeBadgeLabel}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] truncate">
                  Spelling: {currentCurriculum.spelling} &bull; {currentCurriculum.measurementSystem === 'us_customary' ? 'US Units' : 'Metric'}
                </span>
              </div>
            )}
            {fieldErrors.curriculumId && (
              <p className="text-[11px] text-red-500 font-medium">{fieldErrors.curriculumId}</p>
            )}
          </div>

          {/* FIELD 3: REGION SELECT (Appears ONLY if requiresRegion) */}
          {currentCurriculum?.requiresRegion && (
            <div className="space-y-1 relative" ref={regionComboboxRef}>
              <label 
                htmlFor={regionInputId}
                className="block text-xs font-semibold text-[var(--text)]"
              >
                {currentCurriculum.regionLabel || 'State / Province'} <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <button
                  type="button"
                  id={regionInputId}
                  onClick={() => setIsRegionComboboxOpen(!isRegionComboboxOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isRegionComboboxOpen}
                  className={`w-full neu-input px-3 py-2 text-xs text-left text-[var(--text)] flex items-center justify-between min-h-[44px] ${
                    fieldErrors.regionId ? '!border-red-500' : ''
                  }`}
                >
                  <span className="truncate">
                    {availableRegions.find((r) => r.id === regionId)?.name || `Select ${currentCurriculum.regionLabel || 'Region'}...`}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 ml-1" />
                </button>

                {isRegionComboboxOpen && (
                  <div 
                    role="listbox"
                    className="absolute left-0 top-full mt-1.5 w-full z-40 neu-card border border-[var(--border)] shadow-xl p-2 space-y-1 max-h-56 overflow-y-auto"
                  >
                    <input
                      type="text"
                      value={regionSearch}
                      onChange={(e) => setRegionSearch(e.target.value)}
                      placeholder={`Search ${currentCurriculum.regionLabel || 'region'}...`}
                      className="w-full neu-input px-2.5 py-1.5 text-xs text-[var(--text)] mb-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsRegionComboboxOpen(false);
                      }}
                    />
                    {filteredRegions.map((reg) => (
                      <button
                        key={reg.id}
                        type="button"
                        role="option"
                        aria-selected={reg.id === regionId}
                        onClick={() => {
                          setRegionId(reg.id);
                          setIsRegionComboboxOpen(false);
                          setRegionSearch('');
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.regionId;
                            return next;
                          });
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors min-h-[36px] ${
                          reg.id === regionId
                            ? 'bg-[var(--lavender-soft)] text-[var(--primary)] font-bold'
                            : 'hover:bg-[var(--surface)] text-[var(--text)]'
                        }`}
                      >
                        <span>{reg.name}</span>
                        {reg.id === regionId && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {fieldErrors.regionId && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.regionId}</p>
              )}
            </div>
          )}

          {/* FIELD 4: DEFAULT GRADE / YEAR (Optional) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[var(--text)]">
              Default Grade / Year <span className="text-[10px] text-[var(--text-muted)]">(Optional)</span>
            </label>
            <select
              value={defaultGrade}
              onChange={(e) => setDefaultGrade(e.target.value)}
              className="w-full neu-input px-3 py-2 text-xs text-[var(--text)] min-h-[44px]"
            >
              <option value="">-- No default (select per plan) --</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CONDITIONAL FREE-TEXT INPUTS FOR 'OTHER' */}
        {countryId === 'other' && (
          <div className="space-y-1 animate-fadeIn">
            <label className="block text-xs font-semibold text-[var(--text)]">
              Specify Country Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={80}
              value={otherCountryText}
              onChange={(e) => setOtherCountryText(e.target.value)}
              placeholder="e.g. New Zealand, Singapore, South Africa"
              className={`w-full neu-input px-3 py-2 text-xs text-[var(--text)] ${
                fieldErrors.otherCountryText ? '!border-red-500' : ''
              }`}
            />
            {fieldErrors.otherCountryText && (
              <p className="text-[11px] text-red-500 font-medium">{fieldErrors.otherCountryText}</p>
            )}
          </div>
        )}

        {(curriculumId.endsWith('other') || curriculumId === 'other-custom') && (
          <div className="space-y-1 animate-fadeIn">
            <label className="block text-xs font-semibold text-[var(--text)]">
              Specify Curriculum / Syllabus Framework <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={80}
              value={otherCurriculumText}
              onChange={(e) => setOtherCurriculumText(e.target.value)}
              placeholder="e.g. National Curriculum v2, Autonomous Academy Standards"
              className={`w-full neu-input px-3 py-2 text-xs text-[var(--text)] ${
                fieldErrors.otherCurriculumText ? '!border-red-500' : ''
              }`}
            />
            {fieldErrors.otherCurriculumText && (
              <p className="text-[11px] text-red-500 font-medium">{fieldErrors.otherCurriculumText}</p>
            )}
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS & UNSAVED CHANGES INDICATOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
            {isDirty && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Unsaved preference changes
              </span>
            )}
            {!isDirty && preferences && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Preferences match saved configuration
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {preferences && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFieldErrors({});
                  setSaveError(null);
                }}
                className="neu-btn-secondary px-3.5 py-2 text-xs font-semibold text-[var(--text)] min-h-[44px]"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving || (!isDirty && Boolean(preferences))}
              className={`neu-btn-primary inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white min-h-[44px] ${
                !isDirty && Boolean(preferences) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
