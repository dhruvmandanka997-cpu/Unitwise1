import { z } from 'zod';

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

// Unicode letter regex allowing spaces, hyphens, apostrophes, and periods (2 to 100 characters)
const EDUCATOR_NAME_REGEX = /^[\p{L}\s\-.']{2,100}$/u;

// Strict E.164 phone regex (+ followed by 1 to 15 digits, starting with 1-9)
const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

export const ProfileInputSchema = z
  .object({
    educatorName: z
      .string({ required_error: 'Educator name is required' })
      .trim()
      .min(2, 'Educator name must be at least 2 characters')
      .max(100, 'Educator name cannot exceed 100 characters')
      .regex(
        EDUCATOR_NAME_REGEX,
        'Educator name may only contain letters, spaces, hyphens, apostrophes, and periods'
      ),
    email: z
      .string({ required_error: 'Email address is required' })
      .trim()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address')
      .max(254, 'Email address cannot exceed 254 characters')
      .transform((val) => val.toLowerCase()),
    age: z
      .number({
        required_error: 'Age is required',
        invalid_type_error: 'Age must be an integer number',
      })
      .int('Age must be a whole integer')
      .min(MIN_AGE, `Age must be between ${MIN_AGE} and ${MAX_AGE}`)
      .max(MAX_AGE, `Age must be between ${MIN_AGE} and ${MAX_AGE}`),
    address: z
      .string({ required_error: 'Address is required' })
      .trim()
      .min(5, 'Address must be at least 5 characters')
      .max(300, 'Address cannot exceed 300 characters'),
    degree: z.enum(DEGREE_OPTIONS, {
      errorMap: () => ({
        message: `Degree must be one of: ${DEGREE_OPTIONS.join(', ')}`,
      }),
    }),
    degreeOther: z
      .string()
      .trim()
      .max(100, 'Custom degree description cannot exceed 100 characters')
      .optional()
      .nullable(),
    mobileNumber: z
      .string({ required_error: 'Mobile number is required' })
      .trim()
      .regex(
        E164_PHONE_REGEX,
        'Mobile number must be in valid E.164 format (e.g. +14155552671 or +919876543210)'
      ),
    photoUrl: z
      .string()
      .trim()
      .max(2000, 'Photo URL is too long')
      .optional()
      .nullable(),
  })
  .strict({
    message: 'Unknown fields are not allowed in profile submission',
  })
  .superRefine((data, ctx) => {
    if (data.degree === 'Other') {
      const otherTrimmed = data.degreeOther?.trim();
      if (!otherTrimmed || otherTrimmed.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please specify your degree or qualification',
          path: ['degreeOther'],
        });
      } else if (otherTrimmed.length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Custom degree description cannot exceed 100 characters',
          path: ['degreeOther'],
        });
      }
    }
  });

export type ProfileInput = z.infer<typeof ProfileInputSchema>;

export interface ProfileRecord {
  id: string;
  userId: string;
  educatorName: string;
  age: number;
  address: string;
  degree: DegreeOption;
  degreeOther: string | null;
  mobileNumber: string;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse extends ProfileRecord {
  email: string;
}
