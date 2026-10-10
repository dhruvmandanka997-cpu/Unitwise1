import { z } from 'zod';

export type VerificationStatus = 'verified' | 'teacher_provided' | 'suggested_unverified';

export type BloomLevel = 
  | 'Remembering'
  | 'Understanding'
  | 'Applying'
  | 'Analyzing'
  | 'Evaluating'
  | 'Creating';

export type LessonPhase = 
  | 'opening'
  | 'direct_instruction'
  | 'guided_practice'
  | 'collaborative_independent'
  | 'formative_assessment'
  | 'closure';

// --- Zod Schemas ---

export const StandardAlignmentSchema = z.object({
  id: z.string(),
  framework: z.string(),
  code: z.string(),
  description: z.string(),
  lessonConnection: z.string(),
  verificationStatus: z.enum(['verified', 'teacher_provided', 'suggested_unverified']),
});

export const LearningObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  bloomLevel: z.enum([
    'Remembering',
    'Understanding',
    'Applying',
    'Analyzing',
    'Evaluating',
    'Creating'
  ]),
  successCriterion: z.string(),
});

export const LessonActivitySchema = z.object({
  phase: z.enum([
    'opening',
    'direct_instruction',
    'guided_practice',
    'collaborative_independent',
    'formative_assessment',
    'closure'
  ]),
  title: z.string(),
  durationMinutes: z.number().int().positive(),
  description: z.string(),
  teacherAction: z.string(),
  studentAction: z.string(),
  materials: z.array(z.string()).default([]),
});

export const FormativeAssessmentSchema = z.object({
  type: z.string(),
  measures: z.string(),
  promptOrQuestion: z.string(),
  evidenceOfLearning: z.string(),
  interpretationGuide: z.string(),
  nextInstructionalStep: z.string(),
});

export const DifferentiationSchema = z.object({
  support: z.string(),
  onLevel: z.string(),
  advanced: z.string(),
  ell: z.string(),
  modalitiesOrAccommodations: z.string(),
});

export const HomeworkSchema = z.object({
  enabled: z.boolean(),
  task: z.string().default(''),
  estimatedMinutes: z.number().int().nonnegative().default(0),
  optionalChallenge: z.string().optional(),
  realWorldConnection: z.string().optional(),
});

export const SessionPlanSchema = z.object({
  id: z.string(),
  sessionNumber: z.number().int().positive(),
  dayNumber: z.number().int().positive(),
  weekNumber: z.number().int().positive(),
  title: z.string(),
  topic: z.string(),
  durationMinutes: z.number().int().positive(),
  objectives: z.array(LearningObjectiveSchema).min(1),
  successCriteria: z.array(z.string()).default([]),
  standards: z.array(StandardAlignmentSchema).default([]),
  lessonSequence: z.array(LessonActivitySchema).min(1),
  formativeAssessment: FormativeAssessmentSchema,
  differentiation: DifferentiationSchema,
  homework: HomeworkSchema,
  materials: z.array(z.string()).default([]),
});

export const WeeklyAssessmentSchema = z.object({
  type: z.string(),
  description: z.string(),
  checkpointCriteria: z.array(z.string()).default([]),
});

export const WeeklyPlanSchema = z.object({
  id: z.string(),
  weekNumber: z.number().int().positive(),
  title: z.string(),
  theme: z.string(),
  learningGoals: z.array(z.string()).min(1),
  vocabulary: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  sessions: z.array(SessionPlanSchema),
  weeklyAssessment: WeeklyAssessmentSchema,
  weeklyResources: z.array(z.string()).default([]),
  reflectionPrompt: z.string(),
  teacherNotes: z.string().optional().default(''),
});

export const RubricCriterionSchema = z.object({
  criterion: z.string(),
  weightPercentage: z.number().nonnegative(),
  exemplary: z.string(),
  proficient: z.string(),
  developing: z.string(),
  beginning: z.string(),
});

export const FinalAssessmentSchema = z.object({
  title: z.string(),
  type: z.string(),
  description: z.string(),
  rubric: z.array(RubricCriterionSchema),
});

export const ResourceItemSchema = z.object({
  category: z.string(), // "Digital", "Printable", "Lab/Hands-on", "Reading"
  title: z.string(),
  description: z.string(),
  sourceOrUrl: z.string().optional().default(''),
});

