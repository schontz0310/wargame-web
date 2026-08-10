# Modo Jogo — Design

Data: 2026-08-10

## Objetivo

Tela de "game mode" (modo jogo) onde, durante uma partida física, o jogador acompanha os dials de todas as unidades do seu army (originado de um Draft salvo) lado a lado, clicáveis como na tela de detalhe atual (`/list`), organizados em uma grade de 6 por tela sem scroll, com paginação quando o army tem mais de 6 unidades.

## Fora de escopo (por enquanto)

- Múltiplos dispositivos sincronizados entre jogadores (é local, um navegador por vez).
- Fontes de army fora de Draft (Minha Coleção, seleção livre) — pode virar uma extensão futura.
- Atalhos de teclado para navegação de página.

## Arquitetura e navegação

- Nova rota estática `src/app/game-mode/page.tsx` (sem segmento dinâmico — segue o guardrail do projeto). Estado via query params, lidos com `useSearchParams` dentro de `Suspense` (mesmo padrão de `src/app/list/page.tsx`):
  - `draftId` — id do Draft salvo (localStorage `myDrafts`).
  - `player` — `playerId` do `DraftResult` sendo exibido.
  - `page` — página atual da grade paginada (1-based).
- **Sem `draftId`**: a página renderiza um seletor de Drafts salvos (mesma fonte de dados que `/drafts` usa) — lista simples, clicar navega para `/game-mode?draftId=<id>&player=<primeiro playerId>&page=1`.
- **Com `draftId` válido**: carrega o draft do localStorage, renderiza:
  - Header fixo: nome do draft, abas de jogador (uma por `DraftResult`), indicador de página, setas prev/next, botão "Resetar Partida".
  - Corpo: grade 3×2 do `armyUnits` do jogador ativo, fatiada em páginas de 6.
- Trocar de aba de jogador reseta `page=1`.
- `draftId` inexistente ou draft não encontrado no localStorage → volta para o seletor de Drafts com uma mensagem.
- Adicionar botão "Modo Jogo" em cada draft listado em `/drafts` (link direto para `/game-mode?draftId=<id>`).
- Adicionar item "Modo Jogo" → `/game-mode` em `src/components/app-sidebar.tsx`.

## Modelo de dados

`DraftUnit` (já existente em `src/lib/api.ts`) só tem `id`, `name`, `points`, `type`, `faction`, `quantity`, `isCard?`. Não tem `class`/`speedMode`/`combatDial`/`heatDial` — necessários para decidir qual dial renderizar. Cada célula da grade precisa buscar a `Unit` completa via `apiService.getUnit(id)` para classificar o tipo de dial. Isso duplica o fetch que `AppDial`/`InfantryDial` já fazem internamente (eles chamam `useSelectedUnit(unitId)` por conta própria) — é o mesmo padrão que a tela `/list` já usa hoje (fetch na página + fetch dentro do dial), então não é uma regressão de comportamento, só replicada por célula.

Regra de elegibilidade de dial (idêntica à já usada em `src/app/list/page.tsx`):
- `type` infantry/vehicle → `InfantryDial`.
- `type` mech, com `speedMode` mech/quadmech e `class` ≠ colossal → `AppDial`.
- Qualquer outro caso (incluindo `isCard: true`, cards secretos, mechs colossais, tipos futuros) → card placeholder sem dial, mesmo tamanho de célula, mostrando nome/pontos e um badge ("card secreto" ou "dial em desenvolvimento").

### Sessão de jogo (persistência)

Novo hook `src/hooks/useGameSession.ts`, responsável por ler/escrever em `localStorage` sob a chave `wargame_game_session_<draftId>`:

```ts
type GameSessionState = {
  [playerId: number]: {
    [instanceKey: string]: { damageClicks: number; heatClicks: number }
  }
}
```

`instanceKey` = `` `${index}-${unit.id}` ``, onde `index` é a posição da unidade dentro do array `armyUnits` daquele jogador no momento em que a sessão é carregada. Isso separa o progresso de duas cópias da mesma unidade no army (mesmo `id` de catálogo repetido), sem precisar de um id de instância novo no modelo de Draft existente.

- Cada `GameDialCard` (célula da grade) lê/escreve seu par `{damageClicks, heatClicks}` via `useGameSession`, e passa como `externalDamageClicks`/`externalHeatClicks` + `onDamageChange`/`onHeatChange` para `AppDial`/`InfantryDial` — sem alterar esses componentes.
- Botão **"Resetar Partida"** no header: com confirmação, apaga a chave `wargame_game_session_<draftId>` inteira (zera todos os jogadores daquele draft). Pensado para ser usado antes de uma nova partida com o mesmo draft.

## Layout e interação

- Container `h-screen overflow-hidden`; grade CSS `grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(2,1fr)` preenchendo a área abaixo do header fixo.
- Cada célula:
  - Cabeçalho compacto (nome, pontos, facção) — dados vêm direto do `DraftUnit` já em mãos, sem fetch extra.
  - Dial escalado para caber na célula: `ResizeObserver` no container da célula + `transform: scale(fator)` sobre o wrapper do dial (mesma técnica de medir largura via `ResizeObserver` já usada em `unit-builder/preview/page.tsx`), calculando o fator pelo menor entre largura/altura disponíveis vs. os 500×500px do canvas do dial.
  - Clique funciona diretamente na escala reduzida (sem modal de expansão) — decisão já validada.
- Paginação: `armyUnits` fatiado em grupos de 6 (`Array.slice`). Página fora do intervalo válido é clampada para a mais próxima.
- Abas de jogador: uma por `DraftResult.playerId`; a aba ativa recebe destaque (borda dourada + leve glow), reforçando de quem é o army em tela.

## Visual

Reaproveita o design system já estabelecido no app (não um novo, dado que é uma extensão de um produto com identidade visual madura): fundo verde-oliva escuro em gradiente (`#080c05`→`#0d1208`→`#0a0f06`), dourado `#c9a84c` para destaque/pontos, verde `#7a9a5a` para labels, tipografia monoespaçada com tracking largo em maiúsculas, bordas com `corner-clip-sm` — os mesmos tokens usados em `/my-collection`, `/list` e `/unit-builder/preview`.

Elemento de assinatura do Modo Jogo: a aba do jogador ativo funciona como uma "estação de comando" — destaque dourado aceso, indicando claramente qual army está em tela. Sem animações além de transições de estado sutis já usadas no resto do app.

## Erros e casos de borda

- Draft sem `armyUnits` para o jogador selecionado → estado vazio explicando que o army está vazio, com link de volta para `/drafts` para montá-lo.
- Falha ao buscar uma `Unit` individual (API fora do ar) → aquela célula específica mostra um estado de erro compacto, sem quebrar a grade inteira (outras células continuam funcionando).
- `localStorage` corrompido/indisponível → mesmo tratamento defensivo que o resto do app já usa via `safeLocalStorage` (`src/lib/storage.ts`).

## Verificação

Sem testes automatizados novos (o app não tem suíte de testes hoje). Verificação manual no navegador:
- Criar/usar um Draft com >6 unidades no army de um jogador, confirmar paginação e que a grade nunca gera scroll.
- Clicar em dials de mech e infantaria dentro da grade, confirmar que dano/calor incrementam e ficam destacados como na tela `/list`.
- Recarregar a página e confirmar que o progresso persistiu.
- Clicar "Resetar Partida", confirmar que zera todos os jogadores do draft.
- Trocar de aba de jogador e confirmar que a página volta para 1 e mostra o army correto.
