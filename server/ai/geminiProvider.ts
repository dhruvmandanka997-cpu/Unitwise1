import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAIProvider } from './provider';
import { GeneratePlanInput, LessonPlan, SessionPlan, WeeklyPlan, LessonPlanSchema } from '../../src/types/plan';
import { PedagogicalFallbackGenerator } from './pedagogicalFallback';

export class GeminiAIProvider implements IAIProvider {
  public readonly name = 'Google Gemini';
  private fallbackGen: PedagogicalFallbackGenerator;

  constructor() {
    this.fallbackGen = new PedagogicalFallbackGenerator();
  }

  public isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 10 && !key.includes('your_'));
  }

  public async generatePlan(input: GeneratePlanInput): Promise<LessonPlan> {
    if (!this.isAvailable()) {
      console.log('Gemini API key not configured or demo mode active. Using Pedagogical Fallback Generator.');
      return this.fallbackGen.generate(input);
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY!;
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const prompt = `
You are an expert pedagogical curriculum designer, backward-design specialist, and master educator.
Generate a comprehensive, rigorous multi-week instructional plan matching the following teacher specifications:

Topic / Unit Title: "${input.title}"
Subject: "${input.subject}"
Grade Level: "${input.gradeLevel}"
Curriculum Framework: "${input.curriculumFramework}"
Standards Framework: "${input.standardsFramework || 'General Educational Standards'}"
Duration: ${input.durationWeeks} weeks
Sessions Per Week: ${input.sessionsPerWeek} days
Class Duration: ${input.classDurationMinutes} minutes per session
Format: ${input.format}
Overall Goals: "${input.overallGoals}"
Prior Knowledge: "${input.priorKnowledge || 'Standard prior grade foundations'}"
Student Needs: "${input.studentNeeds || 'Differentiated mixed-ability classroom'}"
Available Resources: "${input.availableResources || 'Standard classroom materials'}"
Preferred Teaching Methods: ${JSON.stringify(input.preferredTeachingMethods)}
Assessment Preferences: "${input.assessmentPreferences || 'Formative checks daily and summative unit evaluation'}"
Homework Enabled: ${input.enableHomework}

CRITICAL PEDAGOGICAL & SCHEDULE CONSTRAINTS:
1. SCHEDULE RIGOR: You MUST generate EXACTLY ${input.durationWeeks} weekly plans.
2. In EACH weekly plan, you MUST generate EXACTLY ${input.sessionsPerWeek} session plans.
   Total session count across the entire plan MUST BE EXACTLY ${input.durationWeeks * input.sessionsPerWeek}.
3. TIME RIGOR: In every session plan, the sum of durationMinutes across all 6 phases of lessonSequence (opening, direct_instruction, guided_practice, collaborative_independent, formative_assessment, closure) MUST equal EXACTLY ${input.classDurationMinutes} minutes.
4. OBJECTIVE RIGOR: Objectives MUST use observable Bloom's taxonomy verbs (Identify, Calculate, Analyze, Evaluate, Construct, etc.). Avoid vague verbs like "understand" or "learn".
5. STANDARDS HONESTY: For any standard included, accurately label its verificationStatus as 'verified' if verified against the curriculum framework, 'teacher_provided' if provided by the teacher, or 'suggested_unverified'. Never invent false claims of official certification.
6. FORMATIVE ASSESSMENTS: Every session must have a concrete, actionable formative assessment (type, measures, promptOrQuestion, evidenceOfLearning, interpretationGuide, nextInstructionalStep).
7. DIFFERENTIATION: Include concrete strategies for support, on-level, advanced, ELL, and modalities/accommodations.

Output must be a valid JSON object matching the LessonPlan structure:
{
  "id": "generated_id",
  "title": "${input.title}",
  "subject": "${input.subject}",
  "gradeLevel": "${input.gradeLevel}",
  "curriculumFramework": "${input.curriculumFramework}",
  "standardsFramework": "${input.standardsFramework}",
  "durationWeeks": ${input.durationWeeks},
  "sessionsPerWeek": ${input.sessionsPerWeek},
  "classDurationMinutes": ${input.classDurationMinutes},
  "format": "${input.format}",
  "unitOverview": "string",
  "unitObjectives": ["string", "string"],
  "prerequisiteKnowledge": ["string"],
  "studentNeeds": "string",
  "teachingMethods": [...],
  "weeklyPlans": [
    {
      "id": "week_1",
      "weekNumber": 1,
      "title": "string",
      "theme": "string",
      "learningGoals": ["string"],
      "vocabulary": ["string"],
      "prerequisites": ["string"],
      "sessions": [
        {
          "id": "sess_1_1",
          "sessionNumber": 1,
          "dayNumber": 1,
          "weekNumber": 1,
          "title": "string",
          "topic": "string",
          "durationMinutes": ${input.classDurationMinutes},
          "objectives": [
            {
              "id": "obj_1",
              "description": "string with action verb",
              "bloomLevel": "Understanding",
              "successCriterion": "string"
            }
          ],
          "successCriteria": ["string"],
          "standards": [
            {
              "id": "std_1",
              "framework": "string",
              "code": "string",
              "description": "string",
              "lessonConnection": "string",
              "verificationStatus": "suggested_unverified"
            }
          ],
          "lessonSequence": [
            {
              "phase": "opening",
              "title": "Opening & Retrieval Warm-Up",
              "durationMinutes": number,
              "description": "string",
              "teacherAction": "string",
              "studentAction": "string",
              "materials": ["string"]
            },
            ... direct_instruction, guided_practice, collaborative_independent, formative_assessment, closure
          ],
          "formativeAssessment": {
            "type": "string",
            "measures": "string",
            "promptOrQuestion": "string",
            "evidenceOfLearning": "string",
            "interpretationGuide": "string",
            "nextInstructionalStep": "string"
          },
          "differentiation": {
            "support": "string",
            "onLevel": "string",
            "advanced": "string",
            "ell": "string",
            "modalitiesOrAccommodations": "string"
          },
          "homework": {
            "enabled": ${input.enableHomework},
            "task": "string",
            "estimatedMinutes": number,
            "optionalChallenge": "string",
            "realWorldConnection": "string"
          },
          "materials": ["string"]
        }
      ],
      "weeklyAssessment": {
        "type": "string",
        "description": "string",
        "checkpointCriteria": ["string"]
      },
      "weeklyResources": ["string"],
      "reflectionPrompt": "string",
      "teacherNotes": "string"
    }
  ],
  "finalAssessment": {
    "title": "string",
    "type": "Culminating Project",
    "description": "string",
    "rubric": [
      {
        "criterion": "string",
        "weightPercentage": 25,
        "exemplary": "string",
        "proficient": "string",
        "developing": "string",
        "beginning": "string"
      }
    ]
  },
  "resourceList": [
    {
      "category": "Digital",
      "title": "string",
      "description": "string",
      "sourceOrUrl": "string"
    }
  ],
  "teacherNotes": "string",
  "status": "draft",
  "isDemo": false,
  "createdAt": "${new Date().toISOString()}",
  "updatedAt": "${new Date().toISOString()}"
}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      // Validate through Zod
      const validated = LessonPlanSchema.safeParse(parsed);
      if (validated.success) {
        // Enforce strict schedule checks
        return this.enforceScheduleIntegrity(validated.data, input);
      } else {
        console.warn('Gemini response schema validation failed, falling back to pedagogical generator:', validated.error.format());
        return this.fallbackGen.generate(input);
      }
    } catch (err) {
      console.error('Error in Gemini generation, using reliable fallback:', err);
      return this.fallbackGen.generate(input);
    }
  }

  public async regenerateSession(
    plan: LessonPlan,
    weekNumber: number,
    sessionNumber: number,
    instruction?: string
  ): Promise<SessionPlan> {
    if (!this.isAvailable()) {
      return this.fallbackGen.generateSessionPlan({
        planId: plan.id,
        weekNumber,
        dayNumber: ((sessionNumber - 1) % plan.sessionsPerWeek) + 1,
        sessionNumber,
        totalSessions: plan.durationWeeks * plan.sessionsPerWeek,
        topicTitle: plan.title,
        subject: plan.subject,
        gradeLevel: plan.gradeLevel,
        durationMinutes: plan.classDurationMinutes,
        weekTheme: plan.weeklyPlans.find((w) => w.weekNumber === weekNumber)?.theme || plan.title,
        standardsFramework: plan.standardsFramework,
        enableHomework: true,
      });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY!;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json', temperature: 0.5 },
      });

      const existingWeek = plan.weeklyPlans.find((w) => w.weekNumber === weekNumber);
      const existingSession = existingWeek?.sessions.find((s) => s.sessionNumber === sessionNumber);

      const prompt = `
Regenerate a single daily lesson plan (Session ${sessionNumber}, Week ${weekNumber}) for:
Unit: "${plan.title}"
Subject: "${plan.subject}"
Grade: "${plan.gradeLevel}"
Class Duration: ${plan.classDurationMinutes} minutes
Weekly Theme: "${existingWeek?.theme || 'Core Theme'}"
Teacher Instruction / Customization Request: "${instruction || 'Enhance pedagogical engagement and clarity'}"

Current Session (if available):
${existingSession ? JSON.stringify(existingSession) : 'None'}

Return ONLY a valid JSON object matching the SessionPlan schema.
Ensure phases sum up to exactly ${plan.classDurationMinutes} minutes.
`;

      const res = await model.generateContent(prompt);
      const parsed = JSON.parse(res.response.text());
      return parsed as SessionPlan;
    } catch (err) {
      console.error('Error regenerating session with Gemini, using fallback:', err);
      return this.fallbackGen.generateSessionPlan({
        planId: plan.id,
        weekNumber,
        dayNumber: ((sessionNumber - 1) % plan.sessionsPerWeek) + 1,
        sessionNumber,
        totalSessions: plan.durationWeeks * plan.sessionsPerWeek,
        topicTitle: plan.title,
        subject: plan.subject,
        gradeLevel: plan.gradeLevel,
        durationMinutes: plan.classDurationMinutes,
        weekTheme: plan.weeklyPlans.find((w) => w.weekNumber === weekNumber)?.theme || plan.title,
        standardsFramework: plan.standardsFramework,
        enableHomework: true,
      });
    }
  }

  public async regenerateWeek(
    plan: LessonPlan,
    weekNumber: number,
    instruction?: string
  ): Promise<WeeklyPlan> {
    // Regenerate each session in this week
    const targetWeek = plan.weeklyPlans.find((w) => w.weekNumber === weekNumber);
    if (!targetWeek) {
      throw new Error(`Week ${weekNumber} not found in plan`);
    }

    const updatedSessions: SessionPlan[] = [];
    for (const session of targetWeek.sessions) {
      const regeneratedSession = await this.regenerateSession(
        plan,
        weekNumber,
        session.sessionNumber,
        instruction
      );
      updatedSessions.push(regeneratedSession);
    }

    return {
      ...targetWeek,
      title: instruction ? `${targetWeek.title} (Adapted: ${instruction})` : targetWeek.title,
      sessions: updatedSessions,
    };
  }

  private enforceScheduleIntegrity(plan: LessonPlan, input: GeneratePlanInput): LessonPlan {
    const expectedWeeks = input.durationWeeks;
    const expectedSessionsPerWeek = input.sessionsPerWeek;

    // Ensure correct number of weeks
    let weeklyPlans = [...plan.weeklyPlans];
    if (weeklyPlans.length !== expectedWeeks) {
      if (weeklyPlans.length > expectedWeeks) {
        weeklyPlans = weeklyPlans.slice(0, expectedWeeks);
      } else {
        const fallback = this.fallbackGen.generate(input);
        for (let i = weeklyPlans.length; i < expectedWeeks; i++) {
          weeklyPlans.push(fallback.weeklyPlans[i]);
        }
      }
    }

    // Ensure correct number of sessions per week
    let globalSessionNumber = 1;
    weeklyPlans = weeklyPlans.map((week, wIndex) => {
      const weekNumber = wIndex + 1;
      let sessions = [...week.sessions];
      if (sessions.length !== expectedSessionsPerWeek) {
        if (sessions.length > expectedSessionsPerWeek) {
          sessions = sessions.slice(0, expectedSessionsPerWeek);
        } else {
          for (let s = sessions.length; s < expectedSessionsPerWeek; s++) {
            sessions.push(
              this.fallbackGen.generateSessionPlan({
                planId: plan.id,
                weekNumber,
                dayNumber: s + 1,
                sessionNumber: globalSessionNumber + s,
                totalSessions: expectedWeeks * expectedSessionsPerWeek,
                topicTitle: input.title,
                subject: input.subject,
                gradeLevel: input.gradeLevel,
                durationMinutes: input.classDurationMinutes,
                weekTheme: week.theme,
                standardsFramework: input.standardsFramework || input.curriculumFramework,
                enableHomework: input.enableHomework,
              })
            );
          }
        }
      }

      // Re-index sessions cleanly
      sessions = sessions.map((sess, sIndex) => {
        const sessNum = globalSessionNumber++;
        return {
          ...sess,
          sessionNumber: sessNum,
          dayNumber: sIndex + 1,
          weekNumber,
          durationMinutes: input.classDurationMinutes,
        };
      });

      return {
        ...week,
        weekNumber,
        sessions,
      };
    });

    return {
      ...plan,
      durationWeeks: expectedWeeks,
      sessionsPerWeek: expectedSessionsPerWeek,
      classDurationMinutes: input.classDurationMinutes,
      weeklyPlans,
    };
  }
}
