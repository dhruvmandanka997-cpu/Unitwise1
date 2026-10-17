import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Sparkles, 
  Calendar, 
  Clock, 
  BookOpen, 
  Layers, 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp,
  Share2, 
  FileSpreadsheet,
  Zap,
  Award,
  MoveUp,
  MoveDown,
  Search,
  Filter,
  X,
  CheckSquare,
  ExternalLink
} from 'lucide-react';
import { LessonPlan, SessionPlan, WeeklyPlan, LearningObjective } from '../../types/plan';
import { TeacherTask, TaskStats } from '../../types/task';
import { api } from '../../services/api';
import { VisualLessonCard } from './VisualLessonCard';
import { TaskOverviewPanel } from '../tasks/TaskOverviewPanel';
import { TaskTrackerView } from '../tasks/TaskTrackerView';
import { ReferenceMaterialsView } from '../references/ReferenceMaterialsView';
import { BRAND } from '../../config/brand';

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

export type TabType = 'overview' | 'weekly' | 'daily' | 'standards' | 'assessments' | 'resources' | 'tasks';

interface PlanWorkspaceProps {
  plan: LessonPlan;
  onBack: () => void;
  onSavePlan: (updatedPlan: LessonPlan) => Promise<void>;
  onDuplicatePlan: (id: string) => void;
  initialTab?: TabType;
  tasks?: TeacherTask[];
  onToggleChecklist?: (taskId: string, itemId: string, completed: boolean) => Promise<void>;
  onUpdateTask?: (taskId: string, partial: Partial<TeacherTask>) => Promise<void>;
  onRefreshTasks?: () => void;
}

