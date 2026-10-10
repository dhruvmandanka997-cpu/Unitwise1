import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Calendar, 
  Clock, 
  Sliders, 
  Layers, 
  BookOpen, 
  GraduationCap, 
  Award,
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { GeneratePlanInput, GeneratePlanInputSchema } from '../../types/plan';
import { 
  SUBJECT_OPTIONS, 
  GRADE_OPTIONS, 
  CURRICULUM_OPTIONS, 
  TEACHING_METHOD_OPTIONS,
  QUICK_START_TEMPLATES 
} from '../../data/templates';

interface PlanWizardProps {
  initialTemplateId?: string;
  onCancel: () => void;
  onGenerate: (data: GeneratePlanInput) => Promise<void>;
  isGenerating: boolean;
  generationError: string | null;
  onClearError: () => void;
}

export const PlanWizard: React.FC<PlanWizardProps> = ({
  initialTemplateId,
  onCancel,
  onGenerate,
  isGenerating,
  generationError,
  onClearError,
}) => {
  const [formData, setFormData] = useState<GeneratePlanInput>({
    title: '',
    subject: 'Mathematics',
    gradeLevel: 'Grade 9 (High School / Freshman)',
    curriculumFramework: 'US Common Core & Next Generation Science Standards (NGSS)',
    standardsFramework: '',
    durationWeeks: 4,
    sessionsPerWeek: 5,
    classDurationMinutes: 50,
    format: 'session_sequence',
    priorKnowledge: 'Coordinate plane, integers, and basic linear equation solving.',
    overallGoals: 'Master linear functions, slope as constant rate of change, and formulation of real-world predictive models.',
    studentNeeds: 'Mixed-ability classroom with visual learners and tiered scaffolding needs.',
    availableResources: 'Projector, student whiteboards, graph paper, graphing calculator tools.',
    preferredTeachingMethods: [
      'Explicit Instruction & Teacher Modeling (I Do, We Do, You Do)',
      'Guided Problem Solving & Scaffolding'
    ],
    assessmentPreferences: 'Daily formative exit tickets and culminating performance project with rubric.',
    classSize: 26,
    teacherNotes: '',
    textbookChapters: '',
    holidaysOrBlackoutDates: '',
    languageOfInstruction: 'English',
    proficiencyRange: 'Standard grade-level distribution',
    accommodations: 'Visual word wall, graphic organizers, and extended time where appropriate',
    requiredProjects: '',
    enableHomework: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);

  // Load initial template if specified
  useEffect(() => {
    if (initialTemplateId) {
      const template = QUICK_START_TEMPLATES.find((t) => t.id === initialTemplateId);
      if (template) {
        setFormData((prev) => ({
          ...prev,
          title: template.title,
          subject: template.subject,
          gradeLevel: template.gradeLevel,
          durationWeeks: template.durationWeeks,
          sessionsPerWeek: template.sessionsPerWeek,
          classDurationMinutes: template.classDurationMinutes,
          curriculumFramework: template.curriculumFramework,
          standardsFramework: template.standardsFramework,
          overallGoals: template.overallGoals,
          priorKnowledge: template.priorKnowledge,
          preferredTeachingMethods: template.preferredTeachingMethods,
        }));
      }
    }
  }, [initialTemplateId]);

  // Generation stages animation effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating) {
      setGenerationStage(1);
      timer = setInterval(() => {
        setGenerationStage((prev) => (prev < 5 ? prev + 1 : prev));
      }, 1500);
    } else {
      setGenerationStage(0);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  const stages = [
    { title: 'Deconstructing Unit Goals', desc: 'Analyzing backward design principles & prerequisite concepts' },
    { title: 'Structuring Weekly Thematic Progression', desc: 'Scaffolding conceptual progression across weeks' },
    { title: 'Formulating Bloom’s Objectives & Verification', desc: 'Crafting measurable action verbs and honest standards mapping' },
    { title: 'Synthesizing 6-Phase Lesson Sequences', desc: 'Balancing opening, modeling, guided practice, assessments, and timing' },
    { title: 'Final Schedule Validation', desc: 'Verifying session counts and duration constraints' },
  ];

  const handleMethodToggle = (method: string) => {
    setFormData((prev) => {
      const exists = prev.preferredTeachingMethods.includes(method);
      const updated = exists
        ? prev.preferredTeachingMethods.filter((m) => m !== method)
        : [...prev.preferredTeachingMethods, method];
      return { ...prev, preferredTeachingMethods: updated };
    });
  };

  const handleApplyTemplate = (tmplId: string) => {
    const template = QUICK_START_TEMPLATES.find((t) => t.id === tmplId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        title: template.title,
        subject: template.subject,
        gradeLevel: template.gradeLevel,
        durationWeeks: template.durationWeeks,
        sessionsPerWeek: template.sessionsPerWeek,
        classDurationMinutes: template.classDurationMinutes,
        curriculumFramework: template.curriculumFramework,
        standardsFramework: template.standardsFramework,
        overallGoals: template.overallGoals,
        priorKnowledge: template.priorKnowledge,
        preferredTeachingMethods: template.preferredTeachingMethods,
      }));
      setFormErrors({});
      onClearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();

    const parsed = GeneratePlanInputSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        errors[path] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    await onGenerate(parsed.data);
  };

  const totalSessionsCalculated = formData.durationWeeks * formData.sessionsPerWeek;
  const totalMinutesCalculated = totalSessionsCalculated * formData.classDurationMinutes;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back and Title Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          disabled={isGenerating}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-900 dark:text-navy-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Quick template loader */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-navy-500 dark:text-navy-400">Load sample:</span>
          <select
            onChange={(e) => e.target.value && handleApplyTemplate(e.target.value)}
            defaultValue=""
            className="rounded-lg border border-navy-200 bg-white px-2.5 py-1 text-xs text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200"
          >
            <option value="" disabled>Choose template...</option>
            {QUICK_START_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.gradeLevel})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-b border-navy-200 pb-5 dark:border-navy-800">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-navy-800 dark:text-brand-300 mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Backward-Design AI Curriculum Wizard
        </div>
        <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white">
          Generate Multi-Week Instructional Plan
        </h1>
        <p className="mt-1 text-sm text-navy-600 dark:text-navy-300">
          Provide your unit goals, schedule constraints, and pedagogical preferences. LessonCraft AI will structure a coherent week-by-week and session-by-session teaching guide.
        </p>
      </div>

      {/* Error Banner */}
      {generationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Plan Generation Could Not Complete</h4>
            <p className="text-xs">{generationError}</p>
            <p className="text-xs text-red-700 dark:text-red-400">
              Your inputs have been preserved. You can review and adjust any field below and retry.
            </p>
          </div>
        </div>
      )}

      {/* Generation Loading Overlay */}
      {isGenerating && (
        <div className="rounded-2xl border border-brand-200 bg-gradient-to-b from-brand-50/50 to-white p-8 dark:border-brand-900/50 dark:from-navy-900 dark:to-navy-950 shadow-card space-y-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg animate-pulse-subtle">
            <Sparkles className="h-8 w-8 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Synthesizing Multi-Week Instructional Plan
            </h2>
            <p className="text-sm text-navy-600 dark:text-navy-400 mt-1">
              Building {formData.durationWeeks} weeks and {totalSessionsCalculated} daily lessons with Bloom’s taxonomy objectives & differentiation...
            </p>
          </div>

          {/* Progress Stages */}
          <div className="max-w-md mx-auto space-y-3 text-left">
            {stages.map((st, idx) => {
              const stageNum = idx + 1;
              const isDone = generationStage > stageNum;
              const isCurrent = generationStage === stageNum;

              return (
                <div
                  key={st.title}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                    isCurrent
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-navy-800 text-brand-900 dark:text-brand-200'
                      : isDone
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
                      : 'border-navy-100 bg-white dark:border-navy-800 dark:bg-navy-900 text-navy-400 opacity-60'
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : isCurrent ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-navy-300 dark:border-navy-700 flex items-center justify-center text-[10px]">
                        {stageNum}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{st.title}</p>
                    <p className="text-[11px] opacity-80">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Wizard Form */}
      {!isGenerating && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Unit & Subject Core Details */}
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-5">
            <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                1
              </span>
              Unit Topic & Curriculum Framework
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Plan Title or Unit Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Linear Functions, Rates of Change & Real-World Modeling"
                  className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-1 dark:bg-navy-800 dark:text-white ${
                    formErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-navy-200 focus:border-brand-500 focus:ring-brand-500 dark:border-navy-700'
                  }`}
                />
                {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Grade Level / Learner Age <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                >
                  {GRADE_OPTIONS.map((grd) => (
                    <option key={grd} value={grd}>{grd}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Educational System / Curriculum <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.curriculumFramework}
                  onChange={(e) => setFormData({ ...formData, curriculumFramework: e.target.value })}
                  className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                >
                  {CURRICULUM_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Curriculum Standards Framework (Optional)
                </label>
                <input
                  type="text"
                  value={formData.standardsFramework}
                  onChange={(e) => setFormData({ ...formData, standardsFramework: e.target.value })}
                  placeholder="e.g. CCSS.MATH.CONTENT.HSA.CED.A.2 or NGSS 5-LS2-1"
                  className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 placeholder-navy-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />
                <p className="text-[11px] text-navy-500 dark:text-navy-400">
                  If left blank, LessonCraft AI generates measurable competencies labeled as suggested alignment.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: Schedule & Timeline Rigor */}
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-5">
            <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                2
              </span>
              Instructional Schedule & Timeline Constraints
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Total Duration (Weeks) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.durationWeeks}
                  onChange={(e) => setFormData({ ...formData, durationWeeks: Math.max(1, Math.min(12, parseInt(e.target.value) || 1)) })}
                  className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />
                <span className="text-[11px] text-navy-500 dark:text-navy-400">1 to 12 weeks</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Teaching Days Per Week <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={formData.sessionsPerWeek}
                  onChange={(e) => setFormData({ ...formData, sessionsPerWeek: Math.max(1, Math.min(7, parseInt(e.target.value) || 1)) })}
                  className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />
                <span className="text-[11px] text-navy-500 dark:text-navy-400">e.g. 5 days/wk</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Class Duration (Minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={15}
                  max={180}
                  step={5}
                  value={formData.classDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, classDurationMinutes: Math.max(15, Math.min(180, parseInt(e.target.value) || 15)) })}
                  className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                />
                <span className="text-[11px] text-navy-500 dark:text-navy-400">e.g. 45, 50, 60, 90 min</span>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Schedule Organization Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, format: 'session_sequence' })}
                    className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                      formData.format === 'session_sequence'
                        ? 'border-brand-500 bg-brand-50/60 text-brand-900 dark:bg-navy-800 dark:text-brand-300'
                        : 'border-navy-200 bg-white text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300'
                    }`}
                  >
                    <div className="font-bold">Sequence of Teaching Sessions (Recommended)</div>
                    <div className="text-[11px] font-normal text-navy-500 dark:text-navy-400 mt-0.5">
                      Sessions 1 through {totalSessionsCalculated} (flexible for rotating blocks/snow days)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, format: 'calendar' })}
                    className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                      formData.format === 'calendar'
                        ? 'border-brand-500 bg-brand-50/60 text-brand-900 dark:bg-navy-800 dark:text-brand-300'
                        : 'border-navy-200 bg-white text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300'
                    }`}
                  >
                    <div className="font-bold">Weekly Calendar Schedule</div>
                    <div className="text-[11px] font-normal text-navy-500 dark:text-navy-400 mt-0.5">
                      Days structured Monday through Friday per instructional week
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Schedule Calculation Preview */}
            <div className="rounded-lg bg-navy-50 p-3.5 dark:bg-navy-800/60 border border-navy-200/60 dark:border-navy-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span className="font-semibold text-navy-900 dark:text-white">
                  Schedule Verification:
                </span>
                <span className="text-navy-600 dark:text-navy-300">
                  {formData.durationWeeks} Weeks &times; {formData.sessionsPerWeek} Days = <strong>{totalSessionsCalculated} Planned Sessions</strong>
                </span>
              </div>
              <span className="font-semibold text-brand-700 dark:text-brand-300">
                {totalMinutesCalculated.toLocaleString()} Instructional Minutes Total
              </span>
            </div>
          </div>

          {/* SECTION 3: Pedagogical Goals & Strategy */}
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-5">
            <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                3
              </span>
              Pedagogical Goals & Instructional Strategy
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Overall Unit Learning Goals <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.overallGoals}
                  onChange={(e) => setFormData({ ...formData, overallGoals: e.target.value })}
                  placeholder="Describe enduring understandings, key problem types, and what students will accomplish by unit end..."
                  className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-navy-900 placeholder-navy-400 focus:outline-none dark:bg-navy-800 dark:text-white ${
                    formErrors.overallGoals ? 'border-red-500' : 'border-navy-200 focus:border-brand-500 dark:border-navy-700'
                  }`}
                />
                {formErrors.overallGoals && <p className="text-xs text-red-500">{formErrors.overallGoals}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                    Prior Knowledge & Prerequisite Skills
                  </label>
                  <textarea
                    rows={2}
                    value={formData.priorKnowledge}
                    onChange={(e) => setFormData({ ...formData, priorKnowledge: e.target.value })}
                    placeholder="What concepts have students already mastered?"
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 placeholder-navy-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                    Student Learning Needs & Variances
                  </label>
                  <textarea
                    rows={2}
                    value={formData.studentNeeds}
                    onChange={(e) => setFormData({ ...formData, studentNeeds: e.target.value })}
                    placeholder="Mixed-ability, ELL, visual learners, IEP considerations..."
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 placeholder-navy-400 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Teaching Methods Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                  Preferred Instructional Methods <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TEACHING_METHOD_OPTIONS.map((method) => {
                    const isSelected = formData.preferredTeachingMethods.includes(method);
                    return (
                      <button
                        type="button"
                        key={method}
                        onClick={() => handleMethodToggle(method)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-colors ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/60 font-semibold text-brand-900 dark:bg-navy-800 dark:text-brand-300'
                            : 'border-navy-200 bg-white text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-navy-300 bg-white'
                        }`}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span>{method}</span>
                      </button>
                    );
                  })}
                </div>
                {formErrors.preferredTeachingMethods && (
                  <p className="text-xs text-red-500">{formErrors.preferredTeachingMethods}</p>
                )}
              </div>

              {/* Assessment Preferences & Homework */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                    Assessment Preferences
                  </label>
                  <input
                    type="text"
                    value={formData.assessmentPreferences}
                    onChange={(e) => setFormData({ ...formData, assessmentPreferences: e.target.value })}
                    placeholder="e.g. Daily exit tickets, weekly checkpoint, final rubric project"
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 focus:border-brand-500 focus:outline-none dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                    Homework & Extension Tasks
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableHomework}
                        onChange={(e) => setFormData({ ...formData, enableHomework: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-navy-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                    <span className="text-xs text-navy-700 dark:text-navy-300">
                      {formData.enableHomework ? 'Generate daily homework practice tasks' : 'Disable homework generation'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Inclusivity & Advanced Customizations (Collapsible) */}
          <div className="rounded-xl border border-navy-200/90 bg-white p-6 shadow-subtle dark:border-navy-800 dark:bg-navy-900 space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between text-left text-base font-bold text-navy-900 dark:text-white"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700 dark:bg-navy-800 dark:text-navy-300">
                  4
                </span>
                Advanced Customizations & Accommodations
                <span className="text-xs font-normal text-navy-500 dark:text-navy-400">
                  (Optional)
                </span>
              </span>
              {showAdvanced ? <ChevronUp className="h-5 w-5 text-navy-400" /> : <ChevronDown className="h-5 w-5 text-navy-400" />}
            </button>

            {showAdvanced && (
              <div className="pt-3 border-t border-navy-100 dark:border-navy-800 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                    Class Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.classSize}
                    onChange={(e) => setFormData({ ...formData, classSize: parseInt(e.target.value) || 25 })}
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                    Language of Instruction
                  </label>
                  <input
                    type="text"
                    value={formData.languageOfInstruction}
                    onChange={(e) => setFormData({ ...formData, languageOfInstruction: e.target.value })}
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                    Specific Textbook Chapters / Readings
                  </label>
                  <input
                    type="text"
                    value={formData.textbookChapters}
                    onChange={(e) => setFormData({ ...formData, textbookChapters: e.target.value })}
                    placeholder="e.g. Chapter 4 (Sections 4.1 - 4.5)"
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                    Available Technology & Resources
                  </label>
                  <input
                    type="text"
                    value={formData.availableResources}
                    onChange={(e) => setFormData({ ...formData, availableResources: e.target.value })}
                    placeholder="e.g. 1:1 Chromebooks, science lab balance scales"
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-navy-700 dark:text-navy-300">
                    Teacher Notes & Particular Constraints
                  </label>
                  <textarea
                    rows={2}
                    value={formData.teacherNotes}
                    onChange={(e) => setFormData({ ...formData, teacherNotes: e.target.value })}
                    placeholder="Any specific school events, assembly days, or pedagogy tips..."
                    className="w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm text-navy-900 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-navy-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300 dark:hover:bg-navy-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-brand-500 active:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Generate My Plan ({formData.durationWeeks}w &bull; {totalSessionsCalculated} Sessions)
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
