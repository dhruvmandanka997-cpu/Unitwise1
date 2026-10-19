import { describe, it, expect, beforeEach } from 'vitest';
import { searchController } from '../src/controllers/searchController';
import { searchService } from '../src/services/search/searchService';
import { planDb } from '../src/services/storage/db';
import { directoryDb } from '../src/services/directory/directoryDb';
import { LessonPlan } from '../src/models/plan';
import { DbCurriculum, DbStandardRecord } from '../src/services/directory/types';

function createMockHttp(options: {
  query?: Record<string, string>;
  headers?: Record<string, string>;
  ip?: string;
}) {
  const req: any = {
    query: options.query || {},
    headers: options.headers || {},
    ip: options.ip || '127.0.0.1',
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => responseData,
  };
}

describe('Global Search API & Security Model', () => {
  const testPlanUserA: LessonPlan = {
    id: 'test_plan_user_a',
    title: 'Photosynthesis & Plant Biology',
    subject: 'Biology',
    gradeLevel: 'Grade 9',
    curriculumFramework: 'NGSS',
    standardsFramework: 'General',
    durationWeeks: 4,
    sessionsPerWeek: 3,
    classDurationMinutes: 50,
    format: 'session_sequence',
    unitOverview: 'Comprehensive study of cellular respiration and photosynthesis mechanisms.',
    unitObjectives: ['Explain light-dependent reactions', 'Describe the Calvin cycle'],
    prerequisiteKnowledge: ['Basic cell structure'],
    studentNeeds: 'Visual diagrams and lab experiments',
    teachingMethods: ['Inquiry-based learning'],
    weeklyPlans: [
      {
        id: 'week_user_a_1',
        weekNumber: 1,
        title: 'Introduction to Chloroplasts',
        theme: 'Chloroplast anatomy',
        learningGoals: ['Identify thylakoid membranes'],
        vocabulary: ['Stroma', 'Thylakoid'],
        prerequisites: [],
        sessions: [
          {
            id: 'sess_user_a_1',
            sessionNumber: 1,
            dayNumber: 1,
            weekNumber: 1,
            title: 'Chloroplast Structure Under Microscope',
            topic: 'Microscopic analysis of leaves',
            durationMinutes: 50,
            objectives: [
              {
                id: 'obj_1',
                description: 'Observe guard cells',
                bloomLevel: 'Understanding',
                successCriterion: 'Accurate sketch in lab notebook',
              },
            ],
            successCriteria: ['Accurate sketch in lab notebook'],
            standards: [],
            lessonSequence: [
              {
                phase: 'opening',
                title: 'Hook',
                durationMinutes: 10,
                description: 'Leaf examination',
                teacherAction: 'Display leaf',
                studentAction: 'Observe',
                materials: [],
              },
            ],
            formativeAssessment: {
              type: 'Exit ticket',
              measures: 'Structure recall',
              promptOrQuestion: 'Where does the light reaction occur?',
              evidenceOfLearning: 'Correct answer written',
              interpretationGuide: 'Check understanding',
              nextInstructionalStep: 'Review next day',
            },
            differentiation: {
              support: 'Labelled diagram provided',
              onLevel: 'Standard lab worksheet',
              advanced: 'Compare C3 and C4 plants',
              ell: 'Bilingual glossary',
              modalitiesOrAccommodations: 'Visual models',
            },
            homework: {
              enabled: true,
              task: 'Read chapter 4 and answer review questions',
              estimatedMinutes: 20,
            },
            materials: [],
          },
        ],
        weeklyAssessment: {
          type: 'Formative check',
          description: 'Weekly quiz',
          checkpointCriteria: ['Can identify chloroplast'],
        },
        weeklyResources: [],
        reflectionPrompt: 'What worked well?',
        teacherNotes: '',
      },
    ],
    finalAssessment: {
      title: 'Unit Exam on Photosynthesis',
      type: 'Summative',
      description: 'Multiple choice and open-response diagrams',
      rubric: [],
    },
    resourceList: [],
    references: [
      {
        id: 'ref_user_a_1',
        title: 'Khan Academy Photosynthesis Guide',
        sourceName: 'Khan Academy',
        url: 'https://www.khanacademy.org/science/biology/photosynthesis-in-plants',
        resourceType: 'article',
        category: 'articles',
        description: 'In-depth review of light-dependent reactions.',
        verified: 'verified',
        trustTier: 'reputable',
        linkStatus: 'reachable',
        origin: 'retrieved',
      },
    ],
    referencesStatus: 'ready',
    teacherNotes: '',
    status: 'completed',
    isDemo: false,
    userId: 'teacher_user_a',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const testPlanUserB: LessonPlan = {
    id: 'test_plan_user_b',
    title: 'Quantum Mechanics & Wave-Particle Duality',
    subject: 'Physics',
    gradeLevel: 'Grade 12',
    curriculumFramework: 'Advanced Placement',
    standardsFramework: 'General',
    durationWeeks: 3,
    sessionsPerWeek: 4,
    classDurationMinutes: 55,
    format: 'session_sequence',
    unitOverview: 'Introduction to Schrödinger equation, photons, and quantum tunneling.',
    unitObjectives: ['Understand wave function collapse'],
    prerequisiteKnowledge: ['Classical mechanics'],
    studentNeeds: 'Mathematical derivation aids',
    teachingMethods: ['Lectures and simulations'],
    weeklyPlans: [],
    finalAssessment: {
      title: 'Quantum Physics Problem Set',
      type: 'Summative',
      description: 'Derivations and numerical problems',
      rubric: [],
    },
    resourceList: [],
    references: [
      {
        id: 'ref_user_b_1',
        title: 'MIT OpenCourseWare Quantum Physics',
        sourceName: 'MIT OCW',
        url: 'https://ocw.mit.edu/courses/physics/8-04-quantum-physics-i-spring-2016/',
        resourceType: 'article',
        category: 'articles',
        description: 'Comprehensive undergraduate lecture notes on quantum theory.',
        verified: 'verified',
        trustTier: 'reputable',
        linkStatus: 'reachable',
        origin: 'retrieved',
      },
    ],
    referencesStatus: 'ready',
    teacherNotes: '',
    status: 'completed',
    isDemo: false,
    userId: 'teacher_user_b',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    planDb.save(testPlanUserA);
    planDb.save(testPlanUserB);
  });

  // 1. Authentication requirement (401)
  it('rejects unauthenticated search requests with status 401', () => {
    const http = createMockHttp({ query: { q: 'photosynthesis' } });
    searchController.search(http.req, http.res);

    expect(http.getStatus()).toBe(401);
    expect(http.getBody().error).toContain('Authentication required');
  });

  // 2. Per-user scoping (Critical security guarantee)
  it('strictly isolates plans and references per user: user A cannot see user B records', () => {
    // User A searches for Quantum (which belongs only to User B)
    const httpA = createMockHttp({
      query: { q: 'Quantum' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpA.req, httpA.res);

    expect(httpA.getStatus()).toBe(200);
    expect(httpA.getBody().results.plan).toHaveLength(0);
    expect(httpA.getBody().results.reference).toHaveLength(0);

    // User B searches for Quantum (which belongs to User B)
    const httpB = createMockHttp({
      query: { q: 'Quantum' },
      headers: { 'x-user-id': 'teacher_user_b' },
    });
    searchController.search(httpB.req, httpB.res);

    expect(httpB.getStatus()).toBe(200);
    expect(httpB.getBody().results.plan.length).toBeGreaterThanOrEqual(1);
    expect(httpB.getBody().results.plan[0].id).toBe('test_plan_user_b');
    expect(httpB.getBody().results.reference[0].id).toBe('ref_user_b_1');

    // User B searches for Photosynthesis (belongs only to User A)
    const httpBPhotosynthesis = createMockHttp({
      query: { q: 'Photosynthesis' },
      headers: { 'x-user-id': 'teacher_user_b' },
    });
    searchController.search(httpBPhotosynthesis.req, httpBPhotosynthesis.res);

    expect(httpBPhotosynthesis.getStatus()).toBe(200);
    expect(httpBPhotosynthesis.getBody().results.plan).toHaveLength(0);
    expect(httpBPhotosynthesis.getBody().results.reference).toHaveLength(0);
  });

  // 3. Short / empty queries
  it('returns empty results with status 200 and no error for queries under 2 characters', () => {
    const http1 = createMockHttp({
      query: { q: '' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(http1.req, http1.res);
    expect(http1.getStatus()).toBe(200);
    expect(http1.getBody().total).toBe(0);
    expect(http1.getBody().results.plan).toHaveLength(0);

    const http2 = createMockHttp({
      query: { q: 'p' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(http2.req, http2.res);
    expect(http2.getStatus()).toBe(200);
    expect(http2.getBody().total).toBe(0);
  });

  // 4. Case-insensitive and partial matching
  it('performs case-insensitive partial substring matching on plan titles, topics, and overview', () => {
    // Lowercase match
    const httpLower = createMockHttp({
      query: { q: 'photo' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpLower.req, httpLower.res);
    expect(httpLower.getStatus()).toBe(200);
    expect(httpLower.getBody().results.plan[0].title).toBe('Photosynthesis & Plant Biology');

    // Mixed-case match
    const httpMixed = createMockHttp({
      query: { q: 'pHoToSyNtHeSiS' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpMixed.req, httpMixed.res);
    expect(httpMixed.getStatus()).toBe(200);
    expect(httpMixed.getBody().results.plan[0].title).toBe('Photosynthesis & Plant Biology');

    // Match on session topic
    const httpTopic = createMockHttp({
      query: { q: 'microscopic' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpTopic.req, httpTopic.res);
    expect(httpTopic.getStatus()).toBe(200);
    expect(httpTopic.getBody().results.plan.length).toBeGreaterThan(0);
    expect(httpTopic.getBody().results.plan[0].id).toBe('test_plan_user_a');
  });

  // 5. Wildcard characters (% and _) treated literally
  it('treats SQL wildcards (% and _) literally without matching everything', () => {
    const httpPercent = createMockHttp({
      query: { q: '%' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpPercent.req, httpPercent.res);
    expect(httpPercent.getStatus()).toBe(200);
    expect(httpPercent.getBody().total).toBe(0);

    const httpDouble = createMockHttp({
      query: { q: '%%' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpDouble.req, httpDouble.res);
    expect(httpDouble.getStatus()).toBe(200);
    expect(httpDouble.getBody().total).toBe(0);

    const httpUnderscore = createMockHttp({
      query: { q: '__' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpUnderscore.req, httpUnderscore.res);
    expect(httpUnderscore.getStatus()).toBe(200);
    expect(httpUnderscore.getBody().total).toBe(0);
  });

  // 6. SQL injection resistance
  it('safely handles SQL injection attempts without crashing or leaking records', () => {
    const malicious = "' OR '1'='1' --";
    const httpMalicious = createMockHttp({
      query: { q: malicious },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpMalicious.req, httpMalicious.res);

    expect(httpMalicious.getStatus()).toBe(200);
    expect(httpMalicious.getBody().results.plan).toHaveLength(0);
    expect(httpMalicious.getBody().results.curriculum).toHaveLength(0);
  });

  // 7. Ranking order & category limits
  it('ranks exact and prefix matches above secondary fields, and honors category limits', () => {
    const http = createMockHttp({
      query: { q: 'Bio', limit: '2' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(http.req, http.res);

    expect(http.getStatus()).toBe(200);
    expect(http.getBody().results.plan.length).toBeLessThanOrEqual(2);
    if (http.getBody().results.plan.length > 0) {
      expect(http.getBody().results.plan[0].matchedField).toMatch(/title|subject/);
    }
  });

  // 8. Shared reference data: Curricula and Standards are accessible to all authenticated users
  it('returns shared curriculum and standards directory results for any authenticated user', () => {
    // Seed sample curriculum and standard
    const testCurr: DbCurriculum = {
      id: 'curr_test_search_cbse',
      orgId: 'org_in_cbse',
      name: 'Central Board of Secondary Education (CBSE India)',
      shortName: 'CBSE',
      scope: 'national',
      countryIso2: 'IN',
      educationPathway: 'k-12',
      gradeScheme: 'grade',
      gradeOptions: ['Grade 9', 'Grade 10'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'Board Exams',
      officialDomains: ['cbse.gov.in'],
      verificationStatus: 'verified',
    };
    directoryDb.upsertCurriculum(testCurr);

    const testStd: DbStandardRecord = {
      id: 'std_test_search_cbse_sci',
      curriculumId: 'curr_test_search_cbse',
      grade: 'Grade 9',
      subject: 'Science',
      code: 'CBSE-SCI-09-BIO-01',
      title: 'Fundamental Unit of Life - Cell Biology',
      description: 'Understanding eukaryotic and prokaryotic cellular structures.',
      alignmentType: 'verified',
    };
    directoryDb.upsertStandard(testStd);

    // User A can find CBSE
    const httpA = createMockHttp({
      query: { q: 'CBSE' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpA.req, httpA.res);

    expect(httpA.getStatus()).toBe(200);
    expect(httpA.getBody().results.curriculum.some((c: any) => c.id === 'curr_test_search_cbse')).toBe(true);
    expect(httpA.getBody().results.standard.some((s: any) => s.id === 'std_test_search_cbse_sci')).toBe(true);

    // User B can ALSO find CBSE (shared public reference data)
    const httpB = createMockHttp({
      query: { q: 'CBSE' },
      headers: { 'x-user-id': 'teacher_user_b' },
    });
    searchController.search(httpB.req, httpB.res);

    expect(httpB.getStatus()).toBe(200);
    expect(httpB.getBody().results.curriculum.some((c: any) => c.id === 'curr_test_search_cbse')).toBe(true);
    expect(httpB.getBody().results.standard.some((s: any) => s.id === 'std_test_search_cbse_sci')).toBe(true);
  });

  // 9. Bearer token authentication header support
  it('accepts Authorization Bearer tokens in addition to X-User-Id', () => {
    const httpBearer = createMockHttp({
      query: { q: 'Photosynthesis' },
      headers: { authorization: 'Bearer teacher_user_a' },
    });
    searchController.search(httpBearer.req, httpBearer.res);

    expect(httpBearer.getStatus()).toBe(200);
    expect(httpBearer.getBody().results.plan[0].id).toBe('test_plan_user_a');
  });

  // 10. Type filtering parameter
  it('supports filtering results by specific types (e.g. types=curriculum,standard)', () => {
    const httpTypes = createMockHttp({
      query: { q: 'Photosynthesis', types: 'curriculum,standard' },
      headers: { 'x-user-id': 'teacher_user_a' },
    });
    searchController.search(httpTypes.req, httpTypes.res);

    expect(httpTypes.getStatus()).toBe(200);
    expect(httpTypes.getBody().results.plan).toHaveLength(0);
    expect(httpTypes.getBody().results.reference).toHaveLength(0);
  });
});
