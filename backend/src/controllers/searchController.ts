import { Request, Response } from 'express';
import { searchService } from '../services/search/searchService';

// Sliding-window in-memory rate limiter: max 60 requests per 60 seconds per user/IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(key, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return true;
}

export function resolveAuthUser(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const token = parts[1].trim();
      if (token) return token;
    }
  }

  const xUserId = req.headers['x-user-id'];
  if (typeof xUserId === 'string' && xUserId.trim()) {
    return xUserId.trim();
  }

  return null;
}

export const searchController = {
  search(req: Request, res: Response) {
    try {
      const authUser = resolveAuthUser(req);
      if (!authUser) {
        return res.status(401).json({
          error: 'Authentication required. Please provide a valid Authorization Bearer token or X-User-Id header.',
        });
      }

      const clientKey = `${authUser}_${req.ip || 'local'}`;
      if (!checkRateLimit(clientKey)) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Maximum 60 requests per minute allowed.',
        });
      }

      const queryRaw = req.query.q;
      if (queryRaw !== undefined && typeof queryRaw !== 'string') {
        return res.status(400).json({ error: 'Search query parameter "q" must be a string' });
      }

      const query = typeof queryRaw === 'string' ? queryRaw : '';
      let limit = 5;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          return res.status(400).json({ error: 'Limit parameter must be a positive number' });
        }
        limit = Math.min(parsedLimit, 20);
      }

      let types: string[] | undefined = undefined;
      if (req.query.types && typeof req.query.types === 'string') {
        types = req.query.types.split(',').map((t) => t.trim()).filter(Boolean);
      }

      const result = searchService.search({
        query,
        userId: authUser,
        limit,
        types,
      });

      return res.json(result);
    } catch (err) {
      console.error('[SearchController] Search execution failed:', err);
      return res.status(500).json({ error: 'Internal search error occurred. Please try again.' });
    }
  },
};
