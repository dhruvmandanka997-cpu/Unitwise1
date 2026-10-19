import fs from 'fs';
import path from 'path';
import { config } from '../../config';

export interface StatusAuditEntry {
  id: string;
  userId: string;
  planId: string;
  planTitle: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
  reason?: string;
}

export class StatusAuditDatabase {
  private auditFile: string;
  private entries: StatusAuditEntry[] = [];
  private initialized = false;

  constructor() {
    this.auditFile = path.join(config.dataDir, 'audit.json');
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(config.dataDir)) {
        fs.mkdirSync(config.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.auditFile)) {
        const raw = fs.readFileSync(this.auditFile, 'utf-8');
        this.entries = JSON.parse(raw);
      } else {
        this.entries = [];
        this.persist();
      }
      this.initialized = true;
    } catch (err) {
      console.error('Failed to initialize status audit database:', err);
      this.entries = [];
    }
  }

  private persist() {
    try {
      const tempFile = `${this.auditFile}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.entries, null, 2), 'utf-8');
      try {
        fs.renameSync(tempFile, this.auditFile);
      } catch {
        fs.copyFileSync(tempFile, this.auditFile);
        try { fs.unlinkSync(tempFile); } catch {}
      }
    } catch (err) {
      console.error('Failed to persist status audit database:', err);
    }
  }

  public record(entry: Omit<StatusAuditEntry, 'id' | 'timestamp'> & { timestamp?: string }): StatusAuditEntry {
    if (!this.initialized) {
      this.init();
    }
    const newEntry: StatusAuditEntry = {
      id: 'audit_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry,
    };
    this.entries.push(newEntry);
    this.persist();
    return newEntry;
  }

  public getByPlanId(planId: string): StatusAuditEntry[] {
    return this.entries.filter((e) => e.planId === planId);
  }

  public getByUserId(userId: string): StatusAuditEntry[] {
    return this.entries.filter((e) => e.userId === userId);
  }

  public getAll(): StatusAuditEntry[] {
    return [...this.entries];
  }

  public removeByPlanId(planId: string): void {
    this.entries = this.entries.filter((e) => e.planId !== planId);
    this.persist();
  }

  public restoreEntries(entries: StatusAuditEntry[]): void {
    for (const entry of entries) {
      if (!this.entries.some((e) => e.id === entry.id)) {
        this.entries.push(entry);
      }
    }
    this.persist();
  }

  public clear(): void {
    this.entries = [];
    this.persist();
  }
}

export const statusAuditDb = new StatusAuditDatabase();
