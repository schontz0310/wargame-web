# Battlefield Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed the standalone 2D battlefield canvas (`campo_batalha.html`) as a dedicated view in game-mode, accessible from the ControlPanel after the preparation phase.

**Architecture:** The HTML prototype lives in `public/battlefield/campo_batalha.html` and is served as a static asset. A new `BattlefieldView` React component wraps it in a full-screen `<iframe>` with a minimal header bar (back button + draft name). A new `view=battlefield` URL param is wired into `game-mode/page.tsx` alongside the existing `view=army` and `view=log` params. A "Campo de Batalha" button is added to `ControlPanel` using the same styling as the "VIEW LOG" button.

**Tech Stack:** Next.js 15 App Router static export, TypeScript, React `'use client'`, Tailwind classes, vanilla JS/SVG (inside iframe)

**Spec:** `docs/superpowers/specs/` — inline SDD provided by user (battlefield 2D system for MechWarrior: Age of Destruction v1.0)

## Global Constraints

- All pages must have `'use client'` at the top — no SSR
- No dynamic routes (static export): use query params, not `[id]` segments
- `NEXT_PUBLIC_API_BASE_URL` is the only env var — do not add others
- No new npm dependencies — vanilla JS, Tailwind, standard React hooks only
- No `window.confirm()` — blocked in artifact sandboxes; use double-click or custom modal patterns
- `safeLocalStorage` wrapper from `@/lib/storage` for all localStorage access
- Translations via `useT()` hook from `@/hooks/useT`; add keys to all 3 locales (en, es, pt) in `src/lib/translations.ts`
- `iframe` must have `allow="pointer-events"` and `style={{ border: 'none' }}` — the battlefield uses pointer events for drag

---

### Task 1: Adicionar o arquivo HTML ao projeto

**Files:**
- Create: `public/battlefield/campo_batalha.html` (provided by user)

**Interfaces:**
- Produces: static asset served at `/battlefield/campo_batalha.html`

> ⚠️ **Prerequisite**: o usuário deve fornecer o arquivo `campo_batalha.html`. Solicite-o antes de prosseguir com esta tarefa.

- [ ] **Step 1: Criar o diretório e salvar o arquivo**

```bash
mkdir -p public/battlefield
# copy campo_batalha.html into public/battlefield/campo_batalha.html
```

- [ ] **Step 2: Verificar que o arquivo carrega no browser**

Com o dev server rodando (`npm run dev`), abrir:
```
http://localhost:3000/battlefield/campo_batalha.html
```
Expected: O campo de batalha SVG aparece completo, sem erros no console.

- [ ] **Step 3: Verificar que o build estático inclui o arquivo**

```bash
npm run build
ls out/battlefield/campo_batalha.html
```
Expected: arquivo presente no diretório `out/`.

- [ ] **Step 4: Commit**

```bash
git add public/battlefield/campo_batalha.html
git commit -m "feat(battlefield): add battlefield HTML canvas to public assets"
```

---

### Task 2: Criar o componente BattlefieldView

**Files:**
- Create: `src/components/game-mode/BattlefieldView.tsx`

**Interfaces:**
- Consumes: `draft: Draft` from `@/lib/api`
- Consumes: `t('battlefield.title')`, `t('battlefield.back')` translation keys (added in Task 5)
- Produces: `export default function BattlefieldView({ draft }: { draft: Draft }): JSX.Element`

- [ ] **Step 1: Criar o componente**

