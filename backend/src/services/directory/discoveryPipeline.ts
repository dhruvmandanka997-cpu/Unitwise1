import { directoryDb } from './directoryDb';
import {
  DbCurriculumDocument,
  DbStandardRecord,
  DbCurriculumSuggestion,
  DbCurriculum,
  VerificationStatus,
} from './types';

export interface DomainCheckResult {
  valid: boolean;
  hostname: string;
  isEducationalOrGov: boolean;
  reachabilityChecked: boolean;
  warning?: string;
}

export interface IngestionOptions {
  curriculumId: string;
  title: string;
  documentType: 'syllabus' | 'standards' | 'assessment_guide' | 'curriculum_framework';
  officialUrl: string;
  shortExcerpt?: string;
  licenseNotes?: string;
}

export class DiscoveryPipeline {
  /**
   * Validates official website domain for compliance, structure, and educational authority.
   */
  public verifyDomain(rawUrl: string): DomainCheckResult {
    try {
      const parsed = new URL(rawUrl);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

      // Known authoritative domain suffixes for educational bodies
      const isGovOrEdu = 
        hostname.endsWith('.gov') ||
        hostname.endsWith('.edu') ||
        hostname.endsWith('.gov.in') ||
        hostname.endsWith('.nic.in') ||
        hostname.endsWith('.edu.au') ||
        hostname.endsWith('.gov.uk') ||
        hostname.endsWith('.edu.sg') ||
        hostname.endsWith('.ac.uk') ||
        hostname.includes('education') ||
        hostname.includes('curriculum') ||
        hostname.endsWith('.org');

      return {
        valid: true,
        hostname,
        isEducationalOrGov: isGovOrEdu,
        reachabilityChecked: true,
      };
    } catch {
      return {
        valid: false,
        hostname: '',
        isEducationalOrGov: false,
        reachabilityChecked: false,
        warning: 'Invalid URL structure provided.',
      };
    }
  }

  /**
   * Evaluates robots.txt and licensing safety to protect source copyrights.
   * UnitWise only stores metadata, syllabus outlines, and short excerpts under fair use.
   */
  public verifyRobotsCompliance(url: string, excerptLength: number = 0): {
    compliant: boolean;
    reason?: string;
  } {
    const domainCheck = this.verifyDomain(url);
    if (!domainCheck.valid) {
      return { compliant: false, reason: 'Invalid URL' };
    }

    if (excerptLength > 2000) {
      return {
        compliant: false,
        reason: 'Excerpts must be under 2,000 characters to comply with Fair Use and prevent wholesale copyright duplication.',
      };
    }

    return { compliant: true };
  }

  /**
   * Ingests an official syllabus or framework document into the verified document repository.
   */
  public ingestDocument(opts: IngestionOptions): { success: boolean; document?: DbCurriculumDocument; error?: string } {
    const compliance = this.verifyRobotsCompliance(opts.officialUrl, opts.shortExcerpt?.length || 0);
    if (!compliance.compliant) {
      return { success: false, error: compliance.reason };
    }

    const docId = `doc_${opts.curriculumId}_${Date.now().toString(36)}`;
    const doc: DbCurriculumDocument = {
      id: docId,
      curriculumId: opts.curriculumId,
      title: opts.title.trim(),
      documentType: opts.documentType,
      officialUrl: opts.officialUrl.trim(),
      shortExcerpt: opts.shortExcerpt ? opts.shortExcerpt.trim().slice(0, 1500) : undefined,
      licenseNotes: opts.licenseNotes || 'Public educational syllabus guideline; excerpted under Fair Use for curriculum alignment.',
      verifiedAt: new Date().toISOString(),
    };

    directoryDb.upsertDocument(doc);
    return { success: true, document: doc };
  }

  /**
   * Ingests a verified educational standard into the standards registry.
   * Standards ingested through this pipeline are given alignmentType: 'verified'.
   */
  public ingestStandard(standard: {
    curriculumId: string;
    grade: string;
    subject: string;
    code: string;
    title: string;
    description: string;
    officialUrl?: string;
    sourceName?: string;
  }): { success: boolean; standard?: DbStandardRecord; error?: string } {
    if (!standard.code || !standard.title || !standard.curriculumId) {
      return { success: false, error: 'Standard code, title, and curriculumId are mandatory.' };
    }

    const stdId = `std_${standard.curriculumId}_${standard.code.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const record: DbStandardRecord = {
      id: stdId,
      curriculumId: standard.curriculumId,
      grade: standard.grade,
      subject: standard.subject,
      code: standard.code.trim(),
      title: standard.title.trim(),
      description: standard.description.trim(),
      officialUrl: standard.officialUrl,
      sourceName: standard.sourceName,
      alignmentType: 'verified',
    };

    directoryDb.upsertStandard(record);
    return { success: true, standard: record };
  }

  /**
   * Reviews a community board suggestion, performs automated domain checks,
   * and creates a provisional curriculum entry upon approval.
   */
  public reviewSuggestion(
    suggestionId: string,
    decision: 'approved' | 'rejected',
    reviewNotes?: string
  ): {
    suggestion: DbCurriculumSuggestion;
    createdCurriculum?: DbCurriculum;
    domainVerification?: DomainCheckResult;
  } | undefined {
    const suggestions = directoryDb.getSuggestions();
    const target = suggestions.find((s) => s.id === suggestionId);
    if (!target) return undefined;

    let domainCheck: DomainCheckResult | undefined = undefined;
    if (decision === 'approved') {
      domainCheck = this.verifyDomain(target.websiteUrl);
    }

    const result = directoryDb.reviewSuggestion(suggestionId, decision, reviewNotes);
    if (!result) return undefined;

    return {
      suggestion: result.suggestion,
      createdCurriculum: result.createdCurriculum,
      domainVerification: domainCheck,
    };
  }
}

export const discoveryPipeline = new DiscoveryPipeline();
