import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import app from '../src/index';
import { extractErrorMessage } from '../../frontend/src/utils/errorUtils';

describe('Real Generation Endpoint Integration Tests (/api/generate & /generate)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('generates a full lesson plan via POST /api/generate', async () => {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'teacher_test_runner',
      },
      body: JSON.stringify({
        title: 'Photosynthesis & Cellular Energy Transfer',
        subject: 'Biology',
        gradeLevel: 'Grade 9',
        durationWeeks: 1,
        sessionsPerWeek: 3,
        classDurationMinutes: 50,
        format: 'session_sequence',
        overallGoals: 'Understand light-dependent reactions, the Calvin cycle, and ATP synthesis in chloroplasts.',
        preferredTeachingMethods: ['Hands-on Labs', 'Guided Problem Solving'],
        curriculumFramework: 'US Common Core & NGSS',
      }),
    });

    expect(res.status).toBe(201);
    const plan = (await res.json()) as any;

    expect(plan).toBeDefined();
    expect(plan.id).toBeDefined();
    expect(plan.title).toContain('Photosynthesis');
    expect(plan.weeklyPlans).toHaveLength(1);
    expect(plan.weeklyPlans[0].sessions).toHaveLength(3);
    expect(plan.unitObjectives.length).toBeGreaterThanOrEqual(1);

    // Verify 6-phase sequence on sessions
    const firstSession = plan.weeklyPlans[0].sessions[0];
    expect(firstSession.lessonSequence.length).toBeGreaterThanOrEqual(4);
    expect(firstSession.objectives[0].bloomLevel).toBeDefined();
  });

  it('handles POST /generate identically (dual-mount compatibility for all rewrites)', async () => {
    const res = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'teacher_test_runner',
      },
      body: JSON.stringify({
        title: 'Algebraic Expressions & Linear Equations',
        subject: 'Mathematics',
        gradeLevel: 'Grade 8',
        durationWeeks: 1,
        sessionsPerWeek: 2,
        classDurationMinutes: 45,
        format: 'session_sequence',
        overallGoals: 'Master one-step and two-step linear equations using inverse operations.',
        preferredTeachingMethods: ['Direct Modeling', 'Collaborative Problem Sets'],
        curriculumFramework: 'US Common Core',
      }),
    });

    expect(res.status).toBe(201);
    const plan = (await res.json()) as any;
    expect(plan.weeklyPlans[0].sessions).toHaveLength(2);
  });

  it('returns clean, structured error JSON (not unhandled [object Object]) on invalid inputs', async () => {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields (title, subject, overallGoals, etc.)
        durationWeeks: 1,
      }),
    });

    expect(res.status).toBe(400);
    const errorBody = (await res.json()) as any;

    expect(errorBody).toBeDefined();
    expect(typeof errorBody.error).toBe('string');
    expect(typeof errorBody.message).toBe('string');
    expect(errorBody.message).not.toBe('[object Object]');
    expect(errorBody.correlationId).toBeDefined();

    // Verify frontend error normalization parses this cleanly without [object Object]
    const extracted = extractErrorMessage(errorBody);
    expect(extracted.message).not.toBe('[object Object]');
    expect(extracted.message.length).toBeGreaterThan(5);
  });
});
