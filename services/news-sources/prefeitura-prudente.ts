import { NewsSource, ScrapedNewsItem } from './types';

export class PrefeituraPrudenteSource implements NewsSource {
  public id = 'prefeitura-prudente';
  public name = 'Prefeitura de Presidente Prudente';
  public url = 'https://presidenteprudente.sp.gov.br/site/noticias.xhtml';
  private baseUrl = 'https://presidenteprudente.sp.gov.br';

  /**
   * Converte uma string de data no formato "DD/MM/YYYY" para ISO String
   */
  private parseDateToISO(dateStr: string): string {
    try {
      const parts = dateStr.trim().split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexado no JS Date
        const year = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day, 12, 0, 0); // Define meio-dia para evitar variações de fuso horário
        return date.toISOString();
      }
    } catch (e) {
      console.warn('Erro ao converter data:', dateStr, e);
    }
    return new Date().toISOString();
  }

  /**
   * Busca e extrai os itens da listagem principal
   */
  public async fetchLatestItems(limit = 10): Promise<ScrapedNewsItem[]> {
    try {
      console.log(`[Garimpo] Buscando notícias na listagem da Prefeitura: ${this.url}`);
      
      const response = await fetch(this.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MelhoraPrudenteGarimpoBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(15000) // 15s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP erro! Status: ${response.status}`);
      }

      const html = await response.text();
      const items: ScrapedNewsItem[] = [];

      // Regex para encontrar cada linha de notícia na tabela JSF/PrimeFaces
      // Estrutura esperada:
      // <tr ...><td><strong>DD/MM/YYYY</strong></td><td><a href="/site/noticia/XXXXX" title="TITLE">TITLE</a></td></tr>
      const trRegex = /<tr[^>]*data-ri="(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi;
      let trMatch;
      let parsedCount = 0;

      while ((trMatch = trRegex.exec(html)) !== null && parsedCount < 30) { // Limitamos a leitura dos top 30 itens para segurança
        const rowHtml = trMatch[2];

        // 1. Extrair data
        const dateRegex = /<strong>\s*(\d{2}\/\d{2}\/\d{4})\s*<\/strong>/i;
        const dateMatch = dateRegex.exec(rowHtml);
        if (!dateMatch) continue;
        const dateStr = dateMatch[1];
        const publishedAtISO = this.parseDateToISO(dateStr);

        // 2. Extrair Link e Título
        const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>/i;
        const linkMatch = linkRegex.exec(rowHtml);
        if (!linkMatch) continue;

        const relativeUrl = linkMatch[1];
        const title = linkMatch[2].trim();

        // 3. Extrair ID externo do link
        const idRegex = /\/site\/noticia\/([a-zA-Z0-9_-]+)/i;
        const idMatch = idRegex.exec(relativeUrl);
        if (!idMatch) continue;

        const externalId = idMatch[1];
        const fullUrl = this.baseUrl + relativeUrl;

        items.push({
          externalId,
          title,
          url: fullUrl,
          publishedAt: publishedAtISO
        });

        parsedCount++;
      }

      console.log(`[Garimpo] Encontradas ${items.length} notícias na listagem.`);
      return items.slice(0, limit);
    } catch (error) {
      console.error('[Garimpo] Erro ao buscar notícias da Prefeitura de Prudente:', error);
      throw error;
    }
  }

  /**
   * Busca os detalhes de uma notícia específica (Conteúdo e Imagem de Capa)
   */
  public async fetchItemDetails(item: ScrapedNewsItem): Promise<ScrapedNewsItem> {
    try {
      console.log(`[Garimpo] Buscando detalhes da notícia ID: ${item.externalId} - ${item.url}`);
      
      const response = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MelhoraPrudenteGarimpoBot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP erro ao buscar detalhes! Status: ${response.status}`);
      }

      const html = await response.text();

      // 1. Extrair Imagem de Capa
      // Padrão: <div class="post-img"><img src="/site/imagem/135128" ... /></div>
      const imgRegex = /<div class="post-img">\s*<img[^>]+src=["']([^"']+)["']/i;
      const imgMatch = imgRegex.exec(html);
      let imageUrl: string | undefined = undefined;

      if (imgMatch) {
        const matchedSrc = imgMatch[1];
        imageUrl = matchedSrc.startsWith('http') ? matchedSrc : this.baseUrl + matchedSrc;
      }

      // 2. Extrair Conteúdo
      // Padrão: <div class="col-12 px-lg-0 post-content"> ... </div>
      const contentRegex = /<div class="[^"]*post-content"[^>]*>([\s\S]*?)<\/div>/i;
      const contentMatch = contentRegex.exec(html);
      let content = '';
      let excerpt = '';

      if (contentMatch) {
        const rawContent = contentMatch[1];
        
        // Extrair texto formatado limpando tags HTML indesejadas mas mantendo a quebra de parágrafos
        // Substituir as tags <p> por quebras de linha temporárias
        let cleanedText = rawContent
          .replace(/<\/p>/gi, '\n')
          .replace(/<p[^>]*>/gi, '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '') // Remove qualquer outra tag HTML
          .trim();

        // Decodificar entidades HTML comuns
        cleanedText = cleanedText
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\r\n/g, '\n')
          .replace(/\n\s*\n+/g, '\n\n'); // Padronizar espaçamento de parágrafos

        content = cleanedText;

        // Criar o resumo (excerpt) das primeiras linhas (máx 220 caracteres)
        const plainTextOneLine = content.replace(/\s+/g, ' ').trim();
        excerpt = plainTextOneLine.length > 220 
          ? plainTextOneLine.substring(0, 217) + '...' 
          : plainTextOneLine;
      }

      // Adiciona delay de cortesia de 500ms para evitar sobrecarga (scrape amigável)
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        ...item,
        imageUrl,
        content: content || 'Conteúdo não extraído corretamente.',
        excerpt: excerpt || item.title
      };
    } catch (error) {
      console.error(`[Garimpo] Erro ao buscar detalhes da notícia ${item.externalId}:`, error);
      // Retorna o item original se falhar, para não quebrar a fila inteira
      return item;
    }
  }
}
