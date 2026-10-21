import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { ProfileInputSchema } from '../models/profile';
import { profileDb } from '../services/profile/profileDb';
import { authService } from '../services/auth/authService';
import { config } from '../config';

// Sliding-window rate limiter for profile updates: 30 requests per minute per authenticated user
const WRITE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_WRITE_REQUESTS = 30;
const writeRateLimitMap = new Map<string, number[]>();

function checkWriteRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = writeRateLimitMap.get(userId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < WRITE_RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_WRITE_REQUESTS) {
    writeRateLimitMap.set(userId, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  writeRateLimitMap.set(userId, validTimestamps);
  return true;
}

export const profileController = {
  getProfile(req: Request, res: Response): void {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    try {
      // Re-fetch current user to always get latest email
      const dbUser = authService.findUserById(user.id);
      const email = dbUser ? dbUser.email : user.email.toLowerCase();

      const record = profileDb.getProfileByUserId(user.id);
      if (!record) {
        res.json({
          exists: false,
          email,
          profile: null,
        });
        return;
      }

      res.json({
        exists: true,
        email,
        profile: {
          ...record,
          email,
          photoUrl: record.photoUrl || null,
        },
      });
    } catch (err: any) {
      console.error('[Profile Controller] Error getting profile:', err.message);
      res.status(500).json({ error: 'Failed to retrieve profile', code: 'SERVER_ERROR' });
    }
  },

  saveProfile(req: Request, res: Response): void {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    // Rate limiting check
    if (!checkWriteRateLimit(user.id)) {
      res.status(429).json({
        error: 'Too many profile update requests. Please wait before saving again.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return;
    }

    // Server-side strict Zod validation
    const parsed = ProfileInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const fieldName = issue.path[0] ? String(issue.path[0]) : '_form';
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }

      res.status(400).json({
        error: 'Profile validation failed',
        code: 'VALIDATION_ERROR',
        details: fieldErrors,
      });
      return;
    }

    try {
      let currentEmail = user.email.toLowerCase();
      let newToken: string | undefined;

      // Update user login email in database if modified
      if (parsed.data.email && parsed.data.email !== currentEmail) {
        try {
          const updatedUser = authService.updateUserEmail(user.id, parsed.data.email);
          currentEmail = updatedUser.email;
          newToken = authService.generateToken({ id: updatedUser.id, email: updatedUser.email });
        } catch (emailErr: any) {
          if (emailErr.code === 'EMAIL_ALREADY_EXISTS') {
            res.status(409).json({
              error: 'This email address is already registered to another account',
              code: 'EMAIL_ALREADY_EXISTS',
              details: { email: 'This email address is already registered to another account' },
            });
            return;
          }
          throw emailErr;
        }
      }

      const updated = profileDb.upsertProfile(user.id, parsed.data);
      res.json({
        success: true,
        token: newToken,
        profile: {
          ...updated,
          email: currentEmail,
          photoUrl: updated.photoUrl || null,
        },
      });
    } catch (err: any) {
      console.error('[Profile Controller] Error saving profile:', err.message);
      res.status(500).json({ error: 'Failed to save profile', code: 'SERVER_ERROR' });
    }
  },

  uploadPhoto(req: Request, res: Response): void {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    if (!checkWriteRateLimit(user.id)) {
      res.status(429).json({
        error: 'Too many upload requests. Please wait a moment before trying again.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return;
    }

    const { photoData } = req.body || {};
    if (!photoData || typeof photoData !== 'string') {
      res.status(400).json({
        error: 'Photo image payload is required',
        code: 'MISSING_PHOTO_DATA',
      });
      return;
    }

    try {
      let rawBase64 = photoData;
      if (rawBase64.includes(';base64,')) {
        rawBase64 = rawBase64.split(';base64,')[1];
      }

      const buffer = Buffer.from(rawBase64, 'base64');

      // Maximum 5 MB limit
      const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
      if (buffer.length > MAX_PHOTO_BYTES) {
        res.status(400).json({
          error: 'Image file size exceeds the 5 MB maximum limit',
          code: 'FILE_TOO_LARGE',
        });
        return;
      }

      if (buffer.length < 12) {
        res.status(400).json({
          error: 'Invalid or corrupt image file',
          code: 'INVALID_FILE',
        });
        return;
      }

      // Verify file signature (magic bytes) to prevent file extension spoofing
      let ext: string | null = null;
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        ext = 'jpg';
      } else if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47
      ) {
        ext = 'png';
      } else if (
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
      ) {
        ext = 'webp';
      }

      if (!ext) {
        res.status(400).json({
          error: 'Unsupported image format. Please select a JPEG, PNG, or WebP image.',
          code: 'UNSUPPORTED_FORMAT',
        });
        return;
      }

      const avatarsDir = path.join(config.dataDir, 'uploads', 'avatars');
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }

      // Safe cleanup of any previous photo for this user
      const existing = profileDb.getProfileByUserId(user.id);
      if (existing?.photoUrl) {
        const match = existing.photoUrl.match(/\/avatars\/([^/?#]+)/);
        if (match && match[1]) {
          const oldFile = path.join(avatarsDir, path.basename(match[1]));
          if (fs.existsSync(oldFile) && path.resolve(oldFile).startsWith(path.resolve(avatarsDir))) {
            try {
              fs.unlinkSync(oldFile);
            } catch (unlinkErr) {
              console.warn('[Profile Controller] Could not remove old avatar:', unlinkErr);
            }
          }
        }
      }

      const sanitizedUserId = user.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `avatar_${sanitizedUserId}_${Date.now()}.${ext}`;
      const filePath = path.join(avatarsDir, filename);

      fs.writeFileSync(filePath, buffer);

      const photoUrl = `/api/uploads/avatars/${filename}`;
      const updated = profileDb.updatePhoto(user.id, photoUrl);

      const dbUser = authService.findUserById(user.id);
      const email = dbUser ? dbUser.email : user.email.toLowerCase();

      res.json({
        success: true,
        photoUrl,
        profile: {
          ...updated,
          email,
          photoUrl,
        },
      });
    } catch (err: any) {
      console.error('[Profile Controller] Photo upload failed:', err.message);
      res.status(500).json({ error: 'Failed to process and store profile photo', code: 'SERVER_ERROR' });
    }
  },

  deletePhoto(req: Request, res: Response): void {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    try {
      const existing = profileDb.getProfileByUserId(user.id);
      if (existing?.photoUrl) {
        const avatarsDir = path.join(config.dataDir, 'uploads', 'avatars');
        const match = existing.photoUrl.match(/\/avatars\/([^/?#]+)/);
        if (match && match[1]) {
          const oldFile = path.join(avatarsDir, path.basename(match[1]));
          if (fs.existsSync(oldFile) && path.resolve(oldFile).startsWith(path.resolve(avatarsDir))) {
            try {
              fs.unlinkSync(oldFile);
            } catch (unlinkErr) {
              console.warn('[Profile Controller] Could not delete avatar file:', unlinkErr);
            }
          }
        }
      }

      const updated = profileDb.updatePhoto(user.id, null);
      const dbUser = authService.findUserById(user.id);
      const email = dbUser ? dbUser.email : user.email.toLowerCase();

      res.json({
        success: true,
        photoUrl: null,
        profile: {
          ...updated,
          email,
          photoUrl: null,
        },
      });
    } catch (err: any) {
      console.error('[Profile Controller] Failed to delete photo:', err.message);
      res.status(500).json({ error: 'Failed to remove profile photo', code: 'SERVER_ERROR' });
    }
  },
};
