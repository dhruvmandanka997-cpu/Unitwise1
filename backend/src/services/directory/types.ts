export type EducationPathway = 
  | 'early-childhood'
  | 'primary'
  | 'secondary'
  | 'higher-secondary'
  | 'k-12'
  | 'vocational'
  | 'higher-ed';

export type CurriculumScope = 
  | 'national'
  | 'state-regional'
  | 'local'
  | 'international'
  | 'school-specific';

export type OrgType = 
  | 'ministry'
  | 'state-board'
  | 'national-exam-authority'
  | 'international'
  | 'private-provider'
  | 'other';

export type VerificationStatus = 
  | 'verified'
  | 'provisional'
  | 'community_submitted'
  | 'unverified';

export type SuggestionStatus = 
  | 'pending'
  | 'approved'
  | 'rejected';

export interface DbCountry {
  iso2: string;
  iso3: string;
  name: string;
  aliases: string[]; // JSON in sqlite
  flagEmoji?: string;
  status: 'active' | 'archived';
  createdAt?: string;
}

export interface DbRegion {
  code: string; // ISO 3166-2 e.g. "IN-GJ", "US-CA"
  countryIso2: string;
  name: string;
  type: string; // state, province, territory, etc.
  createdAt?: string;
}

export interface DbCurriculumOrg {
  id: string;
  name: string;
  countryIso2: string;
  type: OrgType;
  officialWebsite: string;
  status: 'verified' | 'unverified';
  createdAt?: string;
}

export interface DbCurriculum {
  id: string;
  orgId: string;
  name: string;
  shortName: string;
  scope: CurriculumScope;
  countryIso2: string;
  regionCode?: string; // ISO 3166-2
  educationPathway: EducationPathway;
  gradeScheme: 'grade' | 'year' | 'key-stage' | 'other';
  gradeOptions: string[]; // JSON in sqlite
  spelling: 'US' | 'UK';
  measurementSystem: 'metric' | 'us_customary' | 'metric_preferred';
  assessmentStyle?: string;
  officialDomains: string[]; // JSON in sqlite
  verificationStatus: VerificationStatus;
  sourceUrl?: string;
  sourceCitation?: string;
  lastVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DbCurriculumSuggestion {
  id: string;
  countryIso2: string;
  regionCode?: string;
  boardName: string;
  organizationName?: string;
  websiteUrl: string;
  educationPathway?: EducationPathway;
  notes?: string;
  submitterEmail?: string;
  status: SuggestionStatus;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface DbCurriculumDocument {
  id: string;
  curriculumId: string;
  title: string;
  documentType: 'syllabus' | 'standards' | 'assessment_guide' | 'curriculum_framework';
  officialUrl: string;
  shortExcerpt?: string;
  licenseNotes?: string;
  verifiedAt: string;
}

export interface DbStandardRecord {
  id: string;
  curriculumId: string;
  grade: string;
  subject: string;
  code: string;
  title: string;
  description: string;
  officialUrl?: string;
  sourceName?: string;
  alignmentType: 'verified';
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
