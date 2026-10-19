import { Request, Response } from 'express';
import { 
  CURRICULUM_CATALOG, 
  resolveCurriculumLabels 
} from '../config/curriculumCatalog';
import { 
  validateCurriculumPreferences, 
  buildCurriculumSnapshot 
} from '../models/curriculum';
import { planDb } from '../services/storage/db';

export const curriculumController = {
  /**
   * GET /api/curriculum/catalog
   * Returns the versioned curriculum catalog.
   */
  getCatalog(_req: Request, res: Response) {
    res.json(CURRICULUM_CATALOG);
  },

  /**
   * GET /api/curriculum/preferences
   * Returns saved preferences for the teacher.
   */
  getPreferences(_req: Request, res: Response) {
    const preferences = planDb.getCurriculumPreferences();
    if (!preferences) {
      return res.json({ preferences: null, resolvedLabels: null });
    }

    const resolvedLabels = resolveCurriculumLabels(
      preferences.countryId,
      preferences.curriculumId,
      preferences.regionId,
      preferences.defaultGrade,
      preferences.otherCountryText,
      preferences.otherCurriculumText
    );

    return res.json({ preferences, resolvedLabels });
  },

  /**
   * PUT /api/curriculum/preferences
   * Validates and saves updated curriculum preferences.
   */
  savePreferences(req: Request, res: Response) {
    const payload = {
      ...req.body,
      updatedAt: req.body?.updatedAt || new Date().toISOString(),
    };

    const validation = validateCurriculumPreferences(payload);
    if (!validation.success || !validation.data) {
      return res.status(400).json({
        error: 'Invalid curriculum preferences configuration',
        fields: validation.errors || {},
      });
    }

    const saved = planDb.saveCurriculumPreferences(validation.data);
    const resolvedLabels = resolveCurriculumLabels(
      saved.countryId,
      saved.curriculumId,
      saved.regionId,
      saved.defaultGrade,
      saved.otherCountryText,
      saved.otherCurriculumText
    );

    return res.json({
      success: true,
      preferences: saved,
      resolvedLabels,
    });
  },

  /**
   * POST /api/curriculum/plans/:id/snapshot
   * Sets or updates the immutable curriculumContext on a single existing plan without regenerating.
   */
  setPlanCurriculum(req: Request, res: Response) {
    const { id } = req.params;
    const plan = planDb.getById(id);
    if (!plan) {
      return res.status(404).json({ error: `Plan not found: ${id}` });
    }

    const {
      countryId,
      curriculumId,
      regionId,
      grade,
      otherCountryText,
      otherCurriculumText,
      source = 'manual'
    } = req.body;

    const snapshot = buildCurriculumSnapshot({
      countryId,
      curriculumId,
      regionId,
      grade: grade || plan.gradeLevel,
      subject: plan.subject,
      topic: plan.title,
      otherCountryText,
      otherCurriculumText,
      source,
    });

    if (!snapshot) {
      return res.status(400).json({ error: 'Valid countryId and curriculumId are required for snapshot.' });
    }

    const updatedPlan = planDb.update(id, { curriculumContext: snapshot });
    return res.json({ success: true, plan: updatedPlan });
  }
};
