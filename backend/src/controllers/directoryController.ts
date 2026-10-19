import { Request, Response } from 'express';
import { directoryDb } from '../services/directory/directoryDb';
import { discoveryPipeline } from '../services/directory/discoveryPipeline';

export const directoryController = {
  /**
   * GET /api/directory/countries
   * Returns list of ISO 3166-1 countries, with optional ranked search.
   */
  getCountries(req: Request, res: Response) {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 250;
    const countries = directoryDb.getCountries(search, isNaN(limit) ? 250 : limit);
    return res.json({
      total: countries.length,
      countries,
    });
  },

  /**
   * GET /api/directory/countries/:iso2/regions
   * Returns ISO 3166-2 subdivisions for a given country code.
   */
  getRegions(req: Request, res: Response) {
    const { iso2 } = req.params;
    if (!iso2) {
      return res.status(400).json({ error: 'Country ISO2 code is required' });
    }

    const regions = directoryDb.getRegions(iso2);
    return res.json({
      countryIso2: iso2.toUpperCase(),
      total: regions.length,
      regions,
    });
  },

  /**
   * GET /api/directory/curricula
   * Query curricula filtered by country, region, scope, pathway, status, or search term.
   */
  getCurricula(req: Request, res: Response) {
    const { country, region, scope, pathway, search, status } = req.query;

    const curricula = directoryDb.getCurricula({
      countryIso2: typeof country === 'string' ? country : undefined,
      regionCode: typeof region === 'string' ? region : undefined,
      scope: typeof scope === 'string' ? scope : undefined,
      pathway: typeof pathway === 'string' ? pathway : undefined,
      search: typeof search === 'string' ? search : undefined,
      verificationStatus: typeof status === 'string' ? status : undefined,
    });

    return res.json({
      total: curricula.length,
      curricula,
    });
  },

  /**
   * GET /api/directory/curricula/:id
   * Detailed curriculum information including issuing organization and verified syllabus documents.
   */
  getCurriculumById(req: Request, res: Response) {
    const { id } = req.params;
    const curriculum = directoryDb.getCurriculum(id);
    if (!curriculum) {
      return res.status(404).json({ error: `Curriculum not found: ${id}` });
    }

    const orgs = directoryDb.getOrganizations();
    const org = orgs.find((o) => o.id === curriculum.orgId);
    const documents = directoryDb.getDocuments(id);
    const standards = directoryDb.getStandards(id);

    return res.json({
      curriculum,
      organization: org,
      documents,
      verifiedStandardsCount: standards.length,
    });
  },

  /**
   * POST /api/directory/suggest
   * Community flow: teacher suggests a missing education board or curriculum.
   */
  suggestCurriculum(req: Request, res: Response) {
    const {
      countryIso2,
      regionCode,
      boardName,
      organizationName,
      websiteUrl,
      educationPathway,
      notes,
      submitterEmail,
    } = req.body;

    if (!countryIso2 || !countryIso2.trim()) {
      return res.status(400).json({ error: 'Country is required.' });
    }
    if (!boardName || !boardName.trim()) {
      return res.status(400).json({ error: 'Board / Curriculum name is required.' });
    }
    if (!websiteUrl || !websiteUrl.trim()) {
      return res.status(400).json({ error: 'Official website URL is required.' });
    }

    // Verify domain format
    const domainCheck = discoveryPipeline.verifyDomain(websiteUrl);
    if (!domainCheck.valid) {
      return res.status(400).json({ error: 'Please enter a valid, reachable official website URL (e.g. https://...)' });
    }

    const suggestion = directoryDb.createSuggestion({
      countryIso2: countryIso2.trim().toUpperCase(),
      regionCode: regionCode ? regionCode.trim().toUpperCase() : undefined,
      boardName: boardName.trim(),
      organizationName: organizationName ? organizationName.trim() : undefined,
      websiteUrl: websiteUrl.trim(),
      educationPathway: educationPathway || 'k-12',
      notes: notes ? notes.trim() : undefined,
      submitterEmail: submitterEmail ? submitterEmail.trim() : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your board suggestion has been received and queued for review.',
      suggestion,
    });
  },

  /**
   * GET /api/directory/suggestions
   * Lists submitted curriculum suggestions (admin view).
   */
  getSuggestions(req: Request, res: Response) {
    const status = typeof req.query.status === 'string' ? (req.query.status as any) : undefined;
    const suggestions = directoryDb.getSuggestions(status);
    return res.json({
      total: suggestions.length,
      suggestions,
    });
  },

  /**
   * PUT /api/directory/suggestions/:id/review
   * Admin reviews and approves/rejects a suggestion.
   */
  reviewSuggestion(req: Request, res: Response) {
    const { id } = req.params;
    const { decision, reviewNotes } = req.body;

    if (decision !== 'approved' && decision !== 'rejected') {
      return res.status(400).json({ error: 'Decision must be either "approved" or "rejected".' });
    }

    const result = discoveryPipeline.reviewSuggestion(id, decision, reviewNotes);
    if (!result) {
      return res.status(404).json({ error: `Suggestion not found: ${id}` });
    }

    return res.json({
      success: true,
      suggestion: result.suggestion,
      createdCurriculum: result.createdCurriculum,
      domainVerification: result.domainVerification,
    });
  },

  /**
   * GET /api/directory/coverage
   * Returns measured coverage statistics, verified counts, and documented gaps.
   */
  getCoverageReport(_req: Request, res: Response) {
    const report = directoryDb.getCoverageReport();
    return res.json(report);
  },
};
