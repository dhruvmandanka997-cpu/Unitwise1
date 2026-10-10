import { describe, it, expect, beforeEach } from 'vitest';
import { PlanDatabase } from '../server/storage/db';
import { PedagogicalFallbackGenerator } from '../server/ai/pedagogicalFallback';
import { aiEngine } from '../server/ai';

describe('Plan Persistence & Lesson Adaptation Engine', () => {
  let db: PlanDatabase;
  const generator = new PedagogicalFallbackGenerator();

  beforeEach(() => {
    db = new PlanDatabase();
  });

  it('persists, updates, and retrieves a curriculum plan correctly', () => {
    const originalPlan = generator.generate({
      title: 'Introductory Fractions & Number Sense',
      subject: 'Mathematics',
      gradeLevel: 'Grade 3 (Elementary)',
      curriculumFramework: 'US Common Core',
      standardsFramework: '',
      durationWeeks: 2,
      sessionsPerWeek: 5,
      classDurationMinutes: 40,
      format: 'session_sequence',
      overallGoals: 'Understand unit fractions and represent fractions on number lines.',
      preferredTeachingMethods: ['Guided Problem Solving & Scaffolding'],
      enableHomework: false,
    });

    // Save to db
    db.save(originalPlan);
    const retrieved = db.getById(originalPlan.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Introductory Fractions & Number Sense');

    // Update title
    const updated = db.update(originalPlan.id, { title: 'Fractions & Proportions Mastery' });
    expect(updated?.title).toBe('Fractions & Proportions Mastery');

    const retrievedAgain = db.getById(originalPlan.id);
    expect(retrievedAgain?.title).toBe('Fractions & Proportions Mastery');
  });

  it('duplicates a plan cleanly with a new ID and title marked (Copy)', () => {
    const originalPlan = generator.generate({
      title: 'Shakespearean Drama & Rhetoric',
      subject: 'English Language Arts',
      gradeLevel: 'Grade 10',
      curriculumFramework: 'Common Core',
      standardsFramework: '',
      durationWeeks: 3,
      sessionsPerWeek: 4,
      classDurationMinutes: 55,
      format: 'session_sequence',
      overallGoals: 'Analyze Macbeth through dramatic irony and theme.',
      preferredTeachingMethods: ['Socratic Seminar & Structured Discussion'],
      enableHomework: true,
    });

    db.save(originalPlan);
    const clone = db.duplicate(originalPlan.id);

    expect(clone).toBeDefined();
    expect(clone?.id).not.toBe(originalPlan.id);
    expect(clone?.title).toBe('Shakespearean Drama & Rhetoric (Copy)');
    expect(clone?.weeklyPlans.length).toBe(originalPlan.weeklyPlans.length);
  });

  it('regenerates a single lesson without modifying unrelated lessons', async () => {
    const plan = generator.generate({
      title: 'Chemical Reactions and Conservation of Mass',
      subject: 'Chemistry',
      gradeLevel: 'Grade 10',
      curriculumFramework: 'NGSS',
      standardsFramework: 'HS-PS1-7',
      durationWeeks: 2,
      sessionsPerWeek: 5,
      classDurationMinutes: 50,
      format: 'session_sequence',
      overallGoals: 'Balance chemical equations and calculate molar ratios.',
      preferredTeachingMethods: ['Hands-on Lab Experiments & Physical Models'],
      enableHomework: true,
    });

    const originalLesson1 = JSON.stringify(plan.weeklyPlans[0].sessions[0]);
    const originalLesson2 = JSON.stringify(plan.weeklyPlans[0].sessions[1]);

    // Regenerate lesson 1
    const regeneratedLesson1 = await aiEngine.regenerateSession(
      plan,
      1,
      1,
      'Focus intensely on visual balancing manipulatives'
    );

    expect(regeneratedLesson1.sessionNumber).toBe(1);
    expect(regeneratedLesson1.durationMinutes).toBe(50);

    // Verify Lesson 2 remains unchanged
    const currentLesson2 = JSON.stringify(plan.weeklyPlans[0].sessions[1]);
    expect(currentLesson2).toBe(originalLesson2);
  });

  it('adapts a lesson to be more interactive without corrupting schedule', async () => {
    const plan = generator.generate({
      title: 'Python Data Structures',
      subject: 'Computer Science',
      gradeLevel: 'Grade 9',
      curriculumFramework: 'CSTA',
      standardsFramework: '',
      durationWeeks: 2,
      sessionsPerWeek: 4,
      classDurationMinutes: 60,
      format: 'session_sequence',
      overallGoals: 'Lists, dictionaries, and iteration in Python.',
      preferredTeachingMethods: ['Project-Based Learning (PBL)'],
      enableHomework: true,
    });

    const adapted = await aiEngine.adaptSession(plan, 1, 3, 'interactive');

    expect(adapted.sessionNumber).toBe(3);
    expect(adapted.durationMinutes).toBe(60);
    const totalMinutes = adapted.lessonSequence.reduce((sum, p) => sum + p.durationMinutes, 0);
    expect(totalMinutes).toBe(60);
  });
});
