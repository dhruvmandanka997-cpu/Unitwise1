import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { 
  Clock, 
  Sparkles, 
  Zap, 
  MoveUp, 
  MoveDown, 
  Trash2, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Award, 
  Layers, 
  FileText, 
  AlertCircle, 
  Edit3, 
  Check, 
  Share2, 
  GraduationCap,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { SessionPlan, LessonPlan, LearningObjective, LessonActivity } from '../../types/plan';
import { TopicVisualAid } from './TopicVisualAid';
import { SessionPacingChart } from './SessionPacingChart';

interface AutoExpandingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

const AutoExpandingTextarea: React.FC<AutoExpandingTextareaProps> = ({
  value,
  onChange,
  className = '',
  rows = 1,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const computedH = Math.max(el.scrollHeight, 24);
    el.style.height = `${computedH}px`;
  }, []);

  useLayoutEffect(() => {
    adjustHeight();
  }, [adjustHeight, value]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      value={value}
      onChange={onChange}
      onInput={adjustHeight}
      className={`resize-none overflow-hidden block w-full break-words [overflow-wrap:anywhere] ${className}`}
      {...props}
    />
  );
};

interface VisualLessonCardProps {
  session: SessionPlan;
  plan: LessonPlan;
  weekNum: number;
  sIdx: number;
  totalSessionsInWeek: number;
  isAiLoading: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateSession: (updater: (s: SessionPlan) => SessionPlan) => void;
  onReorderSession: (direction: 'up' | 'down') => void;
  onRegenerateSession: () => void;
  onAdaptSession: (type: 'simplify' | 'interactive' | 'differentiation' | 'shorten' | 'low_resource') => void;
  onDeleteSession: () => void;
}

