import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export function runMigrations(dbOverride?: any): { applied: string[] } {
  const db = dbOverride || getDatabase();

  // Ensure migration tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows: any[] = db.prepare('SELECT name FROM _migrations').all();
  const appliedSet = new Set(appliedRows.map((r) => r.name));

  const allFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();

  const newlyApplied: string[] = [];

  for (const file of allFiles) {
    const migrationName = file.replace('.sql', '');
    if (!appliedSet.has(migrationName)) {
      const sqlContent = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      try {
        db.exec(sqlContent);
      } catch (sqlErr: any) {
        if (!sqlErr?.message?.includes('duplicate column name')) {
          throw sqlErr;
        }
      }
      db.prepare('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)').run(
        migrationName,
        new Date().toISOString()
      );
      newlyApplied.push(migrationName);
    }
  }

  return { applied: newlyApplied };
}

export function rollbackMigration(dbOverride?: any): { rolledBack: string | null } {
  const db = dbOverride || getDatabase();

  // Find latest applied migration
  const latest: any = db.prepare('SELECT name FROM _migrations ORDER BY applied_at DESC LIMIT 1').get();
  if (!latest) {
    return { rolledBack: null };
  }

  const downFile = path.join(MIGRATIONS_DIR, `${latest.name}.down.sql`);
  if (!fs.existsSync(downFile)) {
    throw new Error(`Rollback file not found: ${downFile}`);
  }

  const sqlContent = fs.readFileSync(downFile, 'utf-8');
  db.exec(sqlContent);
  db.prepare('DELETE FROM _migrations WHERE name = ?').run(latest.name);

  return { rolledBack: latest.name };
}

// CLI runner if executed directly
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  const isDown = process.argv.includes('--down');
  if (isDown) {
    console.log('[Migration] Rolling back latest migration...');
    const result = rollbackMigration();
    console.log('[Migration] Rolled back:', result.rolledBack || 'None');
  } else {
    console.log('[Migration] Running pending migrations...');
    const result = runMigrations();
    console.log('[Migration] Newly applied:', result.applied);
  }
}
