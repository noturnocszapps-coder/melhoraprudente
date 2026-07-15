# Melhora Prudente - Documentação Técnica e Arquitetura de Produção

Este documento detalha a arquitetura, padrões de projeto, fluxo de dados, políticas de segurança, observabilidade, analytics e as diretrizes de desenvolvimento para o portal de notícias **Melhora Prudente**.

---

## 1. Visão Geral da Arquitetura

O **Melhora Prudente** é construído sobre o ecossistema moderno do **Next.js 15 (App Router)** com **React 19** e **Tailwind CSS v4**. O backend conta com persistência dupla utilizando o **Supabase** como banco relacional principal e um mecanismo inteligente de fallback com **LocalStorage** no lado do cliente para assegurar a resiliência operacional em qualquer condição.

```
┌────────────────────────────────────────────────────────┐
│                      Client Side                       │
│  [React Client Components] <──> [Analytics (GA4/Clarity)│
└───────────────────────────┬────────────────────────────┘
                            │ (Através de Services/API)
                            ▼
┌────────────────────────────────────────────────────────┐
│                      Server Side                       │
│  [Next.js Server Components / API Routes / Handlers]   │
└───────────────────────────┬────────────────────────────┘
                            │ (Persistência Dupla)
                            ▼
           ┌────────────────┴────────────────┐
           ▼                                 ▼
┌──────────────────────┐           ┌──────────────────┐
│  Supabase (Postgres) │           │ LocalStorage (FB)│
└──────────────────────┘           └──────────────────┘
```

---

## 2. Estrutura do Projeto

A estrutura segue os padrões recomendados de alta escalabilidade e separação de responsabilidades:

```
├── .env.example              # Exemplo de configuração de variáveis de ambiente
├── app/                      # Rotas e Páginas do Next.js (App Router)
│   ├── admin/                # Painel Administrativo de Controle e Estatísticas
│   ├── api/                  # Endpoints de API e Integrações Server-side
│   ├── cadastro/             # Página de Registro de Novos Usuários
│   ├── categoria/            # Visualização de Notícias Filtradas por Categoria
│   ├── login/                # Autenticação e Entrada no Sistema
│   ├── noticia/              # Exibição de Notícia por Slug (Página de Leitura)
│   ├── noticias/             # Feed Geral e Listagem de Notícias
│   ├── globals.css           # Estilos Globais do Tailwind CSS
│   ├── layout.tsx            # Layout Raiz e Provedores do Sistema
│   ├── page.tsx              # Página Inicial (Capa do Portal)
│   ├── robots.ts             # Configuração para Motores de Busca (SEO)
│   └── sitemap.ts            # Geração Dinâmica de Sitemap XML
├── components/               # Componentes de Interface de Usuário Reutilizáveis
│   ├── AdSlot.tsx            # Container de Publicidade Estável e Lazy-loaded
│   ├── CommentSection.tsx    # Seção de Comentários e Respostas com Rate Limit
│   ├── auth/                 # Guardas de Segurança e Login de Usuários
│   ├── engagement/           # Widgets de Interação (Like, Share, etc.)
│   ├── layout/               # Elementos Estruturais (Header, Footer, AnalyticsTracker)
│   └── news/                 # Componentes de Notícias (Carousel, NewsCard, Feeds)
├── hooks/                    # Custom Hooks do React (ex: useAuth)
├── lib/                      # Conexões Externas, Inicialização e Helpers
│   ├── analytics.ts          # Motor Geral de Monitoramento e Higienização (LGPD)
│   ├── rateLimit.ts          # Utilitário de Prevenção de Abuso no Lado do Cliente
│   ├── supabase.ts           # Inicialização do Cliente Supabase
│   └── utils.ts              # Utilitários de Interface (Tailwind-merge / cn)
├── services/                 # Adaptadores de Serviços de Dados e Fallback local
│   └── index.ts              # Regras de Negócio, Serviços Editoriais e Engajamento
└── types/                    # Definições de Tipos Estritos do TypeScript
    └── index.ts              # Entidades (News, Comment, Profile, Ad, Category)
```

---

## 3. Fluxo de Dados e Persistência Dupla (Resiliência)

Para maximizar o tempo de atividade do portal, as chamadas para dados (notícias, perfis, comentários, likes, visualizações e compartilhamentos) usam a técnica **Supa-Resilience**:
1. O sistema tenta buscar ou persistir no **Supabase** via API.
2. Se a configuração do Supabase estiver ausente ou houver falha de rede/API, o código intercepta a exceção e consome/escreve de forma transparente em uma estrutura local segura (**LocalStorage** no navegador ou dados estáticos de pré-renderização no servidor).
3. Isso garante que o portal continue navegável e funcional mesmo com problemas de infraestrutura externa.

