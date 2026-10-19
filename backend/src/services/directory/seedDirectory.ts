import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json' with { type: 'json' };
import iso3166_2 from 'iso-3166-2';
import { directoryDb } from './directoryDb';
import {
  DbCountry,
  DbRegion,
  DbCurriculumOrg,
  DbCurriculum,
  DbCurriculumDocument,
  DbStandardRecord,
} from './types';

// Register English locale for i18n-iso-countries
countries.registerLocale(enLocale);

export const DATASET_METADATA = {
  iso3166_1: {
    source: 'i18n-iso-countries',
    version: '7.14.0',
    license: 'MIT',
    description: 'ISO 3166-1 country codes (alpha-2, alpha-3) and multilingual nomenclature',
  },
  iso3166_2: {
    source: 'iso-3166-2',
    version: '1.0.0',
    license: 'MIT',
    description: 'ISO 3166-2 country subdivision codes and territory classifications',
  },
};

// Common aliases dictionary for ranked search
const KNOWN_COUNTRY_ALIASES: Record<string, string[]> = {
  US: ['USA', 'United States of America', 'America', 'US'],
  GB: ['UK', 'United Kingdom', 'Great Britain', 'Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland'],
  IN: ['Bharat', 'Hindustan', 'India'],
  AU: ['Aussie', 'Australia', 'Commonwealth of Australia'],
  CA: ['Canada'],
  TR: ['Turkey', 'Türkiye'],
  DE: ['Deutschland', 'Germany'],
  FR: ['France', 'French Republic'],
  JP: ['Nippon', 'Nihon', 'Japan'],
  CN: ['China', 'PRC', 'People\'s Republic of China'],
  ZA: ['South Africa', 'RSA'],
  NZ: ['New Zealand', 'Aotearoa'],
  SG: ['Singapore'],
  AE: ['UAE', 'United Arab Emirates'],
};

