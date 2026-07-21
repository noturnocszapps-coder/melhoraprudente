import { NewsSource, ScrapedNewsItem } from './types';

export class G1PresidentePrudenteSource implements NewsSource {
  public id = 'g1-presidente-prudente';
  public name = 'G1 Presidente Prudente e Região';
  public url = 'https://g1.globo.com/sp/presidente-prudente-regiao/';
  public sourceType: 'official' | 'journalistic' = 'journalistic';

  private rssUrl = 'https://g1.globo.com/dynamo/sp/presidente-prudente-e-regiao/rss2.xml';

  public async fetchLatestItems(limit = 10): Promise<ScrapedNewsItem[]> {
    try {
      console.log(`[Garimpo G1] Buscando notícias no feed RSS do G1: ${this.rssUrl}`);
      const response = await fetch(this.rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MelhoraPrudenteGarimpoBot/1.0',
        },
        signal: AbortSignal.timeout(15000) // 15s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP erro! Status: ${response.status}`);
      }

      const xml = await response.text();
      const items: ScrapedNewsItem[] = [];

      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      let match;
      let parsedCount = 0;

      while ((match = itemRegex.exec(xml)) !== null && parsedCount < 30) {
        const itemXml = match[1];

        // 1. Extrair Título
        const titleMatch = itemXml.match(/<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/i) || itemXml.match(/<title>([\s\S]*?)<\/title>/i);
        if (!titleMatch) continue;
        const title = titleMatch[1].trim();

        // 2. Extrair Link
        const linkMatch = itemXml.match(/<link>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/link>/i) || itemXml.match(/<link>([\s\S]*?)<\/link>/i);
        if (!linkMatch) continue;
        const url = linkMatch[1].trim();

        // 3. Extrair GUID / ID
        const guidMatch = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
        let externalId = '';
        if (guidMatch) {
          const guidVal = guidMatch[1].trim();
          // Extrair ID ou parte da URL
          const matchId = guidVal.match(/noticia\/[^/]+\/([^/]+)\.ghtml/i) || guidVal.match(/noticia\/(\d+)/i) || [null, guidVal];
          externalId = matchId[1] || guidVal;
        } else {
          // Fallback a hash do link
          externalId = Buffer.from(url).toString('base64').substring(0, 16);
        }

        // 4. Extrair Data de Publicação (com fallback e validação prioritária pela URL)
        let publishedAt: string | null = null;

        // 4.1. Tentar extrair do feed RSS (pubDate)
        const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        if (pubDateMatch) {
          try {
            const parsed = new Date(pubDateMatch[1].trim());
            if (!isNaN(parsed.getTime())) {
              publishedAt = parsed.toISOString();
            }
          } catch (e) {
            console.warn('Erro ao converter data pubDate G1:', pubDateMatch[1], e);
          }
        }

        // 4.2. Tentar extrair data da URL (padrão do G1: /noticia/YYYY/MM/DD/)
        // Este é o indicador definitivo da data original da publicação da pauta
        const urlDateMatch = url.match(/\/noticia\/(\d{4})\/(\d{2})\/(\d{2})\//i);
        if (urlDateMatch) {
          const year = urlDateMatch[1];
          const month = urlDateMatch[2];
          const day = urlDateMatch[3];
          const extractedUrlDateStr = `${year}-${month}-${day}T12:00:00.000Z`;

          if (!publishedAt) {
            publishedAt = extractedUrlDateStr;
          } else {
            // Se as datas forem inconsistentes (ano, mês ou dia não baterem), a data da URL sempre prevalece
            const feedDateObj = new Date(publishedAt);
            const feedYear = feedDateObj.getUTCFullYear();
            const feedMonth = String(feedDateObj.getUTCMonth() + 1).padStart(2, '0');
            const feedDay = String(feedDateObj.getUTCDate()).padStart(2, '0');

            if (String(feedYear) !== year || feedMonth !== month || feedDay !== day) {
              console.log(`[Garimpo G1] Inconsistência temporal detectada para URL ${url}. Feed pubDate: ${feedYear}-${feedMonth}-${feedDay}. URL: ${year}-${month}-${day}. Usando a data original da URL.`);
              publishedAt = extractedUrlDateStr;
            }
          }
        }

        // 4.3. Sem data original confiável: NÃO assumir hoje (sem fallback de new Date() para G1)
        if (!publishedAt) {
          publishedAt = 'unknown';
        }

        // 5. Extrair Imagem
        let imageUrl: string | undefined = undefined;
        const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
        if (mediaMatch) {
          imageUrl = mediaMatch[1].trim();
        } else {
          const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch) {
            imageUrl = imgMatch[1].trim();
          }
        }

        // 6. Extrair Excerpt/Description (e limpar HTML)
        const descMatch = itemXml.match(/<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/description>/i) || itemXml.match(/<description>([\s\S]*?)<\/description>/i);
        let excerpt = '';
        if (descMatch) {
          const rawDesc = descMatch[1];
          // Limpar tags HTML do description (incluindo imagens do CDATA)
          excerpt = rawDesc
            .replace(/<[^>]+>/g, '') // Remove tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
        }

        items.push({
          externalId,
          title,
          url,
          publishedAt,
          imageUrl,
          excerpt: excerpt || title,
          content: excerpt || title, // Não copiamos texto integral
          sourceId: this.id,
          sourceName: this.name,
          sourceType: this.sourceType
        });

        parsedCount++;
      }

      console.log(`[Garimpo G1] Encontradas ${items.length} notícias no feed.`);
      return items.slice(0, limit);
    } catch (error) {
      console.error('[Garimpo G1] Erro ao buscar notícias do G1:', error);
      throw error;
    }
  }

  public async fetchItemDetails(item: ScrapedNewsItem): Promise<ScrapedNewsItem> {
    try {
      console.log(`[Garimpo G1] Buscando detalhes de notícia G1: ${item.url}`);
      const response = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MelhoraPrudenteGarimpoBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP erro ao buscar detalhes G1! Status: ${response.status}`);
      }

      const html = await response.text();

      // Extrator de parágrafos padrão do G1: <p class="content-text__container">...</p>
      const pRegex = /<p[^>]*class=["'][^"']*content-text__container[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi;
      let pMatch;
      const paragraphs: string[] = [];
      while ((pMatch = pRegex.exec(html)) !== null) {
        let pText = pMatch[1]
          .replace(/<[^>]+>/g, '') // Remove HTML tags
          .trim();
        pText = decodeHTMLEntities(pText);
        if (pText) {
          paragraphs.push(pText);
        }
      }

      // Se falhar, extrator secundário para corpo de matéria do G1
      if (paragraphs.length === 0) {
        const articleBodyMatch = html.match(/<div[^>]*class=["'][^"']*mc-article-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                                 html.match(/<div[^>]*class=["'][^"']*protected-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        const searchHtml = articleBodyMatch ? articleBodyMatch[1] : html;
        
        const genericPRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let genPMatch;
        while ((genPMatch = genericPRegex.exec(searchHtml)) !== null) {
          let pText = genPMatch[1].replace(/<[^>]+>/g, '').trim();
          pText = decodeHTMLEntities(pText);
          if (pText && pText.length > 20 && !pText.includes('Inscreva-se') && !pText.includes('Receba as notícias') && !pText.includes('globo.com')) {
            paragraphs.push(pText);
          }
        }
      }

      const content = paragraphs.join('\n\n');

      return {
        ...item,
        content: content || item.excerpt || item.title
      };
    } catch (error) {
      console.error(`[Garimpo G1] Erro ao buscar detalhes da notícia G1 ${item.externalId}:`, error);
      return item;
    }
  }
}

function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&aacute;': 'á', '&Aacute;': 'Á', '&acirc;': 'â', '&Acirc;': 'Â', '&agrave;': 'à', '&Agrave;': 'À', '&atilde;': 'ã', '&Atilde;': 'Ã',
    '&eacute;': 'é', '&Eacute;': 'É', '&ecirc;': 'ê', '&Ecirc;': 'Ê', '&egrave;': 'è', '&Egrave;': 'È',
    '&iacute;': 'í', '&Iacute;': 'Í', '&icirc;': 'î', '&Icirc;': 'Î', '&igrave;': 'ì', '&Igrave;': 'Ì',
    '&oacute;': 'ó', '&Oacute;': 'Ó', '&ocirc;': 'ô', '&Ocirc;': 'Ô', '&ograve;': 'ò', '&Ograve;': 'Ò', '&otilde;': 'õ', '&Otilde;': 'Õ',
    '&uacute;': 'ú', '&Uacute;': 'Ú', '&ucirc;': 'û', '&Ucirc;': 'Û', '&ugrave;': 'ù', '&Ugrave;': 'Ù',
    '&ccedil;': 'ç', '&Ccedil;': 'Ç', '&ntilde;': 'ñ', '&Ntilde;': 'Ñ',
    '&nbsp;': ' ', '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&ldquo;': '"', '&rdquo;': '"', '&lsquo;': "'", '&rsquo;': "'", '&ndash;': '-', '&mdash;': '—',
    '&ordm;': 'º', '&ordf;': 'ª'
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
    if (entities[match]) return entities[match];
    if (match.startsWith('&#')) {
      const code = parseInt(match.substring(2, match.length - 1), 10);
      if (!isNaN(code)) return String.fromCharCode(code);
    }
    return match;
  });
}
