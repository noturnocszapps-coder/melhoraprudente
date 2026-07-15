import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Melhora Prudente',
    short_name: 'Melhora Prudente',
    description: 'O seu portal de notícias local de Presidente Prudente e Região do Oeste Paulista.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#dc2626',
    icons: [
      {
        src: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=192&h=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=512&h=512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
