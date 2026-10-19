import { LessonPlan, ReferenceMaterial, ReferenceCategory, ReferenceResourceType } from '../../models/plan';
import { IReferenceProvider, RawSearchResult, TrustTier } from './types';
import { TavilyProvider } from './providers/tavilyProvider';
import { BraveProvider, GoogleProvider } from './providers/braveAndGoogleProviders';
import { CuratedRegistryProvider } from './providers/curatedRegistryProvider';
import { isValidUrl, normalizeUrl } from './urlValidator';
import { verifyLink } from './linkVerifier';
import { getTrustTier, deriveSourceName } from './trustedDomains';
import { planDb } from '../storage/db';
import { config } from '../../config';

// In-memory cache for search results keyed by normalized query to prevent repeated web calls
const searchCache = new Map<string, { timestamp: number; results: RawSearchResult[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export class ReferenceService {
  private providers: IReferenceProvider[];
  private defaultRegistry: CuratedRegistryProvider;

  constructor() {
    this.defaultRegistry = new CuratedRegistryProvider();

    // Initialize provider chain based on configuration
    const activeProviders: IReferenceProvider[] = [];
    const tavily = new TavilyProvider();
    const brave = new BraveProvider();
    const google = new GoogleProvider();

    if (tavily.isConfigured()) activeProviders.push(tavily);
    if (brave.isConfigured()) activeProviders.push(brave);
    if (google.isConfigured()) activeProviders.push(google);

    // Curated Registry is always available as an authentic high-trust baseline
    activeProviders.push(this.defaultRegistry);

    this.providers = activeProviders;
  }

  public getActiveProviderName(): string {
    return this.providers[0]?.name || 'curated_registry';
  }

  /**
   * Builds targeted search queries tailored to the plan's framework, subject, grade, and weekly themes.
   */
  public generateTargetedQueries(plan: LessonPlan): Array<{ query: string; categoryHint: ReferenceCategory; weekNumber?: number; lessonTitle?: string }> {
    const queries: Array<{ query: string; categoryHint: ReferenceCategory; weekNumber?: number; lessonTitle?: string }> = [];

    const baseSubject = plan.subject;
    const baseGrade = plan.gradeLevel;
    const ctx = plan.curriculumContext;
    
    // Resolve board name from structured curriculum context if present
    let boardKey = '';
    if (ctx?.labels?.curriculum) {
      boardKey = ctx.labels.curriculum;
      if (ctx.labels.region) {
        boardKey = `${ctx.labels.curriculum} ${ctx.labels.region}`;
      }
    } else {
      const framework = plan.curriculumFramework || '';
      boardKey = framework.toLowerCase().includes('cbse') || framework.toLowerCase().includes('ncert')
        ? 'CBSE NCERT'
        : framework.toLowerCase().includes('ngss')
        ? 'NGSS'
        : framework.toLowerCase().includes('common core')
        ? 'Common Core'
        : framework;
    }

    // 1. Curriculum Standards & Syllabus query
    queries.push({
      query: `${boardKey} ${baseGrade} ${baseSubject} ${plan.title} syllabus learning standards curriculum`.trim(),
      categoryHint: 'standards',
    });

    // 2. Textbooks & Reading Materials query
    queries.push({
      query: `${baseGrade} ${baseSubject} ${plan.title} textbook chapter reading guide OpenStax NCERT`.trim(),
      categoryHint: 'textbooks',
    });

    // 3. Articles & Research query
    queries.push({
      query: `${baseSubject} ${plan.title} educational research inquiry concepts`.trim(),
      categoryHint: 'articles',
    });

    // 4. Videos & Interactive Simulations query
    queries.push({
      query: `${baseSubject} ${plan.title} interactive simulation video lesson PhET Khan Academy`.trim(),
      categoryHint: 'videos',
    });

    // 5. Worksheets & Assessments query
    queries.push({
      query: `${baseGrade} ${baseSubject} ${plan.title} practice worksheet formative assessment`.trim(),
      categoryHint: 'worksheets',
    });

    // 6. Teacher Guides query
    queries.push({
      query: `${baseGrade} ${baseSubject} ${plan.title} teacher instructional unit planning guide`.trim(),
      categoryHint: 'teacher-guides',
    });

    // 7. Per-week specific targeted queries (1 per week)
    for (const week of plan.weeklyPlans.slice(0, 4)) {
      queries.push({
        query: `${baseSubject} ${week.theme} lesson resources worksheet`,
        categoryHint: 'worksheets',
        weekNumber: week.weekNumber,
        lessonTitle: week.sessions[0]?.title,
      });
    }

    return queries;
  }

  /**
   * Main retrieval pipeline for a plan:
   * 1. Query execution
   * 2. URL normalisation & deduplication
   * 3. Trust tier scoring & topical relevance
   * 4. Link reachability verification
   * 5. Categorisation & count capping
   */
  public async fetchAndAttachReferences(planId: string): Promise<LessonPlan> {
    const plan = planDb.getById(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Set status to pending immediately in database
    plan.referencesStatus = 'pending';
    planDb.save(plan);

    try {
      const queryList = this.generateTargetedQueries(plan);
      const rawCandidates: RawSearchResult[] = [];

      // Execute queries through active providers with cache check
      for (const qObj of queryList) {
        const cacheKey = qObj.query.toLowerCase();
        let queryResults: RawSearchResult[] = [];

        const cached = searchCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          queryResults = cached.results;
        } else {
          // Try providers in order
          for (const provider of this.providers) {
            try {
              const res = await provider.search(qObj.query, { maxResults: 3, categoryHint: qObj.categoryHint });
              if (res && res.length > 0) {
                queryResults = res.map((r) => ({
                  ...r,
                  category: r.category || qObj.categoryHint,
                  relatedWeek: qObj.weekNumber,
                  relatedLesson: qObj.lessonTitle,
                }));
                break;
              }
            } catch (pErr) {
              console.warn(`Provider ${provider.name} failed on query "${qObj.query}":`, pErr);
            }
          }

          // Cache the query results
          if (queryResults.length > 0) {
            searchCache.set(cacheKey, { timestamp: Date.now(), results: queryResults });
          }
        }

        rawCandidates.push(...queryResults);
      }

      // Step 2: Normalise URLs, validate with URL parser, and deduplicate
      const seenUrls = new Set<string>();
      const validCandidates: RawSearchResult[] = [];

      for (const cand of rawCandidates) {
        if (!cand.url || !isValidUrl(cand.url)) continue;

        const norm = normalizeUrl(cand.url);
        if (seenUrls.has(norm)) continue;
        seenUrls.add(norm);

        validCandidates.push({
          ...cand,
          url: norm,
        });
      }

      // Step 3: Score and rank results
      const scoredList = validCandidates.map((cand) => {
        const tier: TrustTier = getTrustTier(cand.url, plan.curriculumFramework);
        let score = 0;

        // Trust tier weights
        if (tier === 'official') score += 40;
        else if (tier === 'reputable') score += 25;
        else score += 10;

        // Title and snippet relevance check
        const text = `${cand.title} ${cand.snippet}`.toLowerCase();
        const subjectTokens = plan.subject.toLowerCase().split(/\s+/);
        const titleTokens = plan.title.toLowerCase().split(/\s+/);

        for (const tok of [...subjectTokens, ...titleTokens]) {
          if (tok.length > 3 && text.includes(tok)) score += 5;
        }

        return {
          cand,
          tier,
          score,
        };
      });

      // Sort by score descending
      scoredList.sort((a, b) => b.score - a.score);

      // Step 4: Verify links concurrently with limit of 5 parallel checks
      const cappedForVerification = scoredList.slice(0, 18);
      const verifiedReferences: ReferenceMaterial[] = [];

      for (const item of cappedForVerification) {
        const check = await verifyLink(item.cand.url, 4000);

        // Discard 404/410/DNS dead links
        if (check.status === 'failed') {
          continue;
        }

        const category: ReferenceCategory = item.cand.category || this.inferCategory(item.cand);
        const resourceType: ReferenceResourceType = item.cand.resourceType || this.inferResourceType(item.cand, category);

        verifiedReferences.push({
          id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: item.cand.title.trim(),
          sourceName: item.cand.sourceName || deriveSourceName(item.cand.url),
          url: item.cand.url,
          resourceType,
          category,
          description: this.sanitizeDescription(item.cand.snippet || `${item.cand.title} - Educational material for ${plan.subject}.`),
          relatedWeek: item.cand.relatedWeek,
          relatedLesson: item.cand.relatedLesson,
          verified: check.status === 'verified' ? 'verified' : 'unverified',
          lastCheckedAt: check.lastCheckedAt,
          trustTier: item.tier,
        });
      }

      // Cap at 15 items maximum
      const finalReferences = verifiedReferences.slice(0, 15);

      // Update plan
      plan.references = finalReferences;
      plan.referencesStatus = finalReferences.length > 0 ? 'ready' : 'partial';
      planDb.save(plan);

      return plan;
    } catch (err) {
      console.error(`Failed to fetch references for plan ${planId}:`, err);
      plan.referencesStatus = 'failed';
      planDb.save(plan);
      return plan;
    }
  }

  /**
   * Helper to add a manual custom reference with URL validation and link check
   */
  public async addCustomReference(planId: string, customInput: {
    title: string;
    url: string;
    category?: ReferenceCategory;
    resourceType?: ReferenceResourceType;
    description?: string;
    relatedWeek?: number;
    relatedLesson?: string;
  }): Promise<LessonPlan> {
    const plan = planDb.getById(planId);
    if (!plan) throw new Error('Plan not found');

    if (!isValidUrl(customInput.url)) {
      throw new Error('Invalid URL. Must be a valid public HTTP or HTTPS web address.');
    }

    const normUrl = normalizeUrl(customInput.url);
    const check = await verifyLink(normUrl, 4000);

    const category: ReferenceCategory = customInput.category || 'teacher-guides';
    const resourceType: ReferenceResourceType = customInput.resourceType || 'other';

    const newRef: ReferenceMaterial = {
      id: `ref_custom_${Date.now()}`,
      title: customInput.title.trim(),
      sourceName: deriveSourceName(normUrl),
      url: normUrl,
      resourceType,
      category,
      description: customInput.description?.trim() || 'Educator-added reference material.',
      relatedWeek: customInput.relatedWeek,
      relatedLesson: customInput.relatedLesson,
      verified: check.status === 'verified' ? 'verified' : 'unverified',
      lastCheckedAt: check.lastCheckedAt,
      trustTier: getTrustTier(normUrl),
    };

    plan.references = [...(plan.references || []), newRef];
    plan.referencesStatus = 'ready';
    planDb.save(plan);

    return plan;
  }

  /**
   * Helper to remove a reference
   */
  public removeReference(planId: string, refId: string): LessonPlan {
    const plan = planDb.getById(planId);
    if (!plan) throw new Error('Plan not found');

    plan.references = (plan.references || []).filter((r) => r.id !== refId);
    planDb.save(plan);
    return plan;
  }

  private inferCategory(cand: RawSearchResult): ReferenceCategory {
    const text = `${cand.title} ${cand.snippet} ${cand.url}`.toLowerCase();
    if (text.includes('standard') || text.includes('syllabus') || text.includes('curriculum framework') || text.includes('learning outcomes')) {
      return 'standards';
    }
    if (text.includes('textbook') || text.includes('chapter') || text.includes('book') || text.includes('openstax')) {
      return 'textbooks';
    }
    if (text.includes('video') || text.includes('simulation') || text.includes('interactive') || text.includes('phet') || text.includes('khan')) {
      return 'videos';
    }
    if (text.includes('worksheet') || text.includes('exercise') || text.includes('assessment') || text.includes('rubric') || text.includes('problem set')) {
      return 'worksheets';
    }
    if (text.includes('research') || text.includes('study') || text.includes('journal') || text.includes('article') || text.includes('paper')) {
      return 'articles';
    }
    return 'teacher-guides';
  }

  private inferResourceType(cand: RawSearchResult, cat: ReferenceCategory): ReferenceResourceType {
    if (cat === 'standards') return 'standard';
    if (cat === 'textbooks') return 'textbook';
    if (cat === 'videos') return 'video';
    if (cat === 'worksheets') return 'worksheet';
    if (cat === 'articles') return 'article';
    return 'teacher-guide';
  }

  private sanitizeDescription(raw: string): string {
    // Strip HTML tags and normalize whitespace
    const clean = raw.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    return clean.length > 220 ? `${clean.substring(0, 217)}...` : clean;
  }
}

export const referenceService = new ReferenceService();
