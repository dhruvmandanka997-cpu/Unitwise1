import fs from 'fs';
import path from 'path';
import { TeacherTask, TaskStats, TaskStatus, generateTasksForPlan, calculateTaskStatus } from '../../models/task';
import { LessonPlan } from '../../models/plan';
import { config } from '../../config';

const DATA_DIR = config.dataDir;
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export class TaskDatabase {
  private cache: Map<string, TeacherTask> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      ensureDir(DATA_DIR);
      if (fs.existsSync(TASKS_FILE)) {
        const raw = fs.readFileSync(TASKS_FILE, 'utf-8');
        const list: TeacherTask[] = JSON.parse(raw);
        this.cache.clear();
        for (const task of list) {
          this.cache.set(task.id, task);
        }
      } else {
        this.cache.clear();
        this.persist();
      }
      this.initialized = true;
    } catch (err) {
      console.error('Error initializing task database:', err);
      this.cache.clear();
    }
  }

  private persist() {
    try {
      ensureDir(DATA_DIR);
      const list = Array.from(this.cache.values());
      const tempFile = `${TASKS_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
      try {
        fs.renameSync(tempFile, TASKS_FILE);
      } catch {
        fs.copyFileSync(tempFile, TASKS_FILE);
        try { fs.unlinkSync(tempFile); } catch {}
      }
    } catch (err) {
      console.error('Failed to persist task database to file:', err);
    }
  }

  public getAll(filters?: { planId?: string; status?: TaskStatus | 'ALL' | string; search?: string }): TeacherTask[] {
    let list = Array.from(this.cache.values());

    if (filters?.planId && filters.planId !== 'ALL') {
      list = list.filter((t) => t.planId === filters.planId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((t) => t.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.planTitle.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.checklist.some((c) => c.label.toLowerCase().includes(q))
      );
    }

    // Sort order: Incomplete first, then In Progress, then Pending, then Completed
    const statusWeight: Record<TaskStatus, number> = {
      incomplete: 1,
      in_progress: 2,
      pending: 3,
      completed: 4,
    };

    return list.sort((a, b) => {
      const weightDiff = statusWeight[a.status] - statusWeight[b.status];
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  public getById(id: string): TeacherTask | undefined {
    return this.cache.get(id);
  }

  public getByPlanId(planId: string): TeacherTask[] {
    return Array.from(this.cache.values()).filter((t) => t.planId === planId);
  }

  public save(task: TeacherTask): TeacherTask {
    const updated: TeacherTask = {
      ...task,
      updatedAt: new Date().toISOString(),
    };
    this.cache.set(task.id, updated);
    this.persist();
    return updated;
  }

  public update(id: string, partial: Partial<TeacherTask>): TeacherTask | undefined {
    const existing = this.cache.get(id);
    if (!existing) return undefined;

    const merged: TeacherTask = {
      ...existing,
      ...partial,
      id, // keep stable id
      updatedAt: new Date().toISOString(),
    };

    // If checklist was updated, recalculate status if not explicitly overridden
    if (partial.checklist && !partial.manualOverride && !partial.status) {
      const hasPrereqBlocked = Boolean(
        merged.prerequisiteTaskId &&
        this.cache.get(merged.prerequisiteTaskId)?.status !== 'completed'
      );
      merged.status = calculateTaskStatus({
        checklist: merged.checklist,
        hasPrerequisiteBlocked: hasPrereqBlocked,
        validationErrorsCount: merged.validationIssues.filter((i) => i.severity === 'error').length,
        manualOverride: false,
      });
    }

    this.cache.set(id, merged);
    this.persist();
    return merged;
  }

  public toggleChecklist(taskId: string, itemId: string, completed: boolean): TeacherTask | undefined {
    const task = this.cache.get(taskId);
    if (!task) return undefined;

    const updatedChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, completed } : item
    );

    const hasPrereqBlocked = Boolean(
      task.prerequisiteTaskId &&
      this.cache.get(task.prerequisiteTaskId)?.status !== 'completed'
    );

    const newStatus = calculateTaskStatus({
      checklist: updatedChecklist,
      hasPrerequisiteBlocked: hasPrereqBlocked,
      validationErrorsCount: task.validationIssues.filter((i) => i.severity === 'error').length,
      manualOverride: false, // toggling checklist activates dynamic recalculation
    });

    const updatedTask: TeacherTask = {
      ...task,
      checklist: updatedChecklist,
      status: newStatus,
      manualOverride: false,
      updatedAt: new Date().toISOString(),
    };

    this.cache.set(taskId, updatedTask);
    this.persist();

    // Check if any dependent tasks need unblocking if this task just completed
    if (newStatus === 'completed') {
      for (const other of this.cache.values()) {
        if (other.prerequisiteTaskId === taskId && other.status === 'pending') {
          const unblockedStatus = calculateTaskStatus({
            checklist: other.checklist,
            hasPrerequisiteBlocked: false,
            validationErrorsCount: other.validationIssues.filter((i) => i.severity === 'error').length,
          });
          other.status = unblockedStatus;
          other.updatedAt = new Date().toISOString();
        }
      }
      this.persist();
    }

    return updatedTask;
  }

  public delete(id: string): boolean {
    const existed = this.cache.delete(id);
    if (existed) this.persist();
    return existed;
  }

  public deleteByPlanId(planId: string): number {
    let count = 0;
    for (const [id, task] of this.cache.entries()) {
      if (task.planId === planId) {
        this.cache.delete(id);
        count++;
      }
    }
    if (count > 0) this.persist();
    return count;
  }

  public restoreTasks(tasks: TeacherTask[]): void {
    for (const t of tasks) {
      this.cache.set(t.id, t);
    }
    this.persist();
  }

  /**
   * Synchronizes stored tasks with active plans.
   * - Generates tasks for newly created or imported plans.
   * - Updates plan titles, subjects, and grade levels.
   * - Preserves teacher edits, checked items, custom notes, and due dates.
   * - Cleans up orphaned tasks for deleted plans.
   */
  public syncWithPlans(plans: LessonPlan[]): void {
    const validPlanIds = new Set(plans.map((p) => p.id));

    // Remove orphaned tasks whose plans no longer exist
    for (const [id, task] of this.cache.entries()) {
      if (!validPlanIds.has(task.planId)) {
        this.cache.delete(id);
      }
    }

    // Generate or update tasks for each plan
    for (const plan of plans) {
      const generated = generateTasksForPlan(plan, this.cache);
      for (const t of generated) {
        // If task already exists in cache, preserve manualOverride, teacher notes, and dueDate
        const existing = this.cache.get(t.id);
        if (existing) {
          this.cache.set(t.id, {
            ...t,
            planTitle: plan.title,
            subject: plan.subject,
            gradeLevel: plan.gradeLevel,
            manualOverride: existing.manualOverride,
            status: existing.manualOverride ? existing.status : t.status,
            dueDate: existing.dueDate || t.dueDate,
            teacherNotes: existing.teacherNotes || t.teacherNotes,
            createdAt: existing.createdAt,
          });
        } else {
          this.cache.set(t.id, t);
        }
      }
    }

    this.persist();
  }

  /**
   * Calculates overall task metrics and completion percentage.
   * Handles 0-task edge case safely with 0% and no division errors.
   */
  public getStats(planId?: string): TaskStats {
    let tasks = Array.from(this.cache.values());
    if (planId && planId !== 'ALL') {
      tasks = tasks.filter((t) => t.planId === planId);
    }

    const total = tasks.length;
    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        incomplete: 0,
        pending: 0,
        completionPercentage: 0,
      };
    }

    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const incomplete = tasks.filter((t) => t.status === 'incomplete').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const completionPercentage = Math.round((completed / total) * 100);

    return {
      total,
      completed,
      inProgress,
      incomplete,
      pending,
      completionPercentage,
    };
  }
}

export const taskDb = new TaskDatabase();
