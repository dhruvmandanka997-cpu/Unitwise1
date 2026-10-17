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

export interface TaskChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  notes?: string;
  isRequired?: boolean;
}

export interface TaskValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface TeacherTask {
  id: string;
  planId: string;
  planTitle: string;
  subject: string;
  gradeLevel: string;
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  manualOverride?: boolean;
  checklist: TaskChecklistItem[];
  prerequisiteTaskId?: string;
  prerequisiteTitle?: string;
  validationIssues: TaskValidationIssue[];
  missingExplanation: string;
  nextActionLabel: string;
  nextActionTab?: string;
  dueDate?: string;
  teacherNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  incomplete: number;
  pending: number;
  completionPercentage: number;
}
