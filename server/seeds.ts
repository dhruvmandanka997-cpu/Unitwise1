import { LessonPlan } from '../src/types/plan';
import { PedagogicalFallbackGenerator } from './ai/pedagogicalFallback';

export function getSeedPlans(): LessonPlan[] {
  const gen = new PedagogicalFallbackGenerator();

  const algebraPlan = gen.generate({
    title: 'Linear Functions, Rates of Change & Real-World Modeling',
    subject: 'Mathematics',
    gradeLevel: 'Grade 9',
    curriculumFramework: 'US Common Core Mathematics',
    standardsFramework: 'CCSS.MATH.CONTENT.HSA.CED.A.2, HSF.IF.B.4',
    durationWeeks: 4,
    sessionsPerWeek: 5,
    classDurationMinutes: 50,
    format: 'session_sequence',
    overallGoals: 'Understand linear relationships, calculate rate of change, graph and write equations in slope-intercept and standard form, and construct mathematical models for real-world scenarios.',
    priorKnowledge: 'Coordinate graphing, integer operations, solving one-step equations.',
    studentNeeds: 'Diverse learners; include visual algebra tiles, worked examples, and non-routine challenge tasks.',
    availableResources: 'Desmos graphing calculator, student whiteboards, guided practice packets.',
    preferredTeachingMethods: ['Explicit Instruction & Teacher Modeling (I Do, We Do, You Do)', 'Guided Problem Solving & Scaffolding'],
    assessmentPreferences: 'Daily formative checks and end-of-unit performance modeling project.',
    enableHomework: true,
  });
  algebraPlan.id = 'plan_seed_algebra_1';
  algebraPlan.status = 'completed';

  const sciencePlan = gen.generate({
    title: 'Ecosystem Dynamics, Food Webs & Energy Flow',
    subject: 'Science',
    gradeLevel: 'Grade 5',
    curriculumFramework: 'Next Generation Science Standards (NGSS)',
    standardsFramework: 'NGSS 5-LS2-1, 5-PS3-1',
    durationWeeks: 3,
    sessionsPerWeek: 5,
    classDurationMinutes: 45,
    format: 'calendar',
    overallGoals: 'Develop a model to describe the movement of matter among plants, animals, decomposers, and the environment. Analyze food webs and energy flow.',
    priorKnowledge: 'Basic organism classification, parts of plants, habitats.',
    studentNeeds: 'Visual models, hands-on food web yarn simulations, bilingual vocabulary cards.',
    availableResources: 'Lab supplies, magnifying glasses, biome specimen cards.',
    preferredTeachingMethods: ['Inquiry-Based Learning & Discovery', 'Hands-on Lab Experiments & Physical Models'],
    assessmentPreferences: 'Biomes diorama and food web analysis report.',
    enableHomework: false,
  });
  sciencePlan.id = 'plan_seed_science_5';
  sciencePlan.status = 'completed';

  return [algebraPlan, sciencePlan];
}
