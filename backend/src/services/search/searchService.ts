import { planDb } from '../storage/db';
import { directoryDb } from '../directory/directoryDb';
import { LessonPlan, ReferenceMaterial } from '../../models/plan';

export interface SearchResultItem {
  id: string;
  type: 'plan' | 'curriculum' | 'standard' | 'reference';
  title: string;
  subtitle: string;
  url?: string;
  routeParams?: {
    view: string;
    planId?: string;
    curriculumId?: string;
    standardId?: string;
    tab?: string;
  };
  matchedField: string;
  snippet?: string;
  score?: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  counts: {
    plan: number;
    curriculum: number;
    standard: number;
    reference: number;
  };
  results: {
    plan: SearchResultItem[];
    curriculum: SearchResultItem[];
    standard: SearchResultItem[];
    reference: SearchResultItem[];
  };
}

export interface SearchOptions {
  query: string;
  userId: string;
  limit?: number;
  types?: string[];
}

function normalizeQuery(q: string): string {
  if (!q) return '';
  return q.trim().replace(/\s+/g, ' ').slice(0, 100);
}

function normalizeForComparison(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function createSnippet(text: string, term: string, maxLen = 90): string {
  if (!text) return '';
  const normText = normalizeForComparison(text);
  const normTerm = normalizeForComparison(term);
  const idx = normText.indexOf(normTerm);
  if (idx === -1) {
    return text.length > maxLen ? text.slice(0, maxLen).trim() + '...' : text;
  }
  const start = Math.max(0, idx - 25);
  const end = Math.min(text.length, idx + term.length + 45);
  let snip = text.slice(start, end).trim();
  if (start > 0) snip = '...' + snip;
  if (end < text.length) snip = snip + '...';
  return snip;
}

export class SearchService {
  public search(options: SearchOptions): SearchResponse {
    const rawQuery = normalizeQuery(options.query);
    const userId = options.userId;
    const categoryLimit = Math.max(1, Math.min(options.limit || 5, 10));
    const requestedTypes = options.types && options.types.length > 0 
      ? new Set(options.types.map((t) => t.toLowerCase())) 
      : new Set(['plan', 'curriculum', 'standard', 'reference']);

    // If query is shorter than 2 chars, return empty result (as specified)
    if (rawQuery.length < 2) {
      return {
        query: rawQuery,
        total: 0,
        counts: { plan: 0, curriculum: 0, standard: 0, reference: 0 },
        results: { plan: [], curriculum: [], standard: [], reference: [] },
      };
    }

    const normQuery = normalizeForComparison(rawQuery);

    // 1. User-scoped plans & references
    const userPlans = planDb.getByUserId(userId);

    // --- Search Plans ---
    let planResults: SearchResultItem[] = [];
    let planTotal = 0;

    if (requestedTypes.has('plan') || requestedTypes.has('all')) {
      const scoredPlans: { item: SearchResultItem; score: number; updatedAt: number }[] = [];

      for (const plan of userPlans) {
        let score = 0;
        let matchedField = '';
        let snippet = '';

        const titleNorm = normalizeForComparison(plan.title);
        const subjectNorm = normalizeForComparison(plan.subject);
        const gradeNorm = normalizeForComparison(plan.gradeLevel);
        const overviewNorm = normalizeForComparison(plan.unitOverview);

        if (titleNorm === normQuery) {
          score = 100;
          matchedField = 'title';
        } else if (titleNorm.startsWith(normQuery)) {
          score = 85;
          matchedField = 'title';
        } else if (titleNorm.includes(normQuery)) {
          score = 70;
          matchedField = 'title';
        } else if (subjectNorm.includes(normQuery)) {
          score = 55;
          matchedField = 'subject';
          snippet = plan.subject;
        } else if (gradeNorm.includes(normQuery)) {
          score = 50;
          matchedField = 'gradeLevel';
          snippet = plan.gradeLevel;
        } else if (overviewNorm.includes(normQuery)) {
          score = 40;
          matchedField = 'overview';
          snippet = createSnippet(plan.unitOverview, rawQuery);
        } else {
          // Check weekly plans and session topics
          for (const week of plan.weeklyPlans || []) {
            const weekTitleNorm = normalizeForComparison(week.title || '');
            if (weekTitleNorm.includes(normQuery)) {
              score = 35;
              matchedField = 'week';
              snippet = createSnippet(week.title, rawQuery);
              break;
            }
            for (const sess of week.sessions || []) {
              const sessTitleNorm = normalizeForComparison(sess.title || '');
              const sessTopicNorm = normalizeForComparison(sess.topic || '');
              if (sessTitleNorm.includes(normQuery)) {
                score = 30;
                matchedField = 'lesson';
                snippet = createSnippet(sess.title, rawQuery);
                break;
              } else if (sessTopicNorm.includes(normQuery)) {
                score = 25;
                matchedField = 'topic';
                snippet = createSnippet(sess.topic, rawQuery);
                break;
              }
            }
            if (score > 0) break;
          }
        }

        if (score > 0) {
          scoredPlans.push({
            item: {
              id: plan.id,
              type: 'plan',
              title: plan.title,
              subtitle: `${plan.gradeLevel} · ${plan.subject} · ${plan.durationWeeks} weeks`,
              url: `/workspace?planId=${plan.id}`,
              routeParams: {
                view: 'workspace',
                planId: plan.id,
                tab: 'overview',
              },
              matchedField,
              snippet: snippet || createSnippet(plan.unitOverview, rawQuery),
              score,
            },
            score,
            updatedAt: new Date(plan.updatedAt || plan.createdAt || 0).getTime(),
          });
        }
      }

      planTotal = scoredPlans.length;
      scoredPlans.sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt);
      planResults = scoredPlans.slice(0, categoryLimit).map((s) => s.item);
    }

    // --- Search References (Per-User Scoped from User Plans) ---
    let refResults: SearchResultItem[] = [];
    let refTotal = 0;

    if (requestedTypes.has('reference') || requestedTypes.has('all')) {
      const scoredRefs: { item: SearchResultItem; score: number }[] = [];
      const seenUrls = new Set<string>();

      for (const plan of userPlans) {
        for (const ref of plan.references || []) {
          // Validate valid web URL (http/https only)
          if (!ref.url || (!ref.url.startsWith('http://') && !ref.url.startsWith('https://'))) {
            continue;
          }
          if (seenUrls.has(ref.url)) continue;

          let score = 0;
          let matchedField = '';
          let snippet = '';

          const titleNorm = normalizeForComparison(ref.title);
          const sourceNorm = normalizeForComparison(ref.sourceName);
          const descNorm = normalizeForComparison(ref.description || '');
          const catNorm = normalizeForComparison(ref.category || '');

          if (titleNorm === normQuery) {
            score = 100;
            matchedField = 'title';
          } else if (titleNorm.startsWith(normQuery)) {
            score = 85;
            matchedField = 'title';
          } else if (titleNorm.includes(normQuery)) {
            score = 70;
            matchedField = 'title';
          } else if (sourceNorm.includes(normQuery)) {
            score = 55;
            matchedField = 'source';
            snippet = ref.sourceName;
          } else if (catNorm.includes(normQuery)) {
            score = 45;
            matchedField = 'category';
            snippet = ref.category;
          } else if (descNorm.includes(normQuery)) {
            score = 35;
            matchedField = 'description';
            snippet = createSnippet(ref.description, rawQuery);
          }

          if (score > 0) {
            seenUrls.add(ref.url);
            scoredRefs.push({
              item: {
                id: ref.id,
                type: 'reference',
                title: ref.title,
                subtitle: `${ref.sourceName} · ${ref.category} · ${ref.verified === 'verified' ? 'Verified Resource' : 'Curated Material'}`,
                url: ref.url,
                routeParams: {
                  view: 'workspace',
                  planId: plan.id,
                  tab: 'references',
                },
                matchedField,
                snippet: snippet || (ref.description ? createSnippet(ref.description, rawQuery) : `In plan: ${plan.title}`),
                score,
              },
              score,
            });
          }
        }
      }

      refTotal = scoredRefs.length;
      scoredRefs.sort((a, b) => b.score - a.score);
      refResults = scoredRefs.slice(0, categoryLimit).map((s) => s.item);
    }

    // --- Search Curricula (Shared Reference Data) ---
    let currResults: SearchResultItem[] = [];
    let currTotal = 0;

    if (requestedTypes.has('curriculum') || requestedTypes.has('all')) {
      const { items, total } = directoryDb.searchCurricula(rawQuery, categoryLimit);
      currTotal = total;
      currResults = items.map((c) => ({
        id: c.id,
        type: 'curriculum',
        title: c.name,
        subtitle: `${c.countryIso2} · ${c.scope} · ${c.educationPathway}`,
        url: `/directory?curriculumId=${c.id}`,
        routeParams: {
          view: 'directory',
          curriculumId: c.id,
        },
        matchedField: normalizeForComparison(c.name).includes(normQuery) ? 'name' : 'details',
        snippet: c.shortName !== c.name ? `${c.shortName} (${c.scope})` : `${c.countryIso2} Curriculum Framework`,
      }));
    }

    // --- Search Standards (Shared Reference Data) ---
    let stdResults: SearchResultItem[] = [];
    let stdTotal = 0;

    if (requestedTypes.has('standard') || requestedTypes.has('all')) {
      const { items, total } = directoryDb.searchStandards(rawQuery, categoryLimit);
      stdTotal = total;
      stdResults = items.map((s) => ({
        id: s.id,
        type: 'standard',
        title: `${s.code}: ${s.title}`,
        subtitle: `${s.subject} · Grade ${s.grade} · Official Standard`,
        url: `/directory?curriculumId=${s.curriculumId}&standardId=${s.id}`,
        routeParams: {
          view: 'directory',
          curriculumId: s.curriculumId,
          standardId: s.id,
        },
        matchedField: normalizeForComparison(s.code).includes(normQuery) ? 'code' : 'title',
        snippet: createSnippet(s.description || s.title, rawQuery),
      }));
    }

    const overallTotal = planTotal + currTotal + stdTotal + refTotal;

    return {
      query: rawQuery,
      total: overallTotal,
      counts: {
        plan: planTotal,
        curriculum: currTotal,
        standard: stdTotal,
        reference: refTotal,
      },
      results: {
        plan: planResults,
        curriculum: currResults,
        standard: stdResults,
        reference: refResults,
      },
    };
  }
}

export const searchService = new SearchService();
