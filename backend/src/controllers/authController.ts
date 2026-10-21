import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth/authService';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const authController = {
  register(req: Request, res: Response): void {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid registration inputs', details: parsed.error.format() });
      return;
    }

    const { email, password } = parsed.data;
    const existing = authService.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    const passwordHash = authService.hashPassword(password);
    const user = authService.createUser(email, passwordHash);
    const token = authService.generateToken({ id: user.id, email: user.email });

    res.status(201).json({
      user: { id: user.id, email: user.email },
      token,
    });
  },

  login(req: Request, res: Response): void {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { email, password } = parsed.data;
    const user = authService.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = authService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = authService.generateToken({ id: user.id, email: user.email });
    res.json({
      user: { id: user.id, email: user.email },
      token,
    });
  },

  me(req: Request, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    res.json({ user: req.user });
  },

  logout(_req: Request, res: Response): void {
    res.json({ message: 'Signed out successfully' });
  },
};
