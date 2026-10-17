import { IReferenceProvider, RawSearchResult } from '../types';
import { ReferenceCategory, ReferenceResourceType } from '../../../models/plan';

interface RegistryResource {
  title: string;
  url: string;
  snippet: string;
  sourceName: string;
  category: ReferenceCategory;
  resourceType: ReferenceResourceType;
  subjects: string[];
  gradeBands: string[]; // 'elementary', 'middle', 'high', 'all'
  keywords: string[];
  frameworks?: string[];
}

export const CURATED_EDUCATIONAL_REGISTRY: RegistryResource[] = [
  // --- MATHEMATICS ---
  {
    title: 'Common Core State Standards for Mathematics - Standards by Domain',
    url: 'https://www.thecorestandards.org/Math/',
    snippet: 'Official standards progressions for Mathematics, detailing learning progressions from counting and cardinality through high school algebra, functions, and geometry.',
    sourceName: 'Common Core State Standards Initiative',
    category: 'standards',
    resourceType: 'standard',
    subjects: ['mathematics', 'math', 'algebra', 'geometry', 'calculus', 'statistics'],
    gradeBands: ['all', 'elementary', 'middle', 'high'],
    keywords: ['standards', 'math', 'progression', 'curriculum', 'benchmark', 'common core'],
    frameworks: ['common core', 'us', 'ngss'],
  },
  {
    title: 'OpenStax Peer-Reviewed Algebra & Trigonometry Textbook',
    url: 'https://openstax.org/details/books/algebra-and-trigonometry-2e',
    snippet: 'Comprehensive open-license, peer-reviewed textbook covering equations, functions, graphs, polynomials, and trigonometric applications with student practice exercises.',
    sourceName: 'OpenStax (Rice University)',
    category: 'textbooks',
    resourceType: 'textbook',
    subjects: ['mathematics', 'math', 'algebra', 'functions'],
    gradeBands: ['middle', 'high'],
    keywords: ['algebra', 'textbook', 'equations', 'linear', 'functions', 'quadratics', 'graphing'],
  },
  {
    title: 'OpenStax Prealgebra Textbook with Integrated Formative Checkpoints',
    url: 'https://openstax.org/details/books/prealgebra-2e',
    snippet: 'Designed to meet scope and sequence requirements for introducing variables, fractions, decimals, integers, and coordinate geometry with worked instructional examples.',
    sourceName: 'OpenStax (Rice University)',
    category: 'textbooks',
    resourceType: 'textbook',
    subjects: ['mathematics', 'math', 'prealgebra', 'fractions'],
    gradeBands: ['middle', 'high'],
    keywords: ['prealgebra', 'fractions', 'integers', 'ratios', 'decimals', 'expressions'],
  },
  {
    title: 'Khan Academy Algebra 1 Interactive Instructional Sequences',
    url: 'https://www.khanacademy.org/math/algebra',
    snippet: 'Mastery-based instructional modules covering linear equations, inequalities, slope, functions, and systems of equations with interactive self-paced practice.',
    sourceName: 'Khan Academy',
    category: 'videos',
    resourceType: 'video',
    subjects: ['mathematics', 'math', 'algebra'],
    gradeBands: ['middle', 'high'],
    keywords: ['algebra', 'video', 'practice', 'slope', 'linear equations', 'functions'],
  },
  {
    title: 'GeoGebra Interactive Visual Math & Geometry Classroom Suite',
    url: 'https://www.geogebra.org/materials',
    snippet: 'Dynamic geometry, algebra, graphing, and 3D modeling applets designed for classroom exploration of geometric proofs, functions, and transformations.',
    sourceName: 'GeoGebra Math Suite',
    category: 'videos',
    resourceType: 'other',
    subjects: ['mathematics', 'math', 'geometry', 'algebra'],
    gradeBands: ['middle', 'high'],
    keywords: ['geometry', 'interactive', 'coordinate', 'transformations', 'graphing', 'proofs'],
  },
  {
    title: 'Desmos Classroom Activities & Interactive Graphing Investigations',
    url: 'https://teacher.desmos.com/',
    snippet: 'Collaborative digital math investigations that invite student inquiry, mathematical discourse, and immediate formative feedback for teachers.',
    sourceName: 'Desmos Classroom',
    category: 'worksheets',
    resourceType: 'worksheet',
    subjects: ['mathematics', 'math', 'algebra', 'functions'],
    gradeBands: ['middle', 'high'],
    keywords: ['desmos', 'investigation', 'graphing', 'activity', 'worksheet', 'inquiry'],
  },
  {
    title: 'NRICH Mathematical Problem Solving & Rich Tasks',
    url: 'https://nrich.maths.org/secondary',
    snippet: 'Teacher guidance and challenging problem-solving investigations developed by the University of Cambridge Faculty of Mathematics to foster mathematical reasoning.',
    sourceName: 'University of Cambridge NRICH',
    category: 'teacher-guides',
    resourceType: 'teacher-guide',
    subjects: ['mathematics', 'math'],
    gradeBands: ['elementary', 'middle', 'high'],
    keywords: ['problem solving', 'teacher guide', 'reasoning', 'pedagogy', 'rich task'],
  },

  // --- SCIENCE & STEM ---
  {
    title: 'Next Generation Science Standards (NGSS) - Disciplinary Core Ideas',
    url: 'https://www.nextgenscience.org/',
    snippet: 'Framework for K-12 science education integrating scientific practices, crosscutting concepts, and disciplinary core ideas across physical, life, and earth sciences.',
    sourceName: 'Next Generation Science Standards',
    category: 'standards',
    resourceType: 'standard',
    subjects: ['science', 'biology', 'chemistry', 'physics', 'environmental science', 'earth science'],
    gradeBands: ['all', 'middle', 'high'],
    keywords: ['ngss', 'standards', 'science', 'inquiry', 'ecosystem', 'forces', 'cells'],
    frameworks: ['ngss', 'us', 'common core'],
  },
  {
    title: 'PhET Interactive Simulations for Science & Math',
    url: 'https://phet.colorado.edu/',
    snippet: 'Research-based interactive simulations developed by the University of Colorado Boulder, enabling visual inquiry into circuit construction, energy skate parks, and ecosystems.',
    sourceName: 'PhET University of Colorado Boulder',
    category: 'videos',
    resourceType: 'other',
    subjects: ['science', 'physics', 'chemistry', 'biology', 'math'],
    gradeBands: ['all', 'middle', 'high'],
    keywords: ['phet', 'simulation', 'interactive', 'lab', 'experiment', 'physics', 'chemistry'],
  },
  {
    title: 'OpenStax Biology 2e Comprehensive Open Textbook',
    url: 'https://openstax.org/details/books/biology-2e',
    snippet: 'Peer-reviewed college- and AP-level biology curriculum covering cellular respiration, genetics, photosynthesis, evolutionary adaptations, and ecological systems.',
    sourceName: 'OpenStax (Rice University)',
    category: 'textbooks',
    resourceType: 'textbook',
    subjects: ['science', 'biology', 'life science', 'ecosystems'],
    gradeBands: ['middle', 'high'],
    keywords: ['biology', 'cells', 'genetics', 'ecosystems', 'photosynthesis', 'ecology'],
  },
  {
    title: 'NASA STEM Engagement & Planetary Science Classroom Resources',
    url: 'https://science.nasa.gov/learn/',
    snippet: 'Real-world scientific datasets, hands-on engineering challenges, and multimedia inquiry guides covering space exploration, gravity, and Earth systems.',
    sourceName: 'NASA Education Directorate',
    category: 'articles',
    resourceType: 'article',
    subjects: ['science', 'physics', 'earth science', 'space science'],
    gradeBands: ['middle', 'high'],
    keywords: ['nasa', 'physics', 'earth', 'space', 'gravity', 'atmosphere', 'data'],
  },
  {
    title: 'National Science Foundation (NSF) Classroom Discovery Resources',
    url: 'https://www.nsf.gov/news/classroom/',
    snippet: 'Curated articles and multimedia lessons detailing current scientific discoveries in climate science, nanotechnology, robotics, and biological engineering.',
    sourceName: 'National Science Foundation',
    category: 'articles',
    resourceType: 'research',
    subjects: ['science', 'technology', 'engineering', 'biology', 'physics'],
    gradeBands: ['middle', 'high'],
    keywords: ['nsf', 'research', 'stem', 'engineering', 'science discovery'],
  },
  {
    title: 'Smithsonian Learning Lab Digital Educational Collections',
    url: 'https://learninglab.si.edu/',
    snippet: 'Millions of authentic museum specimens, primary scientific archives, and instructional pathways curated by Smithsonian researchers for interdisciplinary study.',
    sourceName: 'Smithsonian Institution',
    category: 'teacher-guides',
    resourceType: 'teacher-guide',
    subjects: ['science', 'history', 'social studies', 'arts'],
    gradeBands: ['all', 'middle', 'high'],
    keywords: ['smithsonian', 'primary sources', 'museum', 'inquiry', 'teacher guide'],
  },

  // --- COMPUTER SCIENCE ---
  {
    title: 'Official Python 3 Documentation & Educational Tutorial',
    url: 'https://docs.python.org/3/tutorial/',
    snippet: 'The authoritative reference manual and beginner walkthrough for Python programming syntax, control flow structures, data structures, and functions.',
    sourceName: 'Python Software Foundation',
    category: 'textbooks',
    resourceType: 'textbook',
    subjects: ['computer science', 'programming', 'python', 'coding'],
    gradeBands: ['middle', 'high'],
    keywords: ['python', 'programming', 'coding', 'algorithms', 'syntax', 'functions'],
  },
  {
    title: 'Harvard CS50: Introduction to Computer Science',
    url: 'https://cs50.harvard.edu/x/',
    snippet: 'Open courseware curriculum teaching algorithmic thinking, computational problem solving, data abstraction, and software engineering principles.',
    sourceName: 'Harvard University OpenCourseWare',
    category: 'videos',
    resourceType: 'video',
    subjects: ['computer science', 'programming', 'algorithms'],
    gradeBands: ['high'],
    keywords: ['cs50', 'harvard', 'computer science', 'algorithms', 'computational thinking'],
  },
  {
    title: 'MIT OpenCourseWare: Introduction to Computational Thinking in Python',
    url: 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
    snippet: 'Lecture slides, problem sets, and syllabus developed by MIT faculty to introduce programming concepts and data-driven computational methods.',
    sourceName: 'MIT OpenCourseWare',
    category: 'teacher-guides',
    resourceType: 'teacher-guide',
    subjects: ['computer science', 'programming', 'python'],
    gradeBands: ['high'],
    keywords: ['mit', 'computational thinking', 'problem set', 'teacher guide', 'python'],
  },

  // --- HUMANITIES, HISTORY & SOCIAL STUDIES ---
  {
    title: 'Library of Congress Primary Source Sets for Classroom Teachers',
    url: 'https://www.loc.gov/programs/teachers/classroom-materials/primary-source-sets/',
    snippet: 'Curated historical documents, maps, eyewitness journals, and audio recordings with analysis rubrics and teacher facilitation strategies.',
    sourceName: 'Library of Congress',
    category: 'articles',
    resourceType: 'article',
    subjects: ['history', 'social studies', 'civics', 'humanities'],
    gradeBands: ['middle', 'high'],
    keywords: ['library of congress', 'primary sources', 'history', 'constitution', 'civics', 'revolution'],
  },
  {
    title: 'Facing History and Ourselves: Educator Resource Library',
    url: 'https://www.facinghistory.org/resource-library',
    snippet: 'Classroom-ready case studies, historical readings, and ethical inquiry frameworks examining civic participation, human rights, and social history.',
    sourceName: 'Facing History and Ourselves',
    category: 'teacher-guides',
    resourceType: 'teacher-guide',
    subjects: ['history', 'social studies', 'civics'],
    gradeBands: ['middle', 'high'],
    keywords: ['civics', 'ethical reasoning', 'democracy', 'history', 'teacher guide'],
  },
  {
    title: 'National Archives DocsTeach: Classroom Historical Document Analysis',
    url: 'https://www.docsteach.org/',
    snippet: 'Online interactive activities for teaching historical thinking skills using authentic government charters, letters, treaties, and photographs.',
    sourceName: 'U.S. National Archives (DocsTeach)',
    category: 'worksheets',
    resourceType: 'worksheet',
    subjects: ['history', 'social studies'],
    gradeBands: ['middle', 'high'],
    keywords: ['national archives', 'docsteach', 'primary source', 'analysis', 'worksheet'],
  },

  // --- ENGLISH LANGUAGE ARTS & LITERATURE ---
  {
    title: 'Common Core State Standards for English Language Arts & Literacy',
    url: 'https://www.thecorestandards.org/ELA-Literacy/',
    snippet: 'College and career readiness anchor standards for reading informational texts, literary analysis, argumentative writing, speaking, and listening.',
    sourceName: 'Common Core State Standards Initiative',
    category: 'standards',
    resourceType: 'standard',
    subjects: ['english', 'language arts', 'literature', 'reading', 'writing'],
    gradeBands: ['all', 'middle', 'high'],
    keywords: ['ela', 'literacy', 'reading', 'writing', 'argumentative', 'text analysis'],
  },
  {
    title: 'ReadWriteThink Classroom Strategies & Lesson Frameworks',
    url: 'https://www.readwritethink.org/classroom-resources',
    snippet: 'Peer-reviewed literacy lesson plans, graphic organizers, and rubric templates produced by the National Council of Teachers of English (NCTE).',
    sourceName: 'National Council of Teachers of English',
    category: 'worksheets',
    resourceType: 'worksheet',
    subjects: ['english', 'language arts', 'writing', 'reading'],
    gradeBands: ['all', 'middle', 'high'],
    keywords: ['readwritethink', 'writing', 'graphic organizer', 'rubric', 'reading strategy'],
  },
  {
    title: 'Purdue Online Writing Lab (OWL) Rhetoric & Research Writing Guide',
    url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/index.html',
    snippet: 'The benchmark academic writing manual covering rhetorical analysis, persuasive thesis formulation, citation mechanics, and revision techniques.',
    sourceName: 'Purdue University OWL',
    category: 'articles',
    resourceType: 'article',
    subjects: ['english', 'writing', 'research', 'humanities'],
    gradeBands: ['high'],
    keywords: ['purdue owl', 'writing', 'rhetoric', 'thesis', 'argument', 'citation'],
  },

  // --- INDIAN NATIONAL CURRICULUM (CBSE / NCERT / DIKSHA) ---
  {
    title: 'NCERT Official Digital Textbooks Repository (Classes I - XII)',
    url: 'https://ncert.nic.in/textbook.php',
    snippet: 'Government-authorized complete textbooks for all subjects and classes under the National Curriculum Framework (NCF) including Mathematics, Science, and Social Science.',
    sourceName: 'NCERT (National Council of Educational Research and Training)',
    category: 'textbooks',
    resourceType: 'textbook',
    subjects: ['mathematics', 'science', 'social studies', 'english', 'hindi'],
    gradeBands: ['all', 'elementary', 'middle', 'high'],
    keywords: ['ncert', 'cbse', 'textbook', 'syllabus', 'india', 'curriculum'],
    frameworks: ['cbse', 'ncert', 'india', 'icse'],
  },
  {
    title: 'CBSE Academic Curriculum & Examination Guidelines',
    url: 'https://cbseacademic.nic.in/',
    snippet: 'Official syllabus, subject-wise competency-based learning outcomes, question banks, and pedagogical guidelines published by the Central Board of Secondary Education.',
    sourceName: 'Central Board of Secondary Education (CBSE)',
    category: 'standards',
    resourceType: 'standard',
    subjects: ['all', 'mathematics', 'science', 'social studies', 'english'],
    gradeBands: ['all', 'middle', 'high'],
    keywords: ['cbse', 'curriculum', 'learning outcomes', 'competency', 'board'],
    frameworks: ['cbse', 'ncert', 'india'],
  },
  {
    title: 'DIKSHA National Digital Infrastructure for Teachers & Students',
    url: 'https://diksha.gov.in/',
    snippet: 'Ministry of Education portal featuring interactive energised textbooks, video micro-lessons, and assessment worksheets aligned to state and central boards.',
    sourceName: 'Ministry of Education (DIKSHA)',
    category: 'videos',
    resourceType: 'video',
    subjects: ['all', 'science', 'mathematics', 'social science'],
    gradeBands: ['all', 'middle', 'high'],
    keywords: ['diksha', 'digital lesson', 'video', 'worksheet', 'india', 'ncert'],
    frameworks: ['cbse', 'ncert', 'india'],
  },
];

