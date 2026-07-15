import { newsPortalService, newsService } from '@/services'

export async function GET() {
  try {
    const baseUrl = 'https://melhoraprudente.com.br'

    // Fetch from both sources to build a unified RSS feed
    const [news, posts] = await Promise.all([
      newsPortalService.getLatestNews(40),
      newsService.getLatestPosts(40)
    ]);

    const combinedItems = [
      ...news.map((item) => ({
        title: item.title,
        link: `${baseUrl}/noticia/${item.slug}`,
        guid: `${baseUrl}/noticia/${item.slug}`,
        pubDate: new Date(item.created_at).toUTCString(),
        description: item.excerpt || item.subtitle || '',
        content: item.content || '',
        image: item.cover_image,
        category: item.category || 'Geral'
      })),
      ...posts.map((item) => ({
        title: item.title,
        link: `${baseUrl}/noticias/${item.slug}`,
        guid: `${baseUrl}/noticias/${item.slug}`,
        pubDate: new Date(item.published_at || item.created_at || new Date()).toUTCString(),
        description: item.subtitle || item.excerpt || '',
        content: item.content || '',
        image: item.cover_image_url,
        category: item.category?.name || 'Geral'
      }))
    ];

    // Sort combined feed items by date descending
    combinedItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    const rssItems = combinedItems.map((item) => {
      const mediaTag = item.image 
        ? `<media:content url="${item.image}" medium="image" type="image/jpeg" />` 
        : '';
      const enclosureTag = item.image 
        ? `<enclosure url="${item.image}" length="0" type="image/jpeg" />` 
        : '';
      
      return `
        <item>
          <title><![CDATA[${item.title}]]></title>
          <link>${item.link}</link>
          <guid isPermaLink="true">${item.guid}</guid>
          <pubDate>${item.pubDate}</pubDate>
          <category><![CDATA[${item.category}]]></category>
          <description><![CDATA[${item.description}]]></description>
          <content:encoded><![CDATA[${item.content}]]></content:encoded>
          ${mediaTag}
          ${enclosureTag}
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
        xmlns:media="http://search.yahoo.com/mrss/"
      >
        <channel>
          <title>Melhora Prudente - Notícias de Presidente Prudente e Região</title>
          <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
          <link>${baseUrl}</link>
          <description>Notícias em Tempo Real de Presidente Prudente e Região do Oeste Paulista</description>
          <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
          <language>pt-BR</language>
          <copyright>Copyright ${new Date().getFullYear()}, Melhora Prudente</copyright>
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
