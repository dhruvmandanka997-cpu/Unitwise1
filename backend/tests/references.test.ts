import { describe, it, expect, vi } from 'vitest';
import { validateAndSanitizeUrl, isPrivateOrLocalIp, normalizeUrlForDedup } from '../src/services/references/urlValidator';
import { verifyResourceUrl } from '../src/services/references/linkVerifier';
import { evaluateTrustTier } from '../src/services/references/trustedDomains';
import { LessonPlanSchema, ReferenceMaterialSchema } from '../src/models/plan';
import { referenceService } from '../src/services/references/referenceService';
import { planDb } from '../src/services/storage/db';

describe('Reference Materials - URL Validator & SSRF Protection', () => {
  it('accepts safe https and http educational URLs', () => {
    const valid1 = validateAndSanitizeUrl('https://ncert.nic.in/textbook.php');
    expect(valid1.valid).toBe(true);
    expect(valid1.normalizedUrl).toBe('https://ncert.nic.in/textbook.php');

    const valid2 = validateAndSanitizeUrl('https://openstax.org/details/books/biology-2e?utm_source=newsletter&utm_medium=email');
    expect(valid2.valid).toBe(true);
    // Tracking parameters stripped
    expect(valid2.normalizedUrl).toBe('https://openstax.org/details/books/biology-2e');

    const valid3 = validateAndSanitizeUrl('http://phet.colorado.edu/en/simulations/filter?subjects=physics');
    expect(valid3.valid).toBe(true);
  });

  it('rejects dangerous schemes: javascript, data, file, vbscript', () => {
    expect(validateAndSanitizeUrl('javascript:alert(1)').valid).toBe(false);
    expect(validateAndSanitizeUrl('data:text/html;base64,PHNjcmlwdD4=').valid).toBe(false);
    expect(validateAndSanitizeUrl('file:///etc/passwd').valid).toBe(false);
    expect(validateAndSanitizeUrl('vbscript:msgbox(1)').valid).toBe(false);
    expect(validateAndSanitizeUrl('ftp://example.com/file').valid).toBe(false);
  });

  it('rejects malformed and nonsensical URLs', () => {
    expect(validateAndSanitizeUrl('').valid).toBe(false);
    expect(validateAndSanitizeUrl('not a url at all').valid).toBe(false);
    expect(validateAndSanitizeUrl('https://').valid).toBe(false);
  });

  it('blocks SSRF attempts on localhost, link-local, and private RFC 1918 IPs', () => {
    expect(isPrivateOrLocalIp('localhost')).toBe(true);
    expect(isPrivateOrLocalIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('127.0.1.1')).toBe(true);
    expect(isPrivateOrLocalIp('10.0.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('192.168.1.1')).toBe(true);
    expect(isPrivateOrLocalIp('172.16.0.1')).toBe(true);
    expect(isPrivateOrLocalIp('169.254.169.254')).toBe(true); // AWS/cloud metadata
    expect(isPrivateOrLocalIp('0.0.0.0')).toBe(true);
    expect(isPrivateOrLocalIp('::1')).toBe(true);

    expect(validateAndSanitizeUrl('http://localhost:8080/admin').valid).toBe(false);
    expect(validateAndSanitizeUrl('http://127.0.0.1/secrets').valid).toBe(false);
    expect(validateAndSanitizeUrl('http://169.254.169.254/latest/meta-data/').valid).toBe(false);
    expect(validateAndSanitizeUrl('http://192.168.1.50/dashboard').valid).toBe(false);

    // Public domains must pass
    expect(isPrivateOrLocalIp('khanacademy.org')).toBe(false);
    expect(isPrivateOrLocalIp('ncert.nic.in')).toBe(false);
    expect(isPrivateOrLocalIp('openstax.org')).toBe(false);
  });

  it('normalizes URLs and strips tracking parameters for accurate deduplication', () => {
    const u1 = 'HTTPS://NCERT.NIC.IN:443/textbook.php?utm_source=twitter&chapter=1#section2';
    const u2 = 'https://ncert.nic.in/textbook.php?chapter=1';
    
    const norm1 = normalizeUrlForDedup(u1);
    const norm2 = normalizeUrlForDedup(u2);
    expect(norm1).toBe(norm2);
  });
});

describe('Reference Materials - Trust Tier & Domain Authority', () => {
  it('correctly scores official education portals as official tier', () => {
    expect(evaluateTrustTier('https://ncert.nic.in/textbook.php', 'CBSE', 'India')).toBe('official');
    expect(evaluateTrustTier('https://www.cbse.gov.in/cbsenew/curriculum.html', 'CBSE', 'India')).toBe('official');
    expect(evaluateTrustTier('https://www.education.gov.in/policies', 'CBSE', 'India')).toBe('official');
    expect(evaluateTrustTier('https://www.nextgenscience.org/standards', 'NGSS', 'USA')).toBe('official');
    expect(evaluateTrustTier('https://www.ibo.org/programmes/middle-years-programme/', 'IB', 'Global')).toBe('official');
    expect(evaluateTrustTier('https://science.nasa.gov/learn', 'General', 'USA')).toBe('official');
  });

  it('correctly scores trusted educational non-profits and platforms as reputable tier', () => {
    expect(evaluateTrustTier('https://openstax.org/subjects', 'General', 'USA')).toBe('reputable');
    expect(evaluateTrustTier('https://www.khanacademy.org/science/grade-8-science', 'CBSE', 'India')).toBe('reputable');
    expect(evaluateTrustTier('https://www.ck12.org/browse', 'General', 'USA')).toBe('reputable');
    expect(evaluateTrustTier('https://www.desmos.com/calculator', 'General', 'USA')).toBe('reputable');
  });

  it('falls back to general tier for unknown external domains', () => {
    expect(evaluateTrustTier('https://random-teacher-blog.xyz/lesson-notes', 'General', 'USA')).toBe('general');
  });
});

describe('Reference Materials - Link Verification State Mapping', () => {
  it('maps reachable 200 responses to verified and reachable', async () => {
    // Mock global fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
    });

    try {
      const res = await verifyResourceUrl('https://openstax.org/details/books/biology-2e');
      expect(res.state).toBe('verified');
      expect(res.linkStatus).toBe('reachable');
      expect(res.httpStatus).toBe(200);
      expect(res.lastCheckedAt).toBeDefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('maps 403 and 429 to unverified and blocked (honest bot protection tolerance)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers(),
    });

    try {
      const res403 = await verifyResourceUrl('https://ncert.nic.in/protected-page');
      expect(res403.state).toBe('unverified');
      expect(res403.linkStatus).toBe('blocked');
      expect(res403.httpStatus).toBe(403);
    } finally {
      globalThis.fetch = originalFetch;
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers(),
    });

    try {
      const res429 = await verifyResourceUrl('https://api.example.org/rate-limited');
      expect(res429.state).toBe('unverified');
      expect(res429.linkStatus).toBe('blocked');
      expect(res429.httpStatus).toBe(429);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('maps 404 and 410 to failed and broken (dead links flagged honestly)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
    });

    try {
      const res404 = await verifyResourceUrl('https://example.com/non-existent-page');
      expect(res404.state).toBe('failed');
      expect(res404.linkStatus).toBe('broken');
      expect(res404.httpStatus).toBe(404);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles timeouts and network DNS failures safely as not_checked / broken', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND fake-educational-domain.invalid'));

    try {
      const resDns = await verifyResourceUrl('https://fake-educational-domain.invalid');
      expect(resDns.state).toBe('failed');
      expect(resDns.linkStatus).toBe('broken');
    } finally {
      globalThis.fetch = originalFetch;
    }

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('AbortError: The operation was aborted due to timeout'));

    try {
      const resTimeout = await verifyResourceUrl('https://slow-responding-site.edu');
      expect(resTimeout.state).toBe('unverified');
      expect(resTimeout.linkStatus).toBe('not_checked');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('Reference Materials - Schema Normalization & Backward Compatibility', () => {
  it('safely validates old plans that have no references field', () => {
    const oldPlanWithoutReferences = {
      id: 'legacy-plan-001',
      title: 'Legacy Grade 7 Mathematics Unit',
      subject: 'Mathematics',
      gradeLevel: 'Grade 7',
      curriculumFramework: 'Common Core',
      durationWeeks: 1,
      sessionsPerWeek: 1,
      classDurationMinutes: 50,
      format: 'session_sequence',
      unitOverview: 'Introduction to proportional relationships.',
      unitObjectives: ['Compute unit rates associated with ratios of fractions.'],
      prerequisiteKnowledge: ['Basic fraction arithmetic'],
      teachingMethods: ['Direct Instruction'],
      weeklyPlans: [
        {
          id: 'w1',
          weekNumber: 1,
          title: 'Week 1: Proportional Reasoning',
          theme: 'Proportional Reasoning',
          learningGoals: ['Understand unit rate'],
          vocabulary: ['Ratio', 'Proportion'],
          prerequisites: [],
          sessions: [
            {
              id: 's1',
              sessionNumber: 1,
              dayNumber: 1,
              weekNumber: 1,
              title: 'Identifying Ratios',
              topic: 'Ratios and Proportions',
              durationMinutes: 50,
              objectives: [
                {
                  id: 'o1',
                  description: 'Compute ratios accurately',
                  bloomLevel: 'Applying',
                  successCriterion: 'Solve 4 out of 5 practice problems',
                },
              ],
              standards: [],
              lessonSequence: [
                {
                  phase: 'opening',
                  title: 'Hook',
                  durationMinutes: 10,
                  description: 'Engage with recipe ratio problem',
                  teacherAction: 'Present recipe',
                  studentAction: 'Discuss in pairs',
                  materials: [],
                },
              ],
              materials: ['Whiteboard'],
              formativeAssessment: {
                type: 'Exit Ticket',
                promptOrQuestion: 'What is the ratio?',
                measures: 'Ratio calculation',
                evidenceOfLearning: 'Student work',
                interpretationGuide: '80% mastery',
                nextInstructionalStep: 'Advance to graphs',
              },
              differentiation: {
                support: 'Visual ratio tables',
                onLevel: 'Standard word problems',
                advanced: 'Multi-step rates',
                ell: 'Bilingual sentence stems',
                modalitiesOrAccommodations: 'Visual graphs and diagrams',
              },
              homework: {
                enabled: false,
                task: '',
                estimatedMinutes: 0,
              },
            },
          ],
          weeklyAssessment: {
            type: 'Quiz',
            description: 'Weekly ratio quiz',
            checkpointCriteria: ['Can determine proportionality'],
          },
          weeklyResources: [],
          reflectionPrompt: 'Did students grasp unit rates?',
        },
      ],
      finalAssessment: {
        title: 'Unit Ratio Exam',
        type: 'Summative Exam',
        description: 'Comprehensive test of ratios and proportions',
        rubric: [
          {
            criterion: 'Accuracy',
            weightPercentage: 100,
            exemplary: '100% correct',
            proficient: '80% correct',
            developing: '60% correct',
            beginning: 'Below 60%',
          },
        ],
      },
      resourceList: [],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    // Parsing old legacy plan must succeed without throwing
    const parsed = LessonPlanSchema.parse(oldPlanWithoutReferences);
    expect(parsed.id).toBe('legacy-plan-001');
    // Default fallback values
    expect(parsed.references).toEqual([]);
    expect(parsed.referencesStatus).toBe('ready');
  });

  it('validates a reference material item correctly', () => {
    const validRef = {
      id: 'ref-123',
      title: 'NCERT Grade 8 Science Chapter 1',
      sourceName: 'NCERT Official Portal',
      url: 'https://ncert.nic.in/textbook.php',
      resourceType: 'textbook',
      category: 'textbooks',
      description: 'Official NCERT textbook chapter covering agricultural crop production.',
      relatedWeek: 1,
      verified: 'verified',
      trustTier: 'official',
      lastCheckedAt: '2026-10-16T12:00:00Z',
    };

    const parsed = ReferenceMaterialSchema.parse(validRef);
    expect(parsed.verified).toBe('verified');
    expect(parsed.category).toBe('textbooks');
    expect(parsed.trustTier).toBe('official');
  });
});

describe('Reference Materials - Pipeline & Curated Registry Fallback', () => {
  it('retrieves real educational resources from registry without fabricating URLs', async () => {
    // Generate references for a Grade 8 CBSE Science plan
    const samplePlan = {
      id: 'plan-test-cbse-8',
      title: 'Microorganisms: Friend and Foe',
      subject: 'Science',
      gradeLevel: 'Grade 8',
      curriculumFramework: 'CBSE',
      standardsFramework: 'NCERT',
      durationWeeks: 2,
      sessionsPerWeek: 3,
      classDurationMinutes: 45,
      format: 'session_sequence' as const,
      unitOverview: 'Comprehensive study of bacteria, fungi, algae, and protozoa, their classification, fermentation, disease causation, and antibiotics.',
      unitObjectives: ['Identify major groups of microorganisms', 'Describe the commercial and medicinal use of microorganisms'],
      prerequisiteKnowledge: ['Cell structure basics'],
      teachingMethods: ['Inquiry Lab', 'Direct Instruction'],
      weeklyPlans: [
        {
          id: 'w1',
          weekNumber: 1,
          theme: 'Microbial Diversity & Classification',
          learningGoals: ['Classify microorganisms into 4 major groups'],
          vocabulary: ['Bacteria', 'Fungi', 'Protozoa', 'Algae'],
          prerequisites: [],
          sessions: [],
          weeklyAssessment: { type: 'Checkpoint', description: 'Weekly check', checkpointCriteria: [] },
          weeklyResources: [],
          reflectionPrompt: '',
        },
      ],
      finalAssessment: {
        title: 'Microbiology Project',
        type: 'Investigation Report',
        description: 'Design and report on fermentation inquiry',
        rubric: [],
      },
      resourceList: [],
      references: [],
      referencesStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    planDb.save(samplePlan as any);
    const retrieved = await referenceService.fetchAndAttachReferences(samplePlan.id);
    expect(retrieved.references).toBeDefined();
    expect(retrieved.references!.length).toBeGreaterThan(0);
    expect(retrieved.referencesStatus).toBe('ready');

    // Check that every URL is an authentic URL with https protocol
    for (const ref of retrieved.references) {
      expect(ref.url).toMatch(/^https?:\/\//);
      expect(ref.title.length).toBeGreaterThan(0);
      expect(ref.sourceName.length).toBeGreaterThan(0);
      expect(['official', 'reputable', 'general']).toContain(ref.trustTier);
      expect(['verified', 'unverified']).toContain(ref.verified);
      expect(['standards', 'textbooks', 'articles', 'videos', 'worksheets', 'teacher-guides']).toContain(ref.category);
    }

    // Must include official NCERT/CBSE resource or OpenStax/Khan Academy
    const domainNames = retrieved.references.map(r => new URL(r.url).hostname);
    const hasTrustedAuthority = domainNames.some(d => 
      d.includes('ncert.nic.in') || 
      d.includes('cbse.gov.in') || 
      d.includes('khanacademy.org') ||
      d.includes('openstax.org') ||
      d.includes('phet.colorado.edu')
    );
    expect(hasTrustedAuthority).toBe(true);
  }, 25000);
});

