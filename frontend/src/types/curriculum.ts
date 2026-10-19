import { z } from 'zod';
import { 
  CURRICULUM_CATALOG_VERSION, 
  findCountry, 
  findCurriculum, 
  findRegion, 
  sanitizeFreeText,
  resolveCurriculumLabels 
} from '../config/curriculumCatalog';

export const CurriculumPreferencesSchema = z.object({
  countryId: z.string().min(1, 'Country is required'),
  curriculumId: z.string().min(1, 'Curriculum or board is required'),
  regionId: z.string().optional(),
  defaultGrade: z.string().optional(),
  otherCountryText: z.string().max(80, 'Country name must be 80 characters or fewer').optional(),
  otherCurriculumText: z.string().max(80, 'Curriculum name must be 80 characters or fewer').optional(),
  catalogVersion: z.string().default(CURRICULUM_CATALOG_VERSION),
  updatedAt: z.string(),
});

export type CurriculumPreferences = z.infer<typeof CurriculumPreferencesSchema>;

export const CurriculumLabelsSchema = z.object({
  country: z.string(),
  curriculum: z.string(),
  region: z.string().optional(),
  grade: z.string(),
  summary: z.string(),
});

export type CurriculumLabels = z.infer<typeof CurriculumLabelsSchema>;

export const CurriculumContextSnapshotSchema = z.object({
  countryId: z.string(),
  curriculumId: z.string(),
  regionId: z.string().optional(),
  grade: z.string().default(''),
  subject: z.string().default(''),
  topic: z.string().optional(),
  labels: CurriculumLabelsSchema,
  source: z.enum(['preferences', 'override', 'manual']).default('preferences'),
  catalogVersion: z.string().default(CURRICULUM_CATALOG_VERSION),
});

export type CurriculumContextSnapshot = z.infer<typeof CurriculumContextSnapshotSchema>;

export function validateCurriculumPreferences(data: unknown): {
  success: boolean;
  data?: CurriculumPreferences;
  errors?: Record<string, string>;
} {
  const parsed = CurriculumPreferencesSchema.safeParse(data);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0]?.toString() || 'form';
      errors[field] = issue.message;
    });
    return { success: false, errors };
  }

  const prefs = parsed.data;
  const errors: Record<string, string> = {};

  if (prefs.otherCountryText !== undefined) {
    prefs.otherCountryText = sanitizeFreeText(prefs.otherCountryText, 80);
  }
  if (prefs.otherCurriculumText !== undefined) {
    prefs.otherCurriculumText = sanitizeFreeText(prefs.otherCurriculumText, 80);
  }

  const country = findCountry(prefs.countryId);
  if (!country) {
    errors.countryId = `Invalid country ID: "${prefs.countryId}". Must be an ID from the catalog.`;
    return { success: false, errors };
  }

  if (prefs.countryId === 'other' && !prefs.otherCountryText) {
    errors.otherCountryText = 'Please enter your country name.';
  }

  const curriculum = findCurriculum(prefs.countryId, prefs.curriculumId);
  if (!curriculum) {
    errors.curriculumId = `Curriculum "${prefs.curriculumId}" is not valid for country "${country.name}".`;
    return { success: false, errors };
  }

  if (
    (prefs.curriculumId.endsWith('other') || prefs.curriculumId === 'other-custom') &&
    !prefs.otherCurriculumText
  ) {
    errors.otherCurriculumText = 'Please specify your curriculum or syllabus framework.';
  }

  if (curriculum.requiresRegion) {
    if (!prefs.regionId || prefs.regionId.trim().length === 0) {
      errors.regionId = `Please choose a ${curriculum.regionLabel || 'region/state'} for ${curriculum.label}.`;
    } else {
      const region = findRegion(prefs.countryId, prefs.curriculumId, prefs.regionId);
      if (!region) {
        errors.regionId = `Invalid region "${prefs.regionId}" for ${curriculum.label}.`;
      }
    }
  }

  if (prefs.defaultGrade && prefs.defaultGrade.trim().length > 0) {
    if (curriculum.gradeOptions.length > 0 && !curriculum.gradeOptions.includes(prefs.defaultGrade)) {
      if (prefs.defaultGrade.length > 50) {
        errors.defaultGrade = 'Default grade text is too long (max 50 chars).';
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: prefs };
}

export function buildCurriculumSnapshot(params: {
  countryId?: string;
  curriculumId?: string;
  regionId?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  otherCountryText?: string;
  otherCurriculumText?: string;
  source?: 'preferences' | 'override' | 'manual';
}): CurriculumContextSnapshot | undefined {
  if (!params.countryId || !params.curriculumId) {
    return undefined;
  }

  const cleanCountryId = sanitizeFreeText(params.countryId, 40);
  const cleanCurriculumId = sanitizeFreeText(params.curriculumId, 60);
  const cleanRegionId = sanitizeFreeText(params.regionId, 40);
  const cleanGrade = sanitizeFreeText(params.grade, 50);
  const cleanSubject = sanitizeFreeText(params.subject, 60);
  const cleanTopic = sanitizeFreeText(params.topic, 100);

  const labels = resolveCurriculumLabels(
    cleanCountryId,
    cleanCurriculumId,
    cleanRegionId,
    cleanGrade,
    params.otherCountryText,
    params.otherCurriculumText
  );

  return {
    countryId: cleanCountryId,
    curriculumId: cleanCurriculumId,
    regionId: cleanRegionId || undefined,
    grade: cleanGrade,
    subject: cleanSubject,
    topic: cleanTopic || undefined,
    labels,
    source: params.source || 'preferences',
    catalogVersion: CURRICULUM_CATALOG_VERSION,
  };
}
