import { newsPortalService } from '@/services'

export async function GET() {
  try {
    const news = await newsPortalService.getLatestNews(50)
    const baseUrl = 'https://melhoraprudente.com.br'

    const rssItems = news.map((item) => {
      const pubDate = new Date(item.created_at).toUTCString()
      return `
        <item>
          <title><![CDATA[${item.title}]]></title>
          <link>${baseUrl}/noticia/${item.slug}</link>
          <guid isPermaLink="true">${baseUrl}/noticia/${item.slug}</guid>
          <pubDate>${pubDate}</pubDate>
          <description><![CDATA[${item.excerpt || item.subtitle || ''}]]></description>
          <content:encoded><![CDATA[${item.content || ''}]]></content:encoded>
        </item>
      `
    }).join('')

    const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0" 
        xmlns:content="http://purl.org/rss/1.0/modules/content/"
        xmlns:wfw="http://wellformedweb.org/CommentAPI/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:atom="http://www.w3.org/2005/Atom"
        xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
        xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
      >
        <channel>
          <title>Melhora Prudente - Portal de Mídia Nacional</title>
          <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
          <link>${baseUrl}</link>
          <description>Notícias em Tempo Real - Portal de Mídia Nacional Melhora Prudente</description>
          <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
          <language>pt-BR</language>
          <sy:updatePeriod>hourly</sy:updatePeriod>
          <sy:updateFrequency>1</sy:updateFrequency>
          ${rssItems}
        </channel>
      </rss>
    `

    return new Response(rssFeed.trim(), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=1800',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating feed', { status: 500 })
  }
}
