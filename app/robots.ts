import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/login', '/cadastro'],
    },
    sitemap: 'https://melhoraprudente.com.br/sitemap.xml',
  }
}
