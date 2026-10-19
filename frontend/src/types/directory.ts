export type VerificationStatus = 'verified' | 'provisional' | 'community_submitted' | 'unverified';

export type CurriculumScope = 'national' | 'state-regional' | 'local' | 'international' | 'school-specific';

export type EducationPathway =
  | 'early-childhood'
  | 'primary'
  | 'secondary'
  | 'higher-secondary'
  | 'k-12'
  | 'vocational'
  | 'higher-ed';

export interface DirectoryCountry {
  iso2: string;
  iso3: string;
  name: string;
  aliases: string[];
  flagEmoji?: string;
  status: 'active' | 'archived';
}

export interface DirectoryRegion {
  code: string;
  countryIso2: string;
  name: string;
  type: string;
}

export interface DirectoryCurriculum {
  id: string;
  orgId: string;
  name: string;
  shortName: string;
  scope: CurriculumScope;
  countryIso2: string;
  regionCode?: string;
  educationPathway: EducationPathway;
  gradeScheme: 'grade' | 'year' | 'key-stage' | 'other';
  gradeOptions: string[];
  spelling: 'US' | 'UK';
  measurementSystem: 'metric' | 'us_customary' | 'metric_preferred';
  assessmentStyle?: string;
  officialDomains: string[];
  verificationStatus: VerificationStatus;
  sourceUrl?: string;
  sourceCitation?: string;
  lastVerifiedAt?: string;
}

export interface DirectoryCurriculumDetail {
  curriculum: DirectoryCurriculum;
  organization?: {
    id: string;
    name: string;
    countryIso2: string;
    type: string;
    officialWebsite: string;
    status: string;
  };
  documents: Array<{
    id: string;
    title: string;
    documentType: string;
    officialUrl: string;
    shortExcerpt?: string;
    verifiedAt: string;
  }>;
  verifiedStandardsCount: number;
}

export interface DirectoryCoverageReport {
  timestamp: string;
  totalCountriesWithCurricula: number;
  totalRecognizedCountries: number;
  countryCoveragePercentage: number;
  totalOrganizations: number;
  totalCurricula: number;
  breakdownByStatus: Record<VerificationStatus, number>;
  breakdownByScope: Record<CurriculumScope, number>;
  breakdownByPathway: Record<EducationPathway, number>;
  totalVerifiedDocuments: number;
  totalVerifiedStandards: number;
  totalPendingSuggestions: number;
  documentedGaps: string[];
}

export interface DirectorySuggestionInput {
  countryIso2: string;
  regionCode?: string;
  boardName: string;
  organizationName?: string;
  websiteUrl: string;
  educationPathway?: EducationPathway;
  notes?: string;
  submitterEmail?: string;
}

export interface DirectorySuggestion {
  id: string;
  countryIso2: string;
  regionCode?: string;
  boardName: string;
  organizationName?: string;
  websiteUrl: string;
  educationPathway?: EducationPathway;
  notes?: string;
  submitterEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}
