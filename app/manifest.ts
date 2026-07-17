import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Roxou',
    short_name: 'Roxou',
    description: 'Tecnologia, Mídia e Experiências.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#a855f7',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
