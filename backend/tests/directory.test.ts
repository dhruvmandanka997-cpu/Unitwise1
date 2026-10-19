import { describe, it, expect, beforeEach } from 'vitest';
import { directoryDb } from '../src/services/directory/directoryDb';
import { discoveryPipeline } from '../src/services/directory/discoveryPipeline';
import { seedDirectoryDatabase } from '../src/services/directory/seedDirectory';
import { PedagogicalFallbackGenerator } from '../src/services/ai/pedagogicalFallback';

describe('Global Curriculum Directory & RAG Ingestion Pipeline', () => {
  beforeEach(() => {
    seedDirectoryDatabase();
  });

  describe('1. ISO 3166-1/2 Geographic Directory & Ranked Search', () => {
    it('seeds and retrieves all ISO 3166-1 recognized countries with stable ISO2 keys', () => {
      const allCountries = directoryDb.getCountries(undefined, 300);
      expect(allCountries.length).toBeGreaterThanOrEqual(240);

      const india = directoryDb.getCountry('IN');
      expect(india).toBeDefined();
      expect(india?.name).toBe('India');
      expect(india?.iso3).toBe('IND');
      expect(india?.status).toBe('active');

      const usa = directoryDb.getCountry('US');
      expect(usa).toBeDefined();
      expect(usa?.name).toBe('United States of America');
      expect(usa?.iso3).toBe('USA');
    });

    it('performs accent-insensitive diacritic stripped search', () => {
      const results = directoryDb.getCountries('turkiye');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].iso2).toBe('TR');
    });

    it('ranks exact ISO code match highest', () => {
      const usResults = directoryDb.getCountries('US');
      expect(usResults.length).toBeGreaterThan(0);
      expect(usResults[0].iso2).toBe('US');

      const inResults = directoryDb.getCountries('IN');
      expect(inResults.length).toBeGreaterThan(0);
      expect(inResults[0].iso2).toBe('IN');
    });

    it('resolves common multilingual and regional aliases', () => {
      const ukResults = directoryDb.getCountries('UK');
      expect(ukResults.length).toBeGreaterThan(0);
      expect(ukResults[0].iso2).toBe('GB');

      const britainResults = directoryDb.getCountries('Great Britain');
      expect(britainResults.length).toBeGreaterThan(0);
      expect(britainResults[0].iso2).toBe('GB');

      const bharatResults = directoryDb.getCountries('Bharat');
      expect(bharatResults.length).toBeGreaterThan(0);
      expect(bharatResults[0].iso2).toBe('IN');
    });

    it('retrieves official ISO 3166-2 subdivisions for countries', () => {
      const inRegions = directoryDb.getRegions('IN');
      expect(inRegions.length).toBeGreaterThan(20);
      const gujarat = inRegions.find((r) => r.code === 'IN-GJ');
      expect(gujarat).toBeDefined();
      expect(gujarat?.name).toBe('Gujarat');

      const usRegions = directoryDb.getRegions('US');
      expect(usRegions.length).toBeGreaterThan(45);
      const california = usRegions.find((r) => r.code === 'US-CA');
      expect(california).toBeDefined();
      expect(california?.name).toBe('California');
    });
  });

  describe('2. Curriculum Directory & Verification Model', () => {
    it('retrieves authentic issuing organizations and verified curricula', () => {
      const orgs = directoryDb.getOrganizations();
      expect(orgs.length).toBeGreaterThanOrEqual(8);

      const cbseOrg = orgs.find((o) => o.id === 'org_in_cbse');
      expect(cbseOrg).toBeDefined();
      expect(cbseOrg?.officialWebsite).toContain('cbseacademic.nic.in');
      expect(cbseOrg?.type).toBe('national-exam-authority');
      expect(cbseOrg?.status).toBe('verified');
    });

    it('filters curricula by country, scope, and pathway', () => {
      const indiaCurricula = directoryDb.getCurricula({ countryIso2: 'IN' });
      expect(indiaCurricula.length).toBeGreaterThanOrEqual(3);
      expect(indiaCurricula.some((c) => c.id === 'cbse')).toBe(true);
      expect(indiaCurricula.some((c) => c.id === 'icse')).toBe(true);

      const stateRegional = directoryDb.getCurricula({ scope: 'state-regional' });
      expect(stateRegional.some((c) => c.id === 'in-state-board')).toBe(true);

      const k12Curricula = directoryDb.getCurricula({ pathway: 'k-12' });
      expect(k12Curricula.length).toBeGreaterThan(0);
    });

    it('stores primary source URLs and verification citations without inventing claims', () => {
      const cbse = directoryDb.getCurriculum('cbse');
      expect(cbse).toBeDefined();
      expect(cbse?.verificationStatus).toBe('verified');
      expect(cbse?.sourceUrl).toContain('cbseacademic.nic.in');
      expect(cbse?.sourceCitation).toBeDefined();
      expect(cbse?.officialDomains).toContain('cbseacademic.nic.in');
    });
  });

  describe('3. Community Suggestion & Admin Review Lifecycle', () => {
    it('accepts and queues teacher-submitted missing boards with validation', () => {
      const suggestion = directoryDb.createSuggestion({
        countryIso2: 'SG',
        boardName: 'Singapore MOE Primary Curriculum',
        organizationName: 'Ministry of Education Singapore',
        websiteUrl: 'https://www.moe.gov.sg/primary/curriculum',
        educationPathway: 'primary',
        notes: 'National primary syllabus for Singapore schools.',
        submitterEmail: 'teacher@singaporeschool.edu.sg',
      });

      expect(suggestion.id).toBeDefined();
      expect(suggestion.status).toBe('pending');
      expect(suggestion.countryIso2).toBe('SG');

      const pending = directoryDb.getSuggestions('pending');
      expect(pending.some((s) => s.id === suggestion.id)).toBe(true);
    });

    it('processes admin approval and promotes suggestion to provisional curriculum', () => {
      const suggestion = directoryDb.createSuggestion({
        countryIso2: 'NZ',
        boardName: 'New Zealand Curriculum (NZC)',
        websiteUrl: 'https://curriculum.education.govt.nz',
        educationPathway: 'k-12',
      });

      const reviewResult = discoveryPipeline.reviewSuggestion(
        suggestion.id,
        'approved',
        'Official NZ Ministry of Education curriculum domain confirmed.'
      );

      expect(reviewResult).toBeDefined();
      expect(reviewResult?.suggestion.status).toBe('approved');
      expect(reviewResult?.createdCurriculum).toBeDefined();
      expect(reviewResult?.createdCurriculum?.verificationStatus).toBe('provisional');
      expect(reviewResult?.domainVerification?.valid).toBe(true);
      expect(reviewResult?.domainVerification?.isEducationalOrGov).toBe(true);

      // Verify the provisional board is now discoverable in the directory
      const nzCurricula = directoryDb.getCurricula({ countryIso2: 'NZ' });
      expect(nzCurricula.some((c) => c.name.includes('New Zealand Curriculum'))).toBe(true);
    });

    it('processes admin rejection with documented review notes', () => {
      const suggestion = directoryDb.createSuggestion({
        countryIso2: 'US',
        boardName: 'Fictitious Academy Private Guidelines',
        websiteUrl: 'https://invalid-nonexistent-domain.xyz',
      });

      const reviewResult = discoveryPipeline.reviewSuggestion(
        suggestion.id,
        'rejected',
        'Unverified non-accredited private organization without official standards.'
      );

      expect(reviewResult).toBeDefined();
      expect(reviewResult?.suggestion.status).toBe('rejected');
      expect(reviewResult?.suggestion.reviewNotes).toContain('Unverified');
      expect(reviewResult?.createdCurriculum).toBeUndefined();
    });
  });

  describe('4. Coverage Measurement & Honest Gap Reporting', () => {
    it('honestly reports measured numbers rather than claiming 100% worldwide coverage', () => {
      const report = directoryDb.getCoverageReport();
      expect(report.totalRecognizedCountries).toBeGreaterThanOrEqual(240);
      expect(report.totalCountriesWithCurricula).toBeGreaterThanOrEqual(4);
      // Real percentage should be ~2-5%, never falsely claiming 100%
      expect(report.countryCoveragePercentage).toBeLessThan(10);
      expect(report.countryCoveragePercentage).toBeGreaterThan(0);

      expect(report.totalVerifiedDocuments).toBeGreaterThan(0);
      expect(report.totalVerifiedStandards).toBeGreaterThan(0);
      expect(report.documentedGaps.length).toBeGreaterThan(0);
      expect(report.documentedGaps.some((g) => g.includes('African'))).toBe(true);
      expect(report.documentedGaps.some((g) => g.includes('Latin American'))).toBe(true);
    });
  });

  describe('5. Discovery Pipeline & Fair Use Copyright Compliance', () => {
    it('verifies educational and government domain authenticity', () => {
      const govCheck = discoveryPipeline.verifyDomain('https://cbseacademic.nic.in/curriculum.html');
      expect(govCheck.valid).toBe(true);
      expect(govCheck.isEducationalOrGov).toBe(true);

      const eduCheck = discoveryPipeline.verifyDomain('https://www.educationstandards.nsw.edu.au');
      expect(eduCheck.valid).toBe(true);
      expect(eduCheck.isEducationalOrGov).toBe(true);

      const invalidCheck = discoveryPipeline.verifyDomain('not-a-url');
      expect(invalidCheck.valid).toBe(false);
    });

    it('rejects wholesale copyright copying (>2,000 chars) to maintain fair use compliance', () => {
      const longText = 'A'.repeat(2500);
      const compliance = discoveryPipeline.verifyRobotsCompliance('https://thecorestandards.org', longText.length);
      expect(compliance.compliant).toBe(false);
      expect(compliance.reason).toContain('Fair Use');
    });

    it('ingests verified documents with fair use excerpts and source attribution', () => {
      const res = discoveryPipeline.ingestDocument({
        curriculumId: 'cbse',
        title: 'CBSE Mathematics Class X Curriculum 2026-27',
        documentType: 'syllabus',
        officialUrl: 'https://cbseacademic.nic.in/web_material/Curriculum26/Sec/Maths_Sec_2026-27.pdf',
        shortExcerpt: 'Course structure and unit-wise weightage for Class X Mathematics.',
      });

      expect(res.success).toBe(true);
      expect(res.document?.verifiedAt).toBeDefined();

      const docs = directoryDb.getDocuments('cbse');
      expect(docs.some((d) => d.title.includes('Mathematics Class X'))).toBe(true);
    });
  });

  describe('6. RAG Grounding & Honest Verification Fallback', () => {
    const fallbackGen = new PedagogicalFallbackGenerator();

    it('grounds session standards in verified official standards when present in directoryDb', () => {
      const plan = fallbackGen.generate({
        title: 'Chemical Reactions and Equations',
        subject: 'Science',
        gradeLevel: 'Class 10',
        durationWeeks: 1,
        sessionsPerWeek: 1,
        classDurationMinutes: 45,
        curriculumFramework: 'India · CBSE · Class 10',
        curriculumId: 'cbse',
      });

      const session = plan.weeklyPlans[0].sessions[0];
      expect(session.standards.length).toBeGreaterThan(0);
      const std = session.standards[0];
      expect(std.verificationStatus).toBe('verified');
      expect(std.code).toBe('CBSE.SCI.10.1');
      expect(std.lessonConnection).toContain('Verified official standard');
    });

    it('strictly falls back to suggested_unverified when curriculum has no official registry records', () => {
      const plan = fallbackGen.generate({
        title: 'Introductory Computing',
        subject: 'Computer Science',
        gradeLevel: 'Grade 7',
        durationWeeks: 1,
        sessionsPerWeek: 1,
        classDurationMinutes: 45,
        curriculumFramework: 'Custom Local Curriculum',
        curriculumId: 'unknown_custom_board',
      });

      const session = plan.weeklyPlans[0].sessions[0];
      expect(session.standards.length).toBeGreaterThan(0);
      const std = session.standards[0];
      expect(std.verificationStatus).toBe('suggested_unverified');
      expect(std.lessonConnection).toContain('Suggested pedagogical alignment; please confirm against your official syllabus');
    });
  });
});
