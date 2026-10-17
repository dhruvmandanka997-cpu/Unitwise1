import { ReferenceMaterial, ReferenceCategory, ReferenceResourceType } from '../../models/plan';

export interface RawSearchResult {
  title: string;
  url: string;
  snippet: string;
  sourceName?: string;
  category?: ReferenceCategory;
  resourceType?: ReferenceResourceType;
  relatedWeek?: number;
  relatedLesson?: string;
}

export interface IReferenceProvider {
  name: string;
  isConfigured(): boolean;
  search(query: string, options?: { maxResults?: number; categoryHint?: ReferenceCategory }): Promise<RawSearchResult[]>;
}

export type TrustTier = 'official' | 'reputable' | 'general';

export interface ScoredResource extends RawSearchResult {
  trustTier: TrustTier;
  relevanceScore: number;
  normalizedUrl: string;
}
