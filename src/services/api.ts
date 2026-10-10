import { GeneratePlanInput, LessonPlan, SessionPlan, WeeklyPlan } from '../types/plan';

const API_BASE = '/api';

export interface HealthResponse {
  status: string;
  timestamp: string;
  aiProvider: string;
  liveAiAvailable: boolean;
  totalPlans: number;
}

export interface UserSettings {
  defaultCurriculum: string;
  defaultGradeLevel: string;
  preferredLanguage: string;
  preferredFormat: 'calendar' | 'session_sequence';
  defaultClassDuration: number;
  theme: 'light' | 'dark' | 'system';
  aiProvider: 'gemini' | 'openai' | 'anthropic';
  apiKeyConfigured: boolean;
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  async getSettings(): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },

  async getPlans(): Promise<LessonPlan[]> {
    const res = await fetch(`${API_BASE}/plans`);
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json();
  },

  async getPlan(id: string): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/plans/${id}`);
    if (!res.ok) throw new Error(`Plan not found: ${id}`);
    return res.json();
  },

  async createPlan(plan: LessonPlan): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (!res.ok) throw new Error('Failed to create plan');
    return res.json();
  },

  async updatePlan(id: string, partial: Partial<LessonPlan>): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error('Failed to update plan');
    return res.json();
  },

  async deletePlan(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete plan');
    return res.json();
  },

  async duplicatePlan(id: string): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/plans/${id}/duplicate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to duplicate plan');
    return res.json();
  },

  async generatePlan(input: GeneratePlanInput): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Server generation failed' }));
      throw new Error(err.message || 'Generation failed');
    }
    return res.json();
  },

  async regenerateSession(
    planId: string,
    weekNumber: number,
    sessionNumber: number,
    instruction?: string
  ): Promise<{ plan: LessonPlan; session: SessionPlan }> {
    const res = await fetch(`${API_BASE}/plans/${planId}/regenerate-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekNumber, sessionNumber, instruction }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to regenerate session' }));
      throw new Error(err.message || 'Failed to regenerate session');
    }
    return res.json();
  },

  async adaptSession(
    planId: string,
    weekNumber: number,
    sessionNumber: number,
    adaptationType: 'simplify' | 'interactive' | 'differentiation' | 'shorten' | 'low_resource'
  ): Promise<{ plan: LessonPlan; session: SessionPlan }> {
    const res = await fetch(`${API_BASE}/plans/${planId}/adapt-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekNumber, sessionNumber, adaptationType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to adapt session' }));
      throw new Error(err.message || 'Failed to adapt session');
    }
    return res.json();
  },

  async regenerateWeek(
    planId: string,
    weekNumber: number,
    instruction?: string
  ): Promise<{ plan: LessonPlan; week: WeeklyPlan }> {
    const res = await fetch(`${API_BASE}/plans/${planId}/regenerate-week`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekNumber, instruction }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to regenerate week' }));
      throw new Error(err.message || 'Failed to regenerate week');
    }
    return res.json();
  },

  getExportDocxUrl(id: string): string {
    return `${API_BASE}/plans/${id}/export/docx`;
  },

  getExportPdfUrl(id: string): string {
    return `${API_BASE}/plans/${id}/export/pdf`;
  },

  getExportCsvUrl(id: string): string {
    return `${API_BASE}/plans/${id}/export/csv`;
  },

  getExportPrintUrl(id: string): string {
    return `${API_BASE}/plans/${id}/export/print`;
  },
};
