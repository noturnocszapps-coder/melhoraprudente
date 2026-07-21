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

  // 1. Remover marcadores XML/CDATA residuais e emojis promocionais como 📲
  cleaned = cleaned
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/g, '')
    .replace(/\]\]&gt;/g, '')
    .replace(/&lt;!\[CDATA\[/gi, '')
    .replace(/📲/g, '');

  // 2. Converter tags de bloco/quebra em quebras de linha reais para evitar fusão de frases/palavras
  cleaned = cleaned
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|article|section)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' '); // Substituir tags HTML restantes por espaço

  // 3. Decodificar entidades HTML
  cleaned = decodeHTMLEntities(cleaned);

  // 4. Cortar chamadas promocionais concatenadas do G1 no texto (Tail Clipping)
  const promoTriggers = [
    'notícias no g1',
    'noticias no g1',
    'veja mais notícias',
    'veja mais noticias',
    'confira mais notícias',
    'leia mais sobre',
    'assista às reportagens',
    'assista as reportagens',
    'reportagens da tv tem',
    'participe do canal',
    'participe do grupo',
    'no whatsapp',
    'siga o g1',
    'leia também',
    'veja também',
    'vídeos: assista',
    'videos: assista',
    'vídeos: tudo sobre',
    'fonte original:'
  ];

  const lowerCleaned = cleaned.toLowerCase();
  let earliestPromo = -1;
  for (const trigger of promoTriggers) {
    const idx = lowerCleaned.indexOf(trigger);
    if (idx !== -1) {
      if (earliestPromo === -1 || idx < earliestPromo) {
        earliestPromo = idx;
      }
    }
  }

  if (earliestPromo !== -1) {
    cleaned = cleaned.substring(0, earliestPromo);
  }

  // 5. Filtrar linhas de ruído, anúncios, chamadas promocionais e navegação de portais (ex: G1, Globo)
  const lines = cleaned.split('\n');
  const filteredLines: string[] = [];

  for (const line of lines) {
    // Normalizar espaços na linha
    const l = line.replace(/\s+/g, ' ').trim();
    if (!l) continue;

    // Padrões de ruído a ignorar (com foco absoluto no G1)
    if (
      /^\]\]>/.test(l) ||
      /^LEIA TAMBÉM/i.test(l) ||
      /^VEJA TAMBÉM/i.test(l) ||
      /^Leia também/i.test(l) ||
      /^Veja também/i.test(l) ||
      /^Participe do canal/i.test(l) ||
      /^Participe do grupo/i.test(l) ||
      /^Clique aqui para/i.test(l) ||
      /^Siga o g1/i.test(l) ||
      /^Receba as notícias/i.test(l) ||
      /^WhatsApp/i.test(l) ||
      /^VÍDEOS:?/i.test(l) ||
      /^Vídeos:?/i.test(l) ||
      /^Assista aos vídeos/i.test(l) ||
      /^Inscreva-se/i.test(l) ||
      /^Foto:\s*/i.test(l) ||
      /^Foto\s*:/i.test(l) ||
      /^Reprodução\//i.test(l) ||
      /^globo\.com/i.test(l) ||
      /^G1 Presidente Prudente/i.test(l) ||
      /^Veja mais notícias/i.test(l) ||
      /^Leia mais sobre/i.test(l) ||
      /^Confira mais notícias/i.test(l)
    ) {
      continue;
    }

    // Filtragem por substrings insensíveis a maiúsculas
    const lower = l.toLowerCase();
    if (
      lower.includes('canal do g1') ||
      lower.includes('grupo do g1') ||
      lower.includes('no whatsapp') ||
      lower.includes('siga o g1') ||
      lower.includes('veja mais notícias') ||
      lower.includes('leia mais sobre a região no g1') ||
      lower.includes('tudo sobre a região') ||
      lower.includes('tudo sobre o oeste paulista') ||
      lower.includes('assista às reportagens') ||
      lower.includes('reportagens da tv tem')
    ) {
      continue;
    }

    filteredLines.push(l);
  }

  return filteredLines.join('\n\n').trim();
}

/**
 * Cria um resumo/chamada (excerpt) limpo e curto de no máximo maxLen caracteres (sempre terminando com ponto final, sem '...', sem múltiplos parágrafos)
 */
export function createCleanExcerpt(text: string, maxLen = 200): string {
  if (!text) return '';
  
  // Pegar apenas a primeira linha/parágrafo do texto se houver múltiplas linhas
  const firstLine = text.split('\n')[0] || '';
  const clean = cleanRawScrapedText(firstLine).replace(/\s+/g, ' ').trim();
  if (!clean) return '';

  if (clean.length <= maxLen) {
    return clean.endsWith('.') || clean.endsWith('?') || clean.endsWith('!') ? clean : clean + '.';
  }

  let truncated = clean.substring(0, maxLen);
  const lastSentence = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('! ')
  );

  if (lastSentence > 40) {
    const fullSentence = truncated.substring(0, lastSentence + 1).trim();
    return fullSentence;
  }

  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 40) {
    truncated = truncated.substring(0, lastSpace);
  }

  truncated = truncated.replace(/[,;:\-\s\+]+$/, '');
  truncated = truncated.replace(/\s+(e|ou|de|da|do|em|com|para|um|uma|o|a|os|as|no|na|nos|nas|por|como)$/i, '');
  return truncated.endsWith('.') ? truncated : truncated + '.';
}
