import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return 'Data indisponível';
  
  try {
    let d: Date;
    if (typeof date === 'string') {
      let dateStr = date.trim();
      // If it doesn't specify timezone offset or 'Z', treat it as UTC on both server and client to avoid local parsing differences
      if (!dateStr.includes('Z') && !dateStr.match(/[\+\-]\d\d:?\d\d$/)) {
        if (dateStr.includes(' ')) {
          dateStr = dateStr.replace(' ', 'T');
        }
        if (!dateStr.includes('T')) {
          dateStr = dateStr + 'T00:00:00Z';
        } else {
          dateStr = dateStr + 'Z';
        }
      }
      d = new Date(dateStr);
    } else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) return 'Data inválida';
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(d);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Erro na data';
  }
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // 1. Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove comments
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');

  // 3. Remove dangerous HTML elements completely
  const dangerousTags = ['object', 'embed', 'link', 'style', 'meta', 'applet', 'iframe', 'frame', 'frameset', 'base'];
  dangerousTags.forEach(tag => {
    const reg = new RegExp(`<${tag}\\b[^<]*(?:(?!<\/${tag}>)<[^<]*)*<\/${tag}>`, 'gi');
    sanitized = sanitized.replace(reg, '');
    const singleReg = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(singleReg, '');
  });

  // 4. Strip dangerous attributes like on* (events) and javascript: URIs
  // Remove event handlers like onclick="...", onerror=...
  sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '');

  // Remove href="javascript:..."
  sanitized = sanitized.replace(/href\s*=\s*(['"]\s*javascript:[^'"]*['"]|javascript:[^\s>]+)/gi, 'href="#"');

  // Remove src="javascript:..."
  sanitized = sanitized.replace(/src\s*=\s*(['"]\s*javascript:[^'"]*['"]|javascript:[^\s>]+)/gi, 'src=""');

  return sanitized;
}

/**
 * Gera um resumo seguro (excerpt) que respeita as fronteiras de palavras e sentenças,
 * evitando truncar no meio de palavras ou terminar em conjunções/preposições (ex: 'de...', 'e...').
 */
export function generateSafeExcerpt(text: string, maxLength = 180): string {
  if (!text) return '';
  let clean = text
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/g, '')
    .replace(/\]\]&gt;/g, '')
    .replace(/&lt;!\[CDATA\[/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Filtrar se o texto começar com ]]>
  clean = clean.replace(/^\]\]>/, '').trim();

  if (!clean) return '';
  if (clean.length <= maxLength) return clean;
  
  // Corta o texto na largura máxima desejada
  let truncated = clean.substring(0, maxLength);
  
  // Tenta encontrar o final da última sentença completa (ponto final, interrogação, exclamação)
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('! ')
  );
  
  if (lastSentenceEnd > 40) {
    return truncated.substring(0, lastSentenceEnd + 1).trim();
  }
  
  // Caso contrário, corta no último espaço de palavra
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 40) {
    truncated = truncated.substring(0, lastSpace);
  }
  
  // Limpa pontuações órfãs ou preposições/conjunções fracas no final do texto
  truncated = truncated.replace(/[,;:\-\s\+]+$/, '');
  truncated = truncated.replace(/\s+(e|ou|de|da|do|em|com|para|um|uma|o|a|os|as|no|na|nos|nas|por|com|sob|sob|sobre|atras|atrás|como)$/i, '');
  
  return truncated.endsWith('.') || truncated.endsWith('?') || truncated.endsWith('!') ? truncated : truncated + '.';
}

/**
 * Converte blocos de texto divididos por quebras de linha duplas (\n\n) em tags HTML <p>,
 * preservando as tags de bloco HTML existentes para renderização perfeita no Tailwind Prose.
 */
export function formatContentToHtml(content: string): string {
  if (!content) return '';
  
  // Divide o conteúdo pelas quebras de parágrafo dupla
  const parts = content.split(/\n\s*\n+/);
  
  const formattedParts = parts.map(part => {
    const trimmed = part.trim();
    if (!trimmed) return '';
    
    // Se a parte já inicia com uma tag de bloco conhecida (HTML), preserva intacta
    if (/^<(p|div|blockquote|section|h[1-6]|ul|ol|li)\b/i.test(trimmed)) {
      return trimmed;
    }
    
    // Caso contrário, envolve em tag <p> e converte quebras simples em <br />
    const withBrs = trimmed.replace(/\n/g, '<br />');
    return `<p>${withBrs}</p>`;
  });
  
  return formattedParts.filter(Boolean).join('\n');
}

