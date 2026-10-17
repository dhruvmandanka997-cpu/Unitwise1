import { TrustTier } from './types';

export interface TrustedDomainConfig {
  country?: string;
  framework?: string;
  officialDomains: string[];
  reputableDomains: string[];
}

export const TRUSTED_DOMAINS_REGISTRY: Record<string, TrustedDomainConfig> = {
  india: {
    country: 'India',
    framework: 'CBSE / NCERT / ICSE',
    officialDomains: [
      'cbse.gov.in',
      'cbseacademic.nic.in',
      'ncert.nic.in',
      'diksha.gov.in',
      'epathshala.nic.in',
      'swayam.gov.in',
      'nroer.gov.in',
      'cisce.org',
      'education.gov.in',
    ],
    reputableDomains: [
      'khanacademy.org',
      'learncbse.in',
      'byjus.com',
      'vedantu.com',
      'toppr.com',
      'edugroove.org',
      'aglasem.com',
    ],
  },
  us: {
    country: 'United States',
    framework: 'Common Core / NGSS / State Boards',
    officialDomains: [
      'corestandards.org',
      'nextgenscience.org',
      'ed.gov',
      'loc.gov',
      'si.edu',
      'nasa.gov',
      'nsf.gov',
      'cde.ca.gov',
      'nysed.gov',
      'tea.texas.gov',
    ],
    reputableDomains: [
      'openstax.org',
      'khanacademy.org',
      'phet.colorado.edu',
      'ck12.org',
      'illustrativemathematics.org',
      'geogebra.org',
      'desmos.com',
      'oercommons.org',
      'pbslearningmedia.org',
      'readwritethink.org',
      'facinghistory.org',
    ],
  },
  uk: {
    country: 'United Kingdom',
    framework: 'UK National Curriculum / Cambridge / GCSE',
    officialDomains: [
      'gov.uk',
      'cambridgeinternational.org',
      'ocr.org.uk',
      'aqa.org.uk',
      'edexcel.com',
      'pearson.com',
    ],
    reputableDomains: [
      'bbc.co.uk',
      'thenational.academy',
      'stem.org.uk',
      'tes.com',
      'twinkl.co.uk',
      'nrich.maths.org',
    ],
  },
  international: {
    country: 'Global',
    framework: 'International Baccalaureate (IB) & General',
    officialDomains: [
      'ibo.org',
      'unesco.org',
      'who.int',
      'un.org',
    ],
    reputableDomains: [
      'khanacademy.org',
      'ocw.mit.edu',
      'openstax.org',
      'phet.colorado.edu',
      'britannica.com',
      'jstor.org',
      'gutenberg.org',
      'archive.org',
      'coursera.org',
      'edx.org',
      'libretexts.org',
      'merlot.org',
    ],
  },
};

/**
 * Extracts normalized hostname from URL
 */
export function extractHostname(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Computes trust tier based on domain suffix and registry lookup
 */
export function getTrustTier(url: string, curriculumFramework?: string): TrustTier {
  const host = extractHostname(url);
  if (!host) return 'general';

  // 1. Check official government and academic extensions
  if (
    host.endsWith('.gov') ||
    host.endsWith('.nic.in') ||
    host.endsWith('.gov.in') ||
    host.endsWith('.gov.uk') ||
    host.endsWith('.edu') ||
    host.endsWith('.ac.in') ||
    host.endsWith('.ac.uk')
  ) {
    return 'official';
  }

  // 2. Check board registry
  for (const config of Object.values(TRUSTED_DOMAINS_REGISTRY)) {
    if (config.officialDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
      return 'official';
    }
  }

  // 3. Check reputable registry
  for (const config of Object.values(TRUSTED_DOMAINS_REGISTRY)) {
    if (config.reputableDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
      return 'reputable';
    }
  }

  // 4. General trusted educational extensions
  if (host.endsWith('.org')) {
    return 'reputable';
  }

  return 'general';
}

/**
 * Derives user-friendly source name from hostname or domain
 */
export function deriveSourceName(url: string, defaultName?: string): string {
  if (defaultName && defaultName.length > 2) return defaultName;
  const host = extractHostname(url);
  if (!host) return 'Educational Resource';

  const knownMap: Record<string, string> = {
    'ncert.nic.in': 'NCERT',
    'cbse.gov.in': 'CBSE Official Portal',
    'cbseacademic.nic.in': 'CBSE Academic',
    'diksha.gov.in': 'DIKSHA National Portal',
    'epathshala.nic.in': 'ePathshala',
    'swayam.gov.in': 'SWAYAM',
    'corestandards.org': 'Common Core State Standards',
    'nextgenscience.org': 'Next Generation Science Standards',
    'ed.gov': 'U.S. Department of Education',
    'loc.gov': 'Library of Congress',
    'si.edu': 'Smithsonian Learning Lab',
    'nasa.gov': 'NASA Education',
    'nsf.gov': 'National Science Foundation',
    'openstax.org': 'OpenStax Peer-Reviewed Textbooks',
    'khanacademy.org': 'Khan Academy',
    'phet.colorado.edu': 'PhET Interactive Simulations',
    'ck12.org': 'CK-12 Foundation',
    'ocw.mit.edu': 'MIT OpenCourseWare',
    'britannica.com': 'Encyclopedia Britannica',
    'geogebra.org': 'GeoGebra Math Suite',
    'desmos.com': 'Desmos Classroom',
    'bbc.co.uk': 'BBC Bitesize',
    'gov.uk': 'UK Department for Education',
    'cambridgeinternational.org': 'Cambridge Assessment International',
    'ibo.org': 'International Baccalaureate',
    'gutenberg.org': 'Project Gutenberg',
    'libretexts.org': 'LibreTexts Open Education',
    'jstor.org': 'JSTOR Academic Repository',
  };

  for (const [domain, name] of Object.entries(knownMap)) {
    if (host === domain || host.endsWith(`.${domain}`)) {
      return name;
    }
  }

  // Format capitalized domain name (e.g., "physicsclassroom.com" -> "Physics Classroom")
  const mainPart = host.split('.')[0] || host;
  return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
}

export const evaluateTrustTier = (url: string, framework?: string, country?: string): TrustTier => {
  return getTrustTier(url, framework);
};

