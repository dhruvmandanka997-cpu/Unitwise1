import { PlanTemplate } from '../types/plan';

export const QUICK_START_TEMPLATES: PlanTemplate[] = [
  {
    id: 'algebra-1-linear-functions',
    title: 'Linear Functions, Rates of Change & Real-World Modeling',
    subject: 'Mathematics',
    gradeLevel: 'Grade 9',
    durationWeeks: 4,
    sessionsPerWeek: 5,
    classDurationMinutes: 50,
    curriculumFramework: 'US Common Core Mathematics',
    standardsFramework: 'CCSS.MATH.CONTENT.HSA.CED.A.2, HSF.IF.B.4, HSF.LE.A.2',
    overallGoals: 'Students will understand linear relationships conceptually, algebraically, and graphically. They will master slope as a constant rate of change, formulate linear models for authentic real-world phenomena, solve systems of linear equations, and interpret slope/y-intercept in contextual problem scenarios.',
    priorKnowledge: 'Understanding of the coordinate plane, integers, basic one-step equation solving, and ratio concepts.',
    preferredTeachingMethods: ['Guided Problem Solving', 'Direct Instruction & Modeling', 'Collaborative Small Groups', 'Real-world Application Tasks'],
    description: 'A comprehensive 4-week, 20-session unit covering slope, linear equations in multiple forms, graphing, systems, and modeling real-world data.',
    tag: 'STEM / High School'
  },
  {
    id: 'ngss-ecosystems-energy-flow',
    title: 'Ecosystem Dynamics, Food Webs & Energy Flow',
    subject: 'Science',
    gradeLevel: 'Grade 5',
    durationWeeks: 3,
    sessionsPerWeek: 5,
    classDurationMinutes: 45,
    curriculumFramework: 'Next Generation Science Standards (NGSS)',
    standardsFramework: 'NGSS 5-PS3-1, 5-LS1-1, 5-LS2-1',
    overallGoals: 'Develop a systems-level model of matter cycling and energy flow in terrestrial and aquatic ecosystems. Students will analyze food chains and webs, investigate the role of decomposers, and simulate human environmental impacts on biome biodiversity.',
    priorKnowledge: 'Basic plant parts, living vs. non-living things, primary habitats.',
    preferredTeachingMethods: ['Inquiry-Based Learning', 'Hands-on Experiments/Simulations', 'Visual Diagramming', 'Socratic Questioning'],
    description: '3-week interactive elementary/middle science inquiry unit exploring producers, consumers, energy pyramids, and biome conservation.',
    tag: 'Elementary / Science'
  },
  {
    id: 'rhetorical-analysis-argumentation',
    title: 'Rhetorical Devices & Persuasive Writing Mastery',
    subject: 'English Language Arts',
    gradeLevel: 'Grade 10',
    durationWeeks: 4,
    sessionsPerWeek: 4,
    classDurationMinutes: 60,
    curriculumFramework: 'US Common Core ELA / AP Pre-Cap',
    standardsFramework: 'CCSS.ELA-LITERACY.RI.9-10.1, RI.9-10.6, W.9-10.1',
    overallGoals: 'Empower students to deconstruct seminal historical and contemporary speeches through the rhetorical triangle (Ethos, Pathos, Logos). Students will analyze authorial intent, evaluate evidence quality, and craft their own evidence-backed persuasive op-ed.',
    priorKnowledge: 'Paragraph structure, basic thesis statements, identifying main idea and supporting details.',
    preferredTeachingMethods: ['Socratic Seminar', 'Close Reading Workshops', 'Peer Revision Cycles', 'Direct Instruction'],
    description: 'Deep dive into persuasion, rhetorical appeals, identifying logical fallacies, and structuring convincing written arguments.',
    tag: 'Humanities / Secondary'
  },
  {
    id: 'intro-python-computational-thinking',
    title: 'Computational Thinking & Python Programming Fundamentals',
    subject: 'Computer Science',
    gradeLevel: 'Grade 8',
    durationWeeks: 2,
    sessionsPerWeek: 5,
    classDurationMinutes: 50,
    curriculumFramework: 'CSTA K-12 Computer Science Standards',
    standardsFramework: 'CSTA 2-AP-10, 2-AP-11, 2-AP-12, 2-AP-13',
    overallGoals: 'Introduce foundational computational concepts through hands-on Python scripts: variables, data types, conditional branching (if/else), loops, and basic debugging. Students will design an interactive text-based adventure program demonstrating algorithmic decomposition.',
    priorKnowledge: 'Basic typing and keyboard skills, introductory math coordinate knowledge.',
    preferredTeachingMethods: ['Project-Based Learning', 'Pair Programming', 'Live Coding Demonstrations', 'Interactive Debugging Labs'],
    description: 'Engaging 2-week coding unit building confidence with syntax, logic flows, problem decomposition, and working code projects.',
    tag: 'Computer Science'
  }
];

export const SUBJECT_OPTIONS = [
  'Mathematics',
  'Science (General / Integrated)',
  'Biology',
  'Chemistry',
  'Physics',
  'English Language Arts',
  'World History & Social Studies',
  'Geography',
  'Computer Science & Coding',
  'Foreign Languages',
  'Visual Arts & Design',
  'Music & Performing Arts',
  'Physical Education & Health',
  'Economics & Business Studies',
  'Environmental Systems & Ecology',
  'Custom Subject'
];

export const GRADE_OPTIONS = [
  'Kindergarten',
  'Grade 1 (Elementary)',
  'Grade 2 (Elementary)',
  'Grade 3 (Elementary)',
  'Grade 4 (Elementary)',
  'Grade 5 (Elementary)',
  'Grade 6 (Middle School)',
  'Grade 7 (Middle School)',
  'Grade 8 (Middle School)',
  'Grade 9 (High School / Freshman)',
  'Grade 10 (High School / Sophomore)',
  'Grade 11 (High School / Junior)',
  'Grade 12 (High School / Senior)',
  'College / University (Undergraduate)',
  'Vocational / Adult Education'
];

export const CURRICULUM_OPTIONS = [
  'US Common Core & Next Generation Science Standards (NGSS)',
  'UK National Curriculum (Key Stages 1-4 / GCSE)',
  'International Baccalaureate (IB Primary / Middle Years / Diploma)',
  'Cambridge Assessment International Education (CAIE / IGCSE)',
  'Australian National Curriculum (ACARA)',
  'CBSE / ICSE (India)',
  'State Standards / Department of Education Guidelines',
  'Custom / Institutional Curriculum'
];

export const TEACHING_METHOD_OPTIONS = [
  'Inquiry-Based Learning & Discovery',
  'Explicit Instruction & Teacher Modeling (I Do, We Do, You Do)',
  'Guided Problem Solving & Scaffolding',
  'Project-Based Learning (PBL)',
  'Socratic Seminar & Structured Discussion',
  'Collaborative Small-Group Workshops',
  'Hands-on Lab Experiments & Physical Models',
  'Differentiated Learning Stations',
  'Flipped Classroom & Student-Led Presentations'
];
