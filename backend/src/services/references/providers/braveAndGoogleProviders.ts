import { IReferenceProvider, RawSearchResult } from '../types';
import { config } from '../../../config';

export class BraveProvider implements IReferenceProvider {
  public readonly name = 'brave';

  public isConfigured(): boolean {
    return Boolean(config.braveSearchApiKey && config.braveSearchApiKey.trim().length > 5);
  }

  public async search(query: string, options?: { maxResults?: number }): Promise<RawSearchResult[]> {
    if (!this.isConfigured()) return [];

    const count = options?.maxResults || 5;

    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': config.braveSearchApiKey,
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        console.warn(`Brave search API responded with status ${response.status}`);
        return [];
      }

      const data = (await response.json()) as any;
      if (!data?.web?.results || !Array.isArray(data.web.results)) {
        return [];
      }

      return data.web.results.map((item: any) => ({
        title: item.title || 'Educational Reference',
        url: item.url,
        snippet: item.description || '',
      }));
    } catch (err) {
      console.error('Brave search provider failed:', err);
      return [];
    }
  }
}

export class GoogleProvider implements IReferenceProvider {
  public readonly name = 'google';

  public isConfigured(): boolean {
    return Boolean(
      config.googleSearchApiKey &&
      config.googleSearchApiKey.trim().length > 5 &&
      config.googleSearchCx &&
      config.googleSearchCx.trim().length > 3
    );
  }

  public async search(query: string, options?: { maxResults?: number }): Promise<RawSearchResult[]> {
    if (!this.isConfigured()) return [];

    const num = Math.min(options?.maxResults || 5, 10);

    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(config.googleSearchApiKey)}&cx=${encodeURIComponent(config.googleSearchCx)}&q=${encodeURIComponent(query)}&num=${num}`;
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        console.warn(`Google Custom Search API responded with status ${response.status}`);
        return [];
      }

      const data = (await response.json()) as any;
      if (!data?.items || !Array.isArray(data.items)) {
        return [];
      }

      return data.items.map((item: any) => ({
        title: item.title || 'Educational Resource',
        url: item.link,
        snippet: item.snippet || '',
      }));
    } catch (err) {
      console.error('Google search provider failed:', err);
      return [];
    }
  }
}
