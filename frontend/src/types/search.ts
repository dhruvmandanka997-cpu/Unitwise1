export type SearchResultType = 'plan' | 'curriculum' | 'standard' | 'reference';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
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
