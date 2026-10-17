import { GeneratePlanInput, LessonPlan, SessionPlan, WeeklyPlan } from '../../models/plan';

export interface IAIProvider {
  readonly name: string;
  isAvailable(): boolean;
  generatePlan(input: GeneratePlanInput): Promise<LessonPlan>;
  regenerateSession(
    plan: LessonPlan,
    weekNumber: number,
    sessionNumber: number,
    instruction?: string
  ): Promise<SessionPlan>;
  regenerateWeek(
    plan: LessonPlan,
    weekNumber: number,
    instruction?: string
  ): Promise<WeeklyPlan>;
}
