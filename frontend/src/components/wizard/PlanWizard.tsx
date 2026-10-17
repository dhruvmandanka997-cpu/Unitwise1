import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  ChevronUp, 
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
import { BRAND } from '../../config/brand';

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
  const [currentStep, setCurrentStep] = useState<number>(1);
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
      }, 1400);
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

  const wizardSteps = [
    { number: 1, title: 'Course Info', desc: 'Topic, grade & framework' },
    { number: 2, title: 'Schedule', desc: 'Weeks, days & session time' },
    { number: 3, title: 'Learning Goals', desc: 'Outcomes & prior knowledge' },
    { number: 4, title: 'Preferences', desc: 'Methods, materials & support' },
    { number: 5, title: 'Review & Build', desc: 'Summary & AI generation' },
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

  // Step-by-step validator
  const validateStep = (stepNumber: number): boolean => {
    const errors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.title || formData.title.trim().length < 3) {
        errors.title = 'Please provide a unit title (minimum 3 characters)';
      }
      if (!formData.subject) errors.subject = 'Please choose a subject';
      if (!formData.gradeLevel) errors.gradeLevel = 'Please choose a grade level';
    }

    if (stepNumber === 2) {
      if (!formData.durationWeeks || formData.durationWeeks < 1 || formData.durationWeeks > 12) {
        errors.durationWeeks = 'Duration must be between 1 and 12 weeks';
      }
      if (!formData.sessionsPerWeek || formData.sessionsPerWeek < 1 || formData.sessionsPerWeek > 7) {
        errors.sessionsPerWeek = 'Teaching days must be between 1 and 7 days';
      }
      if (!formData.classDurationMinutes || formData.classDurationMinutes < 15) {
        errors.classDurationMinutes = 'Class duration must be at least 15 minutes';
      }
    }

    if (stepNumber === 3) {
      if (!formData.overallGoals || formData.overallGoals.trim().length < 10) {
        errors.overallGoals = 'Please describe unit learning goals (at least 10 characters)';
      }
    }

    if (stepNumber === 4) {
      if (formData.preferredTeachingMethods.length === 0) {
        errors.preferredTeachingMethods = 'Please select at least one instructional method';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < 5) {
      handleNextStep();
      return;
    }

    if (isGenerating) return;
    onClearError();

    const parsed = GeneratePlanInputSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      let firstErrorStep = 1;
      parsed.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        errors[path] = err.message;
      });

      if (errors.title || errors.subject || errors.gradeLevel || errors.curriculumFramework) {
        firstErrorStep = 1;
      } else if (errors.durationWeeks || errors.sessionsPerWeek || errors.classDurationMinutes || errors.format) {
        firstErrorStep = 2;
      } else if (errors.overallGoals || errors.priorKnowledge) {
        firstErrorStep = 3;
      } else if (errors.preferredTeachingMethods) {
        firstErrorStep = 4;
      }

      setFormErrors(errors);
      setCurrentStep(firstErrorStep);
      return;
    }

    setFormErrors({});
    await onGenerate(parsed.data);
  };

  const totalSessionsCalculated = formData.durationWeeks * formData.sessionsPerWeek;
  const totalMinutesCalculated = totalSessionsCalculated * formData.classDurationMinutes;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <button
            onClick={onCancel}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
            AI Tutor Curriculum Studio
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
            Step-by-step backward design builder backed by validated standards and Bloom’s taxonomy.
          </p>
        </div>

        {/* Quick template dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-[var(--text-muted)] font-medium hidden sm:inline">Template:</span>
          <select
            onChange={(e) => e.target.value && handleApplyTemplate(e.target.value)}
            defaultValue=""
            className="neu-input px-3 py-1.5 text-xs font-medium text-[var(--text)]"
          >
            <option value="" disabled>Pre-load blueprint...</option>
            {QUICK_START_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.gradeLevel})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="neu-card p-2.5 sm:p-3">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {wizardSteps.map((st) => {
            const isCompleted = currentStep > st.number;
            const isCurrent = currentStep === st.number;

            return (
              <button
                key={st.number}
                type="button"
                onClick={() => {
                  if (st.number < currentStep || validateStep(currentStep)) {
                    setCurrentStep(st.number);
                  }
                }}
                className={`flex flex-col sm:flex-row items-center sm:items-start gap-2 p-2 rounded-[16px] text-left transition-all ${
                  isCurrent
                    ? 'neu-nav-active font-semibold text-[var(--primary)]'
                    : isCompleted
                    ? 'text-[var(--text)] hover:bg-[var(--lavender-soft)]/40'
                    : 'text-[var(--text-muted)] hover:bg-[var(--lavender-soft)]/20'
                }`}
                title={`Step ${st.number}: ${st.title} - ${st.desc}`}
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  isCompleted
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : isCurrent
                    ? 'bg-[var(--accent)] text-white shadow-neu-sm'
                    : 'bg-[var(--lavender-soft)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}>
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : st.number}
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className="text-xs font-bold leading-tight truncate" title={st.title}>{st.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate" title={st.desc}>{st.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert Banner */}
      {generationError && (
        <div className="rounded-[16px] border border-red-200 bg-red-50 p-4 text-red-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold">Plan Generation Could Not Complete</h4>
            <p className="text-xs font-normal">{generationError}</p>
            <p className="text-[11px] text-red-700 font-normal">
              Your inputs are preserved. You can adjust fields and click generate again.
            </p>
          </div>
        </div>
      )}

      {/* Generation Loading Modal/State */}
      {isGenerating && (
        <div className="neu-card p-8 sm:p-10 space-y-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--primary)] text-white shadow-neu-raised animate-pulse">
            <Sparkles className="h-8 w-8 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              Synthesizing Multi-Week Curriculum Sequence
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto font-normal">
              Constructing {formData.durationWeeks} weeks and {totalSessionsCalculated} daily lessons with Bloom’s taxonomy objectives, phase timings & differentiation...
            </p>
          </div>

          {/* Progress Stages */}
          <div className="max-w-md mx-auto space-y-2.5 text-left">
            {stages.map((st, idx) => {
              const stageNum = idx + 1;
              const isDone = generationStage > stageNum;
              const isCurrent = generationStage === stageNum;

              return (
                <div
                  key={st.title}
                  className={`flex items-start gap-3 p-3 rounded-[16px] border transition-all ${
                    isCurrent
                      ? 'border-[var(--accent)] bg-[var(--lavender-soft)] text-[var(--text)] font-medium shadow-neu-inset'
                      : isDone
                      ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] shadow-neu-sm'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <Check className="h-4 w-4 text-[var(--primary)]" />
                    ) : isCurrent ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-[var(--accent)]" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-[var(--border)] flex items-center justify-center text-[10px] font-bold">
                        {stageNum}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{st.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-normal">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wizard Step Forms */}
      {!isGenerating && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Course Info */}
          {currentStep === 1 && (
            <div className="neu-card p-6 sm:p-8 space-y-5">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-base font-bold text-[var(--text)]">
                  Step 1: Course Information & Curriculum Context
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
                  Specify the fundamental subject, grade level, and curriculum framework.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Plan Title or Unit Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Linear Functions, Rates of Change & Real-World Modeling"
                    className={`w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)] ${
                      formErrors.title ? '!border-red-500' : ''
                    }`}
                  />
                  {formErrors.title && <p className="text-[11px] text-red-500 font-medium">{formErrors.title}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Grade Level / Learner Age <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                  >
                    {GRADE_OPTIONS.map((grd) => (
                      <option key={grd} value={grd}>{grd}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Curriculum Framework <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.curriculumFramework}
                    onChange={(e) => setFormData({ ...formData, curriculumFramework: e.target.value })}
                    className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                  >
                    {CURRICULUM_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Curriculum Standards Framework (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.standardsFramework}
                    onChange={(e) => setFormData({ ...formData, standardsFramework: e.target.value })}
                    placeholder="e.g. CCSS.MATH.CONTENT.HSA.CED.A.2 or NGSS 5-LS2-1"
                    className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] font-normal">
                    If unspecified, {BRAND.name} generates suggested alignments with explicit verification badges.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Schedule & Timeline */}
          {currentStep === 2 && (
            <div className="neu-card p-6 sm:p-8 space-y-5">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-base font-bold text-[var(--text)]">
                  Step 2: Instructional Schedule & Timeline Rigor
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
                  Configure calendar allocation. Total sessions and minutes are strictly guaranteed.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Total Duration (Weeks) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formData.durationWeeks}
                    onChange={(e) => setFormData({ ...formData, durationWeeks: Math.max(1, Math.min(12, parseInt(e.target.value) || 1)) })}
                    className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">1 to 12 weeks</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Teaching Days Per Week <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={formData.sessionsPerWeek}
                    onChange={(e) => setFormData({ ...formData, sessionsPerWeek: Math.max(1, Math.min(7, parseInt(e.target.value) || 1)) })}
                    className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">e.g. 5 days/week</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Class Duration (Minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    step={5}
                    value={formData.classDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, classDurationMinutes: Math.max(15, Math.min(180, parseInt(e.target.value) || 15)) })}
                    className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">e.g. 45, 50, 60, 90 min</span>
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Schedule Organization Format
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, format: 'session_sequence' })}
                      className={`p-3.5 rounded-[16px] border text-left text-xs transition-all ${
                        formData.format === 'session_sequence'
                          ? 'border-[var(--accent)] bg-[var(--lavender-soft)] text-[var(--text)] shadow-neu-inset font-semibold'
                          : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:bg-[var(--lavender-soft)]/30'
                      }`}
                    >
                      <div className="font-bold text-[var(--text)]">Sequence of Teaching Sessions (Recommended)</div>
                      <div className="text-[11px] font-normal text-[var(--text-muted)] mt-0.5">
                        Linear Sessions 1..{totalSessionsCalculated} (resilient for rotating blocks)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, format: 'calendar' })}
                      className={`p-3.5 rounded-[16px] border text-left text-xs transition-all ${
                        formData.format === 'calendar'
                          ? 'border-[var(--accent)] bg-[var(--lavender-soft)] text-[var(--text)] shadow-neu-inset font-semibold'
                          : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:bg-[var(--lavender-soft)]/30'
                      }`}
                    >
                      <div className="font-bold text-[var(--text)]">Weekly Calendar Schedule</div>
                      <div className="text-[11px] font-normal text-[var(--text-muted)] mt-0.5">
                        Structured Monday through Friday per instructional week
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Schedule Verification Banner */}
              <div className="rounded-[16px] bg-[var(--lavender-soft)]/50 p-4 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--primary)] flex-shrink-0" />
                  <span className="font-bold text-[var(--text)]">
                    Verified Schedule:
                  </span>
                  <span className="text-[var(--text-muted)] font-normal">
                    {formData.durationWeeks} Weeks &times; {formData.sessionsPerWeek} Days = <strong className="text-[var(--text)]">{totalSessionsCalculated} Planned Sessions</strong>
                  </span>
                </div>
                <span className="font-bold text-[var(--primary)]">
                  {totalMinutesCalculated.toLocaleString()} Total Instructional Minutes
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Learning Goals */}
          {currentStep === 3 && (
            <div className="neu-card p-6 sm:p-8 space-y-5">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-base font-bold text-[var(--text)]">
                  Step 3: Pedagogical Goals & Learner Profile
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
                  Define overarching competencies based on Backward Design principles.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Overall Unit Learning Goals <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.overallGoals}
                    onChange={(e) => setFormData({ ...formData, overallGoals: e.target.value })}
                    placeholder="Describe enduring understandings, key problem types, and mastery expectations..."
                    className={`w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)] ${
                      formErrors.overallGoals ? '!border-red-500' : ''
                    }`}
                  />
                  {formErrors.overallGoals && <p className="text-[11px] text-red-500 font-medium">{formErrors.overallGoals}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text)]">
                      Prior Knowledge & Prerequisites
                    </label>
                    <textarea
                      rows={2}
                      value={formData.priorKnowledge}
                      onChange={(e) => setFormData({ ...formData, priorKnowledge: e.target.value })}
                      placeholder="What have students already mastered?"
                      className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text)]">
                      Student Learning Needs & Variances
                    </label>
                    <textarea
                      rows={2}
                      value={formData.studentNeeds}
                      onChange={(e) => setFormData({ ...formData, studentNeeds: e.target.value })}
                      placeholder="Mixed-ability, visual learners, scaffolding considerations..."
                      className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Preferences & Inclusivity */}
          {currentStep === 4 && (
            <div className="neu-card p-6 sm:p-8 space-y-5">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-base font-bold text-[var(--text)]">
                  Step 4: Instructional Strategies & Inclusivity
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
                  Select teaching methods, assessment preferences, and classroom accommodations.
                </p>
              </div>

              {/* Teaching Methods Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text)]">
                  Preferred Instructional Methods <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {TEACHING_METHOD_OPTIONS.map((method) => {
                    const isSelected = formData.preferredTeachingMethods.includes(method);
                    return (
                      <button
                        type="button"
                        key={method}
                        onClick={() => handleMethodToggle(method)}
                        className={`flex items-center gap-2.5 p-3 rounded-[16px] border text-left text-xs transition-all ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--lavender-soft)] font-semibold text-[var(--primary)] shadow-neu-inset'
                            : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:bg-[var(--lavender-soft)]/30'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'border-[var(--border)] bg-white'
                        }`}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="truncate">{method}</span>
                      </button>
                    );
                  })}
                </div>
                {formErrors.preferredTeachingMethods && (
                  <p className="text-[11px] text-red-500 font-medium">{formErrors.preferredTeachingMethods}</p>
                )}
              </div>

              {/* Assessment & Homework */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Assessment Preferences
                  </label>
                  <input
                    type="text"
                    value={formData.assessmentPreferences}
                    onChange={(e) => setFormData({ ...formData, assessmentPreferences: e.target.value })}
                    placeholder="Daily exit slips, weekly review, end-of-unit rubric"
                    className="w-full neu-input px-3.5 py-2.5 text-xs text-[var(--text)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text)]">
                    Homework Generation
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableHomework}
                        onChange={(e) => setFormData({ ...formData, enableHomework: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[var(--lavender-soft)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                    </label>
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {formData.enableHomework ? 'Generate daily homework practice tasks' : 'Disable homework generation'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapsible Inclusivity */}
              <div className="pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex w-full items-center justify-between text-left text-xs font-bold text-[var(--text)]"
                >
                  <span>Advanced Accommodations & Class Size (Optional)</span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                </button>

                {showAdvanced && (
                  <div className="pt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[var(--text)]">Class Size</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.classSize}
                        onChange={(e) => setFormData({ ...formData, classSize: parseInt(e.target.value) || 25 })}
                        className="w-full neu-input px-3 py-2 text-xs text-[var(--text)]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[var(--text)]">Language of Instruction</label>
                      <input
                        type="text"
                        value={formData.languageOfInstruction}
                        onChange={(e) => setFormData({ ...formData, languageOfInstruction: e.target.value })}
                        className="w-full neu-input px-3 py-2 text-xs text-[var(--text)]"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[11px] font-semibold text-[var(--text)]">Learning Accommodations</label>
                      <input
                        type="text"
                        value={formData.accommodations}
                        onChange={(e) => setFormData({ ...formData, accommodations: e.target.value })}
                        placeholder="Visual word banks, graphic organizers, extended time"
                        className="w-full neu-input px-3 py-2 text-xs text-[var(--text)]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Review & Generate */}
          {currentStep === 5 && (
            <div className="neu-card p-6 sm:p-8 space-y-5">
              <div className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)]">
                    Step 5: Review Unit Specifications
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 font-normal">
                    Verify all curriculum parameters before initiating AI generation.
                  </p>
                </div>
                <span className="rounded-full bg-[var(--lavender-soft)] text-[var(--primary)] px-3 py-1 text-xs font-bold border border-[var(--border)]">
                  Ready to Synthesize
                </span>
              </div>

              {/* Specification Review Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[var(--lavender-soft)]/40 p-4 rounded-[16px] border border-[var(--border)] space-y-1.5">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Unit & Curriculum</div>
                  <div className="font-bold text-[var(--text)] text-sm">{formData.title}</div>
                  <div className="text-[var(--text-muted)] font-medium">{formData.subject} &bull; {formData.gradeLevel}</div>
                  <div className="text-[var(--text-muted)] font-normal">{formData.curriculumFramework}</div>
                </div>

                <div className="bg-[var(--lavender-soft)]/40 p-4 rounded-[16px] border border-[var(--border)] space-y-1.5">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Schedule Metrics</div>
                  <div className="font-bold text-[var(--text)] text-sm">
                    {formData.durationWeeks} Weeks &bull; {totalSessionsCalculated} Planned Sessions
                  </div>
                  <div className="text-[var(--text-muted)] font-medium">
                    {formData.sessionsPerWeek} days/wk &bull; {formData.classDurationMinutes} min per session
                  </div>
                  <div className="text-[var(--primary)] font-bold">
                    {totalMinutesCalculated.toLocaleString()} Instructional Minutes
                  </div>
                </div>

                <div className="sm:col-span-2 bg-[var(--lavender-soft)]/40 p-4 rounded-[16px] border border-[var(--border)] space-y-1.5">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Unit Goals & Approach</div>
                  <p className="text-[var(--text-muted)] leading-relaxed font-normal">{formData.overallGoals}</p>
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {formData.preferredTeachingMethods.map((m) => (
                      <span key={m} className="bg-white px-2.5 py-1 rounded-full border border-[var(--border)] text-[11px] font-medium text-[var(--text)]">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Validation Summary if any error */}
              {Object.keys(formErrors).length > 0 && (
                <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Required inputs need attention: </span>
                    {Object.values(formErrors).join('; ')}
                  </div>
                </div>
              )}

              {/* Primary Launch Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="generate-plan-button"
                  disabled={isGenerating}
                  className="w-full neu-btn-primary inline-flex items-center justify-center gap-2 text-sm font-bold text-white py-3.5"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating Multi-Week Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Lesson Plan ({formData.durationWeeks}w &bull; {totalSessionsCalculated} Sessions)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="neu-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-[16px] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)]/40 transition-colors"
              >
                Cancel
              </button>

              {currentStep < 5 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="neu-btn-primary inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white"
                >
                  Next Step
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
