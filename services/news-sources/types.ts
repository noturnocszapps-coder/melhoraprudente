export interface ScrapedNewsItem {
  externalId: string;
  title: string;
  url: string;
  publishedAt: string; // ISO String format
  excerpt?: string;
  imageUrl?: string;
  content?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  fetchLatestItems(limit?: number): Promise<ScrapedNewsItem[]>;
}
