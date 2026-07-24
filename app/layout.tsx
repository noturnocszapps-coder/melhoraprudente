import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Melhora Prudente',
  description: 'Portal de notícias e serviços de Presidente Prudente',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
