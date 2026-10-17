import { IAIProvider } from './provider';
import { GeminiAIProvider } from './geminiProvider';
import { GeneratePlanInput, GeneratePlanInputSchema, LessonPlan, SessionPlan, WeeklyPlan } from '../../models/plan';

export class AIEngine {
  private provider: IAIProvider;

  constructor() {
    this.provider = new GeminiAIProvider();
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  public isLiveAiAvailable(): boolean {
    return this.provider.isAvailable();
  }

  public async generatePlan(rawInput: unknown): Promise<LessonPlan> {
    // 1. Validate input strictly with Zod
    const validationResult = GeneratePlanInputSchema.safeParse(rawInput);
    if (!validationResult.success) {
      throw new Error(`Invalid plan generation inputs: ${validationResult.error.issues.map(i => i.message).join(', ')}`);
    }

    const input = validationResult.data;

    // 2. Execute plan generation
    let plan = await this.provider.generatePlan(input);

    // 3. Guarantee schedule invariant: durationWeeks * sessionsPerWeek === total sessions
    const totalExpectedSessions = input.durationWeeks * input.sessionsPerWeek;
    const actualSessions = plan.weeklyPlans.reduce((acc, w) => acc + w.sessions.length, 0);

    if (actualSessions !== totalExpectedSessions || plan.weeklyPlans.length !== input.durationWeeks) {
      console.warn(`Schedule mismatch detected (${actualSessions} actual vs ${totalExpectedSessions} expected). Enforcing schedule normalization.`);
      // Enforce normalization
      plan = this.normalizeSchedule(plan, input);
    }

    return plan;
  }

  public async regenerateSession(
    plan: LessonPlan,
    weekNumber: number,
    sessionNumber: number,
    instruction?: string
  ): Promise<SessionPlan> {
    return this.provider.regenerateSession(plan, weekNumber, sessionNumber, instruction);
  }

  public async regenerateWeek(
    plan: LessonPlan,
    weekNumber: number,
    instruction?: string
  ): Promise<WeeklyPlan> {
    return this.provider.regenerateWeek(plan, weekNumber, instruction);
  }

  public async adaptSession(
    plan: LessonPlan,
    weekNumber: number,
    sessionNumber: number,
    adaptationType: 'simplify' | 'interactive' | 'differentiation' | 'shorten' | 'low_resource'
  ): Promise<SessionPlan> {
    const instructions: Record<string, string> = {
      simplify: `Adapt this lesson for younger or struggling students: simplify vocabulary, break complex steps down into smaller bite-sized components, add visual scaffolding, and reduce cognitive load while keeping core objectives intact.`,
      interactive: `Adapt this lesson to be highly collaborative, hands-on, and inquiry-driven: convert teacher lecturing into student-led investigation stations, peer think-pair-share, or interactive manipulatives.`,
      differentiation: `Enhance differentiation across all learner tiers: expand Tier 1 support scaffolds (visual word banks, sentence starters), Tier 2 on-level extension, and Tier 3 gifted challenge tasks (non-routine analysis, generalizing formulas).`,
      shorten: `Re-allocate the timing tightly so every phase is crisp and efficient without exceeding ${plan.classDurationMinutes} minutes, prioritizing the core modeling and formative exit ticket.`,
      low_resource: `Adapt this lesson to limited classroom resources: replace high-tech or expensive lab requirements with accessible everyday materials, paper-and-pencil organizers, whiteboard diagrams, and structured verbal protocols.`
    };

    const instruction = instructions[adaptationType] || 'Enhance instructional quality';
    return this.provider.regenerateSession(plan, weekNumber, sessionNumber, instruction);
  }

  private normalizeSchedule(plan: LessonPlan, input: GeneratePlanInput): LessonPlan {
    let globalSessionNumber = 1;
    const normalizedWeeks: WeeklyPlan[] = [];

    for (let w = 0; w < input.durationWeeks; w++) {
      const weekNumber = w + 1;
      const existingWeek = plan.weeklyPlans[w];
      const weekTheme = existingWeek ? existingWeek.theme : `Week ${weekNumber}: Mastery Phase`;
      const weekTitle = existingWeek ? existingWeek.title : `Week ${weekNumber}: ${input.title}`;

      const sessions: SessionPlan[] = [];
      for (let s = 0; s < input.sessionsPerWeek; s++) {
        const sessNumber = globalSessionNumber++;
        const existingSession = existingWeek?.sessions[s];

        if (existingSession) {
          sessions.push({
            ...existingSession,
            sessionNumber: sessNumber,
            dayNumber: s + 1,
            weekNumber,
            durationMinutes: input.classDurationMinutes,
          });
        } else {
          // If a session was missing, create one based on the first session or theme
          const base = existingWeek?.sessions[0] || plan.weeklyPlans[0]?.sessions[0];
          sessions.push({
            id: `sess_norm_${plan.id}_w${weekNumber}_s${sessNumber}`,
            sessionNumber: sessNumber,
            dayNumber: s + 1,
            weekNumber,
            title: `Lesson ${sessNumber}: Applied Investigation in ${weekTheme}`,
            topic: `Core Application ${sessNumber}`,
            durationMinutes: input.classDurationMinutes,
            objectives: base?.objectives || [
              {
                id: `obj_norm_${sessNumber}_1`,
                description: `Analyze and apply key principles of ${weekTheme} with precision.`,
                bloomLevel: 'Applying',
                successCriterion: `I can independently complete the application exercise.`
              }
            ],
            successCriteria: base?.successCriteria || [`I can execute the procedure accurately.`],
            standards: base?.standards || [],
            lessonSequence: base?.lessonSequence || [
              {
                phase: 'opening',
                title: 'Retrieval Warm-Up',
                durationMinutes: Math.round(input.classDurationMinutes * 0.15),
                description: 'Brief retrieval practice prompt activating prior knowledge.',
                teacherAction: 'Circulate and review baseline responses.',
                studentAction: 'Record warm-up responses.',
                materials: ['Warm-up journals']
              },
              {
                phase: 'direct_instruction',
                title: 'Explicit Modeling',
                durationMinutes: Math.round(input.classDurationMinutes * 0.35),
                description: 'Model key concept with worked examples.',
                teacherAction: 'Demonstrate step-by-step thinking.',
                studentAction: 'Take structured guided notes.',
                materials: ['Whiteboard / slides']
              },
              {
                phase: 'guided_practice',
                title: 'Guided Application',
                durationMinutes: Math.round(input.classDurationMinutes * 0.25),
                description: 'Scaffolded practice with immediate feedback.',
                teacherAction: 'Coach and monitor student pairs.',
                studentAction: 'Work through problem set with partner.',
                materials: ['Problem sheet']
              },
              {
                phase: 'closure',
                title: 'Exit Ticket & Wrap Up',
                durationMinutes: input.classDurationMinutes - (Math.round(input.classDurationMinutes * 0.15) + Math.round(input.classDurationMinutes * 0.35) + Math.round(input.classDurationMinutes * 0.25)),
                description: 'Formative exit ticket.',
                teacherAction: 'Collect and sort responses.',
                studentAction: 'Complete exit slip independently.',
                materials: ['Exit tickets']
              }
            ],
            formativeAssessment: base?.formativeAssessment || {
              type: 'Exit Ticket Check',
              measures: 'Application of daily concept',
              promptOrQuestion: 'Solve the check question and explain the reasoning.',
              evidenceOfLearning: 'Correct method and justification.',
              interpretationGuide: 'Check for conceptual fidelity.',
              nextInstructionalStep: 'Address misconceptions in next warm-up.'
            },
            differentiation: base?.differentiation || {
              support: 'Step-by-step graphic organizer',
              onLevel: 'Standard practice set',
              advanced: 'Non-routine extension problem',
              ell: 'Bilingual glossary and sentence stems',
              modalitiesOrAccommodations: 'Visual representations and guided notes'
            },
            homework: {
              enabled: input.enableHomework,
              task: input.enableHomework ? 'Complete 3 review problems' : '',
              estimatedMinutes: input.enableHomework ? 15 : 0,
              optionalChallenge: '',
              realWorldConnection: '',
            },
            materials: ['Student workbook', 'Interactive display', 'Exit slips']
          });
        }
      }

      normalizedWeeks.push({
        id: existingWeek ? existingWeek.id : `week_norm_${plan.id}_${weekNumber}`,
        weekNumber,
        title: weekTitle,
        theme: weekTheme,
        learningGoals: existingWeek?.learningGoals || [`Master core concepts for week ${weekNumber}`],
        vocabulary: existingWeek?.vocabulary || ['Analysis', 'Application', 'Evidence'],
        prerequisites: existingWeek?.prerequisites || ['Foundational prerequisite knowledge'],
        sessions,
        weeklyAssessment: existingWeek?.weeklyAssessment || {
          type: 'Weekly Checkpoint',
          description: `Assessment covering Week ${weekNumber} goals.`,
          checkpointCriteria: ['Accurate concept demonstration']
        },
        weeklyResources: existingWeek?.weeklyResources || ['Guided student notes'],
        reflectionPrompt: existingWeek?.reflectionPrompt || `Reflect on student mastery for week ${weekNumber}.`,
        teacherNotes: existingWeek?.teacherNotes || ''
      });
    }

    return {
      ...plan,
      durationWeeks: input.durationWeeks,
      sessionsPerWeek: input.sessionsPerWeek,
      classDurationMinutes: input.classDurationMinutes,
      weeklyPlans: normalizedWeeks,
    };
  }
}

export const aiEngine = new AIEngine();