// Unicode flag emoji helper
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function seedDirectoryDatabase() {
  console.log('[Directory Seeder] Initializing database seeding from ISO 3166 standards...');

  // 1. Seed ISO 3166-1 Countries
  const countryNames = countries.getNames('en', { select: 'official' });
  const alpha2List = Object.keys(countryNames);

  for (const iso2 of alpha2List) {
    const alpha3 = countries.alpha2ToAlpha3(iso2) || iso2;
    const name = countries.getName(iso2, 'en', { select: 'official' }) || countryNames[iso2];
    const aliases = KNOWN_COUNTRY_ALIASES[iso2] || [];

    let flag: string | undefined = undefined;
    try {
      flag = getFlagEmoji(iso2);
    } catch {
      flag = '🌐';
    }

    const country: DbCountry = {
      iso2,
      iso3: alpha3,
      name,
      aliases,
      flagEmoji: flag,
      status: 'active',
    };
    directoryDb.upsertCountry(country);
  }

  // Also ensure synthetic fallback 'OTHER' country exists
  directoryDb.upsertCountry({
    iso2: 'OTHER',
    iso3: 'OTH',
    name: 'Other Country / International Jurisdiction',
    aliases: ['Custom', 'Other', 'International', 'Independent'],
    flagEmoji: '🌐',
    status: 'active',
  });

  // 2. Seed ISO 3166-2 Subdivisions for core countries
  const targetSubdivisionCountries = ['IN', 'US', 'GB', 'AU', 'CA'];
  const allSubData = (iso3166_2 as any).data || {};

  for (const iso2 of targetSubdivisionCountries) {
    const countrySubs = allSubData[iso2]?.sub;
    if (countrySubs) {
      for (const [code, info] of Object.entries<any>(countrySubs)) {
        const region: DbRegion = {
          code, // e.g. "IN-GJ", "US-TX"
          countryIso2: iso2,
          name: info.name,
          type: info.type || 'Subdivision',
        };
        directoryDb.upsertRegion(region);
      }
    }
  }

  // 3. Seed Verified Educational Organizations
  const seedOrgs: DbCurriculumOrg[] = [
    {
      id: 'org_in_cbse',
      name: 'Central Board of Secondary Education (CBSE)',
      countryIso2: 'IN',
      type: 'national-exam-authority',
      officialWebsite: 'https://cbseacademic.nic.in',
      status: 'verified',
    },
    {
      id: 'org_in_cisce',
      name: 'Council for the Indian School Certificate Examinations (CISCE)',
      countryIso2: 'IN',
      type: 'national-exam-authority',
      officialWebsite: 'https://cisce.org',
      status: 'verified',
    },
    {
      id: 'org_in_scert_gujarat',
      name: 'Gujarat State Council of Educational Research & Training (GCERT / GSEB)',
      countryIso2: 'IN',
      type: 'state-board',
      officialWebsite: 'https://gcert.gujarat.gov.in',
      status: 'verified',
    },
    {
      id: 'org_in_scert_maharashtra',
      name: 'Maharashtra State Board of Secondary and Higher Secondary Education (MSBSHSE)',
      countryIso2: 'IN',
      type: 'state-board',
      officialWebsite: 'https://mahahsscboard.in',
      status: 'verified',
    },
    {
      id: 'org_in_nios',
      name: 'National Institute of Open Schooling (NIOS)',
      countryIso2: 'IN',
      type: 'national-exam-authority',
      officialWebsite: 'https://nios.ac.in',
      status: 'verified',
    },
    {
      id: 'org_us_ccss',
      name: 'Common Core State Standards Initiative (NGA Center & CCSSO)',
      countryIso2: 'US',
      type: 'ministry',
      officialWebsite: 'https://www.corestandards.org',
      status: 'verified',
    },
    {
      id: 'org_us_ngss',
      name: 'Next Generation Science Standards (Achieve, Inc. & NSTA)',
      countryIso2: 'US',
      type: 'national-exam-authority',
      officialWebsite: 'https://www.nextgenscience.org',
      status: 'verified',
    },
    {
      id: 'org_us_tea',
      name: 'Texas Education Agency (TEKS)',
      countryIso2: 'US',
      type: 'state-board',
      officialWebsite: 'https://tea.texas.gov',
      status: 'verified',
    },
    {
      id: 'org_us_cde',
      name: 'California Department of Education (CDE Frameworks)',
      countryIso2: 'US',
      type: 'state-board',
      officialWebsite: 'https://www.cde.ca.gov',
      status: 'verified',
    },
    {
      id: 'org_us_ap',
      name: 'The College Board (Advanced Placement Program)',
      countryIso2: 'US',
      type: 'private-provider',
      officialWebsite: 'https://apcentral.collegeboard.org',
      status: 'verified',
    },
    {
      id: 'org_gb_dfe',
      name: 'Department for Education (National Curriculum for England)',
      countryIso2: 'GB',
      type: 'ministry',
      officialWebsite: 'https://www.gov.uk/government/organisations/department-for-education',
      status: 'verified',
    },
    {
      id: 'org_gb_scot',
      name: 'Education Scotland (Curriculum for Excellence)',
      countryIso2: 'GB',
      type: 'ministry',
      officialWebsite: 'https://education.gov.scot',
      status: 'verified',
    },
    {
      id: 'org_gb_wales',
      name: 'Welsh Government (Curriculum for Wales / Cwricwlwm i Gymru)',
      countryIso2: 'GB',
      type: 'ministry',
      officialWebsite: 'https://hwb.gov.wales',
      status: 'verified',
    },
    {
      id: 'org_gb_aqa',
      name: 'AQA Examination Board (Assessment and Qualifications Alliance)',
      countryIso2: 'GB',
      type: 'national-exam-authority',
      officialWebsite: 'https://www.aqa.org.uk',
      status: 'verified',
    },
    {
      id: 'org_au_acara',
      name: 'Australian Curriculum, Assessment and Reporting Authority (ACARA)',
      countryIso2: 'AU',
      type: 'national-exam-authority',
      officialWebsite: 'https://www.australiancurriculum.edu.au',
      status: 'verified',
    },
    {
      id: 'org_au_nesa',
      name: 'NSW Education Standards Authority (NESA)',
      countryIso2: 'AU',
      type: 'state-board',
      officialWebsite: 'https://educationstandards.nsw.edu.au',
      status: 'verified',
    },
    {
      id: 'org_ca_ontario',
      name: 'Ontario Ministry of Education',
      countryIso2: 'CA',
      type: 'ministry',
      officialWebsite: 'https://www.ontario.ca/page/ministry-education',
      status: 'verified',
    },
    {
      id: 'org_intl_ibo',
      name: 'International Baccalaureate Organization (IBO)',
      countryIso2: 'OTHER',
      type: 'international',
      officialWebsite: 'https://www.ibo.org',
      status: 'verified',
    },
    {
      id: 'org_intl_cambridge',
      name: 'Cambridge Assessment International Education (CAIE)',
      countryIso2: 'OTHER',
      type: 'international',
      officialWebsite: 'https://www.cambridgeinternational.org',
      status: 'verified',
    },
  ];

  for (const org of seedOrgs) {
    directoryDb.upsertOrg(org);
  }

  // 4. Seed Verified Curricula with complete metadata & official source citations
  const seedCurricula: DbCurriculum[] = [
    {
      id: 'cbse',
      orgId: 'org_in_cbse',
      name: 'CBSE (Central Board of Secondary Education)',
      shortName: 'CBSE',
      scope: 'national',
      countryIso2: 'IN',
      educationPathway: 'k-12',
      gradeScheme: 'grade',
      gradeOptions: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'Competency-Based Questions (CBQs), Assertion-Reasoning, Case-Based Questions, and structured marks weighting.',
      officialDomains: ['cbse.gov.in', 'cbseacademic.nic.in', 'ncert.nic.in'],
      verificationStatus: 'verified',
      sourceUrl: 'https://cbseacademic.nic.in/curriculum_2025.html',
      sourceCitation: 'Central Board of Secondary Education Statutory Curriculum Framework, Ministry of Education, Government of India.',
      lastVerifiedAt: '2026-03-15T00:00:00Z',
    },
    {
      id: 'icse',
      orgId: 'org_in_cisce',
      name: 'CISCE / ICSE & ISC',
      shortName: 'CISCE/ICSE',
      scope: 'national',
      countryIso2: 'IN',
      educationPathway: 'k-12',
      gradeScheme: 'grade',
      gradeOptions: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10 (ICSE)', 'Class 11', 'Class 12 (ISC)'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'Comprehensive conceptual understanding, structured analytical literature response, and practical science portfolios.',
      officialDomains: ['cisce.org'],
      verificationStatus: 'verified',
      sourceUrl: 'https://cisce.org/regulations-and-syllabuses/',
      sourceCitation: 'Council for the Indian School Certificate Examinations Regulations and Syllabuses.',
      lastVerifiedAt: '2026-02-20T00:00:00Z',
    },
    {
      id: 'in-state-board',
      orgId: 'org_in_scert_gujarat',
      name: 'State Board (SCERT / State Secondary Board)',
      shortName: 'State Board',
      scope: 'state-regional',
      countryIso2: 'IN',
      regionCode: 'IN-GJ',
      educationPathway: 'k-12',
      gradeScheme: 'grade',
      gradeOptions: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10 (SSLC)', 'Class 11 (HSC)', 'Class 12 (HSC)'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'State Council of Educational Research & Training syllabus benchmarks, textbook-chapter alignment, and bilingual vocabulary aids.',
      officialDomains: ['gcert.gujarat.gov.in', 'mahahsscboard.in'],
      verificationStatus: 'verified',
      sourceUrl: 'https://gcert.gujarat.gov.in/curriculum',
      sourceCitation: 'GCERT Academic Standards and State Curriculum Framework.',
      lastVerifiedAt: '2026-01-10T00:00:00Z',
    },
    {
      id: 'nios',
      orgId: 'org_in_nios',
      name: 'NIOS (National Institute of Open Schooling)',
      shortName: 'NIOS',
      scope: 'national',
      countryIso2: 'IN',
      educationPathway: 'k-12',
      gradeScheme: 'grade',
      gradeOptions: ['Secondary (Class 10)', 'Senior Secondary (Class 12)'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'Tutor Marked Assignments (TMA), self-paced study units, and On-Demand Examination (ODE) formats.',
      officialDomains: ['nios.ac.in'],
      verificationStatus: 'verified',
      sourceUrl: 'https://nios.ac.in/student-information-section/syllabus-sample-question-paper.aspx',
      sourceCitation: 'National Institute of Open Schooling Open Basic Education & Secondary Syllabuses.',
      lastVerifiedAt: '2026-01-12T00:00:00Z',
    },
    {
      id: 'us-ccss',
      orgId: 'org_us_ccss',
      name: 'Common Core State Standards (CCSS)',
      shortName: 'Common Core',
      scope: 'national',
      countryIso2: 'US',
      educationPathway: 'k-12',
      gradeScheme: 'grade',
      gradeOptions: ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9 (High School)', 'Grade 10', 'Grade 11', 'Grade 12'],
      spelling: 'US',
      measurementSystem: 'us_customary',
      assessmentStyle: 'Smarter Balanced & PARCC assessment items, depth of knowledge (DOK) multi-step performance tasks, and text-dependent evidence.',
      officialDomains: ['corestandards.org'],
      verificationStatus: 'verified',
      sourceUrl: 'https://www.corestandards.org/read-the-standards/',
      sourceCitation: 'National Governors Association Center for Best Practices and Council of Chief State School Officers (CCSSO).',
      lastVerifiedAt: '2026-02-14T00:00:00Z',
    },
    {
      id: 'us-ngss',
      orgId: 'org_us_ngss',
      name: 'Next Generation Science Standards (NGSS)',
      shortName: 'NGSS',
      scope: 'national',
      countryIso2: 'US',
      educationPathway: 'k-12',
      gradeScheme: 'grade',
      gradeOptions: ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Middle School (Grades 6-8)', 'High School (Grades 9-12)'],
      spelling: 'US',
      measurementSystem: 'us_customary',
      assessmentStyle: 'Three-Dimensional Learning: Disciplinary Core Ideas (DCIs), Science & Engineering Practices (SEPs), and Crosscutting Concepts (CCCs).',
      officialDomains: ['nextgenscience.org'],
      verificationStatus: 'verified',
      sourceUrl: 'https://www.nextgenscience.org/search-standards',
      sourceCitation: 'NGSS Lead States. 2013. Next Generation Science Standards: For States, By States. Washington, DC: The National Academies Press.',
      lastVerifiedAt: '2026-02-10T00:00:00Z',
    },
    {
      id: 'us-ap',
      orgId: 'org_us_ap',
      name: 'Advanced Placement (AP / College Board)',
      shortName: 'AP',
      scope: 'national',
      countryIso2: 'US',
      educationPathway: 'higher-secondary',
      gradeScheme: 'grade',
      gradeOptions: ['Grade 9 (Pre-AP)', 'Grade 10', 'Grade 11', 'Grade 12'],
      spelling: 'US',
      measurementSystem: 'us_customary',
      assessmentStyle: 'Document-Based Questions (DBQs), Free-Response Questions (FRQs), and analytic scoring rubrics.',
      officialDomains: ['apcentral.collegeboard.org'],
      verificationStatus: 'verified',
      sourceUrl: 'https://apcentral.collegeboard.org/courses',
      sourceCitation: 'The College Board Advanced Placement Course and Exam Descriptions.',
      lastVerifiedAt: '2026-01-28T00:00:00Z',
    },
    {
      id: 'uk-national-england',
      orgId: 'org_gb_dfe',
      name: 'National Curriculum for England',
      shortName: 'National Curriculum (Eng)',
      scope: 'national',
      countryIso2: 'GB',
      educationPathway: 'k-12',
      gradeScheme: 'key-stage',
      gradeOptions: ['Early Years (Reception)', 'Key Stage 1 (Years 1-2)', 'Key Stage 2 (Years 3-6)', 'Key Stage 3 (Years 7-9)', 'Key Stage 4 / GCSE (Years 10-11)', 'Key Stage 5 / Sixth Form (Years 12-13)'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'Statutory programmes of study, formative checkpoints, end-of-key-stage assessments, and GCSE preparation.',
      officialDomains: ['gov.uk'],
      verificationStatus: 'verified',
      sourceUrl: 'https://www.gov.uk/government/collections/national-curriculum',
      sourceCitation: 'Department for Education Statutory Guidance: National curriculum in England.',
      lastVerifiedAt: '2026-03-01T00:00:00Z',
    },
    {
      id: 'uk-scotland',
      orgId: 'org_gb_scot',
      name: 'Curriculum for Excellence (Scotland)',
      shortName: 'CfE (Scotland)',
      scope: 'state-regional',
      countryIso2: 'GB',
      regionCode: 'GB-SCT',
      educationPathway: 'k-12',
      gradeScheme: 'year',
      gradeOptions: ['Early Level (P1)', 'First Level (P2-P4)', 'Second Level (P5-P7)', 'Third/Fourth Level (S1-S3)', 'Senior Phase / Nationals & Highers (S4-S6)'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'Experiences and Outcomes (Es and Os), four capacities, interdisciplinary learning, and Scottish Qualifications Authority (SQA) qualifications.',
      officialDomains: ['education.gov.scot', 'sqa.org.uk'],
      verificationStatus: 'verified',
      sourceUrl: 'https://education.gov.scot/curriculum-for-excellence/',
      sourceCitation: 'Scottish Government & Education Scotland Curriculum for Excellence Benchmarks.',
      lastVerifiedAt: '2026-02-18T00:00:00Z',
    },
    {
      id: 'uk-exam-boards',
      orgId: 'org_gb_aqa',
      name: 'GCSE & A-Level Exam Boards (AQA, Edexcel, OCR)',
      shortName: 'UK Exam Boards',
      scope: 'national',
      countryIso2: 'GB',
      educationPathway: 'secondary',
      gradeScheme: 'year',
      gradeOptions: ['GCSE Year 10', 'GCSE Year 11', 'A-Level Year 12', 'A-Level Year 13'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'Board-specific specification units, mark schemes, Assessment Objectives (AOs), and past-paper structured questions.',
      officialDomains: ['aqa.org.uk', 'qualifications.pearson.com', 'ocr.org.uk'],
      verificationStatus: 'verified',
      sourceUrl: 'https://www.aqa.org.uk/qualifications',
      sourceCitation: 'Ofqual accredited specification frameworks and GCSE/GCE Criteria.',
      lastVerifiedAt: '2026-02-11T00:00:00Z',
    },
    {
      id: 'au-acara',
      orgId: 'org_au_acara',
      name: 'Australian Curriculum (ACARA v9)',
      shortName: 'ACARA (National)',
      scope: 'national',
      countryIso2: 'AU',
      educationPathway: 'k-12',
      gradeScheme: 'year',
      gradeOptions: ['Foundation Year', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'ACARA Content Descriptions, Achievement Standards, General Capabilities, and Cross-Curriculum Priorities.',
      officialDomains: ['australiancurriculum.edu.au', 'acara.edu.au'],
      verificationStatus: 'verified',
      sourceUrl: 'https://v9.australiancurriculum.edu.au/',
      sourceCitation: 'Australian Curriculum, Assessment and Reporting Authority Version 9.0 Standards.',
      lastVerifiedAt: '2026-03-02T00:00:00Z',
    },
    {
      id: 'au-state-territory',
      orgId: 'org_au_nesa',
      name: 'State / Territory Curriculum (NESA, VCAA, QCAA, SCSA)',
      shortName: 'State/Territory (AU)',
      scope: 'state-regional',
      countryIso2: 'AU',
      regionCode: 'AU-NSW',
      educationPathway: 'k-12',
      gradeScheme: 'year',
      gradeOptions: ['Foundation Year', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11 (Senior)', 'Year 12 (HSC/VCE/QCE)'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'State syllabus outcomes, internal school-based assessments, and state senior certificate examinations.',
      officialDomains: ['educationstandards.nsw.edu.au', 'vcaa.vic.edu.au'],
      verificationStatus: 'verified',
      sourceUrl: 'https://curriculum.nsw.edu.au/',
      sourceCitation: 'NSW Curriculum Reform Syllabus Standards, NESA.',
      lastVerifiedAt: '2026-02-15T00:00:00Z',
    },
    {
      id: 'ca-provincial',
      orgId: 'org_ca_ontario',
      name: 'Provincial / Territorial Curriculum (Ontario, BC, Alberta)',
      shortName: 'Provincial (CA)',
      scope: 'state-regional',
      countryIso2: 'CA',
      regionCode: 'CA-ON',
      educationPathway: 'k-12',
      gradeScheme: 'grade',
      gradeOptions: ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'Ministry of Education specific expectations, Big Ideas, Curricular Competencies, and Growing Success assessment levels.',
      officialDomains: ['ontario.ca', 'curriculum.gov.bc.ca'],
      verificationStatus: 'verified',
      sourceUrl: 'https://www.dcp.edu.gov.on.ca/en/curriculum',
      sourceCitation: 'Ontario Curriculum Policy Documents, Ministry of Education.',
      lastVerifiedAt: '2026-01-20T00:00:00Z',
    },
    {
      id: 'in-ib',
      orgId: 'org_intl_ibo',
      name: 'International Baccalaureate (IB PYP, MYP, DP)',
      shortName: 'IB',
      scope: 'international',
      countryIso2: 'OTHER',
      educationPathway: 'k-12',
      gradeScheme: 'year',
      gradeOptions: ['Primary Years (PYP)', 'Middle Years (MYP)', 'Diploma Programme (DP Years 1-2)'],
      spelling: 'UK',
      measurementSystem: 'metric_preferred',
      assessmentStyle: 'Inquiry cycles, Learner Profile attributes, Theory of Knowledge (TOK) connections, and criterion-referenced assessment rubrics (A, B, C, D).',
      officialDomains: ['ibo.org'],
      verificationStatus: 'verified',
      sourceUrl: 'https://www.ibo.org/programmes/',
      sourceCitation: 'International Baccalaureate Organization Curriculum Frameworks.',
      lastVerifiedAt: '2026-02-01T00:00:00Z',
    },
    {
      id: 'in-cambridge',
      orgId: 'org_intl_cambridge',
      name: 'Cambridge Assessment International Education (Primary, Lower Sec, IGCSE, A-Level)',
      shortName: 'Cambridge',
      scope: 'international',
      countryIso2: 'OTHER',
      educationPathway: 'k-12',
      gradeScheme: 'year',
      gradeOptions: ['Stage 1-6 (Primary)', 'Stage 7-9 (Lower Secondary)', 'Stage 10-11 (IGCSE)', 'Stage 12-13 (AS & A Level)'],
      spelling: 'UK',
      measurementSystem: 'metric',
      assessmentStyle: 'Linear syllabus objectives, Cambridge command words (explain, calculate, deduce), progressive past-paper problem sets.',
      officialDomains: ['cambridgeinternational.org'],
      verificationStatus: 'verified',
      sourceUrl: 'https://www.cambridgeinternational.org/programmes-and-qualifications/',
      sourceCitation: 'Cambridge International Education Curricula and Assessment Programmes.',
      lastVerifiedAt: '2026-02-05T00:00:00Z',
    },
    {
      id: 'other-custom',
      orgId: 'org_in_cbse', // placeholder org
      name: 'Custom / Other Curriculum Framework',
      shortName: 'Custom Framework',
      scope: 'local',
      countryIso2: 'OTHER',
      educationPathway: 'k-12',
      gradeScheme: 'other',
      gradeOptions: ['Early Childhood (Ages 3-5)', 'Primary (Grades 1-5)', 'Middle School (Grades 6-8)', 'High School (Grades 9-12)', 'Higher Education / Vocational'],
      spelling: 'US',
      measurementSystem: 'metric',
      assessmentStyle: 'Formative check-ins, continuous teacher assessment, and culminating unit deliverables.',
      officialDomains: [],
      verificationStatus: 'unverified',
      sourceUrl: '',
      sourceCitation: 'Teacher-specified custom instructional guidelines.',
      lastVerifiedAt: '2026-01-01T00:00:00Z',
    },
  ];

  for (const curr of seedCurricula) {
    directoryDb.upsertCurriculum(curr);
  }

  // 5. Seed Official Syllabus Excerpt Documents (for RAG context and verification evidence)
  const seedDocs: DbCurriculumDocument[] = [
    {
      id: 'doc_cbse_sec_science',
      curriculumId: 'cbse',
      title: 'CBSE Secondary School Curriculum (Classes IX-X) Science Syllabus',
      documentType: 'syllabus',
      officialUrl: 'https://cbseacademic.nic.in/web_material/Curriculum25/Sec/Science_Sec_2024-25.pdf',
      shortExcerpt: 'Theme: Materials, The World of the Living, Natural Phenomena, Effects of Current, Natural Resources. Emphasizes experiential learning and scientific inquiry.',
      licenseNotes: 'Government of India Open Access Educational Material; excerpted under fair educational reference.',
      verifiedAt: '2026-03-15T00:00:00Z',
    },
    {
      id: 'doc_ngss_chem_framework',
      curriculumId: 'us-ngss',
      title: 'NGSS High School Physical Sciences: Chemical Reactions and Energy Transfer',
      documentType: 'standards',
      officialUrl: 'https://www.nextgenscience.org/dci-arrangement/hs-ps1-matter-and-its-interactions',
      shortExcerpt: 'HS-PS1 Matter and Its Interactions: Construct explanations for how the structure of atoms relates to properties; model changes in electron configuration and energy changes during reactions.',
      licenseNotes: 'Creative Commons Attribution 4.0 International Public License (CC BY 4.0).',
      verifiedAt: '2026-02-10T00:00:00Z',
    },
    {
      id: 'doc_ccss_algebra_framework',
      curriculumId: 'us-ccss',
      title: 'Common Core High School Algebra: Creating Equations (HSA.CED)',
      documentType: 'standards',
      officialUrl: 'https://www.corestandards.org/Math/Content/HSA/CED/',
      shortExcerpt: 'Create equations that describe numbers or relationships. Represent constraints by equations or inequalities, and interpret solutions in a modeling context.',
      licenseNotes: 'Public domain educational framework, National Governors Association & CCSSO.',
      verifiedAt: '2026-02-14T00:00:00Z',
    },
    {
      id: 'doc_acara_v9_science',
      curriculumId: 'au-acara',
      title: 'Australian Curriculum v9 Science F-10 Learning Area Overview',
      documentType: 'curriculum_framework',
      officialUrl: 'https://v9.australiancurriculum.edu.au/f-10-curriculum/learning-areas/science',
      shortExcerpt: 'Science Understanding, Science as a Human Endeavour, and Science Inquiry sub-strands provide a balanced foundation for investigating real-world systems.',
      licenseNotes: 'Commonwealth of Australia, Creative Commons Attribution 4.0 International.',
      verifiedAt: '2026-03-02T00:00:00Z',
    },
  ];

  for (const doc of seedDocs) {
    directoryDb.upsertDocument(doc);
  }

  // 6. Seed Authentic Verified Standards (for verified RAG retrieval)
  const seedStandards: DbStandardRecord[] = [
    {
      id: 'std_ngss_ps1_1',
      curriculumId: 'us-ngss',
      grade: 'High School (Grades 9-12)',
      subject: 'Science',
      code: 'HS-PS1-1',
      title: 'Periodic Table Patterns & Valence Electrons',
      description: 'Use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons in the outermost energy level of atoms.',
      officialUrl: 'https://www.nextgenscience.org/pe/hs-ps1-1-matter-and-its-interactions',
      sourceName: 'Next Generation Science Standards (Achieve, Inc.)',
      alignmentType: 'verified',
    },
    {
      id: 'std_ngss_ps1_2',
      curriculumId: 'us-ngss',
      grade: 'High School (Grades 9-12)',
      subject: 'Science',
      code: 'HS-PS1-2',
      title: 'Chemical Reactions & Molecular Collisions',
      description: 'Construct and revise an explanation for the outcome of a simple chemical reaction based on the outermost electron states of atoms, trends in the periodic table, and knowledge of the patterns of chemical properties.',
      officialUrl: 'https://www.nextgenscience.org/pe/hs-ps1-2-matter-and-its-interactions',
      sourceName: 'Next Generation Science Standards (Achieve, Inc.)',
      alignmentType: 'verified',
    },
    {
      id: 'std_ccss_math_ced_2',
      curriculumId: 'us-ccss',
      grade: 'Grade 9 (High School)',
      subject: 'Mathematics',
      code: 'CCSS.MATH.CONTENT.HSA.CED.A.2',
      title: 'Linear & Exponential Relationship Modeling',
      description: 'Create equations in two or more variables to represent relationships between quantities; graph equations on coordinate axes with labels and scales.',
      officialUrl: 'https://www.corestandards.org/Math/Content/HSA/CED/A/2/',
      sourceName: 'Common Core State Standards Initiative',
      alignmentType: 'verified',
    },
    {
      id: 'std_cbse_sci_10_chem',
      curriculumId: 'cbse',
      grade: 'Class 10',
      subject: 'Science',
      code: 'CBSE.SCI.10.1',
      title: 'Chemical Reactions and Equations',
      description: 'Chemical equation, Balanced chemical equation, implications of a balanced chemical equation, types of chemical reactions: combination, decomposition, displacement, double displacement, precipitation, neutralization, oxidation and reduction.',
      officialUrl: 'https://cbseacademic.nic.in/curriculum_2025.html',
      sourceName: 'Central Board of Secondary Education Class X Syllabus',
      alignmentType: 'verified',
    },
  ];

  for (const std of seedStandards) {
    directoryDb.upsertStandard(std);
  }

  console.log('[Directory Seeder] Seeding completed successfully.');
}

// Auto-run if executed directly via tsx/node
if (process.argv[1]?.endsWith('seedDirectory.ts')) {
  seedDirectoryDatabase();
}