Criar `src/components/game-mode/BattlefieldView.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/api'
import { useT } from '@/hooks/useT'

export default function BattlefieldView({ draft }: { draft: Draft }) {
  const router = useRouter()
  const t = useT()

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#0a0f06' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid #2a3a1a' }}
      >
        <button
          onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=control`)}
          className="px-3 py-1 font-mono text-xs corner-clip-sm"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
        >
          ← {t('battlefield.back')}
        </button>
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: '#c9a84c' }}>
          {t('battlefield.title')}
        </span>
        <span className="font-mono text-xs" style={{ color: '#4a5e3a' }}>
          — {draft.name}
        </span>
      </div>

      {/* Iframe */}
      <iframe
        src="/battlefield/campo_batalha.html"
        title={t('battlefield.title')}
        style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
        allow="pointer-events"
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```
Expected: sem erros relacionados a `BattlefieldView.tsx`.

Note: `t('battlefield.title')` e `t('battlefield.back')` vão causar erro de tipo até as traduções serem adicionadas na Task 5. Prosseguir assim mesmo — o erro desaparece após a Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/components/game-mode/BattlefieldView.tsx
git commit -m "feat(battlefield): add BattlefieldView iframe wrapper component"
```

---

### Task 3: Adicionar view=battlefield em game-mode/page.tsx

**Files:**
- Modify: `src/app/game-mode/page.tsx` (linhas ~84–92, bloco de `if (view === ...)`)

**Interfaces:**
- Consumes: `BattlefieldView` from `@/components/game-mode/BattlefieldView`
- Produces: quando `?view=battlefield`, renderiza `<BattlefieldView draft={draft} />`

- [ ] **Step 1: Importar BattlefieldView**

Em `src/app/game-mode/page.tsx`, adicionar ao bloco de imports (após a linha que importa `BattleLogView`):

```tsx
import BattlefieldView from '@/components/game-mode/BattlefieldView'
```

- [ ] **Step 2: Adicionar o branch de roteamento**

No bloco de `if (view === ...)`, adicionar antes do `return <ControlPanel draft={draft} />` final:

```tsx
  if (view === 'battlefield') {
    return <BattlefieldView draft={draft} />
  }
```

O bloco completo fica assim (para referência):

```tsx
  if (view === 'army') {
    return <ArmyGrid draft={draft} viewedPlayerId={viewedPlayerId} page={page} />
  }

  if (view === 'log') {
    return <BattleLogView draft={draft} />
  }

  if (view === 'battlefield') {
    return <BattlefieldView draft={draft} />
  }

  return <ControlPanel draft={draft} />
```

- [ ] **Step 3: Verificar no browser**

Com o dev server rodando, navegar para:
```
http://localhost:3000/game-mode?draftId=<id_de_um_draft_existente>&view=battlefield
```
Expected: Aparece o header com botão "← Voltar" e o campo de batalha SVG embaixo.

- [ ] **Step 4: Commit**

```bash
git add src/app/game-mode/page.tsx
git commit -m "feat(battlefield): wire view=battlefield route in game-mode page"
```

---

### Task 4: Adicionar botão "Campo de Batalha" no ControlPanel

**Files:**
- Modify: `src/components/game-mode/ControlPanel.tsx` (linha ~243, após o botão "VIEW LOG")

**Interfaces:**
- Consumes: `t('battlefield.openButton')` translation key (adicionado na Task 5)
- Consumes: `draft.id` (já disponível no escopo do componente)

- [ ] **Step 1: Localizar o botão VIEW LOG no ControlPanel**

O botão está por volta da linha 242–248:
```tsx
<button
  onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=log`)}
  className="px-3 py-1.5 font-mono text-sm corner-clip-sm"
  style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
>
  {t('control.viewLog')}
</button>
```

- [ ] **Step 2: Adicionar o botão de battlefield logo após o botão VIEW LOG**

Inserir após o botão "VIEW LOG" (antes do botão de reset):

```tsx
<button
  onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=battlefield`)}
  className="px-3 py-1.5 font-mono text-sm corner-clip-sm"
  style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
>
  {t('battlefield.openButton')}
</button>
```

- [ ] **Step 3: Verificar no browser**

Com o dev server rodando, entrar em um draft completo (preparation concluída) e verificar que o botão "CAMPO" (ou o label traduzido) aparece na barra de ações do ControlPanel. Clicar nele deve abrir o BattlefieldView.

