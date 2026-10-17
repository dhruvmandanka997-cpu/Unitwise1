import { describe, it, expect } from 'vitest';
import { PedagogicalFallbackGenerator } from '../src/services/ai/pedagogicalFallback';
import { GeneratePlanRawInput, LessonPlanSchema } from '../src/models/plan';
import { aiEngine } from '../src/services/ai';

describe('Pedagogical Schedule & Schema Validation', () => {
  const generator = new PedagogicalFallbackGenerator();

  it('generates exactly 20 planned sessions for a 4-week, 5-day-per-week plan', () => {
    const input: GeneratePlanRawInput = {
      title: 'Linear Functions and Rate of Change',
      subject: 'Mathematics',
      gradeLevel: 'Grade 9',
      curriculumFramework: 'US Common Core',
      standardsFramework: 'CCSS.MATH.CONTENT.HSA.CED.A.2',
      durationWeeks: 4,
      sessionsPerWeek: 5,
      classDurationMinutes: 50,
      format: 'session_sequence',
      priorKnowledge: 'Coordinate plane, linear patterns',
      overallGoals: 'Understand slope-intercept form, calculate rates of change, and construct real-world predictive models.',
      studentNeeds: 'Differentiated practice sets',
      availableResources: 'Graph paper, whiteboards, graphing calculators',
      preferredTeachingMethods: ['Explicit Instruction & Teacher Modeling (I Do, We Do, You Do)'],
      assessmentPreferences: 'Daily exit slips',
      enableHomework: true,
    };

    const plan = generator.generate(input);

    expect(plan.durationWeeks).toBe(4);
    expect(plan.sessionsPerWeek).toBe(5);
    expect(plan.weeklyPlans).toHaveLength(4);

    const totalSessions = plan.weeklyPlans.reduce((acc, w) => acc + w.sessions.length, 0);
    expect(totalSessions).toBe(20);

    // Verify session numbering is contiguous 1 through 20
    const sessionNumbers = plan.weeklyPlans.flatMap(w => w.sessions.map(s => s.sessionNumber));
    expect(sessionNumbers).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('guarantees every session has measurable learning objectives with action verbs and success criteria', () => {
    const input: GeneratePlanRawInput = {
      title: 'Ecosystem Dynamics',
      subject: 'Science',
      gradeLevel: 'Grade 5',
      curriculumFramework: 'NGSS',
      standardsFramework: 'NGSS 5-LS2-1',
      durationWeeks: 2,
      sessionsPerWeek: 4,
      classDurationMinutes: 45,
      format: 'session_sequence',
      overallGoals: 'Model energy flow in food webs and examine biome interactions.',
      preferredTeachingMethods: ['Inquiry-Based Learning & Discovery'],
      enableHomework: false,
    };

    const plan = generator.generate(input);

    for (const week of plan.weeklyPlans) {
      for (const session of week.sessions) {
        expect(session.objectives.length).toBeGreaterThanOrEqual(1);
        for (const obj of session.objectives) {
          expect(obj.description).toBeTruthy();
          expect(obj.bloomLevel).toBeDefined();
          expect(obj.successCriterion).toBeTruthy();
          // Verify Bloom level is a recognized level
          expect(['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating']).toContain(obj.bloomLevel);
        }
      }
    }
  });

  it('guarantees every session has a complete formative assessment and differentiation', () => {
    const input: GeneratePlanRawInput = {
      title: 'Rhetorical Analysis',
      subject: 'English',
      gradeLevel: 'Grade 10',
      curriculumFramework: 'Common Core ELA',
      standardsFramework: '',
      durationWeeks: 3,
      sessionsPerWeek: 5,
      classDurationMinutes: 60,
      format: 'session_sequence',
      overallGoals: 'Deconstruct historical speeches using ethos, pathos, and logos.',
      preferredTeachingMethods: ['Socratic Seminar & Structured Discussion'],
      enableHomework: true,
    };

    const plan = generator.generate(input);

    for (const week of plan.weeklyPlans) {
      for (const session of week.sessions) {
        // Formative assessment fields
        expect(session.formativeAssessment.type).toBeTruthy();
        expect(session.formativeAssessment.measures).toBeTruthy();
        expect(session.formativeAssessment.promptOrQuestion).toBeTruthy();
        expect(session.formativeAssessment.evidenceOfLearning).toBeTruthy();
        expect(session.formativeAssessment.interpretationGuide).toBeTruthy();
        expect(session.formativeAssessment.nextInstructionalStep).toBeTruthy();

        // Differentiation tiers
        expect(session.differentiation.support).toBeTruthy();
        expect(session.differentiation.onLevel).toBeTruthy();
        expect(session.differentiation.advanced).toBeTruthy();
        expect(session.differentiation.ell).toBeTruthy();
      }
    }
  });

  it('strictly validates lesson sequence timing matches class duration', () => {
    const input: GeneratePlanRawInput = {
      title: 'Python Algorithmic Thinking',
      subject: 'Computer Science',
      gradeLevel: 'Grade 8',
      curriculumFramework: 'CSTA',
      standardsFramework: '',
      durationWeeks: 1,
      sessionsPerWeek: 5,
      classDurationMinutes: 50,
      format: 'session_sequence',
      overallGoals: 'Variables, loops, and conditions in Python.',
      preferredTeachingMethods: ['Project-Based Learning (PBL)'],
      enableHomework: false,
    };

    const plan = generator.generate(input);

    for (const week of plan.weeklyPlans) {
      for (const session of week.sessions) {
        const totalPhaseMinutes = session.lessonSequence.reduce(
          (sum, phase) => sum + phase.durationMinutes,
          0
        );
        expect(totalPhaseMinutes).toBe(50);
      }
    }
  });

  it('honestly labels standards as suggested_unverified when unverified', () => {
    const input: GeneratePlanRawInput = {
      title: 'World War I Perspectives',
      subject: 'World History & Social Studies',
      gradeLevel: 'Grade 11 (High School / Junior)',
      curriculumFramework: 'State Standards',
      standardsFramework: '',
      durationWeeks: 2,
      sessionsPerWeek: 3,
      classDurationMinutes: 55,
      format: 'session_sequence',
      overallGoals: 'Analyze causes and global ramifications of WWI.',
      preferredTeachingMethods: ['Socratic Seminar & Structured Discussion'],
      enableHomework: true,
    };

    const plan = generator.generate(input);

    for (const week of plan.weeklyPlans) {
      for (const session of week.sessions) {
        for (const std of session.standards) {
          expect(std.verificationStatus).toBe('suggested_unverified');
        }
      }
    }
  });

  it('validates the complete generated plan against LessonPlanSchema', () => {
    const input: GeneratePlanRawInput = {
      title: 'Cellular Respiration and Photosynthesis',
      subject: 'Biology',
      gradeLevel: 'Grade 9',
      curriculumFramework: 'NGSS',
      standardsFramework: 'HS-LS1-5',
      durationWeeks: 2,
      sessionsPerWeek: 5,
      classDurationMinutes: 45,
      format: 'session_sequence',
      overallGoals: 'Understand ATP production and the carbon cycle.',
      preferredTeachingMethods: ['Hands-on Lab Experiments & Physical Models'],
      enableHomework: true,
    };

    const plan = generator.generate(input);
    const parsed = LessonPlanSchema.safeParse(plan);
    expect(parsed.success).toBe(true);
  });
});
