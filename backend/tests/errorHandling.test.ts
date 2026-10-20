import { describe, it, expect } from 'vitest';
import { extractErrorMessage, sanitizeErrorMessage, normalizeError } from '../../frontend/src/utils/errorUtils';
import { aiEngine } from '../src/services/ai';
import { GeminiAIProvider } from '../src/services/ai/geminiProvider';

describe('Production Error Normalization & AI Generation Resilience', () => {
  describe('extractErrorMessage & errorUtils', () => {
    it('never produces "[object Object]" for plain objects', () => {
      const obj = { error: { code: 'FUNCTION_INVOCATION_FAILED', message: 'Read-only filesystem error' } };
      const res = extractErrorMessage(obj);
      expect(res.message).not.toBe('[object Object]');
      expect(res.message).toBe('Read-only filesystem error');
      expect(res.code).toBe('FUNCTION_INVOCATION_FAILED');
    });

    it('correctly extracts from top-level error object without message', () => {
      const obj = { error: { code: 'FUNCTION_INVOCATION_TIMEOUT' } };
      const res = extractErrorMessage(obj);
      expect(res.message).not.toBe('[object Object]');
      expect(res.message).toContain('timed out');
      expect(res.code).toBe('TIMEOUT');
    });

    it('correctly extracts from Zod issues array', () => {
      const obj = {
        issues: [
          { message: 'Plan title or unit topic must be at least 3 characters' },
          { message: 'Please select or enter a subject' },
        ],
      };
      const res = extractErrorMessage(obj);
      expect(res.message).toBe('Plan title or unit topic must be at least 3 characters, Please select or enter a subject');
      expect(res.code).toBe('VALIDATION_ERROR');
    });

    it('handles standard Error instances and network failures', () => {
      const netErr = new TypeError('Failed to fetch');
      const res = extractErrorMessage(netErr);
      expect(res.message).toContain('Unable to connect');
      expect(res.code).toBe('NETWORK_ERROR');
    });

    it('handles Error instance initialized with an object without producing [object Object]', () => {
      const badError = new Error('[object Object]');
      (badError as any).raw = { error: { message: 'Quota exceeded for project 12345' } };
      const res = extractErrorMessage(badError);
      expect(res.message).toBe('Quota exceeded for project 12345');
    });

    it('redacts sensitive API keys and tokens from error messages', () => {
      const sensitiveMsg = 'Error communicating with Google AI using key AIzaSyD1234567890abcdefghijklmnopqrstuv and Bearer secret_token_xyz';
      const sanitized = sanitizeErrorMessage(sensitiveMsg);
      expect(sanitized).not.toContain('AIzaSyD1234567890abcdefghijklmnopqrstuv');
      expect(sanitized).not.toContain('secret_token_xyz');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('produces structured NormalizedError with a unique correlation ID', () => {
      const res = normalizeError('Something unexpected happened');
      expect(res.correlationId).toMatch(/^err_/);
      expect(res.message).toBe('Something unexpected happened');
    });
  });

  describe('AI Provider Resilience & Valid Models', () => {
    it('uses valid default Gemini model and fallback models', () => {
      const provider = new GeminiAIProvider();
      expect(provider.name).toBe('Google Gemini');
      expect(provider.isAvailable()).toBe(false); // In test environment
    });

    it('generates a full multi-week backward-design curriculum plan using fallback engine without crashing', async () => {
      const plan = await aiEngine.generatePlan({
        title: 'Photosynthesis & Cellular Energy',
        subject: 'Biology',
        gradeLevel: 'Grade 9',
        durationWeeks: 2,
        sessionsPerWeek: 3,
        classDurationMinutes: 50,
        format: 'session_sequence',
        overallGoals: 'Understand chloroplast light reactions, Calvin cycle, and cellular respiration energy transfer.',
        preferredTeachingMethods: ['Inquiry Labs', 'Visual Concept Mapping'],
        curriculumFramework: 'Next Generation Science Standards (NGSS)',
      });

      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
      expect(plan.weeklyPlans.length).toBe(2);
      const totalSessions = plan.weeklyPlans.reduce((sum, w) => sum + w.sessions.length, 0);
      expect(totalSessions).toBe(6);
      expect(plan.unitObjectives.length).toBeGreaterThanOrEqual(1);
    });
  });
});