---

## 4. Auditoria de Analytics, Privacidade & Observabilidade

### Google Analytics 4 (GA4) & Microsoft Clarity
A integração é unificada por meio do `<AnalyticsTracker />` renderizado no layout raiz do portal. Ele detecta navegações do **App Router**, mapeia interações e dispara eventos personalizados para:
* `abertura_noticia`: Disparado ao carregar uma notícia.
* `tempo_leitura`: Mede o tempo de permanência no artigo em milestones (a cada 30 segundos).
* `scroll_25`, `scroll_50`, `scroll_75`, `scroll_100`: Mede a profundidade de leitura.
* `clique_categoria` / `clique_noticia`: Rastreamento de navegação fluida.
* `pesquisa`: Captura as buscas com total segurança.
* `login` / `cadastro` / `comentario` / `curtida` / `compartilhamento`: Eventos de conversão.
* `clique_anuncio`: Monitora a monetização do portal.

### Conformidade com a LGPD (Privacidade)
* **Sem Captura Sensível**: O arquivo `lib/analytics.ts` contém um higienizador de dados regex (`sanitizeData`) de alto desempenho que remove e mascara automaticamente emails, senhas, tokens JWT e Bearer antes de disparar eventos para o GA4 ou Clarity.
* **Respeito ao DNT**: Se o navegador do usuário tiver a opção *Do Not Track* habilitada, nenhum evento de analytics externo é emitido.
* **Anonimização de IP**: Configurada por padrão no cabeçalho de inicialização do GA4 (`anonymize_ip: true`).

### Observabilidade e Tratamento de Erros
Pontos de captura globais estão ativos para capturar erros de runtime do React e promessas rejeitadas, disparando eventos do tipo `exception` para monitoramento futuro e registro limpo no console do servidor/cliente, prontos para integração com Vercel Logs ou Sentry.

---

## 5. Como Estender o Portal (Guia do Desenvolvedor)

### A. Como Adicionar Novas Páginas
Para criar uma nova página de navegação no portal:
1. Navegue até a pasta `/app/`.
2. Crie um subdiretório com o nome amigável da rota desejada (ex: `/app/sobre`).
3. Crie um arquivo `page.tsx`. Use Server Components por padrão:
   ```tsx
   import React from 'react';

   export default function SobrePage() {
     return (
       <main className="max-w-7xl mx-auto px-4 py-12">
         <h1 className="text-3xl font-black uppercase">Sobre o Portal</h1>
         <p className="text-zinc-600 mt-4">Jornalismo sério comprometido com Presidente Prudente.</p>
       </main>
     );
   }
   ```
4. Se precisar de estado ou interatividade do usuário (clicks, formulários), adicione a diretiva `'use client'` no topo do arquivo.

### B. Como Criar Novos Componentes
1. Identifique o escopo do componente:
   * Estrutural: Insira em `/components/layout/`
   * Notícia/Editorial: Insira em `/components/news/`
   * Widgets de Engajamento: Insira em `/components/engagement/`
2. Certifique-se de que o componente possui tipagem explícita no TypeScript.
3. Utilize Tailwind CSS para estilização elegante. Adicione sempre um atributo `id` único e significativo para facilitar a depuração e monitoramento se ele for um componente clicável ou relevante para SEO.

### C. Como Publicar (Deploy)
O projeto está pronto para compilação estrita e deployment imediato:
1. Certifique-se de que as variáveis de ambiente necessárias estão documentadas no arquivo `.env.example`.
2. Execute a validação local completa:
   ```bash
   npm run build
   ```
3. O build estático do Next.js gerará as páginas estáticas, otimizações de imagens e rotas do App Router na pasta `.next/` ou `dist/`.
4. Conecte o repositório à plataforma de hospedagem desejada (Vercel, Cloud Run ou similar). O sistema reconhecerá automaticamente a configuração de build padrão do Next.js e inicializará o servidor na porta correspondente.

---

## 6. Dependências do Projeto

* **Next.js (v15.4)**: Framework React de produção para SSR, ISR, Streaming e roteamento dinâmico.
* **React (v19.2)**: Renderização de componentes de alto desempenho.
* **Supabase Client (v2.99)**: SDK seguro para comunicação com banco de dados em tempo real e autenticação.
* **Tailwind CSS v4 / PostCSS**: Motor de design para interfaces limpas e altamente adaptáveis.
* **Motion (v12.23)**: Biblioteca de animações leves e transições fluidas.
* **Lucide React (v0.577)**: Conjunto de ícones vetoriais modernos de alta fidelidade.
* **Zod / React Hook Form**: Validação estrita de esquemas e gerenciamento de formulários seguros.
