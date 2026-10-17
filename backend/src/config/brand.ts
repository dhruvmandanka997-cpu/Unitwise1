export const BRAND = {
  name: 'UnitWise',
  shortName: 'UnitWise',
  tagline: 'AI unit and curriculum planning for teachers',
  fullTitle: 'UnitWise — AI Unit & Curriculum Planning for Teachers',
  description: 'AI unit and curriculum planning for teachers grounded in Backward Design and Bloom\'s Taxonomy.',
  version: '1.0.0',
  serverName: 'UnitWise Backend API',
} as const;

export type BrandConfig = typeof BRAND;
