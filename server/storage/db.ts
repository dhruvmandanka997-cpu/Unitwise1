import fs from 'fs';
import path from 'path';
import { LessonPlan } from '../../src/types/plan';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'plans.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

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

const DEFAULT_SETTINGS: UserSettings = {
  defaultCurriculum: 'US Common Core & Next Generation Science Standards (NGSS)',
  defaultGradeLevel: 'Grade 9 (High School / Freshman)',
  preferredLanguage: 'English',
  preferredFormat: 'session_sequence',
  defaultClassDuration: 50,
  theme: 'light',
  aiProvider: 'gemini',
  apiKeyConfigured: false,
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export class PlanDatabase {
  private cache: Map<string, LessonPlan> = new Map();
  private settings: UserSettings = DEFAULT_SETTINGS;
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      ensureDir(DATA_DIR);
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const list: LessonPlan[] = JSON.parse(raw);
        this.cache.clear();
        for (const plan of list) {
          this.cache.set(plan.id, plan);
        }
      } else {
        this.cache.clear();
        this.persist();
      }

      if (fs.existsSync(SETTINGS_FILE)) {
        const rawSettings = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) };
      } else {
        this.saveSettings(DEFAULT_SETTINGS);
      }
      this.initialized = true;
    } catch (err) {
      console.error('Error initializing database:', err);
      this.cache.clear();
    }
  }

  private persist() {
    try {
      ensureDir(DATA_DIR);
      const list = Array.from(this.cache.values());
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database to file:', err);
    }
  }

  public getAll(): LessonPlan[] {
    return Array.from(this.cache.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getById(id: string): LessonPlan | undefined {
    return this.cache.get(id);
  }

  public save(plan: LessonPlan): LessonPlan {
    const updatedPlan: LessonPlan = {
      ...plan,
      updatedAt: new Date().toISOString(),
    };
    this.cache.set(plan.id, updatedPlan);
    this.persist();
    return updatedPlan;
  }

  public update(id: string, partial: Partial<LessonPlan>): LessonPlan | undefined {
    const existing = this.cache.get(id);
    if (!existing) return undefined;
    const merged: LessonPlan = {
      ...existing,
      ...partial,
      id, // keep original id
      updatedAt: new Date().toISOString(),
    };
    this.cache.set(id, merged);
    this.persist();
    return merged;
  }

  public delete(id: string): boolean {
    const existed = this.cache.delete(id);
    if (existed) {
      this.persist();
    }
    return existed;
  }

  public duplicate(id: string): LessonPlan | undefined {
    const original = this.cache.get(id);
    if (!original) return undefined;

    const newId = 'plan_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const now = new Date().toISOString();

    const clone: LessonPlan = JSON.parse(JSON.stringify(original));
    clone.id = newId;
    clone.title = `${original.title} (Copy)`;
    clone.status = 'draft';
    clone.createdAt = now;
    clone.updatedAt = now;

    this.cache.set(newId, clone);
    this.persist();
    return clone;
  }

  public getSettings(): UserSettings {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    return {
      ...this.settings,
      apiKeyConfigured: Boolean(apiKey && apiKey.trim().length > 5 && !apiKey.includes('your_')),
    };
  }

  public saveSettings(newSettings: Partial<UserSettings>): UserSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      ensureDir(DATA_DIR);
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    return this.getSettings();
  }

  public seedIfEmpty(seedPlans: LessonPlan[]) {
    if (this.cache.size === 0 && seedPlans.length > 0) {
      for (const p of seedPlans) {
        this.cache.set(p.id, p);
      }
      this.persist();
    }
  }
}

export const planDb = new PlanDatabase();
