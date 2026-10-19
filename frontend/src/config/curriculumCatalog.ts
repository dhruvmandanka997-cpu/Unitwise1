import { z } from 'zod';

export type CurriculumType = 'national' | 'state-regional' | 'international' | 'exam-board' | 'open';
export type GradeScheme = 'grade' | 'year' | 'key-stage' | 'other';

export interface CurriculumRegion {
  id: string;
  name: string;
  code?: string;
}

export interface CurriculumOption {
  id: string;
  label: string;
  shortLabel?: string;
  type: CurriculumType;
  typeBadgeLabel: string;
  requiresRegion: boolean;
  regionLabel?: string;
  regions?: CurriculumRegion[];
  gradeScheme: GradeScheme;
  gradeOptions: string[];
  spelling: 'US' | 'UK';
  measurementSystem: 'metric' | 'us_customary' | 'metric_preferred';
  assessmentStyleDescription?: string;
  officialDomains?: string[];
}

export interface CountryCatalogEntry {
  id: string;
  name: string;
  code: string;
  flagEmoji?: string;
  curricula: CurriculumOption[];
}

export interface CurriculumCatalog {
  catalogVersion: string;
  notice: string;
  countries: CountryCatalogEntry[];
}

export const CURRICULUM_CATALOG_VERSION = '1.0.0';