export const VisualLessonCard: React.FC<VisualLessonCardProps> = ({
  session,
  plan,
  weekNum,
  sIdx,
  totalSessionsInWeek,
  isAiLoading,
  isSelected,
  onSelect,
  onUpdateSession,
  onReorderSession,
  onRegenerateSession,
  onAdaptSession,
  onDeleteSession,
}) => {
  // Local UI expansion states
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showAllObjectives, setShowAllObjectives] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({ 0: true }); // first phase open by default
  const [showAllStandards, setShowAllStandards] = useState(false);
  
  // Collapsible instruction drawers
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isDifferentiationOpen, setIsDifferentiationOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isReferencesOpen, setIsReferencesOpen] = useState(true);

  // Lesson-specific references
  const lessonReferences = React.useMemo(() => {
    const allRefs = plan.references || [];
    const matched = allRefs.filter((r) => {
      if (r.relatedLesson && (r.relatedLesson === session.title || r.relatedLesson === String(session.sessionNumber))) {
        return true;
      }
      if (r.relatedWeek === weekNum) {
        return true;
      }
      return false;
    });

    const seen = new Set<string>();
    const deduped = [];
    for (const item of matched) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        deduped.push(item);
      }
    }
    return deduped;
  }, [plan.references, weekNum, session.title, session.sessionNumber]);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreActions(false);
      }
    };
    if (showMoreActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreActions]);

  // Total allocated minutes from phases
  const totalPhaseMinutes = session.lessonSequence.reduce(
    (sum, act) => sum + (act.durationMinutes || 0),
    0
  );

  // Toggle single objective success criterion
  const toggleCriterion = (objId: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [objId]: !prev[objId] }));
  };

  // Toggle phase expansion
  const togglePhase = (index: number) => {
    setExpandedPhases((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Helper icon for lesson phase
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'opening':
        return <Sparkles className="h-4 w-4 text-[var(--primary)]" />;
      case 'direct_instruction':
        return <BookOpen className="h-4 w-4 text-[var(--accent)]" />;
      case 'guided_practice':
        return <Users className="h-4 w-4 text-[var(--primary)]" />;
      case 'collaborative_independent':
        return <Layers className="h-4 w-4 text-[var(--accent)]" />;
      case 'formative_assessment':
        return <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />;
      case 'closure':
      default:
        return <Award className="h-4 w-4 text-[var(--text-muted)]" />;
    }
  };

  // Objectives to display (top 2-3 or all)
  const displayedObjectives = showAllObjectives 
    ? session.objectives 
    : session.objectives.slice(0, 3);

  // Primary standard for compact display
  const primaryStandard = session.standards[0];

  return (
    <article
      onClick={onSelect}
      className={`neu-card p-5 sm:p-7 space-y-6 transition-all ${
        isSelected
          ? 'ring-2 ring-[var(--primary)] shadow-neu-raised'
          : 'hover:shadow-neu-hover'
      }`}
    >
      {/* 1. SIMPLIFIED LESSON HEADER */}
      <header className="space-y-3 border-b border-[var(--border)] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Title and Session Identifier */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[var(--lavender-soft)] px-3 py-0.5 text-xs font-bold text-[var(--primary)] border border-[var(--border)]">
                Session {session.sessionNumber} &bull; Day {session.dayNumber}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-medium">
                Week {weekNum}
              </span>
            </div>

            {/* Natural Wrapping Editable Lesson Title */}
            <AutoExpandingTextarea
              rows={1}
              value={session.title}
              onChange={(e) => {
                onUpdateSession((s) => ({
                  ...s,
                  title: e.target.value,
                }));
              }}
              className="w-full font-bold text-base sm:text-lg text-[var(--text)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none py-0.5 leading-snug transition-colors"
              placeholder="Lesson title..."
              title="Click to edit lesson title"
            />

            {/* Compact Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lavender-soft)]/60 px-2.5 py-0.5 border border-[var(--border)]">
                <Clock className="h-3 w-3 text-[var(--primary)]" />
                <strong className="text-[var(--text)] font-bold">{session.durationMinutes} min</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lavender-soft)]/60 px-2.5 py-0.5 border border-[var(--border)]">
                <GraduationCap className="h-3 w-3 text-[var(--accent)]" />
                <span className="font-medium text-[var(--text)]">{plan.gradeLevel}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lavender-soft)]/60 px-2.5 py-0.5 border border-[var(--border)] truncate max-w-xs">
                <span className="font-bold text-[var(--text)]">Topic:</span>
                <span className="truncate font-medium text-[var(--text-muted)]">{session.topic}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-1.5 flex-shrink-0 self-start">
            {/* Reorder Buttons */}
            <div className="flex items-center rounded-[12px] border border-[var(--border)] bg-[var(--lavender-soft)]/40 p-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); onReorderSession('up'); }}
                disabled={sIdx === 0}
                title="Move session earlier"
                className="p-1.5 rounded-[8px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white disabled:opacity-30 transition-colors"
              >
                <MoveUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReorderSession('down'); }}
                disabled={sIdx === totalSessionsInWeek - 1}
                title="Move session later"
                className="p-1.5 rounded-[8px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white disabled:opacity-30 transition-colors"
              >
                <MoveDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* AI Regenerate Action */}
            <button
              onClick={(e) => { e.stopPropagation(); onRegenerateSession(); }}
              disabled={isAiLoading}
              className="neu-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              title="Regenerate this session with AI"
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span>{isAiLoading ? 'Regenerating...' : 'Regenerate'}</span>
            </button>

            {/* More Actions Dropdown Menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMoreActions(!showMoreActions); }}
                className="neu-btn-secondary p-2 text-[var(--text-muted)] hover:text-[var(--text)]"
                title="More session actions"
              >
                <MoreHorizontal className="h-4 w-4 text-[var(--primary)]" />
              </button>

              {showMoreActions && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-56 rounded-[16px] border border-[var(--border)] bg-white p-1.5 shadow-neu-raised z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    AI Lesson Adaptations
                  </div>
                  <button
                    onClick={() => { setShowMoreActions(false); onAdaptSession('interactive'); }}
                    disabled={isAiLoading}
                    className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)]"
                  >
                    <Zap className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>Make More Interactive</span>
                  </button>
                  <button
                    onClick={() => { setShowMoreActions(false); onAdaptSession('simplify'); }}
                    disabled={isAiLoading}
                    className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)]"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>Simplify Concepts</span>
                  </button>
                  <button
                    onClick={() => { setShowMoreActions(false); onAdaptSession('differentiation'); }}
                    disabled={isAiLoading}
                    className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)]"
                  >
                    <Layers className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>Expand Differentiation</span>
                  </button>
                  <button
                    onClick={() => { setShowMoreActions(false); onAdaptSession('shorten'); }}
                    disabled={isAiLoading}
                    className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)]"
                  >
                    <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span>Tighten Pacing / Shorten</span>
                  </button>

                  <div className="my-1 border-t border-[var(--border)]" />

                  <button
                    onClick={() => { setShowMoreActions(false); onDeleteSession(); }}
                    className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Session</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Learning Goals & Visual Lesson Flow */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* 2. CONCISE LEARNING GOALS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  Core Learning Goals
                </h4>
                <span className="rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                  {session.objectives.length} goal{session.objectives.length === 1 ? '' : 's'}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newObj: LearningObjective = {
                    id: `obj_${Date.now()}`,
                    description: 'Demonstrate understanding of the core concept and apply it to a practical scenario.',
                    bloomLevel: 'Applying',
                    successCriterion: 'I can complete the task independently with 80% accuracy.',
                  };
                  onUpdateSession((s) => ({
                    ...s,
                    objectives: [...s.objectives, newObj],
                  }));
                }}
                className="neu-btn-secondary inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] px-2.5 py-1"
              >
                <Plus className="h-3 w-3" />
                Add Goal
              </button>
            </div>

            {/* List of concise objectives */}
            <div className="space-y-2.5">
              {displayedObjectives.map((obj) => {
                const isCritExpanded = expandedCriteria[obj.id] || false;
                return (
                  <div
                    key={obj.id}
                    className="neu-card-sm p-3 sm:p-3.5 transition-colors space-y-2"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Bloom's Cognitive Badge */}
                      <span className="flex-shrink-0 mt-0.5 rounded-full bg-[var(--lavender-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)] border border-[var(--border)]">
                        {obj.bloomLevel}
                      </span>

                      {/* Concise Plain-Language Editable Objective Statement */}
                      <div className="flex-1 min-w-0">
                        <AutoExpandingTextarea
                          rows={1}
                          value={obj.description}
                          onChange={(e) => {
                            const updatedObjs = [...session.objectives];
                            const targetIdx = session.objectives.findIndex((item) => item.id === obj.id);
                            if (targetIdx !== -1) {
                              updatedObjs[targetIdx] = { ...obj, description: e.target.value };
                              onUpdateSession((s) => ({ ...s, objectives: updatedObjs }));
                            }
                          }}
                          className="w-full bg-transparent font-medium text-xs text-[var(--text)] border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none leading-relaxed transition-colors"
                          placeholder="Learning objective statement..."
                        />
                      </div>

                      {/* Controls: Expand success criteria & delete objective */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCriterion(obj.id); }}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)] hover:bg-[var(--lavender-soft)] hover:text-[var(--text)] transition-colors"
                          title={isCritExpanded ? 'Hide success criterion' : 'Show success criterion'}
                        >
                          <span className="hidden sm:inline">Criterion</span>
                          {isCritExpanded ? <ChevronUp className="h-3 w-3 text-[var(--primary)]" /> : <ChevronDown className="h-3 w-3 text-[var(--primary)]" />}
                        </button>
                        {session.objectives.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateSession((s) => ({
                                ...s,
                                objectives: s.objectives.filter((item) => item.id !== obj.id),
                              }));
                            }}
                            className="p-1 text-[var(--text-muted)] hover:text-red-500 rounded transition-colors"
                            title="Remove objective"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Success Criteria Details */}
                    {isCritExpanded && (
                      <div className="pt-2 border-t border-[var(--border)] pl-2 text-xs space-y-1">
                        <div className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">
                          Success Criterion (Student "I can" statement):
                        </div>
                        <AutoExpandingTextarea
                          rows={1}
                          value={obj.successCriterion}
                          onChange={(e) => {
                            const updatedObjs = [...session.objectives];
                            const targetIdx = session.objectives.findIndex((item) => item.id === obj.id);
                            if (targetIdx !== -1) {
                              updatedObjs[targetIdx] = { ...obj, successCriterion: e.target.value };
                              onUpdateSession((s) => ({ ...s, objectives: updatedObjs }));
                            }
                          }}
                          className="w-full neu-input p-2 text-xs italic text-[var(--text)] leading-relaxed"
                          placeholder="I can..."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* "Show all objectives" Functional Control */}
            {session.objectives.length > 3 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowAllObjectives(!showAllObjectives); }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
              >
                <span>{showAllObjectives ? 'Show top 3 objectives' : `Show all ${session.objectives.length} objectives`}</span>
                {showAllObjectives ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </section>

          {/* 3. VISUAL LESSON FLOW */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  Visual Lesson Flow
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {session.lessonSequence.length} dynamic phases &bull; {totalPhaseMinutes} min allocated of {session.durationMinutes} min target
                </p>
              </div>
            </div>

            {/* Phase Rows */}
            <div className="space-y-3">
              {session.lessonSequence.map((act, aIdx) => {
                const isExpanded = expandedPhases[aIdx] || false;

                return (
                  <div
                    key={aIdx}
                    className={`rounded-[16px] border border-[var(--border)] bg-white transition-all ${
                      isExpanded
                        ? 'shadow-neu-raised'
                        : 'shadow-neu-sm hover:shadow-neu-hover'
                    } overflow-hidden`}
                  >
                    {/* Collapsed Row Bar */}
                    <div
                      onClick={(e) => { e.stopPropagation(); togglePhase(aIdx); }}
                      className="flex items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer select-none hover:bg-[var(--lavender-soft)]/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Phase Number Badge */}
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--lavender-soft)] text-xs font-bold text-[var(--primary)] border border-[var(--border)] flex-shrink-0">
                          {aIdx + 1}
                        </div>

                        {/* Phase Icon */}
                        <div className="flex-shrink-0">
                          {getPhaseIcon(act.phase)}
                        </div>

                        {/* Phase Name & One-Sentence Summary */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-[var(--text)] truncate">
                              {act.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] truncate max-w-md sm:max-w-lg font-medium">
                            {act.description}
                          </p>
                        </div>
                      </div>

                      {/* Duration & Expand Chevron */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Editable Phase Duration */}
                        <div 
                          className="flex items-center gap-1 text-xs text-[var(--text-muted)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="number"
                            min={1}
                            value={act.durationMinutes}
                            onChange={(e) => {
                              const newMin = parseInt(e.target.value) || 5;
                              const updated = [...session.lessonSequence];
                              updated[aIdx] = { ...act, durationMinutes: newMin };
                              const newTotal = updated.reduce((s, p) => s + p.durationMinutes, 0);
                              onUpdateSession((s) => ({
                                ...s,
                                durationMinutes: newTotal,
                                lessonSequence: updated,
                              }));
                            }}
                            className="w-12 neu-input px-1.5 py-0.5 text-center text-xs font-bold text-[var(--text)]"
                            title="Edit phase duration in minutes (updates total)"
                          />
                          <span className="text-[11px] font-semibold text-[var(--text-muted)]">min</span>
                        </div>

                        {/* Chevron Expand Indicator */}
                        <button
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)]"
                          title={isExpanded ? 'Collapse phase details' : 'Expand phase details'}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--primary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--primary)]" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Phase Details */}
                    {isExpanded && (
                      <div className="border-t border-[var(--border)] bg-[var(--bg)] p-4 sm:p-5 space-y-4">
                        {/* Full Activity Description */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[var(--text)] uppercase tracking-wider">
                            Full Activity Description
                          </label>
                          <AutoExpandingTextarea
                            rows={2}
                            value={act.description}
                            onChange={(e) => {
                              const updated = [...session.lessonSequence];
                              updated[aIdx] = { ...act, description: e.target.value };
                              onUpdateSession((s) => ({ ...s, lessonSequence: updated }));
                            }}
                            className="w-full neu-input p-2.5 text-xs text-[var(--text)] leading-relaxed"
                            placeholder="Activity description..."
                          />
                        </div>

                        {/* 2-Column: Teacher Actions & Student Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Teacher Action */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">
                              Teacher Instructions
                            </label>
                            <AutoExpandingTextarea
                              rows={2}
                              value={act.teacherAction}
                              onChange={(e) => {
                                const updated = [...session.lessonSequence];
                                updated[aIdx] = { ...act, teacherAction: e.target.value };
                                onUpdateSession((s) => ({ ...s, lessonSequence: updated }));
                              }}
                              className="w-full neu-input p-2.5 text-xs text-[var(--text)]"
                              placeholder="Teacher facilitation steps..."
                            />
                          </div>

                          {/* Student Action */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">
                              Student Activities
                            </label>
                            <AutoExpandingTextarea
                              rows={2}
                              value={act.studentAction}
                              onChange={(e) => {
                                const updated = [...session.lessonSequence];
                                updated[aIdx] = { ...act, studentAction: e.target.value };
                                onUpdateSession((s) => ({ ...s, lessonSequence: updated }));
                              }}
                              className="w-full neu-input p-2.5 text-xs text-[var(--text)]"
                              placeholder="Student tasks & participation..."
                            />
                          </div>
                        </div>

                        {/* Materials for this Phase */}
                        <div className="flex items-center gap-2 pt-1 text-xs text-[var(--text-muted)]">
                          <span className="font-bold text-[var(--text)]">Materials:</span>
                          <span className="italic">{act.materials.join(', ') || 'Standard instructional materials'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 7. COLLAPSIBLE DETAILED TEACHING SECTIONS */}
          <section className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
              Detailed Teaching & Support Modules
            </h4>

            {/* Accordion 1: Formative Assessment Details */}
            <div className="rounded-[16px] border border-[var(--border)] bg-white shadow-neu-sm overflow-hidden">
              <button
                onClick={(e) => { e.stopPropagation(); setIsAssessmentOpen(!isAssessmentOpen); }}
                className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-[var(--text)] hover:bg-[var(--lavender-soft)]/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
                  <span>Formative Assessment Details: {session.formativeAssessment?.type || 'Exit Ticket Check'}</span>
                </div>
                {isAssessmentOpen ? <ChevronUp className="h-4 w-4 text-[var(--primary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--primary)]" />}
              </button>

              {isAssessmentOpen && (
                <div className="border-t border-[var(--border)] p-4 bg-[var(--bg)] space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <strong className="text-[var(--text)] font-bold block mb-1">Target Skill Measured:</strong>
                      <p className="text-[var(--text-muted)]">{session.formativeAssessment?.measures}</p>
                    </div>
                    <div>
                      <strong className="text-[var(--text)] font-bold block mb-1">Evidence of Learning:</strong>
                      <p className="text-[var(--text-muted)]">{session.formativeAssessment?.evidenceOfLearning}</p>
                    </div>
                  </div>
                  <div>
                    <strong className="text-[var(--text)] font-bold block mb-1">Check Prompt / Question:</strong>
                    <div className="rounded-[12px] bg-white p-2.5 border border-[var(--border)] text-[var(--text)] italic shadow-neu-inset">
                      "{session.formativeAssessment?.promptOrQuestion}"
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row sm:justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                    <span><strong className="text-[var(--text)]">Interpretation Guide:</strong> {session.formativeAssessment?.interpretationGuide}</span>
                    <span><strong className="text-[var(--text)]">Next Step:</strong> {session.formativeAssessment?.nextInstructionalStep}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Tiered Differentiation */}
            <div className="rounded-[16px] border border-[var(--border)] bg-white shadow-neu-sm overflow-hidden">
              <button
                onClick={(e) => { e.stopPropagation(); setIsDifferentiationOpen(!isDifferentiationOpen); }}
                className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-[var(--text)] hover:bg-[var(--lavender-soft)]/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[var(--primary)]" />
                  <span>Tiered Differentiation & Scaffolding</span>
                </div>
                {isDifferentiationOpen ? <ChevronUp className="h-4 w-4 text-[var(--primary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--primary)]" />}
              </button>

              {isDifferentiationOpen && (
                <div className="border-t border-[var(--border)] p-4 bg-[var(--bg)] space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-[12px] border border-[var(--border)] shadow-neu-sm space-y-1">
                      <span className="font-bold text-[var(--primary)] block text-[11px]">
                        Tier 1 Support Scaffolds
                      </span>
                      <p className="text-[var(--text-muted)] leading-relaxed">
                        {session.differentiation?.support}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-[12px] border border-[var(--border)] shadow-neu-sm space-y-1">
                      <span className="font-bold text-[var(--accent)] block text-[11px]">
                        Advanced / Gifted Extension
                      </span>
                      <p className="text-[var(--text-muted)] leading-relaxed">
                        {session.differentiation?.advanced}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-[12px] border border-[var(--border)] shadow-neu-sm space-y-1">
                      <span className="font-bold text-[var(--primary)] block text-[11px]">
                        ELL & Multimodal Access
                      </span>
                      <p className="text-[var(--text-muted)] leading-relaxed">
                        {session.differentiation?.ell}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Materials & Homework */}
            <div className="rounded-[16px] border border-[var(--border)] bg-white shadow-neu-sm overflow-hidden">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMaterialsOpen(!isMaterialsOpen); }}
                className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-[var(--text)] hover:bg-[var(--lavender-soft)]/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  <span>Materials & Homework Assignment</span>
                </div>
                {isMaterialsOpen ? <ChevronUp className="h-4 w-4 text-[var(--primary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--primary)]" />}
              </button>

              {isMaterialsOpen && (
                <div className="border-t border-[var(--border)] p-4 bg-[var(--bg)] space-y-3 text-xs">
                  <div>
                    <strong className="text-[var(--text)] font-bold block mb-1">Classroom Materials:</strong>
                    <div className="flex flex-wrap gap-1.5">
                      {session.materials.length > 0 ? (
                        session.materials.map((mat, mIdx) => (
                          <span key={mIdx} className="rounded-full bg-white px-2.5 py-1 text-[11px] border border-[var(--border)] text-[var(--text)] font-medium shadow-neu-sm">
                            {mat}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--text-muted)]">Standard classroom materials.</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[var(--border)]">
                    <strong className="text-[var(--text)] font-bold block mb-1">Homework Task:</strong>
                    {session.homework?.enabled ? (
                      <p className="text-[var(--text-muted)]">
                        {session.homework.task} (~{session.homework.estimatedMinutes} minutes)
                      </p>
                    ) : (
                      <p className="text-[var(--text-muted)] italic">No homework assigned for this session.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 4: Reference Materials & Learning Resources */}
            <div className="rounded-[16px] border border-[var(--border)] bg-white shadow-neu-sm overflow-hidden">
              <button
                onClick={(e) => { e.stopPropagation(); setIsReferencesOpen(!isReferencesOpen); }}
                className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-[var(--text)] hover:bg-[var(--lavender-soft)]/20 transition-colors"
                aria-label="Toggle reference materials accordion"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[var(--primary)]" />
                  <span>Reference Materials & Verified Resources</span>
                  <span className="rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-2 py-0.2 text-[10px] font-bold text-[var(--primary)]">
                    {lessonReferences.length}
                  </span>
                </div>
                {isReferencesOpen ? <ChevronUp className="h-4 w-4 text-[var(--primary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--primary)]" />}
              </button>

              {isReferencesOpen && (
                <div className="border-t border-[var(--border)] p-4 bg-[var(--bg)] space-y-3 text-xs">
                  {lessonReferences.length === 0 ? (
                    <div className="text-center py-3 text-[var(--text-muted)] space-y-1">
                      <p>No specific references attached directly to this session yet.</p>
                      <p className="text-[11px]">
                        Check the <strong>Reference Materials</strong> tab to view and retrieve unit-wide resources.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {lessonReferences.map((ref) => (
                        <div
                          key={ref.id}
                          className="bg-white p-3 rounded-[12px] border border-[var(--border)] shadow-neu-sm space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="rounded-full bg-[var(--lavender-soft)] px-2 py-0.5 text-[9px] font-bold text-[var(--primary)] border border-[var(--border)] uppercase">
                              {ref.category}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              ref.verified === 'verified'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {ref.verified === 'verified' ? '✓ Verified' : 'Unverified'}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-xs text-[var(--text)] hover:text-[var(--primary)] leading-snug line-clamp-1 block"
                                aria-label={`Open ${ref.title} on ${ref.sourceName} in a new tab`}
                              >
                                {ref.title}
                              </a>
                              <span className="text-[10px] font-medium text-[var(--primary)] block mt-0.5">
                                {ref.sourceName} &bull; {ref.resourceType}
                              </span>
                            </div>

                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="neu-btn-secondary inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[var(--primary)] flex-shrink-0"
                              aria-label={`Open ${ref.title} on ${ref.sourceName} in a new tab`}
                            >
                              <span>Open</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>

                          {ref.description && (
                            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                              {ref.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Visual Learning Aid, Rigor Charts & Standards Alignment */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* 4. TOPIC-SPECIFIC VISUAL LEARNING AID */}
          <TopicVisualAid
            topic={session.topic}
            subject={plan.subject}
            lessonTitle={session.title}
            gradeLevel={plan.gradeLevel}
          />

          {/* 5. GENUINE DATA CHARTS: Pacing & Rigor Allocation */}
          <SessionPacingChart session={session} />

          {/* 6. SIMPLIFIED STANDARDS ALIGNMENT */}
          {session.standards.length > 0 && (
            <div className="neu-card-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  Curriculum Standards
                </h4>
                <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--lavender-soft)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                  {session.standards.length} aligned
                </span>
              </div>

              {/* Primary Standard Compact Display */}
              {primaryStandard && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--text)]">
                      {primaryStandard.code}
                    </span>
                    {/* Status Badge */}
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                      primaryStandard.verificationStatus === 'verified'
                        ? 'bg-[var(--lavender-soft)] text-[var(--primary)] border-[var(--border)]'
                        : primaryStandard.verificationStatus === 'teacher_provided'
                        ? 'bg-[var(--lavender-soft)]/60 text-[var(--accent)] border-[var(--border)]'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {primaryStandard.verificationStatus === 'verified'
                        ? 'Verified Standard'
                        : primaryStandard.verificationStatus === 'teacher_provided'
                        ? 'Teacher Provided'
                        : 'Suggested Alignment'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {primaryStandard.description}
                  </p>
                </div>
              )}

              {/* Expand Toggle for All Standards Context */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowAllStandards(!showAllStandards); }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline pt-1"
              >
                <span>{showAllStandards ? 'Hide full standards text' : `View full standards alignment context (${session.standards.length})`}</span>
                {showAllStandards ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {/* Expanded Standards Context */}
              {showAllStandards && (
                <div className="pt-2 border-t border-[var(--border)] space-y-3">
                  {session.standards.map((std) => (
                    <div key={std.id} className="rounded-[12px] bg-[var(--lavender-soft)]/40 p-2.5 border border-[var(--border)] text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-[var(--text)] font-mono font-bold">{std.code}</strong>
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">{std.framework}</span>
                      </div>
                      <p className="text-[var(--text-muted)]">{std.description}</p>
                      {std.lessonConnection && (
                        <div className="text-[10px] text-[var(--primary)] italic pt-0.5 font-medium">
                          Connection: {std.lessonConnection}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
