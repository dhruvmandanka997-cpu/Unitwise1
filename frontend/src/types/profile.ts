export const MIN_AGE = 18;
export const MAX_AGE = 80;

export const DEGREE_OPTIONS = [
  'B.Ed.',
  'M.Ed.',
  'B.A.',
  'B.Sc.',
  'M.A.',
  'M.Sc.',
  'Ph.D.',
  'Other',
] as const;

export type DegreeOption = (typeof DEGREE_OPTIONS)[number];

export interface UserProfile {
  id?: string;
  userId?: string;
  educatorName: string;
  age: number;
  address: string;
  email: string; // Login identifier
  degree: DegreeOption;
  degreeOther?: string | null;
  mobileNumber: string; // E.164 format (e.g. +14155552671)
  photoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileInput {
  educatorName: string;
  email: string;
  age: number;
  address: string;
  degree: DegreeOption;
  degreeOther?: string | null;
  mobileNumber: string;
  photoUrl?: string | null;
}

export interface ProfileApiResponse {
  exists: boolean;
  email: string;
  profile: UserProfile | null;
}

export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'ED';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  const honorifics = ['dr.', 'dr', 'prof.', 'prof', 'mr.', 'mr', 'ms.', 'ms', 'mrs.', 'mrs'];
  const meaningful = parts.filter((p) => !honorifics.includes(p.toLowerCase()));
  const target = meaningful.length >= 2 ? meaningful : parts;
  const first = target[0][0] || '';
  const last = target[target.length - 1][0] || '';
  return (first + last).toUpperCase();
}