export const CURRICULUM_CATALOG: CurriculumCatalog = {
  catalogVersion: CURRICULUM_CATALOG_VERSION,
  notice: 'Supported options, which may change over time. Boards and frameworks are categorized neutrally with no endorsement implied.',
  countries: [
    {
      id: 'in',
      name: 'India',
      code: 'IN',
      flagEmoji: '🇮🇳',
      curricula: [
        {
          id: 'cbse',
          label: 'CBSE (Central Board of Secondary Education)',
          shortLabel: 'CBSE',
          type: 'national',
          typeBadgeLabel: 'National Board',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
            'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
            'Class 11', 'Class 12'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'CBSE pedagogical blueprint with Competency-Based Questions (CBQs), Assertion-Reasoning, 1-mark objective questions, 3-mark short answers, and 5-mark structured problem-solving.',
          officialDomains: ['cbse.gov.in', 'cbseacademic.nic.in', 'ncert.nic.in', 'diksha.gov.in']
        },
        {
          id: 'icse',
          label: 'CISCE / ICSE & ISC',
          shortLabel: 'CISCE/ICSE',
          type: 'national',
          typeBadgeLabel: 'National Board',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
            'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10 (ICSE)',
            'Class 11', 'Class 12 (ISC)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'CISCE conceptual application, detailed structured analysis, analytical literature synthesis, and practical laboratory portfolios.',
          officialDomains: ['cisce.org']
        },
        {
          id: 'in-state-board',
          label: 'State Board (SCERT / State Secondary Board)',
          shortLabel: 'State Board',
          type: 'state-regional',
          typeBadgeLabel: 'State-level',
          requiresRegion: true,
          regionLabel: 'State / Union Territory',
          regions: [
            { id: 'andhra-pradesh', name: 'Andhra Pradesh' },
            { id: 'arunachal-pradesh', name: 'Arunachal Pradesh' },
            { id: 'assam', name: 'Assam' },
            { id: 'bihar', name: 'Bihar' },
            { id: 'chhattisgarh', name: 'Chhattisgarh' },
            { id: 'goa', name: 'Goa' },
            { id: 'gujarat', name: 'Gujarat' },
            { id: 'haryana', name: 'Haryana' },
            { id: 'himachal-pradesh', name: 'Himachal Pradesh' },
            { id: 'jharkhand', name: 'Jharkhand' },
            { id: 'karnataka', name: 'Karnataka' },
            { id: 'kerala', name: 'Kerala' },
            { id: 'madhya-pradesh', name: 'Madhya Pradesh' },
            { id: 'maharashtra', name: 'Maharashtra' },
            { id: 'manipur', name: 'Manipur' },
            { id: 'meghalaya', name: 'Meghalaya' },
            { id: 'mizoram', name: 'Mizoram' },
            { id: 'nagaland', name: 'Nagaland' },
            { id: 'odisha', name: 'Odisha' },
            { id: 'punjab', name: 'Punjab' },
            { id: 'rajasthan', name: 'Rajasthan' },
            { id: 'sikkim', name: 'Sikkim' },
            { id: 'tamil-nadu', name: 'Tamil Nadu' },
            { id: 'telangana', name: 'Telangana' },
            { id: 'tripura', name: 'Tripura' },
            { id: 'uttar-pradesh', name: 'Uttar Pradesh' },
            { id: 'uttarakhand', name: 'Uttarakhand' },
            { id: 'west-bengal', name: 'West Bengal' },
            { id: 'delhi', name: 'Delhi (NCT)' },
            { id: 'jammu-kashmir', name: 'Jammu & Kashmir' },
            { id: 'ladakh', name: 'Ladakh' },
            { id: 'chandigarh', name: 'Chandigarh' },
            { id: 'puducherry', name: 'Puducherry' },
            { id: 'andaman-nicobar', name: 'Andaman & Nicobar Islands' },
            { id: 'dadra-nagar-haveli', name: 'Dadra & Nagar Haveli and Daman & Diu' },
            { id: 'lakshadweep', name: 'Lakshadweep' }
          ],
          gradeScheme: 'grade',
          gradeOptions: [
            'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
            'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10 (SSLC/Matric)',
            'Class 11 (HSC)', 'Class 12 (HSC)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'State Council of Educational Research & Training syllabus benchmarks, textbook-chapter alignment, and bilingual vocabulary aids.'
        },
        {
          id: 'nios',
          label: 'NIOS (National Institute of Open Schooling)',
          shortLabel: 'NIOS',
          type: 'open',
          typeBadgeLabel: 'Open / Distance',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'OBE Level A (Class 3)', 'OBE Level B (Class 5)', 'OBE Level C (Class 8)',
            'Secondary (Class 10)', 'Senior Secondary (Class 12)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'Self-paced flexible modular learning, Tutor Marked Assignments (TMAs), and practical vocational application.',
          officialDomains: ['nios.ac.in']
        },
        {
          id: 'in-ib',
          label: 'International Baccalaureate (IB)',
          shortLabel: 'IB',
          type: 'international',
          typeBadgeLabel: 'International',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'PYP (Early Years - Grade 5)',
            'MYP 1 (Grade 6)', 'MYP 2 (Grade 7)', 'MYP 3 (Grade 8)', 'MYP 4 (Grade 9)', 'MYP 5 (Grade 10)',
            'DP 1 (Grade 11)', 'DP 2 (Grade 12)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'Inquiry-based conceptual learning, criterion-referenced rubrics, and internal assessment portfolios.',
          officialDomains: ['ibo.org']
        },
        {
          id: 'in-cambridge',
          label: 'Cambridge Assessment International (CAIE / IGCSE)',
          shortLabel: 'Cambridge',
          type: 'international',
          typeBadgeLabel: 'International',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: [
            'Primary (Stages 1-6)',
            'Lower Secondary (Stages 7-9)',
            'IGCSE (Years 10-11)',
            'AS & A Level (Years 12-13)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'Command-word structured questions, practical science experiments, and analytical problem solving.',
          officialDomains: ['cambridgeinternational.org']
        },
        {
          id: 'in-other',
          label: 'Other Indian Curriculum',
          shortLabel: 'Other (IN)',
          type: 'open',
          typeBadgeLabel: 'Custom',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
            'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
            'Class 11', 'Class 12'
          ],
          spelling: 'UK',
          measurementSystem: 'metric'
        }
      ]
    },
    {
      id: 'us',
      name: 'United States',
      code: 'US',
      flagEmoji: '🇺🇸',
      curricula: [
        {
          id: 'us-ccss',
          label: 'Common Core State Standards (CCSS)',
          shortLabel: 'Common Core',
          type: 'national',
          typeBadgeLabel: 'Multi-State Standard',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
            'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
            'Grade 10', 'Grade 11', 'Grade 12'
          ],
          spelling: 'US',
          measurementSystem: 'us_customary',
          assessmentStyleDescription: 'Standards-based progression, text-dependent analysis, mathematical modeling, and performance tasks.',
          officialDomains: ['corestandards.org']
        },
        {
          id: 'us-ngss',
          label: 'Next Generation Science Standards (NGSS)',
          shortLabel: 'NGSS',
          type: 'national',
          typeBadgeLabel: 'National Framework',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
            'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
            'Grade 10', 'Grade 11', 'Grade 12'
          ],
          spelling: 'US',
          measurementSystem: 'metric_preferred',
          assessmentStyleDescription: 'Three-dimensional learning: Disciplinary Core Ideas (DCIs), Science and Engineering Practices (SEPs), and Crosscutting Concepts (CCCs).',
          officialDomains: ['nextgenscience.org']
        },
        {
          id: 'us-state-standards',
          label: 'State Standards (TEKS, CPALMS, NYSED, etc.)',
          shortLabel: 'State Standards',
          type: 'state-regional',
          typeBadgeLabel: 'State-level',
          requiresRegion: true,
          regionLabel: 'State',
          regions: [
            { id: 'al', name: 'Alabama' }, { id: 'ak', name: 'Alaska' }, { id: 'az', name: 'Arizona' },
            { id: 'ar', name: 'Arkansas' }, { id: 'ca', name: 'California' }, { id: 'co', name: 'Colorado' },
            { id: 'ct', name: 'Connecticut' }, { id: 'de', name: 'Delaware' }, { id: 'fl', name: 'Florida' },
            { id: 'ga', name: 'Georgia' }, { id: 'hi', name: 'Hawaii' }, { id: 'id', name: 'Idaho' },
            { id: 'il', name: 'Illinois' }, { id: 'in', name: 'Indiana' }, { id: 'ia', name: 'Iowa' },
            { id: 'ks', name: 'Kansas' }, { id: 'ky', name: 'Kentucky' }, { id: 'la', name: 'Louisiana' },
            { id: 'me', name: 'Maine' }, { id: 'md', name: 'Maryland' }, { id: 'ma', name: 'Massachusetts' },
            { id: 'mi', name: 'Michigan' }, { id: 'mn', name: 'Minnesota' }, { id: 'ms', name: 'Mississippi' },
            { id: 'mo', name: 'Missouri' }, { id: 'mt', name: 'Montana' }, { id: 'ne', name: 'Nebraska' },
            { id: 'nv', name: 'Nevada' }, { id: 'nh', name: 'New Hampshire' }, { id: 'nj', name: 'New Jersey' },
            { id: 'nm', name: 'New Mexico' }, { id: 'ny', name: 'New York' }, { id: 'nc', name: 'North Carolina' },
            { id: 'nd', name: 'North Dakota' }, { id: 'oh', name: 'Ohio' }, { id: 'ok', name: 'Oklahoma' },
            { id: 'or', name: 'Oregon' }, { id: 'pa', name: 'Pennsylvania' }, { id: 'ri', name: 'Rhode Island' },
            { id: 'sc', name: 'South Carolina' }, { id: 'sd', name: 'South Dakota' }, { id: 'tn', name: 'Tennessee' },
            { id: 'tx', name: 'Texas' }, { id: 'ut', name: 'Utah' }, { id: 'vt', name: 'Vermont' },
            { id: 'va', name: 'Virginia' }, { id: 'wa', name: 'Washington' }, { id: 'wv', name: 'West Virginia' },
            { id: 'wi', name: 'Wisconsin' }, { id: 'wy', name: 'Wyoming' }
          ],
          gradeScheme: 'grade',
          gradeOptions: [
            'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
            'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
            'Grade 10', 'Grade 11', 'Grade 12'
          ],
          spelling: 'US',
          measurementSystem: 'us_customary',
          assessmentStyleDescription: 'State department of education performance benchmarks and standardized testing preparation.'
        },
        {
          id: 'us-ap',
          label: 'Advanced Placement (AP / College Board)',
          shortLabel: 'AP',
          type: 'exam-board',
          typeBadgeLabel: 'Exam Board',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: ['Grade 9 (Pre-AP)', 'Grade 10', 'Grade 11', 'Grade 12'],
          spelling: 'US',
          measurementSystem: 'us_customary',
          assessmentStyleDescription: 'College-level rigor, Document-Based Questions (DBQs), Free-Response Questions (FRQs), and analytic scoring rubrics.',
          officialDomains: ['apcentral.collegeboard.org']
        },
        {
          id: 'us-ib',
          label: 'International Baccalaureate (IB)',
          shortLabel: 'IB',
          type: 'international',
          typeBadgeLabel: 'International',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
            'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
            'Grade 10', 'Grade 11', 'Grade 12'
          ],
          spelling: 'US',
          measurementSystem: 'metric_preferred',
          assessmentStyleDescription: 'Inquiry cycles, international-mindedness, and criterion-referenced assessment rubrics.'
        },
        {
          id: 'us-other',
          label: 'Other US Curriculum / District Program',
          shortLabel: 'Other (US)',
          type: 'open',
          typeBadgeLabel: 'Custom',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
            'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
            'Grade 10', 'Grade 11', 'Grade 12'
          ],
          spelling: 'US',
          measurementSystem: 'us_customary'
        }
      ]
    },
    {
      id: 'uk',
      name: 'United Kingdom',
      code: 'GB',
      flagEmoji: '🇬🇧',
      curricula: [
        {
          id: 'uk-national-england',
          label: 'National Curriculum for England',
          shortLabel: 'National Curriculum (Eng)',
          type: 'national',
          typeBadgeLabel: 'National (England)',
          requiresRegion: false,
          gradeScheme: 'key-stage',
          gradeOptions: [
            'Early Years (Reception)',
            'Key Stage 1 (Years 1-2)',
            'Key Stage 2 (Years 3-6)',
            'Key Stage 3 (Years 7-9)',
            'Key Stage 4 / GCSE (Years 10-11)',
            'Key Stage 5 / Sixth Form (Years 12-13)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'Statutory programmes of study, formative checkpoints, end-of-key-stage assessments, and GCSE preparation.',
          officialDomains: ['gov.uk', 'nationalcurriculum.gov.uk']
        },
        {
          id: 'uk-scotland',
          label: 'Curriculum for Excellence (Scotland)',
          shortLabel: 'CfE (Scotland)',
          type: 'state-regional',
          typeBadgeLabel: 'National (Scotland)',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: [
            'Early Level (P1)',
            'First Level (P2-P4)',
            'Second Level (P5-P7)',
            'Third/Fourth Level (S1-S3)',
            'Senior Phase / Nationals & Highers (S4-S6)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'Experiences and Outcomes (Es and Os), four capacities, interdisciplinary learning, and Scottish Qualifications Authority (SQA) qualifications.',
          officialDomains: ['education.gov.scot', 'sqa.org.uk']
        },
        {
          id: 'uk-wales',
          label: 'Curriculum for Wales (Cwricwlwm i Gymru)',
          shortLabel: 'Curriculum for Wales',
          type: 'state-regional',
          typeBadgeLabel: 'National (Wales)',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: [
            'Progression Step 1 (Ages 3-5)',
            'Progression Step 2 (Ages 5-8)',
            'Progression Step 3 (Ages 8-11)',
            'Progression Step 4 (Ages 11-14)',
            'Progression Step 5 (Ages 14-16)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'Six Areas of Learning and Experience (AoLE), four core purposes, and learner progression steps.',
          officialDomains: ['hwb.gov.wales']
        },
        {
          id: 'uk-ni',
          label: 'Northern Ireland Curriculum',
          shortLabel: 'NI Curriculum',
          type: 'state-regional',
          typeBadgeLabel: 'National (NI)',
          requiresRegion: false,
          gradeScheme: 'key-stage',
          gradeOptions: [
            'Foundation Stage (Years 1-2)',
            'Key Stage 1 (Years 3-4)',
            'Key Stage 2 (Years 5-7)',
            'Key Stage 3 (Years 8-10)',
            'Key Stage 4 (Years 11-12)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'CCEA statutory requirements, Thinking Skills and Personal Capabilities (TSPC), and Cross-Curricular Skills.',
          officialDomains: ['ccea.org.uk']
        },
        {
          id: 'uk-exam-boards',
          label: 'GCSE & A-Level Exam Boards (AQA, Edexcel, OCR)',
          shortLabel: 'UK Exam Boards',
          type: 'exam-board',
          typeBadgeLabel: 'Exam Board',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: [
            'GCSE Year 10', 'GCSE Year 11',
            'A-Level Year 12', 'A-Level Year 13'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'Board-specific specification units, mark schemes, Assessment Objectives (AOs), and past-paper structured questions.',
          officialDomains: ['aqa.org.uk', 'qualifications.pearson.com', 'ocr.org.uk']
        },
        {
          id: 'uk-cambridge',
          label: 'Cambridge Assessment International Education',
          shortLabel: 'Cambridge',
          type: 'international',
          typeBadgeLabel: 'International',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10 (IGCSE)', 'Year 11 (IGCSE)', 'Year 12 (A-Level)', 'Year 13 (A-Level)'],
          spelling: 'UK',
          measurementSystem: 'metric'
        },
        {
          id: 'uk-ib',
          label: 'International Baccalaureate (IB)',
          shortLabel: 'IB',
          type: 'international',
          typeBadgeLabel: 'International',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: ['Years 1-6 (PYP)', 'Years 7-11 (MYP)', 'Years 12-13 (DP)'],
          spelling: 'UK',
          measurementSystem: 'metric'
        },
        {
          id: 'uk-other',
          label: 'Other UK Curriculum',
          shortLabel: 'Other (UK)',
          type: 'open',
          typeBadgeLabel: 'Custom',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'],
          spelling: 'UK',
          measurementSystem: 'metric'
        }
      ]
    },
    {
      id: 'au',
      name: 'Australia',
      code: 'AU',
      flagEmoji: '🇦🇺',
      curricula: [
        {
          id: 'au-acara',
          label: 'Australian Curriculum (ACARA v9)',
          shortLabel: 'ACARA (National)',
          type: 'national',
          typeBadgeLabel: 'National',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: [
            'Foundation Year', 'Year 1', 'Year 2', 'Year 3', 'Year 4',
            'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9',
            'Year 10', 'Year 11', 'Year 12'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'ACARA Content Descriptions, Achievement Standards, General Capabilities, and Cross-Curriculum Priorities.',
          officialDomains: ['australiancurriculum.edu.au', 'acara.edu.au']
        },
        {
          id: 'au-state-territory',
          label: 'State / Territory Curriculum (NESA, VCAA, QCAA, SCSA)',
          shortLabel: 'State/Territory',
          type: 'state-regional',
          typeBadgeLabel: 'State-level',
          requiresRegion: true,
          regionLabel: 'State / Territory',
          regions: [
            { id: 'nsw', name: 'New South Wales (NESA)' },
            { id: 'vic', name: 'Victoria (VCAA)' },
            { id: 'qld', name: 'Queensland (QCAA)' },
            { id: 'wa', name: 'Western Australia (SCSA)' },
            { id: 'sa', name: 'South Australia' },
            { id: 'tas', name: 'Tasmania' },
            { id: 'act', name: 'Australian Capital Territory' },
            { id: 'nt', name: 'Northern Territory' }
          ],
          gradeScheme: 'year',
          gradeOptions: [
            'Foundation Year', 'Year 1', 'Year 2', 'Year 3', 'Year 4',
            'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9',
            'Year 10', 'Year 11 (Senior)', 'Year 12 (HSC/VCE/QCE)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'State syllabus outcomes, internal school-based assessments, and state senior certificate examinations.'
        },
        {
          id: 'au-ib',
          label: 'International Baccalaureate (IB)',
          shortLabel: 'IB',
          type: 'international',
          typeBadgeLabel: 'International',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: [
            'Foundation - Year 5 (PYP)',
            'Year 6 - 10 (MYP)',
            'Year 11 - 12 (DP)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric'
        },
        {
          id: 'au-cambridge',
          label: 'Cambridge Assessment International Education',
          shortLabel: 'Cambridge',
          type: 'international',
          typeBadgeLabel: 'International',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'],
          spelling: 'UK',
          measurementSystem: 'metric'
        },
        {
          id: 'au-other',
          label: 'Other Australian Curriculum',
          shortLabel: 'Other (AU)',
          type: 'open',
          typeBadgeLabel: 'Custom',
          requiresRegion: false,
          gradeScheme: 'year',
          gradeOptions: ['Foundation Year', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'],
          spelling: 'UK',
          measurementSystem: 'metric'
        }
      ]
    },
    {
      id: 'ca',
      name: 'Canada',
      code: 'CA',
      flagEmoji: '🇨🇦',
      curricula: [
        {
          id: 'ca-provincial',
          label: 'Provincial / Territorial Curriculum',
          shortLabel: 'Provincial Curriculum',
          type: 'state-regional',
          typeBadgeLabel: 'Province-level',
          requiresRegion: true,
          regionLabel: 'Province / Territory',
          regions: [
            { id: 'on', name: 'Ontario' },
            { id: 'bc', name: 'British Columbia' },
            { id: 'ab', name: 'Alberta' },
            { id: 'qc', name: 'Quebec' },
            { id: 'sk', name: 'Saskatchewan' },
            { id: 'mb', name: 'Manitoba' },
            { id: 'ns', name: 'Nova Scotia' },
            { id: 'nb', name: 'New Brunswick' },
            { id: 'nl', name: 'Newfoundland and Labrador' },
            { id: 'pe', name: 'Prince Edward Island' },
            { id: 'nt', name: 'Northwest Territories' },
            { id: 'yt', name: 'Yukon' },
            { id: 'nu', name: 'Nunavut' }
          ],
          gradeScheme: 'grade',
          gradeOptions: [
            'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
            'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
            'Grade 10', 'Grade 11', 'Grade 12'
          ],
          spelling: 'UK',
          measurementSystem: 'metric',
          assessmentStyleDescription: 'Ministry of Education specific expectations, Big Ideas, Curricular Competencies, and Growing Success assessment levels.'
        },
        {
          id: 'ca-ib',
          label: 'International Baccalaureate (IB)',
          shortLabel: 'IB',
          type: 'international',
          typeBadgeLabel: 'International',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'Kindergarten - Grade 5 (PYP)',
            'Grade 6 - Grade 10 (MYP)',
            'Grade 11 - Grade 12 (DP)'
          ],
          spelling: 'UK',
          measurementSystem: 'metric'
        },
        {
          id: 'ca-other',
          label: 'Other Canadian Curriculum',
          shortLabel: 'Other (CA)',
          type: 'open',
          typeBadgeLabel: 'Custom',
          requiresRegion: false,
          gradeScheme: 'grade',
          gradeOptions: [
            'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
            'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
            'Grade 10', 'Grade 11', 'Grade 12'
          ],
          spelling: 'UK',
          measurementSystem: 'metric'
        }
      ]
    },
    {
      id: 'other',
      name: 'Other Country / International',
      code: 'OTHER',
      flagEmoji: '🌐',
      curricula: [
        {
          id: 'other-custom',
          label: 'Custom / Other Curriculum Framework',
          shortLabel: 'Custom Framework',
          type: 'open',
          typeBadgeLabel: 'Open / Custom',
          requiresRegion: false,
          gradeScheme: 'other',
          gradeOptions: [
            'Early Childhood (Ages 3-5)',
            'Primary / Elementary (Grades 1-5)',
            'Middle / Lower Secondary (Grades 6-8)',
            'High School / Upper Secondary (Grades 9-12)',
            'Higher Education / Vocational'
          ],
          spelling: 'US',
          measurementSystem: 'metric'
        }
      ]
    }
  ]
};

export function sanitizeFreeText(input: unknown, maxLength: number = 80): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/<[^>]*>?/gm, '')
    .trim()
    .slice(0, maxLength);
}

export function findCountry(countryId: string): CountryCatalogEntry | undefined {
  return CURRICULUM_CATALOG.countries.find((c) => c.id === countryId);
}

export function findCurriculum(countryId: string, curriculumId: string): CurriculumOption | undefined {
  const country = findCountry(countryId);
  return country?.curricula.find((c) => c.id === curriculumId);
}

export function findRegion(countryId: string, curriculumId: string, regionId: string): CurriculumRegion | undefined {
  const curriculum = findCurriculum(countryId, curriculumId);
  return curriculum?.regions?.find((r) => r.id === regionId);
}

export interface ResolvedCurriculumLabels {
  country: string;
  curriculum: string;
  region?: string;
  grade: string;
  summary: string;
}

export function resolveCurriculumLabels(
  countryId?: string,
  curriculumId?: string,
  regionId?: string,
  grade?: string,
  otherCountryText?: string,
  otherCurriculumText?: string
): ResolvedCurriculumLabels {
  const cleanOtherCountry = sanitizeFreeText(otherCountryText);
  const cleanOtherCurriculum = sanitizeFreeText(otherCurriculumText);

  let countryLabel = 'Unspecified Country';
  if (countryId === 'other' && cleanOtherCountry) {
    countryLabel = cleanOtherCountry;
  } else if (countryId) {
    const c = findCountry(countryId);
    countryLabel = c ? c.name : countryId;
  }

  let curriculumLabel = 'General Curriculum';
  if ((curriculumId?.endsWith('other') || curriculumId === 'other-custom') && cleanOtherCurriculum) {
    curriculumLabel = cleanOtherCurriculum;
  } else if (countryId && curriculumId) {
    const curr = findCurriculum(countryId, curriculumId);
    curriculumLabel = curr ? curr.label : curriculumId;
  }

  let regionLabel: string | undefined = undefined;
  if (countryId && curriculumId && regionId) {
    const reg = findRegion(countryId, curriculumId, regionId);
    regionLabel = reg ? reg.name : regionId;
  }

  const gradeLabel = grade || 'Any Grade';

  const parts: string[] = [];
  if (countryLabel && countryLabel !== 'Unspecified Country') parts.push(countryLabel);

  if (regionLabel) {
    parts.push(`${curriculumLabel} (${regionLabel})`);
  } else if (curriculumLabel && curriculumLabel !== 'General Curriculum') {
    parts.push(curriculumLabel);
  }

  if (grade && grade !== 'Any Grade') {
    parts.push(grade);
  }

  const summary = parts.length > 0 ? parts.join(' · ') : 'No curriculum set';

  return {
    country: countryLabel,
    curriculum: curriculumLabel,
    region: regionLabel,
    grade: gradeLabel,
    summary,
  };
}
