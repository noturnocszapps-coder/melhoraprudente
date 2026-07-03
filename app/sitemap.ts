import { MetadataRoute } from 'next'
import { newsPortalService } from '@/services'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://melhoraprudente.com.br'
  
  try {
    const news = await newsPortalService.getLatestNews(100)
    const newsEntries = news.map((item) => ({
      url: `${baseUrl}/noticia/${item.slug}`,
      lastModified: new Date(item.updated_at || item.created_at),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    }))
    
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'always' as const,
        priority: 1.0,
      },
      ...newsEntries,
    ]
  } catch (error) {
    console.error('Error creating sitemap:', error)
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
      },
    ]
  }
}
