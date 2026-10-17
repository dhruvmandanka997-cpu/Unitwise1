import { describe, it, expect, beforeEach } from 'vitest';
import { taskDb } from '../src/services/storage/taskDb';
import { planDb } from '../src/services/storage/db';
import { PedagogicalFallbackGenerator } from '../src/services/ai/pedagogicalFallback';
import { GeneratePlanRawInput } from '../src/models/plan';
import { calculateTaskStatus, TaskChecklistItem } from '../src/models/task';

describe('Teacher Task Tracker Engine & Persistence', () => {
  const generator = new PedagogicalFallbackGenerator();

  const testInput: GeneratePlanRawInput = {
    title: 'Cellular Respiration and Photosynthesis',
    subject: 'Biology',
    gradeLevel: 'Grade 10',
    curriculumFramework: 'NGSS',
    standardsFramework: 'HS-LS1-5',
    durationWeeks: 2,
    sessionsPerWeek: 3,
    classDurationMinutes: 55,
    format: 'session_sequence',
    priorKnowledge: 'Cell organelle functions, chloroplasts and mitochondria basics',
    overallGoals: 'Model matter and energy transformations during cellular respiration and photosynthesis.',
    studentNeeds: 'Visual models and tiered graphic organizers',
    availableResources: 'Microscopes, lab stations, interactive simulations',
    preferredTeachingMethods: ['Inquiry-Based Learning & Discovery'],
    assessmentPreferences: 'Formative lab analysis checks',
    enableHomework: true,
  };

  const samplePlan = generator.generate(testInput);

  beforeEach(() => {
    // Clear and re-sync
    planDb.save(samplePlan);
    taskDb.syncWithPlans([samplePlan]);
  });

  it('generates the 9 canonical pedagogical tasks for a plan with distinct statuses', () => {
    const tasks = taskDb.getByPlanId(samplePlan.id);
    expect(tasks).toHaveLength(9);

    const taskTypes = tasks.map(t => t.type);
    expect(taskTypes).toContain('plan_setup');
    expect(taskTypes).toContain('learning_objectives');
    expect(taskTypes).toContain('curriculum_standards');
    expect(taskTypes).toContain('assessment_rubric');
    expect(taskTypes).toContain('teaching_materials');
    expect(taskTypes).toContain('differentiation');
    expect(taskTypes).toContain('lesson_sequences');
    expect(taskTypes).toContain('finalize_plan');
    expect(taskTypes).toContain('export_share');

    // Every task must have one of the 4 valid statuses
    for (const task of tasks) {
      expect(['completed', 'in_progress', 'incomplete', 'pending']).toContain(task.status);
      expect(task.checklist.length).toBeGreaterThanOrEqual(2);
      expect(task.nextActionLabel).toBeTruthy();
      expect(task.nextActionTab).toBeTruthy();
    }
  });

  it('calculates status strictly and prevents contradictory states', () => {
    const checklist: TaskChecklistItem[] = [
      { id: '1', label: 'Item 1', completed: false, isRequired: true },
      { id: '2', label: 'Item 2', completed: false, isRequired: true },
    ];

    // Case 1: Prerequisite blocked -> always pending
    expect(calculateTaskStatus({
      checklist,
      hasPrerequisiteBlocked: true,
      validationErrorsCount: 0,
    })).toBe('pending');

    // Case 2: No prerequisite, 0 items checked, no validation errors -> pending
    expect(calculateTaskStatus({
      checklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: 0,
    })).toBe('pending');

    // Case 3: 0 items checked, has validation errors -> incomplete
    expect(calculateTaskStatus({
      checklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: 1,
    })).toBe('incomplete');

    // Case 4: Some items checked -> in_progress
    checklist[0].completed = true;
    expect(calculateTaskStatus({
      checklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: 0,
    })).toBe('in_progress');

    // Case 5: All required items checked -> completed
    checklist[1].completed = true;
    expect(calculateTaskStatus({
      checklist,
      hasPrerequisiteBlocked: false,
      validationErrorsCount: 0,
    })).toBe('completed');
  });

  it('dynamically updates parent status when toggling checklist items and preserves across queries', () => {
    const tasks = taskDb.getByPlanId(samplePlan.id);
    const materialsTask = tasks.find(t => t.type === 'teaching_materials')!;
    expect(materialsTask).toBeDefined();

    // Toggle all checklist items to true
    for (const item of materialsTask.checklist) {
      taskDb.toggleChecklist(materialsTask.id, item.id, true);
    }

    const updatedTask = taskDb.getById(materialsTask.id)!;
    expect(updatedTask.status).toBe('completed');
    expect(updatedTask.checklist.every(c => c.completed)).toBe(true);

    // Toggle one item off -> becomes in_progress
    taskDb.toggleChecklist(materialsTask.id, materialsTask.checklist[0].id, false);
    const recheckedTask = taskDb.getById(materialsTask.id)!;
    expect(recheckedTask.status).toBe('in_progress');
  });

  it('calculates accurate overall stats and handles zero tasks without division errors', () => {
    const stats = taskDb.getStats(samplePlan.id);
    expect(stats.total).toBe(9);
    expect(stats.completed + stats.inProgress + stats.incomplete + stats.pending).toBe(9);
    expect(stats.completionPercentage).toBeGreaterThanOrEqual(0);
    expect(stats.completionPercentage).toBeLessThanOrEqual(100);

    // Test zero tasks case
    const zeroStats = taskDb.getStats('non_existent_plan_id');
    expect(zeroStats.total).toBe(0);
    expect(zeroStats.completed).toBe(0);
    expect(zeroStats.inProgress).toBe(0);
    expect(zeroStats.incomplete).toBe(0);
    expect(zeroStats.pending).toBe(0);
    expect(zeroStats.completionPercentage).toBe(0);
    expect(Number.isNaN(zeroStats.completionPercentage)).toBe(false);
  });

  it('filters tasks by status and searches by title', () => {
    const allTasks = taskDb.getAll({ planId: samplePlan.id });
    expect(allTasks.length).toBe(9);

    const pendingTasks = taskDb.getAll({ planId: samplePlan.id, status: 'pending' });
    for (const t of pendingTasks) {
      expect(t.status).toBe('pending');
    }

    const searchResults = taskDb.getAll({ search: 'Assessment' });
    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults.some(t => t.title.includes('Assessment'))).toBe(true);
  });
});
