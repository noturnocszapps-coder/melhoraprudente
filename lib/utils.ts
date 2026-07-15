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
