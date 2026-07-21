import { NewsSource, ScrapedNewsItem } from './types';
import { cleanRawScrapedText, createCleanExcerpt } from './cleaner';

export class InovaPrudenteSource implements NewsSource {
  public id = 'inova-prudente';
  public name = 'Inova Prudente';
  public url = 'https://inovaprudente.com.br/noticias';
  public sourceType: 'official' | 'journalistic' = 'official';

  /**
   * Converte uma string de data no formato "DD/MM/YYYY" para ISO String
   */
  private parseDateToISO(dateStr: string): string {
    try {
      if (!dateStr) return 'unknown';
      const parts = dateStr.trim().split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Formatar como YYYY-MM-DD para consistência com offset de America/Sao_Paulo (-03:00)
        const formattedMonth = String(month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const dateISO = `${year}-${formattedMonth}-${formattedDay}T12:00:00-03:00`;
        const date = new Date(dateISO);
        if (isNaN(date.getTime())) {
          return 'unknown';
        }
        return date.toISOString();
      }
    } catch (e) {
      console.warn('Erro ao converter data Inova Prudente:', dateStr, e);
    }
    return 'unknown';
  }

  public async fetchLatestItems(limit = 10): Promise<ScrapedNewsItem[]> {
    try {
      console.log(`[Garimpo Inova] Buscando notícias na listagem da Inova Prudente: ${this.url}`);
      const response = await fetch(this.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MelhoraPrudenteGarimpoBot/1.0',
        },
        signal: AbortSignal.timeout(15000) // 15s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP erro! Status: ${response.status}`);
      }

      const html = await response.text();
      const items: ScrapedNewsItem[] = [];

      const postRegex = /<div class=\"row post-micro[^\"]* clearfix\">([\s\S]*?)<\/div>\s*<!-- end post-micro -->/gi;
      let match;
      let count = 0;

      while ((match = postRegex.exec(html)) !== null && count < limit) {
        const postHtml = match[1];

        // Extrair Link e Título
        const linkTitleMatch = postHtml.match(/<h3[^>]*>\s*<a href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/i);
        if (!linkTitleMatch) continue;
        const url = linkTitleMatch[1].trim();
        const title = linkTitleMatch[2].trim();

        // Extrair Data
        const dateMatch = postHtml.match(/<h4>(\d{2}\/\d{2}\/\d{4})<\/h4>/i);
        const dateStr = dateMatch ? dateMatch[1].trim() : '';
        const publishedAt = dateStr ? this.parseDateToISO(dateStr) : 'unknown';

        // Extrair Imagem
        const imgMatch = postHtml.match(/<img src=\"([^\"]+)\"/i);
        const imageUrl = imgMatch ? imgMatch[1].trim() : undefined;

        // Extrair Excerpt
        const excerptMatch = postHtml.match(/<p>([\s\S]*?)<a href=/i);
        let excerpt = excerptMatch ? excerptMatch[1].trim() : '';
        // Limpar html entities
        excerpt = excerpt
          .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú')
          .replace(/&atilde;/g, 'ã').replace(/&otilde;/g, 'õ').replace(/&ccedil;/g, 'ç')
          .replace(/&Aacute;/g, 'Á').replace(/&Eacute;/g, 'É').replace(/&Iacute;/g, 'Í').replace(/&Oacute;/g, 'Ó').replace(/&Uacute;/g, 'Ú')
          .replace(/&Atilde;/g, 'Ã').replace(/&Otilde;/g, 'Õ').replace(/&Ccedil;/g, 'Ç')
          .replace(/&[a-z0-9#]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Extrair ID único baseado no nome do arquivo html ou hash da url
        const matchId = url.match(/\/noticias\/([^\/]+)\.html/i) || [null, url];
        const externalId = matchId[1] || Buffer.from(url).toString('base64').substring(0, 16);

        items.push({
          externalId,
          title,
          url,
          publishedAt,
          imageUrl,
          excerpt: excerpt || title,
          content: excerpt || title,
          sourceId: this.id,
          sourceName: this.name,
          sourceType: this.sourceType
        });

        count++;
      }

      console.log(`[Garimpo Inova] Encontradas ${items.length} notícias de Inova Prudente.`);
      return items;
    } catch (error) {
      console.error('[Garimpo Inova] Erro ao buscar notícias de Inova Prudente:', error);
      throw error;
    }
  }

  public async fetchItemDetails(item: ScrapedNewsItem): Promise<ScrapedNewsItem> {
    try {
      console.log(`[Garimpo Inova] Buscando detalhes de notícia Inova: ${item.url}`);
      const response = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MelhoraPrudenteGarimpoBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP erro ao buscar detalhes Inova! Status: ${response.status}`);
      }

      const html = await response.text();

      // Find box-txt-interna element
      const matchTxt = html.match(/<div[^>]*class=["'][^"']*box-txt-interna[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i) ||
                       html.match(/<div[^>]*class=["'][^"']*box-txt-interna[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<div[^>]*class=["'][^"']*post-desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      
      const paragraphs: string[] = [];
      if (matchTxt) {
        const textRaw = matchTxt[1];
        const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let pMatch;
        while ((pMatch = pRegex.exec(textRaw)) !== null) {
          let pText = pMatch[1].replace(/<[^>]+>/g, '').trim();
          pText = decodeHTMLEntities(pText);
          if (pText) {
            paragraphs.push(pText);
          }
        }
      }

      // If no paragraph found under box-txt-interna, fallback to any <p> tags under single-post or post-desc
      if (paragraphs.length === 0) {
        const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let pMatch;
        while ((pMatch = pRegex.exec(html)) !== null) {
          let pText = pMatch[1].replace(/<[^>]+>/g, '').trim();
          pText = decodeHTMLEntities(pText);
          if (pText && pText.length > 30 && !pText.includes('Inscreva-se') && !pText.includes('Assinar') && !pText.includes('Copyright')) {
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
      console.error(`[Garimpo Inova] Erro ao buscar detalhes da notícia Inova ${item.externalId}:`, error);
      return item;
    }
  }
}

function decodeHTMLEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&aacute;': 'á', '&Aacute;': 'Á', '&acirc;': 'â', '&Acirc;': 'Â', '&agrave;': 'à', '&Agrave;': 'À', '&atilde;': 'ã', '&Atilde;': 'Ã',
    '&éacute;': 'é', '&eacute;': 'é', '&Eacute;': 'É', '&ecirc;': 'ê', '&Ecirc;': 'Ê', '&egrave;': 'è', '&Egrave;': 'È',
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
