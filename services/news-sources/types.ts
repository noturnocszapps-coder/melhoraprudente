export interface ScrapedNewsItem {
  externalId: string;
  title: string;
  url: string;
  publishedAt: string; // ISO String format
  excerpt?: string;
  imageUrl?: string;
  content?: string;
  sourceId?: string;
  sourceName?: string;
  sourceType?: 'official' | 'journalistic';
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  sourceType: 'official' | 'journalistic';
  fetchLatestItems(limit?: number): Promise<ScrapedNewsItem[]>;
  fetchItemDetails?(item: ScrapedNewsItem): Promise<ScrapedNewsItem>;
}