- [ ] **Step 4: Commit**

```bash
git add src/components/game-mode/ControlPanel.tsx
git commit -m "feat(battlefield): add battlefield button to ControlPanel"
```

---

### Task 5: Adicionar traduções para as 3 línguas

**Files:**
- Modify: `src/lib/translations.ts`

**Interfaces:**
- Produces: `t('battlefield.title')`, `t('battlefield.back')`, `t('battlefield.openButton')` disponíveis em EN/ES/PT
- A estrutura de `translations.ts` tem `en`, `es`, `pt` como raiz; `control` é uma chave dentro de cada um deles (ex: linha 169 EN, linha 801 ES, linha 1433 PT)

- [ ] **Step 1: Adicionar chaves em inglês**

No objeto `en.control` (ao redor da linha 169, após `viewArmy`), adicionar:

```ts
viewBattlefield: 'BATTLEFIELD',
```

No objeto `en` raiz, adicionar uma nova chave `battlefield` (pode ser adicionada próximo às outras chaves de feature, como `terrainPlacement`):

```ts
battlefield: {
  title: 'BATTLEFIELD',
  back: 'BACK',
  openButton: 'BATTLEFIELD',
},
```

- [ ] **Step 2: Adicionar chaves em espanhol**

No objeto `es.control` (ao redor da linha 801):

```ts
viewBattlefield: 'CAMPO',
```

No objeto `es` raiz:

```ts
battlefield: {
  title: 'CAMPO DE BATALLA',
  back: 'VOLVER',
  openButton: 'CAMPO',
},
```

- [ ] **Step 3: Adicionar chaves em português**

No objeto `pt.control` (ao redor da linha 1433):

```ts
viewBattlefield: 'CAMPO',
```

No objeto `pt` raiz:

```ts
battlefield: {
  title: 'CAMPO DE BATALHA',
  back: 'VOLTAR',
  openButton: 'CAMPO',
},
```

- [ ] **Step 4: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```
Expected: sem erros de tipo em `BattlefieldView.tsx` ou `ControlPanel.tsx`.

- [ ] **Step 5: Verificar o build estático completo**

```bash
npm run build
```
Expected: Build finalizado sem erros, 19+ páginas estáticas geradas.

- [ ] **Step 6: Smoke test visual final**

1. Rodar `npm run dev`
2. Abrir `http://localhost:3000/game-mode?draftId=<id>&view=control`
3. Verificar que o botão "CAMPO" aparece na barra do ControlPanel
4. Clicar no botão → deve abrir a view battlefield com o iframe
5. Verificar que o campo SVG carrega e é interativo (arrastar terreno)
6. Clicar "← VOLTAR" → deve retornar ao ControlPanel

- [ ] **Step 7: Commit**

```bash
git add src/lib/translations.ts
git commit -m "feat(battlefield): add battlefield translations (EN/ES/PT)"
```

---

## Resumo de arquivos

| Arquivo | Ação |
|---|---|
| `public/battlefield/campo_batalha.html` | Criar (fornecido pelo usuário) |
| `src/components/game-mode/BattlefieldView.tsx` | Criar |
| `src/app/game-mode/page.tsx` | Modificar — import + `if (view === 'battlefield')` |
| `src/components/game-mode/ControlPanel.tsx` | Modificar — botão CAMPO após VIEW LOG |
| `src/lib/translations.ts` | Modificar — 3 chaves × 3 línguas |

## Limitações desta integração

- O campo de batalha não troca estado com o React — recarregar a página do iframe reseta o terreno colocado (comportamento esperado conforme a spec §12: "sem persistência entre sessões")
- O botão de reiniciar dentro do HTML usa duplo clique em vez de `window.confirm()` — compatível com ambientes sandboxed (spec §2.3)
- A integração com a fase `terrain_placement` (fase de preparação) é **fora do escopo desta implementação**; o canvas é uma ferramenta visual separada acessível durante a fase de jogo
