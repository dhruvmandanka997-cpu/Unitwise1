declare module 'iso-3166-2' {
  export interface Subdivision {
    name: string;
    type: string;
  }

  export interface CountrySubdivisions {
    name: string;
    sub: Record<string, Subdivision>;
  }

  export const data: Record<string, CountrySubdivisions>;
  export default data;
}