export const LessonPlanSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  curriculumFramework: z.string().default('General Standards'),
  standardsFramework: z.string().default(''),
  durationWeeks: z.number().int().min(1).max(12),
  sessionsPerWeek: z.number().int().min(1).max(7),
  classDurationMinutes: z.number().int().min(15).max(180),
  format: z.enum(['calendar', 'session_sequence']).default('session_sequence'),
  unitOverview: z.string().min(1, 'Unit overview is required'),
  unitObjectives: z.array(z.string()).min(1, 'At least one unit objective is required'),
  prerequisiteKnowledge: z.array(z.string()).default([]),
  studentNeeds: z.string().default(''),
  teachingMethods: z.array(z.string()).default([]),
  weeklyPlans: z.array(WeeklyPlanSchema),
  finalAssessment: FinalAssessmentSchema,
  resourceList: z.array(ResourceItemSchema).default([]),
  teacherNotes: z.string().default(''),
  status: z.enum(['draft', 'completed', 'archived']).default('draft'),
  isDemo: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type StandardAlignment = z.infer<typeof StandardAlignmentSchema>;
export type LearningObjective = z.infer<typeof LearningObjectiveSchema>;
export type LessonActivity = z.infer<typeof LessonActivitySchema>;
export type FormativeAssessment = z.infer<typeof FormativeAssessmentSchema>;
export type Differentiation = z.infer<typeof DifferentiationSchema>;
export type Homework = z.infer<typeof HomeworkSchema>;
export type SessionPlan = z.infer<typeof SessionPlanSchema>;
export type WeeklyAssessment = z.infer<typeof WeeklyAssessmentSchema>;
export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;
export type FinalAssessment = z.infer<typeof FinalAssessmentSchema>;
export type ResourceItem = z.infer<typeof ResourceItemSchema>;
export type LessonPlan = z.infer<typeof LessonPlanSchema>;

// Input schema for the plan creation wizard
export const GeneratePlanInputSchema = z.object({
  title: z.string().min(3, 'Plan title or unit topic must be at least 3 characters'),
  subject: z.string().min(1, 'Please select or enter a subject'),
  gradeLevel: z.string().min(1, 'Please select a grade level'),
  curriculumFramework: z.string().min(1, 'Please specify educational system or curriculum'),
  standardsFramework: z.string().optional().default(''),
  durationWeeks: z.number().int().min(1).max(12),
  sessionsPerWeek: z.number().int().min(1).max(7),
  classDurationMinutes: z.number().int().min(15).max(180),
  format: z.enum(['calendar', 'session_sequence']).default('session_sequence'),
  priorKnowledge: z.string().optional().default(''),
  overallGoals: z.string().min(10, 'Please describe unit learning goals (at least 10 characters)'),
  studentNeeds: z.string().optional().default('Mixed-ability classroom with varied learning styles'),
  availableResources: z.string().optional().default('Standard classroom whiteboard, projector, student notebooks'),
  preferredTeachingMethods: z.array(z.string()).min(1, 'Select at least one preferred teaching method'),
  assessmentPreferences: z.string().optional().default('Formative checks daily and summative project at end of unit'),
  
  // Optional collapsible inputs
  classSize: z.number().int().positive().optional().default(25),
  teacherNotes: z.string().optional().default(''),
  textbookChapters: z.string().optional().default(''),
  holidaysOrBlackoutDates: z.string().optional().default(''),
  languageOfInstruction: z.string().optional().default('English'),
  proficiencyRange: z.string().optional().default('Standard grade-level distribution'),
  accommodations: z.string().optional().default('Visual aids, guided notes, extended time if needed'),
  requiredProjects: z.string().optional().default(''),
  enableHomework: z.boolean().default(true),
});

export type GeneratePlanInput = z.infer<typeof GeneratePlanInputSchema>;

// Quick-start template definition
export interface PlanTemplate {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  durationWeeks: number;
  sessionsPerWeek: number;
  classDurationMinutes: number;
  curriculumFramework: string;
  standardsFramework: string;
  overallGoals: string;
  priorKnowledge: string;
  preferredTeachingMethods: string[];
  description: string;
  tag: string;
}
