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
