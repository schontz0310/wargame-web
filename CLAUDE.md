# CLAUDE.md — wargame-web

Instruções e padrões para a IA ao trabalhar neste projeto.

---

## Arquitetura

Este app é uma **SPA estática pura** construída com Next.js 15 App Router.

- **Sem SSR** — nenhuma página usa renderização no servidor
- **Sem API routes** — não existe `src/app/api/`
- **Sem middleware** — não existe `middleware.ts`
- Todos os dados são buscados no browser via `fetch` dentro de `useEffect`
- Estado local gerenciado com `useState`; persistência via `localStorage` (wrapper seguro em `src/lib/storage.ts`)
- Toda página de dados deve ter `'use client'` no topo

---

## Static Export — Padrão de Deploy

O build gera arquivos estáticos servidos pelo **DigitalOcean Static Sites**.

| Detalhe | Valor |
|---------|-------|
| Script de build | `npm run build` (já inclui `NEXT_PUBLIC_EXPORT=true`) |
| Output dir | `out/` |
| Config | `next.config.ts` com `output: 'export'` condicional |
| Trailing slash | `trailingSlash: true` (obrigatório) |
| Imagens | `images.unoptimized: true` (obrigatório) |
| Rewrites | Desabilitados no export (sem servidor Next.js) |

---

## Guardrails — O que NUNCA fazer

- **NUNCA** criar rotas dinâmicas `[id]` — quebram o static export
- **NUNCA** criar `src/app/api/` routes — sem servidor para processá-las em produção
- **NUNCA** usar `generateStaticParams` com fetch de API externa — não há backend Next.js em runtime
- **NUNCA** remover `'use client'` de páginas que buscam dados
- **NUNCA** usar `getServerSideProps` ou qualquer primitiva de SSR

### Padrão correto para páginas de detalhe

Usar **rotas estáticas fixas** com **query params** para IDs:

```
/cards/faction-pride/detail/page.tsx  ← rota estática
useSearchParams() para ler ?id=123    ← ID via query param
```

Estrutura de rotas de cards:
```
src/app/cards/
  page.tsx                         ← seletor de tipo
  faction-pride/
    page.tsx                       ← lista
    detail/page.tsx                ← detalhe (?id=)
  mercenary-contract/
    page.tsx                       ← lista
    detail/page.tsx                ← detalhe (?id=)
```

---

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_BASE_URL` | URL base da API REST |

- Cadastrada no painel do **DigitalOcean App Platform** (não no repositório)
- `.env.local` usado apenas localmente — está no `.gitignore`
- Por ser `NEXT_PUBLIC_*`, é embutida no bundle **no momento do build**
- Não existe `.env.production` — as envs são gerenciadas pelo painel DO

---

## API e CORS

- Um único servidor de API para todos os ambientes (dev, prod, test)
- CORS configurado no servidor — browser chama diretamente, sem proxy
- Toda comunicação é **GET-only** via `ApiService` em `src/lib/api.ts`
- Nunca adicionar um proxy Next.js para a API (incompatível com static export)

---

## DigitalOcean App Platform

| Configuração | Valor |
|-------------|-------|
| Repositório | `schontz0310/wargame-web` |
| Branch | `main` |
| Build command | `npm run build` |
| Output directory | `out` |
| Envs | Cadastradas no painel DO (não no `app.yaml`) |

O arquivo `.do/app.yaml` serve como documentação de infraestrutura e referência para recriar o app via CLI (`doctl apps create --spec .do/app.yaml`).