export class CuratedRegistryProvider implements IReferenceProvider {
  public readonly name = 'curated_registry';

  public isConfigured(): boolean {
    return true; // Always available as an authoritative baseline
  }

  public async search(query: string, options?: { maxResults?: number; categoryHint?: ReferenceCategory }): Promise<RawSearchResult[]> {
    const qLower = query.toLowerCase();
    const queryTokens = qLower.split(/\s+/).filter((t) => t.length > 2);

    const scored = CURATED_EDUCATIONAL_REGISTRY.map((res) => {
      let score = 0;

      // Category matching
      if (options?.categoryHint && res.category === options.categoryHint) {
        score += 15;
      }

      // Keyword & title matches
      for (const token of queryTokens) {
        if (res.title.toLowerCase().includes(token)) score += 8;
        if (res.subjects.some((s) => s.includes(token) || token.includes(s))) score += 6;
        if (res.keywords.some((k) => k.includes(token))) score += 4;
        if (res.snippet.toLowerCase().includes(token)) score += 2;
        if (res.frameworks?.some((f) => qLower.includes(f))) score += 5;
      }

      return { resource: res, score };
    });

    // Sort by score descending and filter out zero scores
    scored.sort((a, b) => b.score - a.score);
    const limit = options?.maxResults || 5;
    const top = scored.slice(0, limit);

    return top.map(({ resource }) => ({
      title: resource.title,
      url: resource.url,
      snippet: resource.snippet,
      sourceName: resource.sourceName,
      category: resource.category,
      resourceType: resource.resourceType,
    }));
  }
}
