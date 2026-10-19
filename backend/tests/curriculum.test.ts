import { describe, it, expect, beforeEach } from 'vitest';
import { 
  CURRICULUM_CATALOG, 
  findCountry, 
  findCurriculum, 
  findRegion, 
  sanitizeFreeText, 
  resolveCurriculumLabels 
} from '../src/config/curriculumCatalog';
import { 
  validateCurriculumPreferences, 
  buildCurriculumSnapshot,
  CurriculumPreferencesSchema,
  CurriculumContextSnapshotSchema
} from '../src/models/curriculum';
import { LessonPlanSchema, LessonPlan, GeneratePlanRawInput } from '../src/models/plan';
import { PlanDatabase, planDb } from '../src/services/storage/db';
import { aiEngine } from '../src/services/ai';
import { PedagogicalFallbackGenerator } from '../src/services/ai/pedagogicalFallback';

describe('Curriculum Preferences & Catalog Architecture', () => {

  describe('1. Curriculum Catalog Schema & Dependency Rules', () => {
    it('contains versioned catalog with supported options notice', () => {
      expect(CURRICULUM_CATALOG.catalogVersion).toBe('1.0.0');
      expect(CURRICULUM_CATALOG.notice).toBeDefined();
      expect(CURRICULUM_CATALOG.countries.length).toBeGreaterThanOrEqual(6);
    });

    it('validates India catalog entries and state board dependencies', () => {
      const india = findCountry('in');
      expect(india).toBeDefined();
      expect(india?.name).toBe('India');

      // Check CBSE
      const cbse = findCurriculum('in', 'cbse');
      expect(cbse).toBeDefined();
      expect(cbse?.type).toBe('national');
      expect(cbse?.typeBadgeLabel).toBe('National Board');
      expect(cbse?.requiresRegion).toBe(false);
      expect(cbse?.gradeOptions).toContain('Class 8');
      expect(cbse?.spelling).toBe('UK');
      expect(cbse?.measurementSystem).toBe('metric');

      // Check ICSE
      const icse = findCurriculum('in', 'icse');
      expect(icse).toBeDefined();
      expect(icse?.type).toBe('national');

      // Check State Board
      const stateBoard = findCurriculum('in', 'in-state-board');
      expect(stateBoard).toBeDefined();
      expect(stateBoard?.requiresRegion).toBe(true);
      expect(stateBoard?.regionLabel).toBe('State / Union Territory');
      expect(stateBoard?.regions?.length).toBeGreaterThanOrEqual(30);

      // Verify specific states
      const gujarat = findRegion('in', 'in-state-board', 'gujarat');
      expect(gujarat?.name).toBe('Gujarat');
      const maharashtra = findRegion('in', 'in-state-board', 'maharashtra');
      expect(maharashtra?.name).toBe('Maharashtra');

      // Check NIOS, IB, Cambridge
      expect(findCurriculum('in', 'nios')).toBeDefined();
      expect(findCurriculum('in', 'in-ib')?.type).toBe('international');
      expect(findCurriculum('in', 'in-cambridge')?.type).toBe('international');
    });

    it('validates United States catalog entries and state standards', () => {
      const us = findCountry('us');
      expect(us).toBeDefined();

      const ccss = findCurriculum('us', 'us-ccss');
      expect(ccss?.label).toContain('Common Core');
      expect(ccss?.spelling).toBe('US');
      expect(ccss?.measurementSystem).toBe('us_customary');

      const ngss = findCurriculum('us', 'us-ngss');
      expect(ngss?.label).toContain('Next Generation Science Standards');

      const stateStandards = findCurriculum('us', 'us-state-standards');
      expect(stateStandards?.requiresRegion).toBe(true);
      expect(stateStandards?.regions?.length).toBe(50);
      expect(findRegion('us', 'us-state-standards', 'tx')?.name).toBe('Texas');
      expect(findRegion('us', 'us-state-standards', 'ca')?.name).toBe('California');

      expect(findCurriculum('us', 'us-ap')?.type).toBe('exam-board');
    });

    it('validates United Kingdom catalog entries', () => {
      const uk = findCountry('uk');
      expect(uk).toBeDefined();

      const england = findCurriculum('uk', 'uk-national-england');
      expect(england?.gradeScheme).toBe('key-stage');
      expect(england?.gradeOptions).toContain('Key Stage 4 / GCSE (Years 10-11)');

      expect(findCurriculum('uk', 'uk-scotland')?.label).toContain('Scotland');
      expect(findCurriculum('uk', 'uk-wales')?.label).toContain('Wales');
      expect(findCurriculum('uk', 'uk-ni')?.label).toContain('Northern Ireland');
      expect(findCurriculum('uk', 'uk-exam-boards')?.type).toBe('exam-board');
    });

    it('validates Australia and Canada catalog entries', () => {
      const au = findCountry('au');
      expect(au).toBeDefined();
      const acara = findCurriculum('au', 'au-acara');
      expect(acara?.gradeOptions).toContain('Foundation Year');

      const auState = findCurriculum('au', 'au-state-territory');
      expect(auState?.requiresRegion).toBe(true);
      expect(findRegion('au', 'au-state-territory', 'nsw')?.name).toContain('New South Wales');

      const ca = findCountry('ca');
      expect(ca).toBeDefined();
      const caProv = findCurriculum('ca', 'ca-provincial');
      expect(caProv?.requiresRegion).toBe(true);
      expect(findRegion('ca', 'ca-provincial', 'on')?.name).toBe('Ontario');
    });
  });

  describe('2. Preferences Validation & Free-Text Sanitization', () => {
    it('validates and accepts valid curriculum preferences', () => {
      const valid = {
        countryId: 'in',
        curriculumId: 'cbse',
        defaultGrade: 'Class 8',
        updatedAt: new Date().toISOString(),
      };

      const result = validateCurriculumPreferences(valid);
      expect(result.success).toBe(true);
      expect(result.data?.countryId).toBe('in');
      expect(result.data?.curriculumId).toBe('cbse');
    });

    it('rejects unknown country ID or unknown curriculum ID', () => {
      const invalidCountry = {
        countryId: 'non_existent_country',
        curriculumId: 'cbse',
        updatedAt: new Date().toISOString(),
      };
      const res1 = validateCurriculumPreferences(invalidCountry);
      expect(res1.success).toBe(false);
      expect(res1.errors?.countryId).toBeDefined();

      const invalidCurr = {
        countryId: 'in',
        curriculumId: 'fake_curriculum_board',
        updatedAt: new Date().toISOString(),
      };
      const res2 = validateCurriculumPreferences(invalidCurr);
      expect(res2.success).toBe(false);
      expect(res2.errors?.curriculumId).toBeDefined();
    });

    it('enforces required region when curriculum.requiresRegion is true', () => {
      const missingRegion = {
        countryId: 'in',
        curriculumId: 'in-state-board',
        regionId: '',
        updatedAt: new Date().toISOString(),
      };
      const res = validateCurriculumPreferences(missingRegion);
      expect(res.success).toBe(false);
      expect(res.errors?.regionId).toContain('Please choose a State / Union Territory');

      const validWithRegion = {
        countryId: 'in',
        curriculumId: 'in-state-board',
        regionId: 'gujarat',
        defaultGrade: 'Class 9',
        updatedAt: new Date().toISOString(),
      };
      const validRes = validateCurriculumPreferences(validWithRegion);
      expect(validRes.success).toBe(true);
    });

    it('sanitizes and strips malicious HTML and control characters from untrusted text', () => {
      const malicious = '<script>alert("hack")</script><b>Custom Syllabus</b>\x00\x1F';
      const clean = sanitizeFreeText(malicious, 80);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<b>');
      expect(clean).toBe('alert("hack")Custom Syllabus');

      // Test length truncation
      const longText = 'A'.repeat(120);
      const truncated = sanitizeFreeText(longText, 80);
      expect(truncated.length).toBe(80);
    });

    it('requires free-text description when selecting "Other" country or curriculum', () => {
      const otherCountryMissing = {
        countryId: 'other',
        curriculumId: 'other-custom',
        otherCountryText: '',
        otherCurriculumText: 'Custom Curriculum',
        updatedAt: new Date().toISOString(),
      };
      const res = validateCurriculumPreferences(otherCountryMissing);
      expect(res.success).toBe(false);
      expect(res.errors?.otherCountryText).toBeDefined();
    });
  });

  describe('3. Human-Readable Labels & Snapshot Builder', () => {
    it('constructs accurate label summary string for standard boards', () => {
      const labels = resolveCurriculumLabels('in', 'cbse', undefined, 'Class 8');
      expect(labels.country).toBe('India');
      expect(labels.curriculum).toContain('CBSE');
      expect(labels.grade).toBe('Class 8');
      expect(labels.summary).toBe('India · CBSE (Central Board of Secondary Education) · Class 8');
    });

    it('constructs formatted label with region for state boards', () => {
      const labels = resolveCurriculumLabels('in', 'in-state-board', 'gujarat', 'Class 10');
      expect(labels.country).toBe('India');
      expect(labels.region).toBe('Gujarat');
      expect(labels.summary).toContain('State Board (SCERT / State Secondary Board) (Gujarat)');
      expect(labels.summary).toContain('Class 10');
    });

    it('builds immutable snapshot with catalogVersion', () => {
      const snapshot = buildCurriculumSnapshot({
        countryId: 'us',
        curriculumId: 'us-ccss',
        grade: 'Grade 9',
        subject: 'Mathematics',
        topic: 'Algebra 1',
        source: 'preferences',
      });

      expect(snapshot).toBeDefined();
      expect(snapshot?.catalogVersion).toBe('1.0.0');
      expect(snapshot?.source).toBe('preferences');
      expect(snapshot?.labels.country).toBe('United States');
      expect(snapshot?.labels.curriculum).toContain('Common Core');
    });
  });

  describe('4. Persistence & Snapshot Immutability Rules', () => {
    let db: PlanDatabase;

    beforeEach(() => {
      db = new PlanDatabase();
    });

    it('ensures changing saved preferences NEVER modifies existing plans curriculumContext', async () => {
      // 1. Teacher sets India CBSE preferences
      db.saveCurriculumPreferences({
        countryId: 'in',
        curriculumId: 'cbse',
        defaultGrade: 'Class 8',
        catalogVersion: '1.0.0',
        updatedAt: new Date().toISOString(),
      });

      // 2. Generate plan A under CBSE preferences
      const planA = await aiEngine.generatePlan({
        title: 'Photosynthesis & Plant Respiration',
        subject: 'Science',
        gradeLevel: 'Class 8',
        durationWeeks: 2,
        sessionsPerWeek: 4,
        classDurationMinutes: 45,
        format: 'session_sequence',
        overallGoals: 'Understand chlorophyll, light reactions, and carbon fixation.',
        preferredTeachingMethods: ['Explicit Instruction & Teacher Modeling (I Do, We Do, You Do)'],
        enableHomework: true,
      });

      expect(planA.curriculumContext).toBeDefined();
      expect(planA.curriculumContext?.countryId).toBe('in');
      expect(planA.curriculumContext?.curriculumId).toBe('cbse');
      expect(planA.curriculumContext?.source).toBe('preferences');
      expect(planA.curriculumContext?.labels.summary).toContain('CBSE');

      db.save(planA);

      // 3. Teacher switches global preferences to United States NGSS Grade 5
      db.saveCurriculumPreferences({
        countryId: 'us',
        curriculumId: 'us-ngss',
        defaultGrade: 'Grade 5',
        catalogVersion: '1.0.0',
        updatedAt: new Date().toISOString(),
      });

      // 4. Retrieve plan A from database and verify curriculumContext was NOT altered
      const retrievedPlanA = db.getById(planA.id);
      expect(retrievedPlanA).toBeDefined();
      expect(retrievedPlanA?.curriculumContext?.countryId).toBe('in');
      expect(retrievedPlanA?.curriculumContext?.curriculumId).toBe('cbse');
      expect(retrievedPlanA?.curriculumContext?.labels.country).toBe('India');
      expect(retrievedPlanA?.curriculumContext?.labels.summary).toContain('CBSE');
    });

    it('enforces precedence: per-plan override > saved preferences > fallback', async () => {
      // Saved preferences: India CBSE
      db.saveCurriculumPreferences({
        countryId: 'in',
        curriculumId: 'cbse',
        defaultGrade: 'Class 8',
        catalogVersion: '1.0.0',
        updatedAt: new Date().toISOString(),
      });

      // User initiates generation with explicit override for UK Edexcel GCSE
      const overriddenPlan = await aiEngine.generatePlan({
        title: 'British History & Industrial Revolution',
        subject: 'History',
        gradeLevel: 'GCSE Year 10',
        countryId: 'uk',
        curriculumId: 'uk-exam-boards',
        curriculumSource: 'override',
        durationWeeks: 2,
        sessionsPerWeek: 3,
        classDurationMinutes: 50,
        format: 'session_sequence',
        overallGoals: 'Analyze social transformations, urbanization, and economic models in Victorian Britain.',
        preferredTeachingMethods: ['Guided Problem Solving & Scaffolding'],
        enableHomework: false,
      });

      expect(overriddenPlan.curriculumContext?.countryId).toBe('uk');
      expect(overriddenPlan.curriculumContext?.curriculumId).toBe('uk-exam-boards');
      expect(overriddenPlan.curriculumContext?.source).toBe('override');
      expect(overriddenPlan.curriculumContext?.labels.country).toBe('United Kingdom');

      // Verify that saved preferences remained unchanged
      const currentPrefs = db.getCurriculumPreferences();
      expect(currentPrefs?.countryId).toBe('in');
      expect(currentPrefs?.curriculumId).toBe('cbse');
    });
  });

  describe('5. Backward Compatibility & Standards Honesty', () => {
    it('safely validates and loads older plans with no curriculumContext', () => {
      const generator = new PedagogicalFallbackGenerator();
      const legacyPlan = generator.generate({
        title: 'Legacy Plan without curriculumContext',
        subject: 'Mathematics',
        gradeLevel: 'Grade 9',
        durationWeeks: 2,
        sessionsPerWeek: 5,
        classDurationMinutes: 50,
      });

      delete (legacyPlan as any).curriculumContext;

      // Ensure LessonPlanSchema parses legacy plan safely
      const parsed = LessonPlanSchema.safeParse(legacyPlan);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.curriculumContext).toBeUndefined();
      }
    });

    it('enforces that standards are labeled suggested_unverified unless officially confirmed', async () => {
      const plan = await aiEngine.generatePlan({
        title: 'Chemical Reactions and Catalysts',
        subject: 'Chemistry',
        gradeLevel: 'Grade 10',
        countryId: 'us',
        curriculumId: 'us-ngss',
        durationWeeks: 1,
        sessionsPerWeek: 3,
        classDurationMinutes: 45,
        format: 'session_sequence',
        overallGoals: 'Investigate reaction rates, catalysts, and activation energy.',
        preferredTeachingMethods: ['Inquiry-Based Learning & Discovery'],
        enableHomework: true,
      });

      // Verify standards in sessions have verificationStatus: 'suggested_unverified'
      const standards = plan.weeklyPlans.flatMap(w => w.sessions.flatMap(s => s.standards));
      expect(standards.length).toBeGreaterThan(0);
      for (const std of standards) {
        expect(std.verificationStatus).toBe('suggested_unverified');
        expect(std.lessonConnection).toContain('Suggested');
      }
    });
  });
});
