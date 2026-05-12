# TikTok Analytics

Painel mobile-first para pesquisar perfis públicos do TikTok, coletar dados reais via Bright Data e apresentar métricas com cache em banco.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + componentes inspirados em shadcn/ui
- tRPC v11
- Supabase
- Bright Data TikTok Scraper API
- Vitest + Playwright

## Scripts

```bash
npm install
npm run dev
npm run build
npm run test
```

## Ambiente

Copie `.env.example` para `.env` e preencha as chaves do Supabase e do Bright Data.
