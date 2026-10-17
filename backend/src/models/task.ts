import { z } from 'zod';
import { LessonPlan } from './plan';

export type TaskStatus = 'completed' | 'in_progress' | 'incomplete' | 'pending';

export type TaskType = 
  | 'plan_setup'
  | 'learning_objectives'
  | 'curriculum_standards'
  | 'assessment_rubric'
  | 'teaching_materials'
  | 'differentiation'
  | 'lesson_sequences'
  | 'finalize_plan'
  | 'export_share';

export const TaskChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  completed: z.boolean(),
  notes: z.string().optional(),
  isRequired: z.boolean().default(true),
});

export const TaskValidationIssueSchema = z.object({
  field: z.string(),
  message: z.string(),
  severity: z.enum(['error', 'warning']),
});

export const TeacherTaskSchema = z.object({
  id: z.string(),
  planId: z.string(),
  planTitle: z.string(),
  subject: z.string(),
  gradeLevel: z.string(),
  type: z.enum([
    'plan_setup',
    'learning_objectives',
    'curriculum_standards',
    'assessment_rubric',
    'teaching_materials',
    'differentiation',
    'lesson_sequences',
    'finalize_plan',
    'export_share'
  ]),
  title: z.string(),
  description: z.string(),
  status: z.enum(['completed', 'in_progress', 'incomplete', 'pending']),
  manualOverride: z.boolean().default(false),
  checklist: z.array(TaskChecklistItemSchema),
  prerequisiteTaskId: z.string().optional(),
  prerequisiteTitle: z.string().optional(),
  validationIssues: z.array(TaskValidationIssueSchema).default([]),
  missingExplanation: z.string().default(''),
  nextActionLabel: z.string(),
  nextActionTab: z.string().default('overview'),
  dueDate: z.string().optional(),
  teacherNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TaskChecklistItem = z.infer<typeof TaskChecklistItemSchema>;
export type TaskValidationIssue = z.infer<typeof TaskValidationIssueSchema>;
export type TeacherTask = z.infer<typeof TeacherTaskSchema>;

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  incomplete: number;
  pending: number;
  completionPercentage: number;
}

/**
 * Task generation and real-data validation rules.
 * Generates the 9 canonical tasks for a curriculum plan, evaluating actual plan properties.
 */
export function generateTasksForPlan(
  plan: LessonPlan,
  existingTasksMap?: Map<string, TeacherTask>
): TeacherTask[] {
  const now = new Date().toISOString();
  const tasks: TeacherTask[] = [];

  // Helper to retrieve prior user edits (checked items, notes, dueDate, manualOverride)
  const getExisting = (taskId: string) => existingTasksMap?.get(taskId);

  // 1. Task: Plan Setup & Overview
  {
    const id = `task_${plan.id}_plan_setup`;
    const prev = getExisting(id);
    const issues: TaskValidationIssue[] = [];

    const hasTitle = Boolean(plan.title && plan.title.trim().length > 3 && !plan.title.toLowerCase().includes('untitled'));
    const hasOverview = Boolean(plan.unitOverview && plan.unitOverview.trim().length >= 30);
    const hasGradeDuration = Boolean(plan.gradeLevel && plan.classDurationMinutes >= 15);
    const hasPrereqs = Boolean(plan.prerequisiteKnowledge && plan.prerequisiteKnowledge.length > 0);

    if (!hasTitle) issues.push({ field: 'title', message: 'Unit title is too brief or missing', severity: 'error' });
    if (!hasOverview) issues.push({ field: 'unitOverview', message: 'Unit overview requires at least 30 characters explaining core understandings', severity: 'error' });
    if (!hasGradeDuration) issues.push({ field: 'classDurationMinutes', message: 'Class duration must be at least 15 minutes', severity: 'warning' });
    if (!hasPrereqs) issues.push({ field: 'prerequisiteKnowledge', message: 'No prerequisite knowledge items documented', severity: 'warning' });

    const defaultChecklist: TaskChecklistItem[] = [
      { id: 'item_title', label: 'Define descriptive curriculum unit title', completed: prev ? (prev.checklist.find(c => c.id === 'item_title')?.completed ?? hasTitle) : hasTitle, isRequired: true },
      { id: 'item_overview', label: 'Draft unit overview and enduring understandings (Backward Design Stage 1)', completed: prev ? (prev.checklist.find(c => c.id === 'item_overview')?.completed ?? hasOverview) : hasOverview, isRequired: true },
      { id: 'item_grade', label: 'Set target grade level and class duration', completed: prev ? (prev.checklist.find(c => c.id === 'item_grade')?.completed ?? hasGradeDuration) : hasGradeDuration, isRequired: true },
      { id: 'item_prereqs', label: 'Identify prerequisite student knowledge and prior skills', completed: prev ? (prev.checklist.find(c => c.id === 'item_prereqs')?.completed ?? hasPrereqs) : hasPrereqs, isRequired: false },
    ];

    const status = calculateTaskStatus({
      checklist: defaultChecklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: issues.filter(i => i.severity === 'error').length,
      manualOverride: prev?.manualOverride,
      previousStatus: prev?.status,
    });

    tasks.push({
      id,
      planId: plan.id,
      planTitle: plan.title,
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
      type: 'plan_setup',
      title: 'Define Unit Overview & Curriculum Scope',
      description: 'Establish foundational unit goals, grade level, and enduring understandings grounded in Backward Design.',
      status,
      manualOverride: prev?.manualOverride ?? false,
      checklist: defaultChecklist,
      validationIssues: issues,
      missingExplanation: formatMissingExplanation(status, issues, defaultChecklist, 'Edit the Unit Overview in the Overview tab to articulate essential questions and prior knowledge.'),
      nextActionLabel: 'Open Overview Tab',
      nextActionTab: 'overview',
      dueDate: prev?.dueDate,
      teacherNotes: prev?.teacherNotes,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  }

  // 2. Task: Review Learning Objectives
  {
    const id = `task_${plan.id}_learning_objectives`;
    const prev = getExisting(id);
    const issues: TaskValidationIssue[] = [];

    const hasUnitObjectives = Boolean(plan.unitObjectives && plan.unitObjectives.length >= 2);
    const allSessions = plan.weeklyPlans.flatMap(w => w.sessions || []);
    const sessionsWithObjectives = allSessions.filter(s => s.objectives && s.objectives.length > 0);
    const hasSessionObjectives = allSessions.length > 0 && sessionsWithObjectives.length === allSessions.length;

    const allObjectives = allSessions.flatMap(s => s.objectives || []);
    const higherOrderObjectives = allObjectives.filter(o => ['Applying', 'Analyzing', 'Evaluating', 'Creating'].includes(o.bloomLevel));
    const hasBloomDepth = allObjectives.length > 0 && (higherOrderObjectives.length / allObjectives.length) >= 0.4;
    const hasSuccessCriteria = allSessions.some(s => s.successCriteria && s.successCriteria.length > 0);

    if (!hasUnitObjectives) issues.push({ field: 'unitObjectives', message: 'At least 2 overarching unit objectives are required', severity: 'error' });
    if (!hasSessionObjectives) issues.push({ field: 'sessionObjectives', message: `${allSessions.length - sessionsWithObjectives.length} daily session(s) are missing clear learning objectives`, severity: 'error' });
    if (!hasBloomDepth) issues.push({ field: 'bloomDepth', message: 'Fewer than 40% of objectives target higher-order Bloom levels (Applying, Analyzing, Evaluating, Creating)', severity: 'warning' });

    const defaultChecklist: TaskChecklistItem[] = [
      { id: 'item_unit_obj', label: 'Articulate 2+ overarching unit learning goals', completed: prev ? (prev.checklist.find(c => c.id === 'item_unit_obj')?.completed ?? hasUnitObjectives) : hasUnitObjectives, isRequired: true },
      { id: 'item_sess_obj', label: 'Verify each daily session has measurable objectives', completed: prev ? (prev.checklist.find(c => c.id === 'item_sess_obj')?.completed ?? hasSessionObjectives) : hasSessionObjectives, isRequired: true },
      { id: 'item_bloom', label: 'Ensure cognitive depth across Bloom’s Taxonomy spectrum', completed: prev ? (prev.checklist.find(c => c.id === 'item_bloom')?.completed ?? hasBloomDepth) : hasBloomDepth, isRequired: false },
      { id: 'item_success_criteria', label: 'Include observable student success criteria ("I can...")', completed: prev ? (prev.checklist.find(c => c.id === 'item_success_criteria')?.completed ?? hasSuccessCriteria) : hasSuccessCriteria, isRequired: true },
    ];

    const status = calculateTaskStatus({
      checklist: defaultChecklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: issues.filter(i => i.severity === 'error').length,
      manualOverride: prev?.manualOverride,
      previousStatus: prev?.status,
    });

    tasks.push({
      id,
      planId: plan.id,
      planTitle: plan.title,
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
      type: 'learning_objectives',
      title: 'Review Learning Objectives & Bloom Depth',
      description: 'Audit unit and session objectives to ensure measurable outcomes and cognitive rigor.',
      status,
      manualOverride: prev?.manualOverride ?? false,
      checklist: defaultChecklist,
      validationIssues: issues,
      missingExplanation: formatMissingExplanation(status, issues, defaultChecklist, 'Refine lesson objectives and ensure every daily session includes explicit success criteria.'),
      nextActionLabel: 'Review Objectives',
      nextActionTab: 'overview',
      dueDate: prev?.dueDate,
      teacherNotes: prev?.teacherNotes,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  }

  // 3. Task: Verify Curriculum Standards
  {
    const id = `task_${plan.id}_curriculum_standards`;
    const prev = getExisting(id);
    const issues: TaskValidationIssue[] = [];

    const allSessions = plan.weeklyPlans.flatMap(w => w.sessions || []);
    const totalStandards = allSessions.reduce((acc, s) => acc + (s.standards?.length || 0), 0);
    const hasStandards = totalStandards > 0;
    const hasRationale = allSessions.some(s => s.standards?.some(st => Boolean(st.lessonConnection && st.lessonConnection.length > 10)));
    const allVerifiedOrReviewed = allSessions.every(s => s.standards?.every(st => st.verificationStatus !== 'suggested_unverified'));

    if (!hasStandards) issues.push({ field: 'standards', message: 'No state or national curriculum standards attached to lessons', severity: 'error' });
    if (hasStandards && !allVerifiedOrReviewed) issues.push({ field: 'verificationStatus', message: 'Some standards remain flagged as unverified AI suggestions', severity: 'warning' });

    const defaultChecklist: TaskChecklistItem[] = [
      { id: 'item_standards_attached', label: 'Attach curriculum standards to unit sessions', completed: prev ? (prev.checklist.find(c => c.id === 'item_standards_attached')?.completed ?? hasStandards) : hasStandards, isRequired: true },
      { id: 'item_standards_connection', label: 'Verify pedagogical alignment rationale for each standard', completed: prev ? (prev.checklist.find(c => c.id === 'item_standards_connection')?.completed ?? hasRationale) : hasRationale, isRequired: true },
      { id: 'item_standards_reviewed', label: 'Confirm standards verification status (Verified / Teacher Provided)', completed: prev ? (prev.checklist.find(c => c.id === 'item_standards_reviewed')?.completed ?? allVerifiedOrReviewed) : allVerifiedOrReviewed, isRequired: false },
    ];

    const status = calculateTaskStatus({
      checklist: defaultChecklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: issues.filter(i => i.severity === 'error').length,
      manualOverride: prev?.manualOverride,
      previousStatus: prev?.status,
    });

    tasks.push({
      id,
      planId: plan.id,
      planTitle: plan.title,
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
      type: 'curriculum_standards',
      title: 'Verify Curriculum Standards Alignment',
      description: 'Audit framework standards codes, pedagogical alignment rationales, and verification badges.',
      status,
      manualOverride: prev?.manualOverride ?? false,
      checklist: defaultChecklist,
      validationIssues: issues,
      missingExplanation: formatMissingExplanation(status, issues, defaultChecklist, 'Open the Standards Alignment tab to inspect standards codes and confirm curricular connections.'),
      nextActionLabel: 'Open Standards Alignment',
      nextActionTab: 'standards',
      dueDate: prev?.dueDate,
      teacherNotes: prev?.teacherNotes,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  }

  // 4. Task: Complete Assessment Rubrics
  {
    const id = `task_${plan.id}_assessment_rubric`;
    const prev = getExisting(id);
    const issues: TaskValidationIssue[] = [];

    const hasWeeklyAssessments = plan.weeklyPlans.every(w => Boolean(w.weeklyAssessment && w.weeklyAssessment.type));
    const rubricCriteria = plan.finalAssessment?.rubric || [];
    const hasRubricCriteria = rubricCriteria.length >= 2;
    const totalRubricWeight = rubricCriteria.reduce((sum, r) => sum + (r.weightPercentage || 0), 0);
    const hasValidWeight = rubricCriteria.length > 0 && Math.abs(totalRubricWeight - 100) < 0.1;
    const allSessions = plan.weeklyPlans.flatMap(w => w.sessions || []);
    const hasFormativeChecks = allSessions.some(s => Boolean(s.formativeAssessment?.type));

    if (!hasWeeklyAssessments) issues.push({ field: 'weeklyAssessment', message: 'One or more weeks lack defined formative checkpoint assessments', severity: 'error' });
    if (!hasRubricCriteria) issues.push({ field: 'rubric', message: 'Summative rubric requires at least 2 distinct evaluation criteria', severity: 'error' });
    if (hasRubricCriteria && !hasValidWeight) issues.push({ field: 'weightPercentage', message: `Rubric criterion weights sum to ${totalRubricWeight}%, but must equal 100%`, severity: 'error' });

    const defaultChecklist: TaskChecklistItem[] = [
      { id: 'item_formative_checks', label: 'Configure daily formative checks and exit questions', completed: prev ? (prev.checklist.find(c => c.id === 'item_formative_checks')?.completed ?? hasFormativeChecks) : hasFormativeChecks, isRequired: true },
      { id: 'item_weekly_checks', label: 'Establish weekly progress checkpoints across all weeks', completed: prev ? (prev.checklist.find(c => c.id === 'item_weekly_checks')?.completed ?? hasWeeklyAssessments) : hasWeeklyAssessments, isRequired: true },
      { id: 'item_summative_rubric', label: 'Build multi-tiered summative assessment rubric', completed: prev ? (prev.checklist.find(c => c.id === 'item_summative_rubric')?.completed ?? hasRubricCriteria) : hasRubricCriteria, isRequired: true },
      { id: 'item_weights_100', label: 'Verify rubric weighting balances exactly to 100%', completed: prev ? (prev.checklist.find(c => c.id === 'item_weights_100')?.completed ?? hasValidWeight) : hasValidWeight, isRequired: true },
    ];

    const status = calculateTaskStatus({
      checklist: defaultChecklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: issues.filter(i => i.severity === 'error').length,
      manualOverride: prev?.manualOverride,
      previousStatus: prev?.status,
    });

    tasks.push({
      id,
      planId: plan.id,
      planTitle: plan.title,
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
      type: 'assessment_rubric',
      title: 'Complete Assessment Rubrics & Checkpoints',
      description: 'Design formative checkpoints and configure weighted multi-criteria grading rubrics.',
      status,
      manualOverride: prev?.manualOverride ?? false,
      checklist: defaultChecklist,
      validationIssues: issues,
      missingExplanation: formatMissingExplanation(status, issues, defaultChecklist, 'Open Assessments & Rubric tab to adjust criteria descriptions and verify weight percentages.'),
      nextActionLabel: 'Open Assessments & Rubric',
      nextActionTab: 'assessments',
      dueDate: prev?.dueDate,
      teacherNotes: prev?.teacherNotes,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  }

  // 5. Task: Prepare Teaching Materials
  {
    const id = `task_${plan.id}_teaching_materials`;
    const prev = getExisting(id);
    const issues: TaskValidationIssue[] = [];

    const hasResourceList = Boolean(plan.resourceList && plan.resourceList.length >= 2);
    const allSessions = plan.weeklyPlans.flatMap(w => w.sessions || []);
    const sessionsWithMaterials = allSessions.filter(s => s.materials && s.materials.length > 0);
    const hasSessionMaterials = allSessions.length > 0 && sessionsWithMaterials.length === allSessions.length;

    if (!hasResourceList) issues.push({ field: 'resourceList', message: 'Resource catalog should include at least 2 structured curriculum references', severity: 'warning' });
    if (!hasSessionMaterials) issues.push({ field: 'materials', message: `${allSessions.length - sessionsWithMaterials.length} lesson session(s) lack required materials lists`, severity: 'error' });

    const defaultChecklist: TaskChecklistItem[] = [
      { id: 'item_curriculum_resources', label: 'Catalog digital links, readings, and lab resources', completed: prev ? (prev.checklist.find(c => c.id === 'item_curriculum_resources')?.completed ?? hasResourceList) : hasResourceList, isRequired: true },
      { id: 'item_daily_materials', label: 'Specify physical and digital equipment for all daily sessions', completed: prev ? (prev.checklist.find(c => c.id === 'item_daily_materials')?.completed ?? hasSessionMaterials) : hasSessionMaterials, isRequired: true },
      { id: 'item_printables', label: 'Prepare student handouts, graphic organizers, or slide decks', completed: prev ? (prev.checklist.find(c => c.id === 'item_printables')?.completed ?? false) : false, isRequired: false },
    ];

    const status = calculateTaskStatus({
      checklist: defaultChecklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: issues.filter(i => i.severity === 'error').length,
      manualOverride: prev?.manualOverride,
      previousStatus: prev?.status,
    });

    tasks.push({
      id,
      planId: plan.id,
      planTitle: plan.title,
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
      type: 'teaching_materials',
      title: 'Prepare Teaching Materials & Resources',
      description: 'Collate classroom supplies, digital tools, worksheets, and lab setups required across unit lessons.',
      status,
      manualOverride: prev?.manualOverride ?? false,
      checklist: defaultChecklist,
      validationIssues: issues,
      missingExplanation: formatMissingExplanation(status, issues, defaultChecklist, 'Open Materials & Resources tab to catalog lab items and ensure daily lessons list their handouts.'),
      nextActionLabel: 'Open Resources Tab',
      nextActionTab: 'resources',
      dueDate: prev?.dueDate,
      teacherNotes: prev?.teacherNotes,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  }

  // 6. Task: Add Differentiation Strategies
  {
    const id = `task_${plan.id}_differentiation`;
    const prev = getExisting(id);
    const issues: TaskValidationIssue[] = [];

    const allSessions = plan.weeklyPlans.flatMap(w => w.sessions || []);
    const sessionsWithSupport = allSessions.filter(s => Boolean(s.differentiation?.support && s.differentiation.support.length > 5));
    const sessionsWithAdvanced = allSessions.filter(s => Boolean(s.differentiation?.advanced && s.differentiation.advanced.length > 5));
    const sessionsWithEll = allSessions.filter(s => Boolean(s.differentiation?.ell && s.differentiation.ell.length > 5));

    const hasSupport = allSessions.length > 0 && sessionsWithSupport.length === allSessions.length;
    const hasAdvanced = allSessions.length > 0 && sessionsWithAdvanced.length === allSessions.length;
    const hasEll = allSessions.length > 0 && sessionsWithEll.length === allSessions.length;

    if (!hasSupport) issues.push({ field: 'support', message: `${allSessions.length - sessionsWithSupport.length} session(s) lack scaffolds for struggling students`, severity: 'error' });
    if (!hasAdvanced) issues.push({ field: 'advanced', message: `${allSessions.length - sessionsWithAdvanced.length} session(s) lack enrichment tasks for advanced learners`, severity: 'warning' });
    if (!hasEll) issues.push({ field: 'ell', message: `${allSessions.length - sessionsWithEll.length} session(s) lack language acquisition (ELL) scaffolds`, severity: 'warning' });

    const defaultChecklist: TaskChecklistItem[] = [
      { id: 'item_scaffolds_support', label: 'Provide structured scaffolds for intervention & striving learners', completed: prev ? (prev.checklist.find(c => c.id === 'item_scaffolds_support')?.completed ?? hasSupport) : hasSupport, isRequired: true },
      { id: 'item_enrichment_adv', label: 'Create extension tasks and deeper inquiry for advanced learners', completed: prev ? (prev.checklist.find(c => c.id === 'item_enrichment_adv')?.completed ?? hasAdvanced) : hasAdvanced, isRequired: true },
      { id: 'item_ell_accommodations', label: 'Include linguistic scaffolds & bilingual vocabulary for ELLs', completed: prev ? (prev.checklist.find(c => c.id === 'item_ell_accommodations')?.completed ?? hasEll) : hasEll, isRequired: true },
      { id: 'item_modalities', label: 'Incorporate multimodal representations (visual, auditory, kinesthetic)', completed: prev ? (prev.checklist.find(c => c.id === 'item_modalities')?.completed ?? false) : false, isRequired: false },
    ];

    const status = calculateTaskStatus({
      checklist: defaultChecklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: issues.filter(i => i.severity === 'error').length,
      manualOverride: prev?.manualOverride,
      previousStatus: prev?.status,
    });

    tasks.push({
      id,
      planId: plan.id,
      planTitle: plan.title,
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
      type: 'differentiation',
      title: 'Add Differentiation & Accessibility Strategies',
      description: 'Ensure equitable instruction by tailoring support for striving learners, advanced students, and multilingual learners.',
      status,
      manualOverride: prev?.manualOverride ?? false,
      checklist: defaultChecklist,
      validationIssues: issues,
      missingExplanation: formatMissingExplanation(status, issues, defaultChecklist, 'Open Daily Lessons to review and adapt individual session differentiation tiers.'),
      nextActionLabel: 'Review Differentiation',
      nextActionTab: 'daily',
      dueDate: prev?.dueDate,
      teacherNotes: prev?.teacherNotes,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  }

  // 7. Task: Review Weekly Lesson Sequences
  {
    const id = `task_${plan.id}_lesson_sequences`;
    const prev = getExisting(id);
    const issues: TaskValidationIssue[] = [];

    const hasWeeks = Boolean(plan.weeklyPlans && plan.weeklyPlans.length === plan.durationWeeks);
    const allSessions = plan.weeklyPlans.flatMap(w => w.sessions || []);
    const sessionsWithPhases = allSessions.filter(s => s.lessonSequence && s.lessonSequence.length >= 3);
    const hasAdequatePhases = allSessions.length > 0 && sessionsWithPhases.length === allSessions.length;

    // Check phase timing match class duration
    const badTimingSessions = allSessions.filter(s => {
      const sum = (s.lessonSequence || []).reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
      return Math.abs(sum - plan.classDurationMinutes) > 5;
    });
    const hasGoodTiming = badTimingSessions.length === 0;

    if (!hasWeeks) issues.push({ field: 'durationWeeks', message: `Plan duration is ${plan.durationWeeks} weeks, but contains ${plan.weeklyPlans.length} week modules`, severity: 'error' });
    if (!hasAdequatePhases) issues.push({ field: 'lessonSequence', message: `${allSessions.length - sessionsWithPhases.length} session(s) have fewer than 3 instructional phases`, severity: 'error' });
    if (!hasGoodTiming) issues.push({ field: 'phaseTiming', message: `${badTimingSessions.length} session(s) have phase minutes that do not add up to ${plan.classDurationMinutes} min class period`, severity: 'warning' });

    const defaultChecklist: TaskChecklistItem[] = [
      { id: 'item_weekly_scope', label: 'Verify thematic scope and pacing across all curriculum weeks', completed: prev ? (prev.checklist.find(c => c.id === 'item_weekly_scope')?.completed ?? hasWeeks) : hasWeeks, isRequired: true },
      { id: 'item_instructional_phases', label: 'Ensure all sessions contain clear opening, instruction, practice, and closure', completed: prev ? (prev.checklist.find(c => c.id === 'item_instructional_phases')?.completed ?? hasAdequatePhases) : hasAdequatePhases, isRequired: true },
      { id: 'item_phase_timing', label: `Balance instructional phase timings to total ${plan.classDurationMinutes} minutes`, completed: prev ? (prev.checklist.find(c => c.id === 'item_phase_timing')?.completed ?? hasGoodTiming) : hasGoodTiming, isRequired: true },
    ];

    const status = calculateTaskStatus({
      checklist: defaultChecklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: issues.filter(i => i.severity === 'error').length,
      manualOverride: prev?.manualOverride,
      previousStatus: prev?.status,
    });

    tasks.push({
      id,
      planId: plan.id,
      planTitle: plan.title,
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
      type: 'lesson_sequences',
      title: 'Review Weekly Lesson Sequences & Timing',
      description: 'Audit instructional pacing, time allocations, and lesson phase transitions across the unit.',
      status,
      manualOverride: prev?.manualOverride ?? false,
      checklist: defaultChecklist,
      validationIssues: issues,
      missingExplanation: formatMissingExplanation(status, issues, defaultChecklist, 'Open Daily Lessons to review phase durations and reorder sessions if necessary.'),
      nextActionLabel: 'Review Daily Lessons',
      nextActionTab: 'daily',
      dueDate: prev?.dueDate,
      teacherNotes: prev?.teacherNotes,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  }

  // 8. Task: Finalize & Save Plan
  {
    const id = `task_${plan.id}_finalize_plan`;
    const prev = getExisting(id);
    const prereqId = `task_${plan.id}_lesson_sequences`;
    const prereqTask = tasks.find(t => t.id === prereqId);
    const isPrereqComplete = prereqTask?.status === 'completed';

    const issues: TaskValidationIssue[] = [];
    const isPlanStatusCompleted = plan.status === 'completed';

    if (!isPrereqComplete) {
      issues.push({ field: 'prerequisite', message: 'Lesson sequences review must be completed before finalizing the plan', severity: 'error' });
    }
    if (!isPlanStatusCompleted) {
      issues.push({ field: 'status', message: 'Plan status is currently in Draft; mark Completed when ready', severity: 'warning' });
    }

    const defaultChecklist: TaskChecklistItem[] = [
      { id: 'item_audit_integrity', label: 'Review full curriculum sequence for pedagogical consistency', completed: prev ? (prev.checklist.find(c => c.id === 'item_audit_integrity')?.completed ?? isPrereqComplete) : isPrereqComplete, isRequired: true },
      { id: 'item_resolve_warnings', label: 'Resolve all outstanding validation errors across tabs', completed: prev ? (prev.checklist.find(c => c.id === 'item_resolve_warnings')?.completed ?? (issues.filter(i => i.severity === 'error').length === 0)) : (issues.filter(i => i.severity === 'error').length === 0), isRequired: true },
      { id: 'item_mark_completed', label: 'Set overall plan status to "Completed"', completed: prev ? (prev.checklist.find(c => c.id === 'item_mark_completed')?.completed ?? isPlanStatusCompleted) : isPlanStatusCompleted, isRequired: true },
    ];

    const status = calculateTaskStatus({
      checklist: defaultChecklist,
      hasPrerequisiteBlocked: !isPrereqComplete,
      validationErrorsCount: issues.filter(i => i.severity === 'error').length,
      manualOverride: prev?.manualOverride,
      previousStatus: prev?.status,
    });

    tasks.push({
      id,
      planId: plan.id,
      planTitle: plan.title,
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
      type: 'finalize_plan',
      title: 'Finalize & Approve Curriculum Plan',
      description: 'Perform a comprehensive pre-flight check and certify the unit plan as ready for classroom execution.',
      status,
      manualOverride: prev?.manualOverride ?? false,
      checklist: defaultChecklist,
      prerequisiteTaskId: prereqId,
      prerequisiteTitle: 'Review Weekly Lesson Sequences & Timing',
      validationIssues: issues,
      missingExplanation: formatMissingExplanation(
        status, 
        issues, 
        defaultChecklist, 
        isPrereqComplete ? 'Change plan status from Draft to Completed in the workspace top bar.' : 'Complete lesson sequence timing review before marking this plan finalized.'
      ),
      nextActionLabel: 'Finalize in Overview',
      nextActionTab: 'overview',
      dueDate: prev?.dueDate,
      teacherNotes: prev?.teacherNotes,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  }

  // 9. Task: Export or Share Plan
  {
    const id = `task_${plan.id}_export_share`;
    const prev = getExisting(id);
    const prereqId = `task_${plan.id}_finalize_plan`;
    const prereqTask = tasks.find(t => t.id === prereqId);
    const isPrereqComplete = prereqTask?.status === 'completed';

    const issues: TaskValidationIssue[] = [];
    if (!isPrereqComplete) {
      issues.push({ field: 'prerequisite', message: 'Finalize the plan before publishing official export documents', severity: 'warning' });
    }

    const defaultChecklist: TaskChecklistItem[] = [
      { id: 'item_export_docs', label: 'Export official curriculum syllabus (DOCX or PDF)', completed: prev ? (prev.checklist.find(c => c.id === 'item_export_docs')?.completed ?? false) : false, isRequired: true },
      { id: 'item_share_colleagues', label: 'Share curriculum summary or CSV tracker with grade-level team', completed: prev ? (prev.checklist.find(c => c.id === 'item_share_colleagues')?.completed ?? false) : false, isRequired: false },
    ];

    const status = calculateTaskStatus({
      checklist: defaultChecklist,
      hasPrerequisiteBlocked: !isPrereqComplete,
      validationErrorsCount: 0,
      manualOverride: prev?.manualOverride,
      previousStatus: prev?.status,
    });

    tasks.push({
      id,
      planId: plan.id,
      planTitle: plan.title,
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
      type: 'export_share',
      title: 'Export Documents & Share with Department',
      description: 'Download classroom-ready Word DOCX / PDF formats and share curriculum data with administrators or co-teachers.',
      status,
      manualOverride: prev?.manualOverride ?? false,
      checklist: defaultChecklist,
      prerequisiteTaskId: prereqId,
      prerequisiteTitle: 'Finalize & Approve Curriculum Plan',
      validationIssues: issues,
      missingExplanation: formatMissingExplanation(
        status, 
        issues, 
        defaultChecklist, 
        'Use the Export menu in the workspace header to download Word or PDF copies of your curriculum unit.'
      ),
      nextActionLabel: 'Open Export Menu',
      nextActionTab: 'overview',
      dueDate: prev?.dueDate,
      teacherNotes: prev?.teacherNotes,
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  }

  return tasks;
}

/**
 * Calculates parent task status strictly and prevent contradictory states.
 * - Completed: all required checklist items finished, no blocking errors.
 * - In Progress: work has started (1+ items checked), but not finished.
 * - Incomplete: prerequisite is unblocked, but required work is missing or failed validation.
 * - Pending: work has not started or is waiting for a prerequisite.
 */
export function calculateTaskStatus(params: {
  checklist: TaskChecklistItem[];
  hasPrerequisiteBlocked: boolean;
  validationErrorsCount: number;
  manualOverride?: boolean;
  previousStatus?: TaskStatus;
}): TaskStatus {
  // If manual override was specified by teacher, respect it unless checklist explicitly contradicts
  if (params.manualOverride && params.previousStatus) {
    return params.previousStatus;
  }

  if (params.hasPrerequisiteBlocked) {
    return 'pending';
  }

  const requiredItems = params.checklist.filter(c => c.isRequired);
  const checkedRequired = requiredItems.filter(c => c.completed).length;
  const checkedTotal = params.checklist.filter(c => c.completed).length;

  if (requiredItems.length > 0 && checkedRequired === requiredItems.length && params.validationErrorsCount === 0) {
    return 'completed';
  }

  if (checkedTotal > 0) {
    return 'in_progress';
  }

  if (params.validationErrorsCount > 0) {
    return 'incomplete';
  }

  return 'pending';
}

/**
 * Formats a short, grounded explanation of what remains to be done.
 */
function formatMissingExplanation(
  status: TaskStatus,
  issues: TaskValidationIssue[],
  checklist: TaskChecklistItem[],
  recommendedAction: string
): string {
  if (status === 'completed') {
    return 'All required items verified and completed.';
  }

  const parts: string[] = [];

  const uncheckedRequired = checklist.filter(c => c.isRequired && !c.completed);
  if (uncheckedRequired.length > 0) {
    parts.push(`Missing: ${uncheckedRequired.map(c => c.label).slice(0, 2).join('; ')}${uncheckedRequired.length > 2 ? ` (+${uncheckedRequired.length - 2} more)` : ''}.`);
  }

  const errorIssues = issues.filter(i => i.severity === 'error');
  if (errorIssues.length > 0) {
    parts.push(`Validation: ${errorIssues[0].message}.`);
  }

  if (status === 'pending') {
    parts.push('Status is Pending: awaiting prerequisite or work has not yet started.');
  } else if (status === 'incomplete') {
    parts.push('Status is Incomplete: required items missing or validation check failed.');
  } else if (status === 'in_progress') {
    parts.push('Status is In Progress: steps have been initiated but require final review.');
  }

  parts.push(`Next action: ${recommendedAction}`);

  return parts.join(' ');
}
