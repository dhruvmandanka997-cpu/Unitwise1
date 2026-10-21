import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import app from '../src/index';
import { authService } from '../src/services/auth/authService';
import { profileDb } from '../src/services/profile/profileDb';
import { MIN_AGE, MAX_AGE } from '../src/models/profile';

describe('My Profile Architecture & Security Integration Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  let userA: { id: string; email: string; token: string };
  let userB: { id: string; email: string; token: string };

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

  beforeEach(() => {
    // Generate two distinct test users with signed tokens
    const emailA = `test_teacher_a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@unitwise.local`;
    const emailB = `test_teacher_b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@unitwise.local`;
    const hash = authService.hashPassword('TeacherSecurePassword2026!');

    const createdA = authService.createUser(emailA, hash);
    const createdB = authService.createUser(emailB, hash);

    userA = {
      id: createdA.id,
      email: createdA.email,
      token: authService.generateToken({ id: createdA.id, email: createdA.email }),
    };

    userB = {
      id: createdB.id,
      email: createdB.email,
      token: authService.generateToken({ id: createdB.id, email: createdB.email }),
    };

    // Clean up any test records
    profileDb.deleteProfile(userA.id);
    profileDb.deleteProfile(userB.id);

    validProfileData = {
      educatorName: 'Dr. Jane M. Doe-Smith',
      email: userA.email,
      age: 38,
      address: '104 Innovation Way, Suite 400\nSan Francisco, CA 94105',
      degree: 'Ph.D.',
      mobileNumber: '+14155552671',
    };
  });

  let validProfileData: {
    educatorName: string;
    email: string;
    age: number;
    address: string;
    degree: any;
    mobileNumber: string;
    degreeOther?: string;
  };

  async function apiRequest(path: string, options: { method?: string; token?: string; body?: any } = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const status = res.status;
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    return { status, body: data };
  }

  describe('1. Authentication & Authorization Enforcement', () => {
    it('returns 401 Unauthorized when no authentication header is provided', async () => {
      const res = await apiRequest('/api/profile');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 Unauthorized when a tampered or invalid token is supplied', async () => {
      const res = await apiRequest('/api/profile', {
        token: 'invalid_signature_token_xyz',
      });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('returns exists: false on first-time profile load for a newly registered user', async () => {
      const res = await apiRequest('/api/profile', {
        token: userA.token,
      });

      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(false);
      expect(res.body.email).toBe(userA.email);
      expect(res.body.profile).toBeNull();
    });
  });

  describe('2. Profile Creation, Retrieval & Update Lifecycle', () => {
    it('creates a new educator profile and reads it back faithfully', async () => {
      const createRes = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: validProfileData,
      });

      expect(createRes.status).toBe(200);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.profile.educatorName).toBe(validProfileData.educatorName);
      expect(createRes.body.profile.age).toBe(validProfileData.age);
      expect(createRes.body.profile.address).toBe(validProfileData.address);
      expect(createRes.body.profile.degree).toBe(validProfileData.degree);
      expect(createRes.body.profile.mobileNumber).toBe(validProfileData.mobileNumber);
      expect(createRes.body.profile.email).toBe(userA.email);

      // Verify persistence via GET /api/profile
      const getRes = await apiRequest('/api/profile', {
        token: userA.token,
      });

      expect(getRes.status).toBe(200);
      expect(getRes.body.exists).toBe(true);
      expect(getRes.body.profile.educatorName).toBe(validProfileData.educatorName);
      expect(getRes.body.profile.age).toBe(validProfileData.age);
    });

    it('updates an existing profile with new valid values and preserves user id', async () => {
      // First save
      await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: validProfileData,
      });

      // Update
      const updatedData = {
        ...validProfileData,
        educatorName: 'Prof. J. Doe',
        age: 40,
        address: '500 Academic Boulevard, Boston, MA 02115',
      };

      const updateRes = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: updatedData,
      });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.profile.educatorName).toBe('Prof. J. Doe');
      expect(updateRes.body.profile.age).toBe(40);
      expect(updateRes.body.profile.address).toBe('500 Academic Boulevard, Boston, MA 02115');
    });

    it('correctly handles Degree = "Other" with degreeOther text field', async () => {
      const otherData = {
        ...validProfileData,
        degree: 'Other',
        degreeOther: 'National Board Certified Teacher (NBCT)',
      };

      const res = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: otherData,
      });

      expect(res.status).toBe(200);
      expect(res.body.profile.degree).toBe('Other');
      expect(res.body.profile.degreeOther).toBe('National Board Certified Teacher (NBCT)');
    });
  });

  describe('3. Strict Validation Rules on All Six Fields', () => {
    // 1. Educator Name
    it('rejects educator name under 2 characters or over 100 characters', async () => {
      const resTooShort = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, educatorName: 'A' },
      });
      expect(resTooShort.status).toBe(400);
      expect(resTooShort.body.details.educatorName).toBeDefined();

      const resTooLong = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, educatorName: 'A'.repeat(101) },
      });
      expect(resTooLong.status).toBe(400);
      expect(resTooLong.body.details.educatorName).toBeDefined();
    });

    it('accepts Unicode educator names with apostrophes, periods, and hyphens', async () => {
      const unicodeNames = [
        'René Descartes',
        "Dr. O'Connor-Smith",
        'Søren Kierkegaard',
        'François Müller',
      ];

      for (const name of unicodeNames) {
        const res = await apiRequest('/api/profile', {
          method: 'PUT',
          token: userA.token,
          body: { ...validProfileData, educatorName: name },
        });
        expect(res.status).toBe(200);
        expect(res.body.profile.educatorName).toBe(name);
      }
    });

    it('rejects numbers or disallowed symbols in educator name', async () => {
      const res = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, educatorName: 'Teacher123 <script>' },
      });
      expect(res.status).toBe(400);
      expect(res.body.details.educatorName).toBeDefined();
    });

    // 2. Age
    it(`enforces age limits between ${MIN_AGE} and ${MAX_AGE}`, async () => {
      const resUnder = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, age: 17 },
      });
      expect(resUnder.status).toBe(400);
      expect(resUnder.body.details.age).toBeDefined();

      const resOver = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, age: 81 },
      });
      expect(resOver.status).toBe(400);
      expect(resOver.body.details.age).toBeDefined();

      const resNonInt = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, age: 35.5 },
      });
      expect(resNonInt.status).toBe(400);
      expect(resNonInt.body.details.age).toBeDefined();
    });

    // 3. Address
    it('enforces address length between 5 and 300 characters', async () => {
      const resTooShort = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, address: '1234' },
      });
      expect(resTooShort.status).toBe(400);
      expect(resTooShort.body.details.address).toBeDefined();

      const resTooLong = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, address: 'A'.repeat(301) },
      });
      expect(resTooLong.status).toBe(400);
      expect(resTooLong.body.details.address).toBeDefined();
    });

    // 4. Degree
    it('rejects invalid degree options', async () => {
      const res = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, degree: 'Astronaut' },
      });
      expect(res.status).toBe(400);
      expect(res.body.details.degree).toBeDefined();
    });

    it('requires degreeOther when degree is Other', async () => {
      const resMissing = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: { ...validProfileData, degree: 'Other', degreeOther: '' },
      });
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.details.degreeOther).toBeDefined();
    });

    // 5. Mobile Number (E.164)
    it('validates E.164 format and rejects invalid phone numbers', async () => {
      const validNumbers = ['+14155552671', '+919876543210', '+442071838750'];
      for (const num of validNumbers) {
        const res = await apiRequest('/api/profile', {
          method: 'PUT',
          token: userA.token,
          body: { ...validProfileData, mobileNumber: num },
        });
        expect(res.status).toBe(200);
        expect(res.body.profile.mobileNumber).toBe(num);
      }

      const invalidNumbers = ['14155552671', '+012345', 'phone_number', '+1-800-abc-defg'];
      for (const num of invalidNumbers) {
        const res = await apiRequest('/api/profile', {
          method: 'PUT',
          token: userA.token,
          body: { ...validProfileData, mobileNumber: num },
        });
        expect(res.status).toBe(400);
        expect(res.body.details.mobileNumber).toBeDefined();
      }
    });

    // 6. Unknown fields rejection
    it('rejects unknown fields in the payload with 400 Bad Request', async () => {
      const res = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: {
          ...validProfileData,
          injectedField: 'malicious_content',
          isAdmin: true,
        },
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('4. Cross-User Privacy & Security Isolation', () => {
    it('strictly isolates User A from User B profile data', async () => {
      // User A saves profile
      await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: {
          ...validProfileData,
          educatorName: 'Educator Alpha',
        },
      });

      // User B saves profile
      await apiRequest('/api/profile', {
        method: 'PUT',
        token: userB.token,
        body: {
          ...validProfileData,
          email: userB.email,
          educatorName: 'Educator Beta',
        },
      });

      // Reading User A returns User A data only
      const resA = await apiRequest('/api/profile', {
        token: userA.token,
      });
      expect(resA.body.profile.educatorName).toBe('Educator Alpha');
      expect(resA.body.profile.email).toBe(userA.email);

      // Reading User B returns User B data only
      const resB = await apiRequest('/api/profile', {
        token: userB.token,
      });
      expect(resB.body.profile.educatorName).toBe('Educator Beta');
      expect(resB.body.profile.email).toBe(userB.email);
    });

    it('ignores client-supplied user ID in query, body, or headers to prevent IDOR attacks', async () => {
      // User B attempts to overwrite User A by sending User A ID in the body
      const attackRes = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userB.token,
        body: {
          ...validProfileData,
          email: userB.email,
          userId: userA.id, // IDOR attempt
        },
      });

      // Unknown field / IDOR attempt is rejected
      expect(attackRes.status).toBe(400);

      // Verify User A profile is unmodified
      const resA = await apiRequest('/api/profile', {
        token: userA.token,
      });
      expect(resA.body.profile?.educatorName).not.toBe('Hacked Profile');
    });
  });

  describe('5. Educator Email Address Management & Security', () => {
    it('allows an educator to update their email and returns a refreshed token', async () => {
      // Create initial profile
      await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: validProfileData,
      });

      const newEmail = `updated_jane_${Date.now()}@unitwise.local`;
      const updateRes = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: {
          ...validProfileData,
          email: newEmail,
        },
      });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.profile.email).toBe(newEmail);
      expect(updateRes.body.token).toBeDefined();

      // Verify that the new token can be used to query the profile
      const verifyRes = await apiRequest('/api/profile', {
        token: updateRes.body.token,
      });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.profile.email).toBe(newEmail);

      // Verify persistence in the users table
      const userInDb = authService.findUserById(userA.id);
      expect(userInDb?.email).toBe(newEmail);
    });

    it('rejects email updates when the target email is already claimed by another user (409 Conflict)', async () => {
      // User A attempts to update their email to User B's email
      const conflictRes = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: {
          ...validProfileData,
          email: userB.email,
        },
      });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(conflictRes.body.details?.email).toContain('already registered');

      // Verify User A's email was not altered in the database
      const userAInDb = authService.findUserById(userA.id);
      expect(userAInDb?.email).toBe(userA.email);
    });

    it('rejects invalid email formats with 400 Bad Request', async () => {
      const invalidEmails = ['not-an-email', 'user@', '@unitwise.local', 'user@domain@domain.com'];
      for (const badEmail of invalidEmails) {
        const res = await apiRequest('/api/profile', {
          method: 'PUT',
          token: userA.token,
          body: {
            ...validProfileData,
            email: badEmail,
          },
        });
        expect(res.status).toBe(400);
        expect(res.body.details?.email).toBeDefined();
      }
    });

    it('normalizes email addresses to lowercase and trims whitespace', async () => {
      const mixedCaseEmail = `  Spaced.Case_${Date.now()}@UnitWise.LOCAL  `;
      const expectedNormalized = mixedCaseEmail.trim().toLowerCase();

      const res = await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: {
          ...validProfileData,
          email: mixedCaseEmail,
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.profile.email).toBe(expectedNormalized);

      const dbUser = authService.findUserById(userA.id);
      expect(dbUser?.email).toBe(expectedNormalized);
    });
  });

  describe('6. Educator Profile Photo Upload, Storage & Lifecycle', () => {
    const validPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const validJpgBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const invalidGifBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    it('uploads a valid PNG profile photo and persists the photoUrl in the profile', async () => {
      // First save base profile
      await apiRequest('/api/profile', {
        method: 'PUT',
        token: userA.token,
        body: validProfileData,
      });

      const uploadRes = await apiRequest('/api/profile/photo', {
        method: 'POST',
        token: userA.token,
        body: { photoData: validPngBase64 },
      });

      expect(uploadRes.status).toBe(200);
      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.photoUrl).toMatch(/^\/api\/uploads\/avatars\/avatar_/);
      expect(uploadRes.body.photoUrl).toMatch(/\.png$/);
      expect(uploadRes.body.profile.photoUrl).toBe(uploadRes.body.photoUrl);

      // Verify persistence via GET /api/profile
      const getRes = await apiRequest('/api/profile', {
        token: userA.token,
      });
      expect(getRes.status).toBe(200);
      expect(getRes.body.profile.photoUrl).toBe(uploadRes.body.photoUrl);
    });

    it('serves the uploaded profile photo over HTTP through the static route', async () => {
      const uploadRes = await apiRequest('/api/profile/photo', {
        method: 'POST',
        token: userA.token,
        body: { photoData: validPngBase64 },
      });

      const photoUrl = uploadRes.body.photoUrl;
      const fileRes = await fetch(`${baseUrl}${photoUrl}`);
      expect(fileRes.status).toBe(200);
      const buffer = await fileRes.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('replaces an existing photo with a new one and updates the photoUrl', async () => {
      // Upload PNG
      await apiRequest('/api/profile/photo', {
        method: 'POST',
        token: userA.token,
        body: { photoData: validPngBase64 },
      });

      // Replace with JPEG
      const replaceRes = await apiRequest('/api/profile/photo', {
        method: 'POST',
        token: userA.token,
        body: { photoData: validJpgBase64 },
      });

      expect(replaceRes.status).toBe(200);
      expect(replaceRes.body.photoUrl).toMatch(/\.jpg$/);

      const getRes = await apiRequest('/api/profile', {
        token: userA.token,
      });
      expect(getRes.body.profile.photoUrl).toBe(replaceRes.body.photoUrl);
    });

    it('rejects unsupported image formats (e.g. GIF) with 400 Bad Request', async () => {
      const res = await apiRequest('/api/profile/photo', {
        method: 'POST',
        token: userA.token,
        body: { photoData: invalidGifBase64 },
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('UNSUPPORTED_FORMAT');
    });

    it('rejects oversized image uploads (> 5MB) with 400 Bad Request', async () => {
      const largeBuffer = Buffer.alloc(5.2 * 1024 * 1024);
      const oversizedPayload = 'data:image/png;base64,' + largeBuffer.toString('base64');

      const res = await apiRequest('/api/profile/photo', {
        method: 'POST',
        token: userA.token,
        body: { photoData: oversizedPayload },
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('FILE_TOO_LARGE');
    });

    it('deletes the profile photo safely and restores photoUrl to null', async () => {
      // Upload photo
      await apiRequest('/api/profile/photo', {
        method: 'POST',
        token: userA.token,
        body: { photoData: validPngBase64 },
      });

      // Delete photo
      const deleteRes = await apiRequest('/api/profile/photo', {
        method: 'DELETE',
        token: userA.token,
      });

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.photoUrl).toBeNull();
      expect(deleteRes.body.profile.photoUrl).toBeNull();

      // Verify persistence via GET /api/profile
      const getRes = await apiRequest('/api/profile', {
        token: userA.token,
      });
      expect(getRes.body.profile.photoUrl).toBeNull();
    });

    it('isolates photo uploads so User A cannot alter User B photo', async () => {
      // User A uploads photo
      const resA = await apiRequest('/api/profile/photo', {
        method: 'POST',
        token: userA.token,
        body: { photoData: validPngBase64 },
      });

      // User B uploads different photo
      const resB = await apiRequest('/api/profile/photo', {
        method: 'POST',
        token: userB.token,
        body: { photoData: validJpgBase64 },
      });

      expect(resA.body.photoUrl).not.toBe(resB.body.photoUrl);

      // Verify User A photo remains unchanged
      const checkA = await apiRequest('/api/profile', { token: userA.token });
      expect(checkA.body.profile.photoUrl).toBe(resA.body.photoUrl);

      // Verify User B photo is User B's
      const checkB = await apiRequest('/api/profile', { token: userB.token });
      expect(checkB.body.profile.photoUrl).toBe(resB.body.photoUrl);
    });
  });
});

