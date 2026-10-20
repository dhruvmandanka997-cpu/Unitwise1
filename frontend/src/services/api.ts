import { GeneratePlanInput, LessonPlan, SessionPlan, WeeklyPlan, ReferenceMaterial, PlanStatus } from '../types/plan';
import { TeacherTask, TaskStats } from '../types/task';
import { CurriculumPreferences } from '../types/curriculum';
import { CurriculumCatalog, ResolvedCurriculumLabels } from '../config/curriculumCatalog';
import {
  DirectoryCountry,
  DirectoryRegion,
  DirectoryCurriculum,
  DirectoryCurriculumDetail,
  DirectoryCoverageReport,
  DirectorySuggestion,
  DirectorySuggestionInput,
} from '../types/directory';
import { SearchResponse, SearchResultItem } from '../types/search';
function resolveApiBase(): string {
  let base = (import.meta.env.VITE_API_BASE_URL as string)?.trim() || '/api';
  while (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  if (base.startsWith('http') && !base.endsWith('/api') && !base.includes('/api/')) {
    base = `${base}/api`;
  }
  return base;
}

const API_BASE = resolveApiBase();

export function getAuthUserId(): string {
  return localStorage.getItem('unitwise_user_id') || 'teacher_default';
}

export function getAuthHeaders(): Record<string, string> {
  const userId = getAuthUserId();
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${userId}`,
    'X-User-Id': userId,
  };
}

export interface ActivePlanSummary {
  userId: string;
  activeCount: number;
  maxActivePlans: number;
  isAtLimit: boolean;
  isOverLimit: boolean;
  activePlans: Array<{
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    updatedAt: string;
    statusChangedAt?: string;
  }>;
}

export interface ActiveLimitReachedErrorPayload {
  error: string;
  code: 'ACTIVE_LIMIT_REACHED';
  limit: number;
  activePlans: Array<{ id: string; title: string; subject: string; gradeLevel: string }>;
}

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

export interface CurriculumPreferencesResponse {
  preferences: CurriculumPreferences | null;
  resolvedLabels: ResolvedCurriculumLabels | null;
}

export interface SaveCurriculumPreferencesResponse {
  success: boolean;
  preferences: CurriculumPreferences;
  resolvedLabels: ResolvedCurriculumLabels;
}

export const api = {
  async getCurriculumCatalog(): Promise<CurriculumCatalog> {
    const res = await fetch(`${API_BASE}/curriculum/catalog`);
    if (!res.ok) throw new Error('Failed to fetch curriculum catalog');
    return res.json();
  },

  async getCurriculumPreferences(): Promise<CurriculumPreferencesResponse> {
    const res = await fetch(`${API_BASE}/curriculum/preferences`);
    if (!res.ok) throw new Error('Failed to fetch curriculum preferences');
    return res.json();
  },

  async saveCurriculumPreferences(prefs: CurriculumPreferences): Promise<SaveCurriculumPreferencesResponse> {
    const res = await fetch(`${API_BASE}/curriculum/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error || 'Failed to save curriculum preferences';
      const fields = errData?.fields ? Object.values(errData.fields).join(', ') : '';
      throw new Error(fields ? `${msg}: ${fields}` : msg);
    }
    return res.json();
  },

  async setPlanCurriculum(
    planId: string, 
    data: { countryId: string; curriculumId: string; regionId?: string; grade?: string; otherCountryText?: string; otherCurriculumText?: string }
  ): Promise<{ success: boolean; plan: LessonPlan }> {
    const res = await fetch(`${API_BASE}/curriculum/plans/${planId}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update plan curriculum snapshot');
    return res.json();
  },
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

  async getActiveSummary(): Promise<ActivePlanSummary> {
    const res = await fetch(`${API_BASE}/plans/active-summary`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch active plans summary');
    return res.json();
  },

  async activatePlan(id: string, reason?: string): Promise<{ success: boolean; plan: LessonPlan; isIdempotent: boolean; summary: ActivePlanSummary }> {
    const res = await fetch(`${API_BASE}/plans/${id}/activate`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error: any = new Error(err.error || 'Failed to activate plan');
      error.code = err.code;
      error.status = res.status;
      error.limit = err.limit;
      error.activePlans = err.activePlans;
      throw error;
    }
    return res.json();
  },

  async deactivatePlan(id: string, reason?: string): Promise<{ success: boolean; plan: LessonPlan; summary: ActivePlanSummary }> {
    const res = await fetch(`${API_BASE}/plans/${id}/deactivate`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to deactivate plan');
    }
    return res.json();
  },

  async updatePlanStatus(id: string, status: PlanStatus, reason?: string): Promise<{ success: boolean; plan: LessonPlan; summary: ActivePlanSummary }> {
    const res = await fetch(`${API_BASE}/plans/${id}/status`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error: any = new Error(err.error || 'Failed to update plan status');
      error.code = err.code;
      error.status = res.status;
      error.limit = err.limit;
      error.activePlans = err.activePlans;
      throw error;
    }
    return res.json();
  },

  async swapActivePlans(deactivatePlanId: string, activatePlanId: string, reason?: string): Promise<{ success: boolean; deactivatedPlan: LessonPlan; activatedPlan: LessonPlan; summary: ActivePlanSummary }> {
    const res = await fetch(`${API_BASE}/plans/swap`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ deactivatePlanId, activatePlanId, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to swap active plans');
    }
    return res.json();
  },

  async resolveOverLimitActivePlans(keepPlanIds: string[], expectedActivePlanIds: string[], reason?: string): Promise<{ success: boolean; keptPlans: LessonPlan[]; deactivatedPlans: LessonPlan[]; summary: ActivePlanSummary }> {
    const res = await fetch(`${API_BASE}/plans/active/resolve`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepPlanIds, expectedActivePlanIds, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error: any = new Error(err.error || 'Failed to resolve active plans limit');
      error.code = err.code;
      error.freshActivePlans = err.freshActivePlans;
      throw error;
    }
    return res.json();
  },

  async getPlans(): Promise<LessonPlan[]> {
    const res = await fetch(`${API_BASE}/plans`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json();
  },

  async getPlan(id: string): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Plan not found: ${id}`);
    return res.json();
  },

  async createPlan(plan: LessonPlan): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (!res.ok) throw new Error('Failed to create plan');
    return res.json();
  },

  async updatePlan(id: string, partial: Partial<LessonPlan>): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error: any = new Error(err.error || 'Failed to update plan');
      error.code = err.code;
      error.status = res.status;
      error.limit = err.limit;
      error.activePlans = err.activePlans;
      throw error;
    }
    return res.json();
  },

  async deletePlan(id: string): Promise<{ success: boolean; id: string; message?: string; freedActiveSlot?: boolean }> {
    const res = await fetch(`${API_BASE}/plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete plan');
    }
    return res.json();
  },

  async duplicatePlan(id: string): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/plans/${id}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to duplicate plan');
    return res.json();
  },

  async generatePlan(input: GeneratePlanInput): Promise<LessonPlan & { savedAsDraftDueToLimit?: boolean; limitNotice?: string }> {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      let errMessage = 'Plan generation failed';
      try {
        const err = await res.json();
        errMessage = err.message || err.error || errMessage;
      } catch {
        errMessage = `Server request failed with status ${res.status} (${res.statusText || 'Error'})`;
      }
      throw new Error(errMessage);
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

  async getTasks(params?: { planId?: string; status?: string; search?: string }): Promise<TeacherTask[]> {
    const query = new URLSearchParams();
    if (params?.planId) query.set('planId', params.planId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/tasks${qs}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getTaskStats(planId?: string): Promise<TaskStats> {
    const qs = planId ? `?planId=${encodeURIComponent(planId)}` : '';
    const res = await fetch(`${API_BASE}/tasks/stats${qs}`);
    if (!res.ok) throw new Error('Failed to fetch task stats');
    return res.json();
  },

  async getTask(id: string): Promise<TeacherTask> {
    const res = await fetch(`${API_BASE}/tasks/${id}`);
    if (!res.ok) throw new Error(`Task not found: ${id}`);
    return res.json();
  },

  async updateTask(id: string, partial: Partial<TeacherTask>): Promise<TeacherTask> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async toggleTaskChecklist(taskId: string, itemId: string, completed: boolean): Promise<TeacherTask> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/toggle-checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, completed }),
    });
    if (!res.ok) throw new Error('Failed to toggle checklist item');
    return res.json();
  },

  async deleteTask(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  async syncTasks(): Promise<{ success: boolean; count: number }> {
    const res = await fetch(`${API_BASE}/tasks/sync`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to sync tasks');
    return res.json();
  },

  async fetchReferences(planId: string): Promise<{ plan: LessonPlan; references: ReferenceMaterial[]; referencesStatus: string }> {
    const res = await fetch(`${API_BASE}/plans/${planId}/references/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to fetch references' }));
      throw new Error(err.message || 'Failed to fetch references');
    }
    return res.json();
  },

  async addReference(planId: string, reference: Partial<ReferenceMaterial>): Promise<{ plan: LessonPlan; reference: ReferenceMaterial }> {
    const res = await fetch(`${API_BASE}/plans/${planId}/references/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reference),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to add reference' }));
      throw new Error(err.message || 'Failed to add reference');
    }
    return res.json();
  },

  async deleteReference(planId: string, refId: string): Promise<{ plan: LessonPlan; success: boolean }> {
    const res = await fetch(`${API_BASE}/plans/${planId}/references/${refId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete reference' }));
      throw new Error(err.message || 'Failed to delete reference');
    }
    return res.json();
  },

  // --- Directory Endpoints ---

  async getCountries(search?: string, limit?: number): Promise<{ total: number; countries: DirectoryCountry[] }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    const res = await fetch(`${API_BASE}/directory/countries?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch countries');
    return res.json();
  },

  async getRegions(countryIso2: string): Promise<{ countryIso2: string; total: number; regions: DirectoryRegion[] }> {
    const res = await fetch(`${API_BASE}/directory/countries/${encodeURIComponent(countryIso2)}/regions`);
    if (!res.ok) throw new Error('Failed to fetch subdivisions for country');
    return res.json();
  },

  async getCurricula(filters?: {
    country?: string;
    region?: string;
    scope?: string;
    pathway?: string;
    search?: string;
    status?: string;
  }): Promise<{ total: number; curricula: DirectoryCurriculum[] }> {
    const params = new URLSearchParams();
    if (filters?.country) params.append('country', filters.country);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.scope) params.append('scope', filters.scope);
    if (filters?.pathway) params.append('pathway', filters.pathway);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    const res = await fetch(`${API_BASE}/directory/curricula?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch curricula');
    return res.json();
  },

  async getCurriculumById(id: string): Promise<DirectoryCurriculumDetail> {
    const res = await fetch(`${API_BASE}/directory/curricula/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Failed to fetch curriculum: ${id}`);
    return res.json();
  },

  async submitCurriculumSuggestion(data: DirectorySuggestionInput): Promise<{ success: boolean; message: string; suggestion: DirectorySuggestion }> {
    const res = await fetch(`${API_BASE}/directory/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit suggestion' }));
      throw new Error(err.error || 'Failed to submit suggestion');
    }
    return res.json();
  },

  async getCurriculumSuggestions(status?: string): Promise<{ total: number; suggestions: DirectorySuggestion[] }> {
    const url = status ? `${API_BASE}/directory/suggestions?status=${encodeURIComponent(status)}` : `${API_BASE}/directory/suggestions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch curriculum suggestions');
    return res.json();
  },

  async reviewCurriculumSuggestion(
    id: string,
    decision: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<{ success: boolean; suggestion: DirectorySuggestion; createdCurriculum?: DirectoryCurriculum }> {
    const res = await fetch(`${API_BASE}/directory/suggestions/${encodeURIComponent(id)}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewNotes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to review suggestion' }));
      throw new Error(err.error || 'Failed to review suggestion');
    }
    return res.json();
  },

  async getDirectoryCoverage(): Promise<DirectoryCoverageReport> {
    const res = await fetch(`${API_BASE}/directory/coverage`);
    if (!res.ok) throw new Error('Failed to fetch directory coverage report');
    return res.json();
  },

  async search(
    query: string,
    options?: { limit?: number; types?: string[] },
    signal?: AbortSignal
  ): Promise<SearchResponse> {
    const params = new URLSearchParams();
    params.set('q', query);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.types && options.types.length > 0) params.set('types', options.types.join(','));

    const userId = localStorage.getItem('unitwise_user_id') || 'teacher_default';

    const res = await fetch(`${API_BASE}/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${userId}`,
        'X-User-Id': userId,
      },
      signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Search failed' }));
      throw new Error(err.error || `Search failed with status ${res.status}`);
    }

    return res.json();
  },
};
