/**
 * Helper de limpeza e sanitização de conteúdos raspados (Garimpo)
 */

export function decodeHTMLEntities(text: string): string {
  if (!text) return '';
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

/**
 * Limpa resíduos brutos de HTML/XML (como ]]> ou <![CDATA[), propagandas e ruídos de portais
 */
export function cleanRawScrapedText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Remover marcadores XML/CDATA residuais e tags HTML
  cleaned = cleaned
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/g, '')
    .replace(/\]\]&gt;/g, '')
    .replace(/&lt;!\[CDATA\[/gi, '')
    .replace(/<[^>]+>/g, '');

  // 2. Decodificar entidades HTML
  cleaned = decodeHTMLEntities(cleaned);

  // 3. Filtrar linhas de ruído, anúncios, chamadas promocionais e navegação de portais (ex: G1, Globo)
  const lines = cleaned.split('\n');
  const filteredLines: string[] = [];

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    // Padrões de ruído a ignorar
    if (
      /^\]\]>/.test(l) ||
      /^LEIA TAMBÉM/i.test(l) ||
      /^VEJA TAMBÉM/i.test(l) ||
      /^Leia também/i.test(l) ||
      /^Veja também/i.test(l) ||
      /^Participe do canal do g1/i.test(l) ||
      /^Siga o g1/i.test(l) ||
      /^Receba as notícias/i.test(l) ||
      /^WhatsApp/i.test(l) ||
      /^VÍDEOS: assista/i.test(l) ||
      /^Vídeos:/i.test(l) ||
      /^Assista aos vídeos/i.test(l) ||
      /^Inscreva-se/i.test(l) ||
      /^Foto:\s*/i.test(l) ||
      /^Foto\s*:/i.test(l) ||
      /^Reprodução\//i.test(l) ||
      /^globo\.com/i.test(l) ||
      /^G1 Presidente Prudente/i.test(l) ||
      /^Veja mais notícias da região/i.test(l)
    ) {
      continue;
    }

    if (l.includes('canal do g1 no WhatsApp') || l.includes('siga o g1 nas redes')) {
      continue;
    }

    filteredLines.push(l);
  }

  return filteredLines.join('\n\n').trim();
}

/**
 * Cria um resumo/chamada (excerpt) limpo e curto de no máximo maxLen caracteres
 */
export function createCleanExcerpt(text: string, maxLen = 220): string {
  if (!text) return '';
  const clean = cleanRawScrapedText(text).replace(/\s+/g, ' ').trim();
  if (!clean) return '';

  if (clean.length <= maxLen) return clean;

  let truncated = clean.substring(0, maxLen);
  const lastSentence = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('! ')
  );
  if (lastSentence > 60) {
    return truncated.substring(0, lastSentence + 1);
  }

  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 60) {
    truncated = truncated.substring(0, lastSpace);
  }
  truncated = truncated.replace(/[,;:\-\s\+]+$/, '');
  truncated = truncated.replace(/\s+(e|ou|de|da|do|em|com|para|um|uma|o|a|os|as|no|na|nos|nas|por|como)$/i, '');
  return truncated + '...';
}
