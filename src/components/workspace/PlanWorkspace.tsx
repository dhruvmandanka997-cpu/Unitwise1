import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Printer, 
  Sparkles, 
  Check, 
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
  RefreshCw, 
  Sliders, 
  MoveUp, 
  MoveDown, 
  Share2, 
  HelpCircle,
  FileSpreadsheet,
  Zap,
  Tag,
  Award
} from 'lucide-react';
import { LessonPlan, SessionPlan, WeeklyPlan, LearningObjective, LessonActivity } from '../../types/plan';
import { api } from '../../services/api';

interface PlanWorkspaceProps {
  plan: LessonPlan;
  onBack: () => void;
  onSavePlan: (updatedPlan: LessonPlan) => Promise<void>;
  onDuplicatePlan: (id: string) => void;
}

type TabType = 'overview' | 'weekly' | 'daily' | 'standards' | 'assessments' | 'resources';

export const PlanWorkspace: React.FC<PlanWorkspaceProps> = ({
  plan: initialPlan,
  onBack,
  onSavePlan,
  onDuplicatePlan,
}) => {
  const [currentPlan, setCurrentPlan] = useState<LessonPlan>(initialPlan);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Selected session for Daily Lessons tab
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(1);

  // AI adaptation loading state
  const [aiLoadingSessionNum, setAiLoadingSessionNum] = useState<number | null>(null);
  const [aiLoadingWeekNum, setAiLoadingWeekNum] = useState<number | null>(null);

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
      setTimeout(() => setSaveSuccess(false), 3000);
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

    // Renumber sessionNumbers in week
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

    const newSessions: SessionPlan[] = [];
    for (let s = 1; s <= currentPlan.sessionsPerWeek; s++) {
      const sessNum = maxGlobalSess + s;
      newSessions.push({
        id: `sess_w${newWeekNum}_s${sessNum}_${Date.now()}`,
        sessionNumber: sessNum,
        dayNumber: s,
        weekNumber: newWeekNum,
        title: `Lesson ${sessNum}: Extended Mastery & Authentic Application`,
        topic: `Advanced Synthesis & Inquiry`,
        durationMinutes: currentPlan.classDurationMinutes,
        objectives: [
          {
            id: `obj_w${newWeekNum}_${s}_1`,
            description: `Synthesize core concepts and solve non-routine multi-step challenges.`,
            bloomLevel: 'Analyzing',
            successCriterion: `I can solve complex multi-step problems with accuracy.`,
          },
        ],
        successCriteria: [`I can apply advanced problem-solving strategies.`],
        standards: currentPlan.weeklyPlans[0]?.sessions[0]?.standards || [],
        lessonSequence: [
          {
            phase: 'opening',
            title: 'Retrieval Warm-Up',
            durationMinutes: Math.round(currentPlan.classDurationMinutes * 0.15),
            description: 'Spaced retrieval check on prior weeks.',
            teacherAction: 'Display retrieval prompts; circulate and coach.',
            studentAction: 'Complete warm-up in notebooks.',
            materials: ['Warm-up notebooks'],
          },
          {
            phase: 'direct_instruction',
            title: 'Modeling & Case Study',
            durationMinutes: Math.round(currentPlan.classDurationMinutes * 0.35),
            description: 'Model advanced application.',
            teacherAction: 'Work through complex case study.',
            studentAction: 'Analyze solution pathway.',
            materials: ['Display screen / whiteboard'],
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

    // Renumber weeks and sessions globally
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
    const summary = `# ${currentPlan.title}\n**Subject:** ${currentPlan.subject} | **Grade:** ${currentPlan.gradeLevel}\n**Duration:** ${currentPlan.durationWeeks} Weeks (${totalSessionsCount} Sessions)\n\n## Overview\n${currentPlan.unitOverview}\n\n## Unit Goals\n${currentPlan.unitObjectives.map((o) => '- ' + o).join('\n')}\n\n*Generated by LessonCraft AI*`;
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

  // Active session for Daily tab
  const currentWeek = currentPlan.weeklyPlans.find((w) => w.weekNumber === selectedWeekNum) || currentPlan.weeklyPlans[0];
  const activeSession = currentWeek?.sessions.find((s) => s.sessionNumber === selectedSessionNum) || currentWeek?.sessions[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Workspace Action Bar */}
      <div className="sticky top-16 z-30 -mx-4 -mt-6 mb-6 border-b border-navy-200/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-navy-800 dark:bg-navy-900/95 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isDirty && !confirm('You have unsaved edits. Are you sure you want to return to the dashboard?')) {
                  return;
                }
                onBack();
              }}
              className="rounded-lg p-1.5 text-navy-500 hover:text-navy-900 hover:bg-navy-100 dark:text-navy-400 dark:hover:text-white dark:hover:bg-navy-800"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentPlan.title}
                  onChange={(e) => handleUpdate({ ...currentPlan, title: e.target.value })}
                  className="font-bold text-lg text-navy-900 bg-transparent border-b border-transparent hover:border-navy-300 focus:border-brand-500 focus:outline-none dark:text-white px-1 py-0.5"
                  title="Click to edit plan title"
                />
                <Edit3 className="h-3.5 w-3.5 text-navy-400" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-navy-500 dark:text-navy-400">
                <span className="font-semibold text-brand-700 dark:text-brand-300">{currentPlan.subject}</span>
                <span>&bull;</span>
                <span>{currentPlan.gradeLevel}</span>
                <span>&bull;</span>
                <span>{currentPlan.durationWeeks}w ({totalSessionsCount} sessions)</span>
                <span>&bull;</span>
                <span>{currentPlan.classDurationMinutes} min/class</span>
                {currentPlan.isDemo && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Demo Mode
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Save Status Indicator */}
            <div className="text-xs mr-2">
              {saveSuccess ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              ) : isDirty ? (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes
                </span>
              ) : (
                <span className="text-navy-400 dark:text-navy-500">
                  All changes saved
                </span>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all ${
                isDirty
                  ? 'bg-brand-600 hover:bg-brand-500 active:bg-brand-700'
                  : 'bg-navy-600 hover:bg-navy-500'
              }`}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Plan'}
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700 shadow-sm"
              >
                <Download className="h-4 w-4 text-brand-600" />
                Export
                <ChevronDown className="h-3 w-3" />
              </button>

              <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-lg border border-navy-200 bg-white py-1 shadow-lg group-hover:block dark:border-navy-700 dark:bg-navy-800 z-50">
                <a
                  href={api.getExportDocxUrl(currentPlan.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  Microsoft Word (.docx)
                </a>
                <a
                  href={api.getExportPdfUrl(currentPlan.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                >
                  <Download className="h-4 w-4 text-red-600" />
                  PDF Document (.pdf)
                </a>
                <a
                  href={api.getExportPrintUrl(currentPlan.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                >
                  <Printer className="h-4 w-4 text-teal-600" />
                  Print / Save as PDF
                </a>
                <a
                  href={api.getExportCsvUrl(currentPlan.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-700"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  CSV Schedule Tracker
                </a>
              </div>
            </div>

            {/* Share Summary Button */}
            <button
              onClick={handleShareSummary}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 shadow-sm"
              title="Copy markdown unit summary to clipboard"
            >
              <Share2 className="h-4 w-4 text-brand-600" />
              {copySuccess ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-3 flex overflow-x-auto space-x-1 border-t border-navy-100 pt-2 dark:border-navy-800">
          {[
            { id: 'overview' as const, label: 'Overview & Goals', icon: BookOpen },
            { id: 'weekly' as const, label: `Weekly Scope (${currentPlan.durationWeeks}w)`, icon: Calendar },
            { id: 'daily' as const, label: `Daily Lessons (${totalSessionsCount})`, icon: Clock },
            { id: 'standards' as const, label: 'Standards Alignment', icon: Award },
            { id: 'assessments' as const, label: 'Assessments & Rubric', icon: GraduationCap },
            { id: 'resources' as const, label: 'Materials & Resources', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-brand-300 border border-brand-200 dark:border-navy-700'
                    : 'text-navy-600 hover:text-navy-900 dark:text-navy-400 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800/60'
                }`}
              >
                <Icon className="h-4 w-4" />
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
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-4">
            <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center justify-between">
              <span>Unit Overview & Enduring Understandings</span>
              <span className="text-xs font-normal text-navy-400">Backward-Design Stage 1</span>
            </h2>
            <textarea
              rows={4}
              value={currentPlan.unitOverview}
              onChange={(e) => handleUpdate({ ...currentPlan, unitOverview: e.target.value })}
              className="w-full rounded-lg border border-navy-200 bg-white p-3 text-sm text-navy-800 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Unit Objectives */}
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900 dark:text-white">
                Unit-Level Learning Outcomes
              </h2>
              <button
                onClick={() => {
                  handleUpdate({
                    ...currentPlan,
                    unitObjectives: [...currentPlan.unitObjectives, 'New measurable unit objective...'],
                  });
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Objective
              </button>
            </div>

            <div className="space-y-2">
              {currentPlan.unitObjectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-brand-100 text-brand-700 dark:bg-navy-800 dark:text-brand-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => {
                      const updated = [...currentPlan.unitObjectives];
                      updated[idx] = e.target.value;
                      handleUpdate({ ...currentPlan, unitObjectives: updated });
                    }}
                    className="flex-1 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const filtered = currentPlan.unitObjectives.filter((_, i) => i !== idx);
                      handleUpdate({ ...currentPlan, unitObjectives: filtered });
                    }}
                    className="p-1 text-navy-400 hover:text-red-500"
                    title="Remove objective"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Thematic Progression Matrix */}
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-4">
            <h2 className="text-base font-bold text-navy-900 dark:text-white">
              Instructional Thematic Progression Roadmap
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {currentPlan.weeklyPlans.map((week) => (
                <div
                  key={week.id}
                  className="rounded-lg border border-navy-100 bg-navy-50/50 p-4 dark:border-navy-800 dark:bg-navy-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800 dark:bg-brand-900/60 dark:text-brand-300">
                      Week {week.weekNumber}
                    </span>
                    <span className="text-xs text-navy-500">{week.sessions.length} sessions</span>
                  </div>
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white line-clamp-1">
                    {week.theme}
                  </h4>
                  <p className="text-[11px] text-navy-600 dark:text-navy-300 line-clamp-3">
                    {week.learningGoals.join('; ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. WEEKLY SCOPE TAB */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white">
                Weekly Scope & Thematic Milestones
              </h2>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                Logical sequencing from foundational concepts to culminating synthesis
              </p>
            </div>
            <button
              onClick={handleAddWeek}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Extend Plan (+1 Week)
            </button>
          </div>

          <div className="space-y-6">
            {currentPlan.weeklyPlans.map((week) => (
              <div
                key={week.id}
                className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-navy-100 pb-3 dark:border-navy-800">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
                      Week {week.weekNumber}
                    </span>
                    <input
                      type="text"
                      value={week.title}
                      onChange={(e) => {
                        const updated = currentPlan.weeklyPlans.map((w) =>
                          w.weekNumber === week.weekNumber ? { ...w, title: e.target.value } : w
                        );
                        handleUpdate({ ...currentPlan, weeklyPlans: updated });
                      }}
                      className="font-bold text-sm text-navy-900 dark:text-white bg-transparent border-b border-transparent hover:border-navy-300 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerateWeek(week.weekNumber)}
                      disabled={aiLoadingWeekNum === week.weekNumber}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:border-navy-700 dark:bg-navy-800 dark:text-brand-300"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {aiLoadingWeekNum === week.weekNumber ? 'Regenerating...' : 'Regenerate Week'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWeekNum(week.weekNumber);
                        if (week.sessions[0]) setSelectedSessionNum(week.sessions[0].sessionNumber);
                        setActiveTab('daily');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-navy-100 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-200 dark:bg-navy-800 dark:text-navy-300"
                    >
                      View {week.sessions.length} Lessons &rarr;
                    </button>
                    <button
                      onClick={() => handleDeleteWeek(week.weekNumber)}
                      className="p-1.5 text-navy-400 hover:text-red-500 rounded"
                      title="Delete this week"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Week theme and vocabulary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">Central Theme</label>
                    <input
                      type="text"
                      value={week.theme}
                      onChange={(e) => {
                        const updated = currentPlan.weeklyPlans.map((w) =>
                          w.weekNumber === week.weekNumber ? { ...w, theme: e.target.value } : w
                        );
                        handleUpdate({ ...currentPlan, weeklyPlans: updated });
                      }}
                      className="w-full rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">Key Vocabulary / Concepts</label>
                    <input
                      type="text"
                      value={week.vocabulary.join(', ')}
                      onChange={(e) => {
                        const updated = currentPlan.weeklyPlans.map((w) =>
                          w.weekNumber === week.weekNumber ? { ...w, vocabulary: e.target.value.split(',').map((v) => v.trim()) } : w
                        );
                        handleUpdate({ ...currentPlan, weeklyPlans: updated });
                      }}
                      className="w-full rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Weekly Assessment Checkpoint */}
                <div className="rounded-lg bg-navy-50 p-3.5 dark:bg-navy-800/50 space-y-1">
                  <span className="text-xs font-bold text-navy-900 dark:text-white">
                    Weekly Assessment Checkpoint: {week.weeklyAssessment.type}
                  </span>
                  <p className="text-xs text-navy-600 dark:text-navy-300">{week.weeklyAssessment.description}</p>
                </div>

                {/* Reflection Prompt */}
                <div className="text-xs text-navy-500 italic">
                  <strong>Teacher Reflection Prompt:</strong> {week.reflectionPrompt}
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
            <span className="text-xs font-bold text-navy-700 dark:text-navy-300 whitespace-nowrap">Week:</span>
            {currentPlan.weeklyPlans.map((w) => (
              <button
                key={w.weekNumber}
                onClick={() => {
                  setSelectedWeekNum(w.weekNumber);
                  if (w.sessions[0]) setSelectedSessionNum(w.sessions[0].sessionNumber);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedWeekNum === w.weekNumber
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50 dark:bg-navy-800 dark:border-navy-700 dark:text-navy-300'
                }`}
              >
                Week {w.weekNumber} ({w.sessions.length} sess)
              </button>
            ))}
          </div>

          {/* Session Cards for Current Selected Week */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                Week {currentWeek.weekNumber} Teaching Sessions &bull; {currentWeek.theme}
              </h3>
              <button
                onClick={() => handleAddSession(selectedWeekNum)}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:bg-navy-800 dark:text-brand-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Session to Week {selectedWeekNum}
              </button>
            </div>

            {currentWeek.sessions.map((session, sIdx) => {
              const isAiLoading = aiLoadingSessionNum === session.sessionNumber;

              return (
                <div
                  key={session.id}
                  className={`rounded-xl border transition-all ${
                    selectedSessionNum === session.sessionNumber
                      ? 'border-brand-500 bg-white shadow-card dark:border-brand-600 dark:bg-navy-900'
                      : 'border-navy-200/90 bg-white shadow-subtle dark:border-navy-800 dark:bg-navy-900'
                  } p-6 space-y-5`}
                >
                  {/* Session Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-navy-100 pb-3 dark:border-navy-800">
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800 dark:bg-brand-900/60 dark:text-brand-300">
                        Session {session.sessionNumber}
                      </span>
                      <span className="text-xs font-semibold text-navy-500">Day {session.dayNumber}</span>
                      <input
                        type="text"
                        value={session.title}
                        onChange={(e) =>
                          handleUpdateSession(selectedWeekNum, session.sessionNumber, (s) => ({
                            ...s,
                            title: e.target.value,
                          }))
                        }
                        className="font-bold text-sm text-navy-900 dark:text-white bg-transparent border-b border-transparent hover:border-navy-300 focus:outline-none"
                      />
                    </div>

                    {/* AI Modification Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 border-r border-navy-200 pr-2 dark:border-navy-700">
                        <button
                          onClick={() => handleReorderSession(selectedWeekNum, session.sessionNumber, 'up')}
                          disabled={sIdx === 0}
                          title="Move session earlier"
                          className="p-1 rounded text-navy-400 hover:text-navy-700 hover:bg-navy-100 disabled:opacity-30 dark:hover:bg-navy-800"
                        >
                          <MoveUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorderSession(selectedWeekNum, session.sessionNumber, 'down')}
                          disabled={sIdx === currentWeek.sessions.length - 1}
                          title="Move session later"
                          className="p-1 rounded text-navy-400 hover:text-navy-700 hover:bg-navy-100 disabled:opacity-30 dark:hover:bg-navy-800"
                        >
                          <MoveDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* AI Adapt Actions */}
                      <button
                        onClick={() => handleRegenerateSession(selectedWeekNum, session.sessionNumber)}
                        disabled={isAiLoading}
                        className="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
                        title="Regenerate this session with AI"
                      >
                        <Sparkles className="h-3 w-3 text-brand-600" />
                        {isAiLoading ? 'Updating...' : 'Regenerate'}
                      </button>

                      <button
                        onClick={() => handleAdaptSession(selectedWeekNum, session.sessionNumber, 'interactive')}
                        disabled={isAiLoading}
                        className="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
                        title="Increase hands-on inquiry and collaboration"
                      >
                        <Zap className="h-3 w-3 text-amber-500" />
                        More Interactive
                      </button>

                      <button
                        onClick={() => handleAdaptSession(selectedWeekNum, session.sessionNumber, 'simplify')}
                        disabled={isAiLoading}
                        className="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
                        title="Break down steps for younger or struggling students"
                      >
                        Simplify
                      </button>

                      <button
                        onClick={() => handleAdaptSession(selectedWeekNum, session.sessionNumber, 'differentiation')}
                        disabled={isAiLoading}
                        className="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
                        title="Expand tiered support and extension tasks"
                      >
                        +Differentiation
                      </button>

                      <button
                        onClick={() => handleAdaptSession(selectedWeekNum, session.sessionNumber, 'shorten')}
                        disabled={isAiLoading}
                        className="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
                        title="Re-allocate pacing to fit tightly within available time"
                      >
                        Shorten
                      </button>

                      <button
                        onClick={() => handleAdaptSession(selectedWeekNum, session.sessionNumber, 'low_resource')}
                        disabled={isAiLoading}
                        className="inline-flex items-center gap-1 rounded-lg border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
                        title="Adapt lesson to limited equipment and classroom materials"
                      >
                        Low Resource
                      </button>

                      <button
                        onClick={() => handleDeleteSession(selectedWeekNum, session.sessionNumber)}
                        className="p-1 text-navy-400 hover:text-red-500 rounded"
                        title="Delete this session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Topic & Duration Info */}
                  <div className="flex items-center gap-4 text-xs text-navy-600 dark:text-navy-300">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-navy-400" />
                      Duration: <strong>{session.durationMinutes} min</strong>
                    </span>
                    <span>&bull;</span>
                    <span>Topic: <strong>{session.topic}</strong></span>
                  </div>

                  {/* Measurable Bloom's Objectives */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                        Measurable Learning Objectives (Observable Action Verbs)
                      </h4>
                      <button
                        onClick={() => {
                          const newObj: LearningObjective = {
                            id: `obj_${Date.now()}`,
                            description: 'Analyze key variables and describe their relationship.',
                            bloomLevel: 'Analyzing',
                            successCriterion: 'I can complete the analysis with 80% accuracy.',
                          };
                          handleUpdateSession(selectedWeekNum, session.sessionNumber, (s) => ({
                            ...s,
                            objectives: [...s.objectives, newObj],
                          }));
                        }}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        + Add Objective
                      </button>
                    </div>

                    <div className="space-y-2">
                      {session.objectives.map((obj, oIdx) => (
                        <div
                          key={obj.id}
                          className="flex items-start gap-2 rounded-lg border border-navy-100 bg-navy-50/40 p-2.5 dark:border-navy-800 dark:bg-navy-800/40 text-xs"
                        >
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 flex-shrink-0">
                            {obj.bloomLevel}
                          </span>
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={obj.description}
                              onChange={(e) => {
                                const updatedObjs = [...session.objectives];
                                updatedObjs[oIdx] = { ...obj, description: e.target.value };
                                handleUpdateSession(selectedWeekNum, session.sessionNumber, (s) => ({
                                  ...s,
                                  objectives: updatedObjs,
                                }));
                              }}
                              className="w-full bg-transparent font-medium text-navy-900 dark:text-white border-b border-transparent hover:border-navy-300 focus:outline-none"
                            />
                            <div className="text-[11px] text-navy-500">
                              <em>Success Criterion:</em> {obj.successCriterion}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Standards Alignment Honest Badges */}
                  {session.standards.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                        Standards Alignment
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {session.standards.map((std) => (
                          <div
                            key={std.id}
                            className={`rounded-lg border px-2.5 py-1 text-xs flex items-center gap-1.5 ${
                              std.verificationStatus === 'verified'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : std.verificationStatus === 'teacher_provided'
                                ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            <span className="font-bold">{std.code}</span>
                            <span className="text-[10px] opacity-75">
                              ({std.verificationStatus === 'verified'
                                ? 'Verified'
                                : std.verificationStatus === 'teacher_provided'
                                ? 'Teacher Provided'
                                : 'Suggested — Verify before use'})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6-Phase Lesson Sequence Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                      Instructional Sequence ({session.lessonSequence.reduce((sum, p) => sum + p.durationMinutes, 0)}m allocated)
                    </h4>

                    <div className="overflow-x-auto rounded-lg border border-navy-200 dark:border-navy-700">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-300">
                          <tr>
                            <th className="p-2.5">Phase</th>
                            <th className="p-2.5 w-16">Time</th>
                            <th className="p-2.5">Activity Description</th>
                            <th className="p-2.5">Teacher & Student Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
                          {session.lessonSequence.map((act, aIdx) => (
                            <tr key={aIdx} className="hover:bg-navy-50/50 dark:hover:bg-navy-800/40">
                              <td className="p-2.5 font-bold text-brand-700 dark:text-brand-400 whitespace-nowrap">
                                {act.title}
                              </td>
                              <td className="p-2.5 whitespace-nowrap font-medium text-navy-700 dark:text-navy-300">
                                <input
                                  type="number"
                                  min={1}
                                  value={act.durationMinutes}
                                  onChange={(e) => {
                                    const updated = [...session.lessonSequence];
                                    updated[aIdx] = { ...act, durationMinutes: parseInt(e.target.value) || 5 };
                                    handleUpdateSession(selectedWeekNum, session.sessionNumber, (s) => ({
                                      ...s,
                                      lessonSequence: updated,
                                    }));
                                  }}
                                  className="w-12 rounded border border-navy-200 px-1 py-0.5 text-center dark:bg-navy-800"
                                /> m
                              </td>
                              <td className="p-2.5 text-navy-800 dark:text-navy-200">
                                <textarea
                                  rows={2}
                                  value={act.description}
                                  onChange={(e) => {
                                    const updated = [...session.lessonSequence];
                                    updated[aIdx] = { ...act, description: e.target.value };
                                    handleUpdateSession(selectedWeekNum, session.sessionNumber, (s) => ({
                                      ...s,
                                      lessonSequence: updated,
                                    }));
                                  }}
                                  className="w-full rounded border border-transparent bg-transparent hover:border-navy-200 focus:border-brand-500 focus:outline-none"
                                />
                                <div className="text-[11px] text-navy-400 mt-1">
                                  Materials: {act.materials.join(', ') || 'Standard classroom'}
                                </div>
                              </td>
                              <td className="p-2.5 text-[11px] text-navy-600 dark:text-navy-400 space-y-1">
                                <div><strong>Teacher:</strong> {act.teacherAction}</div>
                                <div><strong>Student:</strong> {act.studentAction}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Formative Assessment Box */}
                  <div className="rounded-lg bg-emerald-50/50 border border-emerald-200 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Formative Assessment: {session.formativeAssessment.type}
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Measures: {session.formativeAssessment.measures}
                      </span>
                    </div>
                    <p className="text-emerald-800 dark:text-emerald-200">
                      <strong>Check Prompt:</strong> "{session.formativeAssessment.promptOrQuestion}"
                    </p>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-wrap gap-4">
                      <span><strong>Evidence:</strong> {session.formativeAssessment.evidenceOfLearning}</span>
                      <span><strong>Next Step:</strong> {session.formativeAssessment.nextInstructionalStep}</span>
                    </div>
                  </div>

                  {/* Tiered Differentiation Grid */}
                  <div className="rounded-lg bg-navy-50/60 border border-navy-200 p-4 dark:bg-navy-800/40 dark:border-navy-700 space-y-2 text-xs">
                    <h5 className="font-bold text-navy-900 dark:text-white">Tiered Differentiation Strategies</h5>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-[11px]">
                      <div className="bg-white p-2.5 rounded border border-navy-100 dark:bg-navy-900 dark:border-navy-800">
                        <strong className="text-amber-700 dark:text-amber-400 block mb-1">Tier 1 Support Scaffolds:</strong>
                        <p className="text-navy-600 dark:text-navy-400">{session.differentiation.support}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-navy-100 dark:bg-navy-900 dark:border-navy-800">
                        <strong className="text-indigo-700 dark:text-indigo-400 block mb-1">Advanced / Gifted Extension:</strong>
                        <p className="text-navy-600 dark:text-navy-400">{session.differentiation.advanced}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-navy-100 dark:bg-navy-900 dark:border-navy-800">
                        <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">ELL & Multimodal Access:</strong>
                        <p className="text-navy-600 dark:text-navy-400">{session.differentiation.ell}</p>
                      </div>
                    </div>
                  </div>

                  {/* Homework & Materials footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-navy-500 pt-2 border-t border-navy-100 dark:border-navy-800">
                    <div>
                      {session.homework.enabled ? (
                        <span>
                          <strong>Homework:</strong> {session.homework.task} (~{session.homework.estimatedMinutes} min)
                        </span>
                      ) : (
                        <span>No homework assigned.</span>
                      )}
                    </div>
                    <div>
                      <strong>Materials:</strong> {session.materials.join(', ') || 'Standard classroom'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. STANDARDS ALIGNMENT TAB */}
      {activeTab === 'standards' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-4">
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white">
                Standards Alignment & Competency Matrix
              </h2>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                Ethical standards tracking: unverified standards are labeled honestly without false claims of compliance
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-navy-200 dark:border-navy-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-300">
                  <tr>
                    <th className="p-3 w-32">Standard Code</th>
                    <th className="p-3 w-40">Framework</th>
                    <th className="p-3">Description & Competency</th>
                    <th className="p-3 w-32">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
                  {currentPlan.weeklyPlans.flatMap((w) =>
                    w.sessions.flatMap((s) => s.standards)
                  ).filter((std, idx, arr) => arr.findIndex((x) => x.code === std.code) === idx).map((std) => (
                    <tr key={std.id} className="hover:bg-navy-50/50 dark:hover:bg-navy-800/40">
                      <td className="p-3 font-bold text-brand-700 dark:text-brand-300">
                        {std.code}
                      </td>
                      <td className="p-3 text-navy-600 dark:text-navy-300">
                        {std.framework}
                      </td>
                      <td className="p-3 text-navy-800 dark:text-navy-200">
                        {std.description}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          std.verificationStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : std.verificationStatus === 'teacher_provided'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {std.verificationStatus === 'verified'
                            ? 'Verified'
                            : std.verificationStatus === 'teacher_provided'
                            ? 'Teacher Provided'
                            : 'Suggested Alignment'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
              <strong>Curriculum Disclaimer:</strong> Suggested standards alignments are generated algorithmically to assist your planning. In accordance with professional standards, please verify alignments against your local school district curriculum guide before formal submission.
            </div>
          </div>
        </div>
      )}

      {/* 5. ASSESSMENTS & RUBRIC TAB */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-4">
            <h2 className="text-base font-bold text-navy-900 dark:text-white">
              Culminating Summative Assessment & 4-Tier Rubric
            </h2>
            <div className="space-y-2">
              <input
                type="text"
                value={currentPlan.finalAssessment.title}
                onChange={(e) =>
                  handleUpdate({
                    ...currentPlan,
                    finalAssessment: { ...currentPlan.finalAssessment, title: e.target.value },
                  })
                }
                className="w-full text-base font-bold text-navy-900 dark:text-white bg-transparent border-b border-transparent hover:border-navy-300 focus:outline-none"
              />
              <textarea
                rows={3}
                value={currentPlan.finalAssessment.description}
                onChange={(e) =>
                  handleUpdate({
                    ...currentPlan,
                    finalAssessment: { ...currentPlan.finalAssessment, description: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-navy-200 p-2.5 text-xs text-navy-800 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
              />
            </div>

            {/* Rubric Table */}
            <div className="overflow-x-auto rounded-lg border border-navy-200 dark:border-navy-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-300">
                  <tr>
                    <th className="p-3 w-48">Criterion & Weight</th>
                    <th className="p-3">Exemplary (4)</th>
                    <th className="p-3">Proficient (3)</th>
                    <th className="p-3">Developing (2)</th>
                    <th className="p-3">Beginning (1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
                  {currentPlan.finalAssessment.rubric.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-navy-50/50 dark:hover:bg-navy-800/40">
                      <td className="p-3 font-bold text-navy-900 dark:text-white">
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
                          className="w-full bg-transparent font-bold border-b border-transparent hover:border-navy-200 focus:outline-none"
                        />
                        <span className="text-[11px] text-brand-600 block mt-1">({r.weightPercentage}%)</span>
                      </td>
                      <td className="p-3 text-[11px] text-navy-800 dark:text-navy-200">{r.exemplary}</td>
                      <td className="p-3 text-[11px] text-navy-800 dark:text-navy-200">{r.proficient}</td>
                      <td className="p-3 text-[11px] text-navy-800 dark:text-navy-200">{r.developing}</td>
                      <td className="p-3 text-[11px] text-navy-800 dark:text-navy-200">{r.beginning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900 dark:text-white">
                Categorized Materials & Educational Resources
              </h2>
              <button
                onClick={() => {
                  handleUpdate({
                    ...currentPlan,
                    resourceList: [
                      ...currentPlan.resourceList,
                      {
                        category: 'Digital',
                        title: 'New Resource Item',
                        description: 'Description of pedagogical resource',
                        sourceOrUrl: 'Recommended classroom link',
                      },
                    ],
                  });
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Resource
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {currentPlan.resourceList.map((res, rIdx) => (
                <div
                  key={rIdx}
                  className="rounded-lg border border-navy-100 bg-navy-50/50 p-4 dark:border-navy-800 dark:bg-navy-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-navy-800 dark:text-brand-300">
                      {res.category}
                    </span>
                    <button
                      onClick={() => {
                        const filtered = currentPlan.resourceList.filter((_, i) => i !== rIdx);
                        handleUpdate({ ...currentPlan, resourceList: filtered });
                      }}
                      className="p-1 text-navy-400 hover:text-red-500"
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
                    className="w-full font-bold text-navy-900 dark:text-white bg-transparent border-b border-transparent hover:border-navy-300 focus:outline-none"
                  />
                  <p className="text-navy-600 dark:text-navy-300 text-[11px]">{res.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
