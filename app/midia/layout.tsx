import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roxou | Tecnologia, Mídia, Audiovisual e Experiências',
  description: 'Soluções em desenvolvimento de sites e plataformas, marketing digital, produção audiovisual, cobertura de eventos e ferramentas para empresas e eventos.',
  alternates: {
    canonical: 'https://midia.roxou.com.br',
  },
  openGraph: {
    title: 'Roxou | Tecnologia, Mídia, Audiovisual e Experiências',
    description: 'Soluções em desenvolvimento de sites e plataformas, marketing digital, produção audiovisual, cobertura de eventos e ferramentas para empresas e eventos.',
    url: 'https://midia.roxou.com.br',
    siteName: 'Roxou Mídia',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200&h=630',
        width: 1200,
        height: 630,
        alt: 'Roxou - Tecnologia, Mídia, Experiências',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function MidiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
