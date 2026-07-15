import { MetadataRoute } from 'next'
import { newsPortalService, newsService, categoryService } from '@/services'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://melhoraprudente.com.br'
  
  try {
    // 1. Fetch dynamic news portal stories (/noticia/[slug])
    const news = await newsPortalService.getLatestNews(100)
    const newsEntries = news.map((item) => ({
      url: `${baseUrl}/noticia/${item.slug}`,
      lastModified: new Date(item.updated_at || item.created_at || new Date()),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    }))

    // 2. Fetch standard posts (/noticias/[slug])
    const posts = await newsService.getLatestPosts(100)
    const postEntries = posts.map((item) => ({
      url: `${baseUrl}/noticias/${item.slug}`,
      lastModified: new Date(item.updated_at || item.created_at || new Date()),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    // 3. Fetch active categories (/categoria/[slug])
    const categories = await categoryService.getAll()
    const categoryEntries = categories.map((cat) => ({
      url: `${baseUrl}/categoria/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'always' as const,
        priority: 1.0,
      },
      ...newsEntries,
      ...postEntries,
      ...categoryEntries,
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
