import { IReferenceProvider, RawSearchResult } from '../types';
import { config } from '../../../config';

export class TavilyProvider implements IReferenceProvider {
  public readonly name = 'tavily';

  public isConfigured(): boolean {
    return Boolean(config.tavilyApiKey && config.tavilyApiKey.trim().length > 5);
  }

  public async search(query: string, options?: { maxResults?: number }): Promise<RawSearchResult[]> {
    if (!this.isConfigured()) return [];

    const maxResults = options?.maxResults || 5;

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: config.tavilyApiKey,
          query,
          search_depth: 'advanced',
          include_answer: false,
          max_results: maxResults,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        console.warn(`Tavily search API responded with status ${response.status}`);
        return [];
      }

      const data = (await response.json()) as any;
      if (!data || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((item: any) => ({
        title: item.title || 'Educational Resource',
        url: item.url,
        snippet: item.content || '',
        sourceName: item.source || undefined,
      }));
    } catch (err) {
      console.error('Tavily search provider failed:', err);
      return [];
    }
  }
}