export const PlanWorkspace: React.FC<PlanWorkspaceProps> = ({
  plan: initialPlan,
  onBack,
  onSavePlan,
  initialTab = 'overview',
  tasks = [],
  onToggleChecklist,
  onUpdateTask,
  onRefreshTasks,
}) => {
  const [currentPlan, setCurrentPlan] = useState<LessonPlan>(initialPlan);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedTaskStatusFilter, setSelectedTaskStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const planTaskStats = useMemo<TaskStats>(() => {
    const total = tasks.length;
    if (total === 0) {
      return { total: 0, completed: 0, inProgress: 0, incomplete: 0, pending: 0, completionPercentage: 0 };
    }
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const incomplete = tasks.filter((t) => t.status === 'incomplete').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const completionPercentage = Math.round((completed / total) * 100);
    return { total, completed, inProgress, incomplete, pending, completionPercentage };
  }, [tasks]);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Selected session for Daily Lessons tab
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(1);

  // AI adaptation loading state
  const [aiLoadingSessionNum, setAiLoadingSessionNum] = useState<number | null>(null);
  const [, setAiLoadingWeekNum] = useState<number | null>(null);

  // Standards Alignment Tab State & Aggregation
  const [standardsSearchQuery, setStandardsSearchQuery] = useState('');
  const [standardsFrameworkFilter, setStandardsFrameworkFilter] = useState('ALL');
  const [expandedStandardCodes, setExpandedStandardCodes] = useState<string[]>([]);

  const aggregatedStandards = useMemo(() => {
    const map = new Map<string, {
      id: string;
      code: string;
      framework: string;
      description: string;
      lessonConnection?: string;
      verificationStatus: string;
      sessions: {
        weekNumber: number;
        sessionNumber: number;
        title: string;
        objectives: LearningObjective[];
      }[];
    }>();

    currentPlan.weeklyPlans.forEach((w) => {
      w.sessions.forEach((s) => {
        s.standards?.forEach((std) => {
          if (!map.has(std.code)) {
            map.set(std.code, {
              id: std.id,
              code: std.code,
              framework: std.framework,
              description: std.description,
              lessonConnection: std.lessonConnection,
              verificationStatus: std.verificationStatus || 'suggested_unverified',
              sessions: []
            });
          }
          const entry = map.get(std.code)!;
          if (!entry.sessions.some((sess) => sess.weekNumber === w.weekNumber && sess.sessionNumber === s.sessionNumber)) {
            entry.sessions.push({
              weekNumber: w.weekNumber,
              sessionNumber: s.sessionNumber,
              title: s.title,
              objectives: s.objectives || []
            });
          }
          if (!entry.lessonConnection && std.lessonConnection) {
            entry.lessonConnection = std.lessonConnection;
          }
        });
      });
    });

    return Array.from(map.values());
  }, [currentPlan]);

  const availableFrameworks = useMemo(() => {
    const set = new Set<string>();
    aggregatedStandards.forEach((s) => {
      if (s.framework) set.add(s.framework);
    });
    return Array.from(set);
  }, [aggregatedStandards]);

  const filteredStandards = useMemo(() => {
    return aggregatedStandards.filter((std) => {
      const q = standardsSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        std.code.toLowerCase().includes(q) ||
        std.description.toLowerCase().includes(q) ||
        std.framework.toLowerCase().includes(q);

      const matchesFramework =
        standardsFrameworkFilter === 'ALL' || std.framework === standardsFrameworkFilter;

      return matchesSearch && matchesFramework;
    });
  }, [aggregatedStandards, standardsSearchQuery, standardsFrameworkFilter]);

  const toggleStandardExpansion = (code: string) => {
    setExpandedStandardCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Sync when initialPlan changes externally
  useEffect(() => {
    setCurrentPlan(initialPlan);
    setIsDirty(false);
  }, [initialPlan]);

  const handleUpdate = (updated: LessonPlan) => {
    setCurrentPlan(updated);
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePlan(currentPlan);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save plan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Session Mutations ---
  const handleUpdateSession = (weekNum: number, sessionNum: number, updater: (s: SessionPlan) => SessionPlan) => {
    const updatedWeeks = currentPlan.weeklyPlans.map((w) => {
      if (w.weekNumber !== weekNum) return w;
      return {
        ...w,
        sessions: w.sessions.map((s) => (s.sessionNumber === sessionNum ? updater(s) : s)),
      };
    });
    handleUpdate({ ...currentPlan, weeklyPlans: updatedWeeks });
  };

  const handleReorderSession = (weekNum: number, sessionNum: number, direction: 'up' | 'down') => {
    const targetWeek = currentPlan.weeklyPlans.find((w) => w.weekNumber === weekNum);
    if (!targetWeek) return;

    const idx = targetWeek.sessions.findIndex((s) => s.sessionNumber === sessionNum);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === targetWeek.sessions.length - 1) return;

    const newSessions = [...targetWeek.sessions];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newSessions[idx];
    newSessions[idx] = newSessions[swapIdx];
    newSessions[swapIdx] = temp;

    const renumbered = newSessions.map((s, i) => ({
      ...s,
      dayNumber: i + 1,
    }));

    const updatedWeeks = currentPlan.weeklyPlans.map((w) =>
      w.weekNumber === weekNum ? { ...w, sessions: renumbered } : w
    );
    handleUpdate({ ...currentPlan, weeklyPlans: updatedWeeks });
  };

  const handleDeleteSession = (weekNum: number, sessionNum: number) => {
    if (!confirm('Are you sure you want to remove this teaching session from the plan?')) return;

    const updatedWeeks = currentPlan.weeklyPlans.map((w) => {
      if (w.weekNumber !== weekNum) return w;
      const filtered = w.sessions.filter((s) => s.sessionNumber !== sessionNum);
      return {
        ...w,
        sessions: filtered.map((s, i) => ({ ...s, dayNumber: i + 1 })),
      };
    });

    handleUpdate({ ...currentPlan, weeklyPlans: updatedWeeks });
  };

  const handleAddSession = (weekNum: number) => {
    const targetWeek = currentPlan.weeklyPlans.find((w) => w.weekNumber === weekNum);
    if (!targetWeek) return;

    const maxGlobalSess = currentPlan.weeklyPlans.reduce(
      (max, w) => Math.max(max, ...w.sessions.map((s) => s.sessionNumber)),
      0
    );
    const newSessNum = maxGlobalSess + 1;
    const newDayNum = targetWeek.sessions.length + 1;

    const newSession: SessionPlan = {
      id: `sess_new_${Date.now()}`,
      sessionNumber: newSessNum,
      dayNumber: newDayNum,
      weekNumber: weekNum,
      title: `Lesson ${newSessNum}: Guided Practice & Concept Reinforcement`,
      topic: `${targetWeek.theme} Extension`,
      durationMinutes: currentPlan.classDurationMinutes,
      objectives: [
        {
          id: `obj_new_${Date.now()}`,
          description: `Demonstrate mastery of core principles through guided analysis.`,
          bloomLevel: 'Applying',
          successCriterion: `I can solve targeted practice tasks independently.`,
        },
      ],
      successCriteria: [`I can apply the core procedure.`],
      standards: targetWeek.sessions[0]?.standards || [],
      lessonSequence: [
        {
          phase: 'opening',
          title: 'Retrieval Practice',
          durationMinutes: Math.round(currentPlan.classDurationMinutes * 0.15),
          description: 'Activate prior knowledge with a quick 3-prompt warm-up.',
          teacherAction: 'Display warm-up questions and observe student work.',
          studentAction: 'Answer questions in notebook.',
          materials: ['Warm-up journals'],
        },
        {
          phase: 'direct_instruction',
          title: 'Direct Instruction & Modeling',
          durationMinutes: Math.round(currentPlan.classDurationMinutes * 0.35),
          description: 'Model step-by-step problem-solving strategy.',
          teacherAction: 'Work through example problem on board.',
          studentAction: 'Take guided notes.',
          materials: ['Whiteboard'],
        },
        {
          phase: 'guided_practice',
          title: 'Guided & Collaborative Practice',
          durationMinutes: Math.round(currentPlan.classDurationMinutes * 0.3),
          description: 'Students work in pairs on scaffolded problem set.',
          teacherAction: 'Circulate and provide targeted feedback.',
          studentAction: 'Collaborate with partner on problem set.',
          materials: ['Problem set'],
        },
        {
          phase: 'closure',
          title: 'Exit Ticket & Synthesis',
          durationMinutes: currentPlan.classDurationMinutes - (Math.round(currentPlan.classDurationMinutes * 0.15) + Math.round(currentPlan.classDurationMinutes * 0.35) + Math.round(currentPlan.classDurationMinutes * 0.3)),
          description: 'Collect formative check.',
          teacherAction: 'Collect exit slips at door.',
          studentAction: 'Complete exit slip independently.',
          materials: ['Exit tickets'],
        },
      ],
      formativeAssessment: {
        type: 'Exit Ticket Check',
        measures: 'Application of lesson objective',
        promptOrQuestion: 'Solve the check question and justify your strategy in one sentence.',
        evidenceOfLearning: 'Correct answer and valid written rationale.',
        interpretationGuide: 'Check for conceptual fidelity.',
        nextInstructionalStep: 'Review common errors in next warm-up.',
      },
      differentiation: {
        support: 'Provide worked-example step cards.',
        onLevel: 'Standard practice set.',
        advanced: 'Tier 3 challenge problem.',
        ell: 'Visual representations and sentence stems.',
        modalitiesOrAccommodations: 'Visual anchors and flexible pacing.',
      },
      homework: {
        enabled: true,
        task: 'Complete 3 practice problems.',
        estimatedMinutes: 15,
        optionalChallenge: '',
        realWorldConnection: '',
      },
      materials: ['Guided notes handout', 'Display slides', 'Exit tickets'],
    };

    const updatedWeeks = currentPlan.weeklyPlans.map((w) =>
      w.weekNumber === weekNum ? { ...w, sessions: [...w.sessions, newSession] } : w
    );
    handleUpdate({ ...currentPlan, weeklyPlans: updatedWeeks });
    setSelectedSessionNum(newSessNum);
  };

  const handleAddWeek = () => {
    const newWeekNum = currentPlan.weeklyPlans.length + 1;
    const maxGlobalSess = currentPlan.weeklyPlans.reduce(
      (max, w) => Math.max(max, ...w.sessions.map((s) => s.sessionNumber)),
      0
    );

    const sessionsPerWeekCount = currentPlan.weeklyPlans[0]?.sessions.length || 3;
    const newSessions: SessionPlan[] = [];

    for (let i = 1; i <= sessionsPerWeekCount; i++) {
      const sessNum = maxGlobalSess + i;
      newSessions.push({
        id: `sess_${currentPlan.id}_${newWeekNum}_${sessNum}`,
        sessionNumber: sessNum,
        dayNumber: i,
        weekNumber: newWeekNum,
        title: `Lesson ${sessNum}: Synthesis, Reflection & Application`,
        topic: `Week ${newWeekNum} Deepening`,
        durationMinutes: currentPlan.classDurationMinutes,
        objectives: [
          {
            id: `obj_${sessNum}_1`,
            description: `Synthesize foundational knowledge and apply core competencies to real-world scenarios.`,
            bloomLevel: 'Creating',
            successCriterion: `I can construct an evidence-based explanation.`,
          },
        ],
        successCriteria: [`I can explain the core principle and justify my reasoning.`],
        standards: currentPlan.weeklyPlans[0]?.sessions[0]?.standards || [],
        lessonSequence: [
          {
            phase: 'opening',
            title: 'Diagnostic Bell-Ringer',
            durationMinutes: Math.round(currentPlan.classDurationMinutes * 0.15),
            description: 'Quick formative check on prior concepts.',
            teacherAction: 'Circulate and review student responses.',
            studentAction: 'Complete warm-up in notebooks.',
            materials: ['Warm-up prompt'],
          },
          {
            phase: 'direct_instruction',
            title: 'Interactive Conceptual Framework',
            durationMinutes: Math.round(currentPlan.classDurationMinutes * 0.35),
            description: 'Introduce advanced synthesis framework.',
            teacherAction: 'Guide interactive discussion and model reasoning.',
            studentAction: 'Contribute examples and record insights.',
            materials: ['Slide deck'],
          },
          {
            phase: 'guided_practice',
            title: 'Collaborative Problem Lab',
            durationMinutes: Math.round(currentPlan.classDurationMinutes * 0.3),
            description: 'Paired problem solving on authentic scenarios.',
            teacherAction: 'Facilitate collaborative discussion.',
            studentAction: 'Work in pairs on tiered task cards.',
            materials: ['Task cards'],
          },
          {
            phase: 'closure',
            title: 'Formative Reflection & Exit Slip',
            durationMinutes: currentPlan.classDurationMinutes - (Math.round(currentPlan.classDurationMinutes * 0.15) + Math.round(currentPlan.classDurationMinutes * 0.35) + Math.round(currentPlan.classDurationMinutes * 0.3)),
            description: 'Collect formative exit slip.',
            teacherAction: 'Collect and assess student exit tickets.',
            studentAction: 'Submit one-sentence synthesis.',
            materials: ['Exit tickets'],
          },
        ],
        formativeAssessment: {
          type: 'Exit Ticket Check',
          measures: 'Advanced conceptual transfer',
          promptOrQuestion: 'Explain how this concept applies in a novel scenario.',
          evidenceOfLearning: 'Coherent justification using domain vocabulary.',
          interpretationGuide: 'Assess depth of transfer reasoning.',
          nextInstructionalStep: 'Address edge-case questions in next session.',
        },
        differentiation: {
          support: 'Structured sentence frames and graphic organizers.',
          onLevel: 'Standard application set.',
          advanced: 'Independent research challenge.',
          ell: 'Visual representations and bilingual glossary.',
          modalitiesOrAccommodations: 'Multimodal representations and extended time.',
        },
        homework: {
          enabled: true,
          task: 'Complete 3 extension review exercises.',
          estimatedMinutes: 15,
          optionalChallenge: '',
          realWorldConnection: '',
        },
        materials: ['Guided workbook', 'Interactive display', 'Exit slips'],
      });
    }

    const newWeek: WeeklyPlan = {
      id: `week_ext_${currentPlan.id}_${newWeekNum}_${Date.now()}`,
      weekNumber: newWeekNum,
      title: `Week ${newWeekNum}: Advanced Extension & Synthesized Applications`,
      theme: `Extended Mastery & Culminating Inquiry`,
      learningGoals: [
        `Synthesize multi-step problem solving across unit topics.`,
        `Apply conceptual models to evaluate authentic scenarios.`,
      ],
      vocabulary: ['Synthesis', 'Extrapolation', 'Evaluation', 'Transfer'],
      prerequisites: [`Mastery of Week ${newWeekNum - 1} concepts`],
      sessions: newSessions,
      weeklyAssessment: {
        type: 'Weekly Checkpoint & Portfolio Review',
        description: `Summative checkpoint evaluating student synthesis of Week ${newWeekNum} goals.`,
        checkpointCriteria: ['Accurate concept demonstration on transfer tasks'],
      },
      weeklyResources: ['Guided Student Activity Workbook', 'Interactive Slide Deck'],
      reflectionPrompt: `How effectively did students transfer foundational knowledge to novel problems this week?`,
      teacherNotes: 'Calibrate small-group extension tasks.',
    };

    handleUpdate({
      ...currentPlan,
      durationWeeks: newWeekNum,
      weeklyPlans: [...currentPlan.weeklyPlans, newWeek],
    });
  };

  const handleDeleteWeek = (weekNum: number) => {
    if (currentPlan.weeklyPlans.length <= 1) {
      alert('A curriculum plan must contain at least one week.');
      return;
    }
    if (!confirm(`Are you sure you want to delete Week ${weekNum} and all its associated lessons?`)) {
      return;
    }

    const filtered = currentPlan.weeklyPlans.filter((w) => w.weekNumber !== weekNum);

    let globalSessionNumber = 1;
    const renumberedWeeks = filtered.map((week, wIdx) => {
      const currentWNum = wIdx + 1;
      const renumberedSessions = week.sessions.map((sess, sIdx) => ({
        ...sess,
        sessionNumber: globalSessionNumber++,
        dayNumber: sIdx + 1,
        weekNumber: currentWNum,
      }));
      return {
        ...week,
        weekNumber: currentWNum,
        title: week.title.replace(/Week \d+/, `Week ${currentWNum}`),
        sessions: renumberedSessions,
      };
    });

    handleUpdate({
      ...currentPlan,
      durationWeeks: renumberedWeeks.length,
      weeklyPlans: renumberedWeeks,
    });

    if (selectedWeekNum > renumberedWeeks.length) {
      setSelectedWeekNum(renumberedWeeks.length);
    }
  };

  const [copySuccess, setCopySuccess] = useState(false);
  const handleShareSummary = () => {
    const summary = `# ${currentPlan.title}\n**Subject:** ${currentPlan.subject} | **Grade:** ${currentPlan.gradeLevel}\n**Duration:** ${currentPlan.durationWeeks} Weeks (${totalSessionsCount} Sessions)\n\n## Overview\n${currentPlan.unitOverview}\n\n## Unit Goals\n${currentPlan.unitObjectives.map((o) => '- ' + o).join('\n')}\n\n*Generated by ${BRAND.name}*`;
    navigator.clipboard.writeText(summary);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // --- AI Regeneration Calls ---
  const handleRegenerateSession = async (weekNum: number, sessionNum: number) => {
    setAiLoadingSessionNum(sessionNum);
    try {
      const res = await api.regenerateSession(currentPlan.id, weekNum, sessionNum);
      handleUpdateSession(weekNum, sessionNum, () => res.session);
    } catch (err) {
      alert('Could not regenerate session: ' + (err as Error).message);
    } finally {
      setAiLoadingSessionNum(null);
    }
  };

  const handleAdaptSession = async (
    weekNum: number,
    sessionNum: number,
    adaptationType: 'simplify' | 'interactive' | 'differentiation' | 'shorten' | 'low_resource'
  ) => {
    setAiLoadingSessionNum(sessionNum);
    try {
      const res = await api.adaptSession(currentPlan.id, weekNum, sessionNum, adaptationType);
      handleUpdateSession(weekNum, sessionNum, () => res.session);
    } catch (err) {
      alert('Could not adapt session: ' + (err as Error).message);
    } finally {
      setAiLoadingSessionNum(null);
    }
  };

  const handleRegenerateWeek = async (weekNum: number) => {
    setAiLoadingWeekNum(weekNum);
    try {
      const res = await api.regenerateWeek(currentPlan.id, weekNum);
      const updatedWeeks = currentPlan.weeklyPlans.map((w) =>
        w.weekNumber === weekNum ? res.week : w
      );
      handleUpdate({ ...currentPlan, weeklyPlans: updatedWeeks });
    } catch (err) {
      alert('Could not regenerate week: ' + (err as Error).message);
    } finally {
      setAiLoadingWeekNum(null);
    }
  };

  const totalSessionsCount = currentPlan.weeklyPlans.reduce(
    (acc, w) => acc + w.sessions.length,
    0
  );

  const currentWeek = currentPlan.weeklyPlans.find((w) => w.weekNumber === selectedWeekNum) || currentPlan.weeklyPlans[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Workspace Action Sub-Bar */}
      <div className="sticky top-16 z-20 -mx-4 -mt-4 mb-4 border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 py-3.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-colors">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (isDirty && !confirm('You have unsaved edits. Are you sure you want to return to the dashboard?')) {
                  return;
                }
                onBack();
              }}
              className="neu-btn-secondary p-2 flex-shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4 text-[var(--primary)]" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <AutoExpandingTextarea
                  rows={1}
                  value={currentPlan.title}
                  onChange={(e) => {
                    handleUpdate({ ...currentPlan, title: e.target.value });
                  }}
                  className="font-bold text-base sm:text-lg text-[var(--text)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none px-1 py-0.5 w-full leading-snug transition-colors"
                  placeholder="Plan title..."
                  title="Click to edit plan title"
                />
                <Edit3 className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="font-bold text-[var(--text)]">{currentPlan.subject}</span>
                <span>&bull;</span>
                <span>{currentPlan.gradeLevel}</span>
                <span>&bull;</span>
                <span>{currentPlan.durationWeeks} weeks ({totalSessionsCount} sessions)</span>
                <span>&bull;</span>
                <span>{currentPlan.classDurationMinutes} min/class</span>
                <select
                  value={currentPlan.status}
                  onChange={(e) => handleUpdate({ ...currentPlan, status: e.target.value as 'draft' | 'completed' | 'archived' })}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border transition-colors cursor-pointer ${
                    currentPlan.status === 'completed'
                      ? 'bg-[var(--lavender-soft)] text-[var(--primary)] border-[var(--border)]'
                      : currentPlan.status === 'archived'
                      ? 'bg-slate-100 text-[var(--text-muted)] border-[var(--border)]'
                      : 'bg-white text-[var(--text-muted)] border-[var(--border)]'
                  }`}
                  title="Plan status"
                >
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
                {currentPlan.isDemo && (
                  <span className="rounded-full bg-[var(--lavender-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)] border border-[var(--border)]">
                    Demo Mode
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer ${
                    planTaskStats.completionPercentage === 100
                      ? 'bg-[var(--lavender-soft)] text-[var(--primary)] border-[var(--border)]'
                      : 'bg-white text-[var(--primary)] border-[var(--border)]'
                  }`}
                  title="View plan task milestones"
                >
                  <CheckSquare className="w-3 h-3 text-[var(--primary)]" />
                  <span>Tasks: {planTaskStats.completed}/{planTaskStats.total} ({planTaskStats.completionPercentage}%)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {/* Save Status Indicator */}
            <div className="text-xs mr-2">
              {saveSuccess ? (
                <span className="inline-flex items-center gap-1 text-[var(--primary)] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </span>
              ) : isDirty ? (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Unsaved changes
                </span>
              ) : (
                <span className="text-[var(--text-muted)]">
                  All changes saved
                </span>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white transition-all ${
                !isDirty && 'opacity-90'
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Saving...' : 'Save Plan'}
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button
                className="neu-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--text)]"
              >
                <Download className="h-3.5 w-3.5 text-[var(--primary)]" />
                Export
                <ChevronDown className="h-3 w-3 text-[var(--text-muted)]" />
              </button>

              <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-[16px] border border-[var(--border)] bg-white py-1.5 shadow-neu-raised group-hover:block z-50 animate-fadeIn">
                <a
                  href={api.getExportDocxUrl(currentPlan.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-[var(--primary)]" />
                  Microsoft Word (.docx)
                </a>
                <a
                  href={api.getExportPdfUrl(currentPlan.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-[var(--accent)]" />
                  PDF Document (.pdf)
                </a>
                <a
                  href={api.getExportPrintUrl(currentPlan.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  Print View
                </a>
                <a
                  href={api.getExportCsvUrl(currentPlan.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[var(--primary)]" />
                  Tracker CSV
                </a>
              </div>
            </div>

            <button
              onClick={handleShareSummary}
              className="neu-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--text)]"
              title="Copy markdown unit summary to clipboard"
            >
              <Share2 className="h-3.5 w-3.5 text-[var(--primary)]" />
              {copySuccess ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-3 flex overflow-x-auto space-x-1.5 border-t border-[var(--border)] pt-2.5">
          {[
            { id: 'overview' as const, label: 'Overview & Goals', icon: BookOpen },
            { id: 'weekly' as const, label: `Weekly Scope (${currentPlan.durationWeeks}w)`, icon: Calendar },
            { id: 'daily' as const, label: `Daily Lessons (${totalSessionsCount})`, icon: Clock },
            { id: 'standards' as const, label: 'Standards Alignment', icon: Award },
            { id: 'assessments' as const, label: 'Assessments & Rubric', icon: GraduationCap },
            { id: 'resources' as const, label: `Reference Materials (${currentPlan.references?.length || 0})`, icon: Layers },
            { id: 'tasks' as const, label: `Tasks Tracker (${planTaskStats.completed}/${planTaskStats.total})`, icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-[16px] transition-all whitespace-nowrap ${
                  isActive
                    ? 'neu-nav-active text-[var(--primary)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)]/40 font-semibold'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Unit Overview Card */}
          <div className="neu-card p-5 sm:p-6 space-y-3">
            <h2 className="text-sm font-bold text-[var(--text)] flex items-center justify-between">
              <span>Unit Overview & Enduring Understandings</span>
              <span className="text-xs font-normal text-[var(--text-muted)]">Backward-Design Stage 1</span>
            </h2>
            <textarea
              rows={4}
              value={currentPlan.unitOverview}
              onChange={(e) => handleUpdate({ ...currentPlan, unitOverview: e.target.value })}
              className="w-full neu-input p-3 text-xs text-[var(--text)] leading-relaxed"
            />
          </div>

          {/* Unit Objectives */}
          <div className="neu-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--text)]">
                Unit-Level Learning Outcomes
              </h2>
              <button
                onClick={() => {
                  handleUpdate({
                    ...currentPlan,
                    unitObjectives: [...currentPlan.unitObjectives, 'New measurable unit objective...'],
                  });
                }}
                className="neu-btn-secondary inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] px-3 py-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Objective
              </button>
            </div>

            <div className="space-y-2">
              {currentPlan.unitObjectives.map((obj, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="h-6 w-6 rounded-full bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <AutoExpandingTextarea
                      rows={1}
                      value={obj}
                      onChange={(e) => {
                        const updated = [...currentPlan.unitObjectives];
                        updated[idx] = e.target.value;
                        handleUpdate({ ...currentPlan, unitObjectives: updated });
                      }}
                      className="w-full neu-input px-3 py-2 text-xs text-[var(--text)] leading-relaxed"
                      placeholder="Enter unit learning objective..."
                    />
                  </div>
                  <button
                    onClick={() => {
                      const filtered = currentPlan.unitObjectives.filter((_, i) => i !== idx);
                      handleUpdate({ ...currentPlan, unitObjectives: filtered });
                    }}
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 transition-colors mt-1"
                    title="Remove objective"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Thematic Progression Matrix */}
          <div className="neu-card p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-[var(--text)]">
              Instructional Thematic Progression Roadmap
            </h2>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {currentPlan.weeklyPlans.map((week) => (
                <div
                  key={week.id}
                  className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-neu-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                      Week {week.weekNumber}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">{week.sessions.length} sessions</span>
                  </div>
                  <h4 
                    className="text-xs font-bold text-[var(--text)] leading-snug break-words"
                    title={week.theme}
                  >
                    {week.theme}
                  </h4>
                  <p 
                    className="text-[11px] text-[var(--text-muted)] leading-relaxed break-words"
                    title={week.learningGoals.join('; ')}
                  >
                    {week.learningGoals.join('; ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Reference Materials Overview Card */}
          <div className="neu-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[var(--text)]">
                    Curriculum Reference Materials & Verified Resources
                  </h2>
                  <span className="rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                    {currentPlan.references?.length || 0} attached
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Real educational portals, syllabus standards, and primary textbooks aligned to this curriculum
                </p>
              </div>

              <button
                onClick={() => setActiveTab('resources')}
                className="neu-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white self-start sm:self-auto"
              >
                <span>Explore All References ({currentPlan.references?.length || 0})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {(!currentPlan.references || currentPlan.references.length === 0) ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-[var(--text-muted)]">
                  No reference materials have been retrieved for this curriculum plan yet.
                </p>
                <button
                  onClick={() => setActiveTab('resources')}
                  className="neu-btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--primary)]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Fetch References in Materials Tab
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentPlan.references.slice(0, 3).map((ref) => (
                  <div
                    key={ref.id}
                    className="neu-card-sm p-3.5 bg-white border border-[var(--border)] space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
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
                      <h4 className="font-bold text-xs text-[var(--text)] line-clamp-1" title={ref.title}>
                        {ref.title}
                      </h4>
                      <p className="text-[10px] text-[var(--primary)] font-medium mt-0.5">
                        {ref.sourceName}
                      </p>
                      {ref.description && (
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
                          {ref.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                      {ref.relatedWeek ? (
                        <span className="text-[10px] text-[var(--text-muted)]">Week {ref.relatedWeek}</span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">Unit Resource</span>
                      )}
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                        aria-label={`Open ${ref.title} in a new tab`}
                      >
                        <span>Open ↗</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. WEEKLY SCOPE TAB */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
                Weekly Scope & Thematic Milestones
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Logical sequencing from foundational concepts to culminating synthesis
              </p>
            </div>
            <button
              onClick={handleAddWeek}
              className="neu-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              Extend Plan (+1 Week)
            </button>
          </div>

          <div className="space-y-6">
            {currentPlan.weeklyPlans.map((week) => (
              <div
                key={week.id}
                className="neu-card p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3.5 border-b border-[var(--border)] pb-4">
                  {/* Left: Badge + Full Week Title */}
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <span className="flex-shrink-0 inline-flex items-center rounded-full bg-[var(--lavender-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)] border border-[var(--border)] mt-0.5 select-none">
                      Week {week.weekNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <AutoExpandingTextarea
                        rows={1}
                        value={week.title}
                        onChange={(e) => {
                          const updated = currentPlan.weeklyPlans.map((w) =>
                            w.id === week.id ? { ...w, title: e.target.value } : w
                          );
                          handleUpdate({ ...currentPlan, weeklyPlans: updated });
                        }}
                        className="w-full font-bold text-sm sm:text-base text-[var(--text)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none py-0.5 leading-snug transition-colors break-words"
                        placeholder="Enter week title..."
                        title={week.title}
                        aria-label={`Title for Week ${week.weekNumber}`}
                      />
                    </div>
                  </div>

                  {/* Right: Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 flex-shrink-0 w-full xl:w-auto pt-2 xl:pt-0 border-t border-[var(--border)] xl:border-t-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleRegenerateWeek(week.weekNumber)}
                        className="neu-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text)] min-h-[34px]"
                        title="AI Regenerate this weekly scope"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
                        <span>Regenerate<span className="hidden sm:inline"> Week</span></span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWeekNum(week.weekNumber);
                          setActiveTab('daily');
                        }}
                        className="neu-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white min-h-[34px]"
                        title="View daily lesson sessions for this week"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>View Lessons ({week.sessions.length})</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteWeek(week.weekNumber)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-600 rounded-lg transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                      title="Delete week"
                      aria-label={`Delete Week ${week.weekNumber}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text)]">Central Theme</label>
                    <input
                      type="text"
                      value={week.theme}
                      onChange={(e) => {
                        const updated = currentPlan.weeklyPlans.map((w) =>
                          w.id === week.id ? { ...w, theme: e.target.value } : w
                        );
                        handleUpdate({ ...currentPlan, weeklyPlans: updated });
                      }}
                      className="w-full neu-input px-3 py-2 text-xs text-[var(--text)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text)]">Key Vocabulary / Concepts</label>
                    <input
                      type="text"
                      value={week.vocabulary.join(', ')}
                      onChange={(e) => {
                        const updated = currentPlan.weeklyPlans.map((w) =>
                          w.id === week.id
                            ? { ...w, vocabulary: e.target.value.split(',').map((v) => v.trim()) }
                            : w
                        );
                        handleUpdate({ ...currentPlan, weeklyPlans: updated });
                      }}
                      className="w-full neu-input px-3 py-2 text-xs text-[var(--text)]"
                    />
                  </div>
                </div>

                {/* Weekly Assessment Checkpoint */}
                <div className="rounded-[16px] bg-[var(--lavender-soft)]/40 p-4 space-y-1.5 border border-[var(--border)]">
                  <span className="text-xs font-bold text-[var(--primary)] block">
                    Weekly Assessment Checkpoint: {week.weeklyAssessment.type}
                  </span>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed break-words">
                    {week.weeklyAssessment.description}
                  </p>
                </div>

                {/* Teacher Reflection Prompt */}
                <div className="rounded-[16px] bg-[var(--lavender-soft)]/60 p-3.5 border border-[var(--border)] text-xs text-[var(--text-muted)] leading-relaxed">
                  <strong className="text-[var(--text)] font-semibold not-italic">Teacher Reflection Prompt: </strong>
                  <span className="italic">{week.reflectionPrompt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DAILY LESSONS TAB */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Week Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-[var(--text)] whitespace-nowrap">Week:</span>
            {currentPlan.weeklyPlans.map((w) => (
              <button
                key={w.weekNumber}
                onClick={() => {
                  setSelectedWeekNum(w.weekNumber);
                  if (w.sessions[0]) setSelectedSessionNum(w.sessions[0].sessionNumber);
                }}
                className={`px-3 py-1.5 rounded-[12px] text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedWeekNum === w.weekNumber
                    ? 'neu-btn-primary text-white font-bold'
                    : 'neu-btn-secondary text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Week {w.weekNumber} ({w.sessions.length} sess)
              </button>
            ))}
          </div>

          {/* Session Cards for Current Selected Week */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                Week {currentWeek.weekNumber} Teaching Sessions &bull; {currentWeek.theme}
              </h3>
              <button
                onClick={() => handleAddSession(selectedWeekNum)}
                className="neu-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--primary)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Session to Week {selectedWeekNum}
              </button>
            </div>

            {currentWeek.sessions.map((session, sIdx) => {
              const isAiLoading = aiLoadingSessionNum === session.sessionNumber;

              return (
                <VisualLessonCard
                  key={session.id}
                  session={session}
                  plan={currentPlan}
                  weekNum={selectedWeekNum}
                  sIdx={sIdx}
                  totalSessionsInWeek={currentWeek.sessions.length}
                  isAiLoading={isAiLoading}
                  isSelected={selectedSessionNum === session.sessionNumber}
                  onSelect={() => setSelectedSessionNum(session.sessionNumber)}
                  onUpdateSession={(updater) =>
                    handleUpdateSession(selectedWeekNum, session.sessionNumber, updater)
                  }
                  onReorderSession={(direction) =>
                    handleReorderSession(selectedWeekNum, session.sessionNumber, direction)
                  }
                  onRegenerateSession={() =>
                    handleRegenerateSession(selectedWeekNum, session.sessionNumber)
                  }
                  onAdaptSession={(type) =>
                    handleAdaptSession(selectedWeekNum, session.sessionNumber, type)
                  }
                  onDeleteSession={() =>
                    handleDeleteSession(selectedWeekNum, session.sessionNumber)
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 4. STANDARDS ALIGNMENT TAB */}
      {activeTab === 'standards' && (
        <div className="space-y-6">
          <div className="neu-card p-5 sm:p-6 space-y-5">
            {/* Header: Title, Description, and Counter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex items-start gap-3">
                <div className="neu-icon-box mt-0.5">
                  <Award className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text)]">
                    Standards Alignment
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Curriculum competencies, alignment rationale, and verified frameworks mapped across instructional units.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {filteredStandards.length === aggregatedStandards.length
                    ? `${aggregatedStandards.length} standards available`
                    : `Showing ${filteredStandards.length} of ${aggregatedStandards.length} standards`}
                </span>
                {filteredStandards.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (expandedStandardCodes.length === filteredStandards.length) {
                        setExpandedStandardCodes([]);
                      } else {
                        setExpandedStandardCodes(filteredStandards.map((s) => s.code));
                      }
                    }}
                    className="neu-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
                  >
                    {expandedStandardCodes.length === filteredStandards.length && filteredStandards.length > 0 ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5 text-[var(--primary)]" />
                        Collapse all
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 text-[var(--primary)]" />
                        Expand all
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5 bg-[var(--lavender-soft)]/40 p-3 rounded-[16px] border border-[var(--border)]">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={standardsSearchQuery}
                  onChange={(e) => setStandardsSearchQuery(e.target.value)}
                  placeholder="Search by code or description..."
                  className="w-full neu-input pl-9 pr-8 py-2 text-xs font-medium text-[var(--text)] placeholder:text-[var(--text-muted)]"
                />
                {standardsSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStandardsSearchQuery('')}
                    className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text)]"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {availableFrameworks.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Filter className="h-3.5 w-3.5 text-[var(--text-muted)] hidden sm:inline-block" />
                  <select
                    value={standardsFrameworkFilter}
                    onChange={(e) => setStandardsFrameworkFilter(e.target.value)}
                    className="max-w-[240px] truncate neu-input px-3 py-2 text-xs font-semibold text-[var(--text)]"
                  >
                    <option value="ALL">All Frameworks ({availableFrameworks.length})</option>
                    {availableFrameworks.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredStandards.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white p-10 text-center">
                <Award className="mx-auto h-8 w-8 text-[var(--primary)] mb-2" />
                <h3 className="text-sm font-bold text-[var(--text)]">
                  No matching standards found
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                  {standardsSearchQuery
                    ? `No standards match "${standardsSearchQuery}".`
                    : 'No standards match the selected framework filter.'}
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStandardsSearchQuery('');
                      setStandardsFrameworkFilter('ALL');
                    }}
                    className="neu-btn-primary inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* DESKTOP VIEW: Responsive Table with Sensible Columns & Expandable Details */}
                <div className="hidden md:block overflow-x-auto rounded-[16px] border border-[var(--border)] shadow-neu-sm bg-white">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead className="bg-[var(--lavender-soft)]/50 text-[var(--text)] border-b border-[var(--border)]">
                      <tr>
                        <th className="py-3 px-4 w-40 font-bold text-xs text-[var(--text)]">Standard Code</th>
                        <th className="py-3 px-4 w-48 font-bold text-xs text-[var(--text)]">Framework</th>
                        <th className="py-3 px-4 min-w-[280px] font-bold text-xs text-[var(--text)]">Competency Summary</th>
                        <th className="py-3 px-4 w-44 font-bold text-xs text-[var(--text)]">Verification Status</th>
                        <th className="py-3 px-4 w-28 text-right font-bold text-xs text-[var(--text)]">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-xs">
                      {filteredStandards.map((std) => {
                        const isExpanded = expandedStandardCodes.includes(std.code);
                        const conciseSummary = std.description.length > 105
                          ? std.description.slice(0, 100).trim() + '…'
                          : std.description;

                        return (
                          <React.Fragment key={std.code}>
                            <tr
                              onClick={() => toggleStandardExpansion(std.code)}
                              className={`group cursor-pointer transition-colors ${
                                isExpanded
                                  ? 'bg-[var(--lavender-soft)]/40'
                                  : 'hover:bg-[var(--lavender-soft)]/20'
                              }`}
                            >
                              {/* Standard Code - Visually distinct small lavender pill */}
                              <td className="py-3.5 px-4 align-top">
                                <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--lavender-soft)] px-2.5 py-0.5 rounded-full border border-[var(--border)] inline-block">
                                  {std.code}
                                </span>
                              </td>

                              {/* Framework - Understated secondary information */}
                              <td className="py-3.5 px-4 align-top">
                                <span className="text-xs text-[var(--text-muted)] leading-relaxed break-words block font-medium">
                                  {std.framework}
                                </span>
                              </td>

                              {/* Competency Summary - Concise summary, wraps naturally */}
                              <td className="py-3.5 px-4 align-top">
                                <p className="text-xs text-[var(--text)] leading-relaxed break-words font-medium">
                                  {conciseSummary}
                                </p>
                              </td>

                              {/* Verification Status */}
                              <td className="py-3.5 px-4 align-top">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  std.verificationStatus === 'verified'
                                    ? 'bg-[var(--lavender-soft)] text-[var(--primary)] border-[var(--border)]'
                                    : std.verificationStatus === 'teacher_provided'
                                    ? 'bg-[var(--lavender-soft)]/60 text-[var(--accent)] border-[var(--border)]'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                  {std.verificationStatus === 'verified' && <CheckCircle2 className="w-3 h-3 text-[var(--primary)]" />}
                                  {std.verificationStatus === 'verified'
                                    ? 'Verified'
                                    : std.verificationStatus === 'teacher_provided'
                                    ? 'Teacher Provided'
                                    : 'Suggested Alignment'}
                                </span>
                              </td>

                              {/* Details Action Button */}
                              <td className="py-3.5 px-4 align-top text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStandardExpansion(std.code);
                                  }}
                                  aria-expanded={isExpanded}
                                  className="neu-btn-secondary inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] px-2.5 py-1"
                                >
                                  <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </td>
                            </tr>

                            {/* Expandable Details Drawer */}
                            {isExpanded && (
                              <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
                                <td colSpan={5} className="p-4 sm:p-5">
                                  <div className="rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5 space-y-4 shadow-neu-sm">
                                    {/* Full Competency Description */}
                                    <div>
                                      <h4 className="text-xs font-bold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-[var(--primary)]" />
                                        Full Competency Description
                                      </h4>
                                      <p className="text-xs text-[var(--text)] leading-relaxed break-words pl-5">
                                        {std.description}
                                      </p>
                                    </div>

                                    {/* Alignment Rationale */}
                                    {std.lessonConnection && (
                                      <div className="rounded-[12px] bg-[var(--lavender-soft)]/50 p-3 border border-[var(--border)]">
                                        <h4 className="text-xs font-bold text-[var(--primary)] mb-1 flex items-center gap-1.5">
                                          <Sparkles className="h-3.5 w-3.5" />
                                          Alignment Rationale
                                        </h4>
                                        <p className="text-xs text-[var(--text)] leading-relaxed">
                                          {std.lessonConnection}
                                        </p>
                                      </div>
                                    )}

                                    {/* Related Learning Objectives & Connected Sessions */}
                                    {std.sessions.length > 0 && (
                                      <div>
                                        <h4 className="text-xs font-bold text-[var(--text)] mb-2 flex items-center gap-1.5">
                                          <BookOpen className="h-3.5 w-3.5 text-[var(--primary)]" />
                                          Connected Curriculum Sessions & Learning Objectives ({std.sessions.length})
                                        </h4>
                                        <div className="space-y-2.5">
                                          {std.sessions.map((sess) => (
                                            <div
                                              key={`${sess.weekNumber}-${sess.sessionNumber}`}
                                              className="rounded-[12px] border border-[var(--border)] bg-[var(--bg)] p-3 space-y-2"
                                            >
                                              <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
                                                <span>Week {sess.weekNumber}, Session {sess.sessionNumber}: {sess.title}</span>
                                              </div>
                                              {sess.objectives && sess.objectives.length > 0 && (
                                                <div className="space-y-1.5 pl-2.5 border-l-2 border-[var(--primary)]/40">
                                                  {sess.objectives.map((obj) => (
                                                    <div key={obj.id} className="text-xs space-y-0.5">
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[var(--text)] font-medium">
                                                          {obj.description}
                                                        </span>
                                                        {obj.bloomLevel && (
                                                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[var(--primary)] border border-[var(--border)] font-bold">
                                                            {obj.bloomLevel}
                                                          </span>
                                                        )}
                                                      </div>
                                                      {obj.successCriterion && (
                                                        <p className="text-[11px] text-[var(--text-muted)] italic">
                                                          Success Criterion: {obj.successCriterion}
                                                        </p>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Verification Status and Source Information */}
                                    <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-[var(--text)]">Framework:</span>
                                        <span>{std.framework}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-[var(--text)]">Status:</span>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                          std.verificationStatus === 'verified'
                                            ? 'bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)]'
                                            : std.verificationStatus === 'teacher_provided'
                                            ? 'bg-[var(--lavender-soft)]/60 text-[var(--accent)] border border-[var(--border)]'
                                            : 'bg-amber-50 text-amber-800'
                                        }`}>
                                          {std.verificationStatus === 'verified'
                                            ? 'Official Framework Match'
                                            : std.verificationStatus === 'teacher_provided'
                                            ? 'Teacher-Defined Alignment'
                                            : 'Algorithmic Suggestion (Unverified)'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE VIEW: Stacked Expandable Cards without horizontal overflow */}
                <div className="md:hidden space-y-3">
                  {filteredStandards.map((std) => {
                    const isExpanded = expandedStandardCodes.includes(std.code);
                    const conciseSummary = std.description.length > 105
                      ? std.description.slice(0, 100).trim() + '…'
                      : std.description;

                    return (
                      <div
                        key={std.code}
                        className="neu-card-sm p-4 space-y-3"
                      >
                        {/* Header: Standard Code + Verification Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--lavender-soft)] px-2.5 py-1 rounded-full border border-[var(--border)] inline-block">
                            {std.code}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            std.verificationStatus === 'verified'
                              ? 'bg-[var(--lavender-soft)] text-[var(--primary)] border-[var(--border)]'
                              : std.verificationStatus === 'teacher_provided'
                              ? 'bg-[var(--lavender-soft)]/60 text-[var(--accent)] border-[var(--border)]'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {std.verificationStatus === 'verified' && <CheckCircle2 className="w-2.5 h-2.5 text-[var(--primary)]" />}
                            {std.verificationStatus === 'verified'
                              ? 'Verified'
                              : std.verificationStatus === 'teacher_provided'
                              ? 'Teacher Provided'
                              : 'Suggested'}
                          </span>
                        </div>

                        {/* Framework: Understated Secondary Information */}
                        <div className="text-xs text-[var(--text-muted)] font-medium">
                          {std.framework}
                        </div>

                        {/* Competency Summary / Full Description Toggle */}
                        <p className="text-xs text-[var(--text)] leading-relaxed break-words font-medium">
                          {isExpanded ? std.description : conciseSummary}
                        </p>

                        {/* View Details Action Button */}
                        <button
                          type="button"
                          onClick={() => toggleStandardExpansion(std.code)}
                          className="w-full neu-btn-secondary flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[var(--primary)]"
                        >
                          <span>{isExpanded ? 'Hide details' : 'View full details'}</span>
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Mobile Expanded Drawer */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-[var(--border)] space-y-3">
                            {/* Alignment Rationale */}
                            {std.lessonConnection && (
                              <div className="rounded-[12px] bg-[var(--lavender-soft)]/50 p-2.5 border border-[var(--border)]">
                                <h4 className="text-[11px] font-bold text-[var(--primary)] mb-0.5 flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  Alignment Rationale
                                </h4>
                                <p className="text-xs text-[var(--text)] leading-relaxed">
                                  {std.lessonConnection}
                                </p>
                              </div>
                            )}

                            {/* Connected Sessions */}
                            {std.sessions.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-1">
                                  <BookOpen className="h-3 w-3 text-[var(--primary)]" />
                                  Connected Sessions ({std.sessions.length})
                                </h4>
                                <div className="space-y-1.5">
                                  {std.sessions.map((sess) => (
                                    <div
                                      key={`${sess.weekNumber}-${sess.sessionNumber}`}
                                      className="rounded-[12px] border border-[var(--border)] bg-[var(--bg)] p-2 text-xs space-y-1"
                                    >
                                      <div className="font-bold text-[var(--text)]">
                                        W{sess.weekNumber} S{sess.sessionNumber}: {sess.title}
                                      </div>
                                      {sess.objectives?.map((obj) => (
                                        <div key={obj.id} className="text-[11px] text-[var(--text-muted)]">
                                          &bull; {obj.description}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Curriculum Disclaimer */}
            <div className="rounded-[16px] bg-[var(--lavender-soft)]/40 p-4 text-xs text-[var(--text)] border border-[var(--border)] flex items-start gap-3">
              <span className="font-bold text-[var(--primary)] shrink-0">Curriculum Disclaimer:</span>
              <p className="leading-relaxed text-[var(--text-muted)]">
                Suggested standards alignments are generated algorithmically to assist your planning. In accordance with professional standards, please verify alignments against your local school district curriculum guide before formal submission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. ASSESSMENTS & RUBRIC TAB */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <div className="neu-card p-5 sm:p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="neu-icon-box mt-0.5">
                <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">
                  Culminating Summative Assessment & 4-Tier Rubric
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Authentic performance task evaluating enduring understandings across 4 mastery tiers.
                </p>
              </div>
            </div>

            {/* Assessment Title & Description */}
            <div className="space-y-3 rounded-[16px] bg-[var(--lavender-soft)]/30 border border-[var(--border)] p-4">
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">
                  Summative Assessment Title
                </label>
                <input
                  type="text"
                  value={currentPlan.finalAssessment.title}
                  onChange={(e) =>
                    handleUpdate({
                      ...currentPlan,
                      finalAssessment: { ...currentPlan.finalAssessment, title: e.target.value },
                    })
                  }
                  className="w-full text-sm font-bold text-[var(--text)] neu-input px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">
                  Task Prompt & Student Deliverables
                </label>
                <textarea
                  rows={3}
                  value={currentPlan.finalAssessment.description}
                  onChange={(e) =>
                    handleUpdate({
                      ...currentPlan,
                      finalAssessment: { ...currentPlan.finalAssessment, description: e.target.value },
                    })
                  }
                  className="w-full neu-input p-3 text-xs text-[var(--text)] leading-relaxed"
                />
              </div>
            </div>

            {/* DESKTOP VIEW: Well-proportioned, spacious 5-column table with self-contained overflow */}
            <div className="hidden lg:block overflow-x-auto rounded-[16px] border border-[var(--border)] shadow-neu-sm bg-white">
              <table className="w-full min-w-[960px] text-left border-collapse table-auto">
                <thead className="bg-[var(--lavender-soft)]/50 border-b border-[var(--border)]">
                  <tr>
                    <th className="p-4 w-56 min-w-[210px] text-xs font-bold text-[var(--text)]">
                      Criterion & Weight
                    </th>
                    <th className="p-4 w-1/4 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                        <span className="text-xs font-bold text-[var(--primary)]">Exemplary (4)</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Advanced Mastery</span>
                    </th>
                    <th className="p-4 w-1/4 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
                        <span className="text-xs font-bold text-[var(--accent)]">Proficient (3)</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Target Standard</span>
                    </th>
                    <th className="p-4 w-1/4 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-amber-700">Developing (2)</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Approaching Standard</span>
                    </th>
                    <th className="p-4 w-1/4 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <span className="text-xs font-bold text-[var(--text-muted)]">Beginning (1)</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Emerging Foundation</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {currentPlan.finalAssessment.rubric.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[var(--lavender-soft)]/20 transition-colors">
                      <td className="p-4 align-top">
                        <input
                          type="text"
                          value={r.criterion}
                          onChange={(e) => {
                            const updated = [...currentPlan.finalAssessment.rubric];
                            updated[rIdx] = { ...r, criterion: e.target.value };
                            handleUpdate({
                              ...currentPlan,
                              finalAssessment: { ...currentPlan.finalAssessment, rubric: updated },
                            });
                          }}
                          className="w-full bg-transparent font-bold border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-xs text-[var(--text)] pb-0.5"
                          title="Edit criterion title"
                        />
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] bg-[var(--lavender-soft)] px-2.5 py-0.5 rounded-full mt-2 border border-[var(--border)]">
                          {r.weightPercentage}% weight
                        </span>
                      </td>
                      <td className="p-4 align-top text-xs leading-relaxed text-[var(--text-muted)] break-words font-medium">
                        {r.exemplary}
                      </td>
                      <td className="p-4 align-top text-xs leading-relaxed text-[var(--text-muted)] break-words font-medium">
                        {r.proficient}
                      </td>
                      <td className="p-4 align-top text-xs leading-relaxed text-[var(--text-muted)] break-words font-medium">
                        {r.developing}
                      </td>
                      <td className="p-4 align-top text-xs leading-relaxed text-[var(--text-muted)] break-words font-medium">
                        {r.beginning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABLET & MOBILE VIEW: Stacked Criterion Cards with Performance-Level Cards */}
            <div className="block lg:hidden space-y-5">
              {currentPlan.finalAssessment.rubric.map((r, rIdx) => (
                <div
                  key={rIdx}
                  className="neu-card-sm p-4 sm:p-5 space-y-4"
                >
                  {/* Criterion Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                        Criterion {rIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={r.criterion}
                        onChange={(e) => {
                          const updated = [...currentPlan.finalAssessment.rubric];
                          updated[rIdx] = { ...r, criterion: e.target.value };
                          handleUpdate({
                            ...currentPlan,
                            finalAssessment: { ...currentPlan.finalAssessment, rubric: updated },
                          });
                        }}
                        className="w-full bg-transparent font-bold text-sm text-[var(--text)] border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none pb-0.5"
                      />
                    </div>
                    <span className="inline-flex items-center text-xs font-bold text-[var(--primary)] bg-[var(--lavender-soft)] px-2.5 py-1 rounded-full border border-[var(--border)] self-start sm:self-auto">
                      {r.weightPercentage}% weight
                    </span>
                  </div>

                  {/* 4 Performance Levels Stacked for Comfortable Reading */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Level 4: Exemplary */}
                    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--lavender-soft)]/50 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                          Exemplary (4)
                        </span>
                        <span className="text-[10px] font-bold text-[var(--primary)]">Advanced</span>
                      </div>
                      <p className="text-xs text-[var(--text)] leading-relaxed">
                        {r.exemplary}
                      </p>
                    </div>

                    {/* Level 3: Proficient */}
                    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--lavender-soft)]/25 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                          Proficient (3)
                        </span>
                        <span className="text-[10px] font-bold text-[var(--accent)]">Target</span>
                      </div>
                      <p className="text-xs text-[var(--text)] leading-relaxed">
                        {r.proficient}
                      </p>
                    </div>

                    {/* Level 2: Developing */}
                    <div className="rounded-[12px] border border-amber-200 bg-amber-50/40 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Developing (2)
                        </span>
                        <span className="text-[10px] font-semibold text-amber-700">Approaching</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {r.developing}
                      </p>
                    </div>

                    {/* Level 1: Beginning */}
                    <div className="rounded-[12px] border border-[var(--border)] bg-white p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Beginning (1)
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--text-muted)]">Emerging</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {r.beginning}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. REFERENCE MATERIALS & RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Main Reference Materials Component */}
          <ReferenceMaterialsView
            plan={currentPlan}
            onUpdatePlan={handleUpdate}
          />

          {/* Internal Classroom Manipulatives & Materials */}
          <div className="neu-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
                  Classroom Manipulatives & Physical Materials
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Internal materials, lab apparatus, and handouts needed on-site
                </p>
              </div>
              <button
                onClick={() => {
                  handleUpdate({
                    ...currentPlan,
                    resourceList: [
                      ...currentPlan.resourceList,
                      {
                        category: 'Printable',
                        title: 'New Classroom Resource',
                        description: 'Materials needed for class session',
                        sourceOrUrl: '',
                      },
                    ],
                  });
                }}
                className="neu-btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--primary)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            {currentPlan.resourceList.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {currentPlan.resourceList.map((res, rIdx) => (
                  <div
                    key={rIdx}
                    className="neu-card-sm p-4 space-y-2 text-xs bg-white border border-[var(--border)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[var(--lavender-soft)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
                        {res.category}
                      </span>
                      <button
                        onClick={() => {
                          const filtered = currentPlan.resourceList.filter((_, i) => i !== rIdx);
                          handleUpdate({ ...currentPlan, resourceList: filtered });
                        }}
                        className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        title="Delete resource"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={res.title}
                      onChange={(e) => {
                        const updated = [...currentPlan.resourceList];
                        updated[rIdx] = { ...res, title: e.target.value };
                        handleUpdate({ ...currentPlan, resourceList: updated });
                      }}
                      className="w-full font-bold text-xs text-[var(--text)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none"
                    />
                    <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">{res.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">
                No specific physical classroom manipulatives listed.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 7. TASKS TRACKER TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <TaskOverviewPanel
            stats={planTaskStats}
            selectedStatusFilter={selectedTaskStatusFilter}
            onSelectStatusFilter={setSelectedTaskStatusFilter}
            title={`${currentPlan.title} — Plan Milestone Tracker`}
            subtitle="Verify required curriculum components, checklist steps, and pedagogical milestones for this unit"
          />
          <TaskTrackerView
            tasks={tasks}
            stats={planTaskStats}
            plans={[currentPlan]}
            selectedStatusFilter={selectedTaskStatusFilter}
            onSelectStatusFilter={setSelectedTaskStatusFilter}
            onToggleChecklist={onToggleChecklist || (async () => {})}
            onUpdateTask={onUpdateTask || (async () => {})}
            onContinueWorkflow={(_planId, targetTab) => {
              if (targetTab && ['overview', 'weekly', 'daily', 'standards', 'assessments', 'resources'].includes(targetTab)) {
                setActiveTab(targetTab as TabType);
              }
            }}
            onRefreshTasks={onRefreshTasks}
            showPlanFilter={false}
            initialPlanFilter={currentPlan.id}
          />
        </div>
      )}
    </div>
  );
};
