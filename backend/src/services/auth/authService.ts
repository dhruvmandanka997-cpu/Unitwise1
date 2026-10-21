import crypto from 'node:crypto';
import { getDatabase } from '../../db/database';
import { UserRecord, AuthenticatedUser } from '../../models/user';

const AUTH_SECRET = process.env.AUTH_SECRET || 'unitwise_development_auth_secret_2026_educator_platform';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64url');
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8');
}

export class AuthService {
  private getDb() {
    return getDatabase();
  }

  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  public verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const hashBuffer = Buffer.from(key, 'hex');
    const computedBuffer = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(hashBuffer, computedBuffer);
  }

  public generateToken(user: AuthenticatedUser): string {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = base64UrlEncode(
      JSON.stringify({
        id: user.id,
        email: user.email,
        exp: Date.now() + TOKEN_EXPIRY_MS,
      })
    );
    const signature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  public verifyToken(token: string): AuthenticatedUser | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      return null;
    }

    try {
      const decoded = JSON.parse(base64UrlDecode(payload));
      if (!decoded || !decoded.id || !decoded.email) return null;
      if (decoded.exp && Date.now() > decoded.exp) return null; // expired
      return { id: decoded.id, email: decoded.email };
    } catch {
      return null;
    }
  }

  public findUserById(id: string): UserRecord | null {
    const row: any = this.getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public findUserByEmail(email: string): UserRecord | null {
    const normalized = email.trim().toLowerCase();
    const row: any = this.getDb().prepare('SELECT * FROM users WHERE email = ?').get(normalized);
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public createUser(email: string, passwordHash: string, customId?: string): UserRecord {
    const id = customId || `usr_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const normalized = email.trim().toLowerCase();

    this.getDb().prepare(`
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, normalized, passwordHash, now, now);

    return {
      id,
      email: normalized,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
  }

  public updateUserEmail(userId: string, newEmail: string): UserRecord {
    const normalized = newEmail.trim().toLowerCase();

    // Check if another user already has this email registered
    const existing = this.findUserByEmail(normalized);
    if (existing && existing.id !== userId) {
      const err: any = new Error('This email address is already registered to another account');
      err.code = 'EMAIL_ALREADY_EXISTS';
      throw err;
    }

    const now = new Date().toISOString();
    this.getDb().prepare(`
      UPDATE users
      SET email = ?, updated_at = ?
      WHERE id = ?
    `).run(normalized, now, userId);

    const updated = this.findUserById(userId);
    if (!updated) {
      throw new Error('User not found');
    }
    return updated;
  }

  public ensureDefaultUser(): UserRecord {
    const defaultId = 'teacher_default';
    const defaultEmail = 'educator@unitwise.local';

    let user = this.findUserById(defaultId);
    if (!user) {
      user = this.findUserByEmail(defaultEmail);
      if (!user) {
        const dummyHash = this.hashPassword('TeacherSecurePassword2026!');
        user = this.createUser(defaultEmail, dummyHash, defaultId);
      }
    }
    return user;
  }
}

export const authService = new AuthService();
