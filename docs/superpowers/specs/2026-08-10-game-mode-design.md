# Modo Jogo — Design

Data: 2026-08-10 (atualizado)

Jogo de referência: **MechWarrior: Age of Destruction** (rulebook fornecido pelo usuário — `MechWarrior: Age of Destruction — Quick-Start and Rules of Warfare`). As regras de turno, ordens e sequência de ataque citadas abaixo vêm diretamente desse rulebook.

## Objetivo

Tela de "Modo Jogo" onde, durante uma partida física, o jogador acompanha:
1. Um **painel de controle** de turno/estágio/jogador ativo, seguindo a estrutura real de turnos do rulebook (Comando → Ordens → Limpeza), com contador de Ordens e um assistente que guia a sequência oficial de resolução de ataque.
2. Uma **grade de dials** (6 por tela, paginada) com todas as unidades do army de um jogador (originado de um Draft salvo), clicáveis como na tela de detalhe atual (`/list`).

## Fora de escopo (por enquanto)

- Múltiplos dispositivos sincronizados entre jogadores (é local, um navegador por vez, controlado por quem estiver com o dispositivo na mesa).
- Fontes de army fora de Draft (Minha Coleção, seleção livre) — pode virar uma extensão futura.
- Pontuação de vitória (eliminação, controle de campo, controle de zona de implantação) — fica para uma próxima etapa.
- Ordens de Assalto e ataques especiais (Carga, Investida, Queda dos Céus, Artilharia) no assistente de sequência de ataque — só Combate à Distância e Corpo a Corpo na v1. As demais ficam desabilitadas/"em breve" no seletor de tipo de ordem.
- Cálculo automático de resultado de ataque (soma de dado, comparação com defesa, dano final) — o assistente só guia o roteiro dos passos; contas continuam sendo feitas pelos jogadores com os dados físicos, como hoje.
- Atalhos de teclado para navegação de página/estágio.

## Arquitetura e navegação

Nova rota estática `src/app/game-mode/page.tsx` (sem segmento dinâmico — segue o guardrail do projeto). Estado via query params, lidos com `useSearchParams` dentro de `Suspense` (mesmo padrão de `src/app/list/page.tsx`):
- `draftId` — id do Draft salvo (localStorage `myDrafts`).
- `player` — `playerId` do `DraftResult` sendo exibido/ativo.
- `page` — página atual da grade paginada (1-based).
- `view` — `control` (padrão) ou `army`.

Fluxo:
- **Sem `draftId`**: seletor de Drafts salvos (mesma fonte de dados que `/drafts` usa). Clicar navega para `/game-mode?draftId=<id>&view=control`.
- **`draftId` inválido/não encontrado**: volta pro seletor de Drafts com uma mensagem.
- **`view=control`** (painel de controle, ver seção própria abaixo).
- **`view=army`** (grade de dials, ver seção própria abaixo) — tem um botão "← Painel de Controle" que volta para `view=control` mantendo `draftId`/`player`.
- Botão "Modo Jogo" em cada draft listado em `/drafts` (link direto para `/game-mode?draftId=<id>`).
- Item "Modo Jogo" → `/game-mode` em `src/components/app-sidebar.tsx`.

## Estrutura de turno (do rulebook)

Referência: rulebook, "Turns, Orders, and Stages" (p. 13) e "Attack Sequence" (p. 28-29).

- O jogo é jogado em uma série de **turnos**. Jogadores se revezam **um de cada vez**, na ordem dos `playerId` (crescente, voltando ao primeiro após o último) — não é "todos jogam a fase junto".
- O jogador da vez é o **jogador ativo**.
- Cada turno tem **3 estágios**, nesta ordem: **Comando** → **Ordens** → **Limpeza**.
  - **Comando**: resolve efeitos de jogo pendentes daquele jogador (fora de escopo automatizar — só navegação).
  - **Ordens**: o jogador ativo tem um total de ordens (1 ordem a cada 150 pontos do build total) para distribuir, uma por unidade, entre 5 tipos: Mover, Ventilar, Combate à Distância, Corpo a Corpo, Assalto. Dar uma 2ª ordem à mesma unidade no mesmo turno é uma "ordem empurrada" (dano de push).
  - **Limpeza**: fim do turno; ordens não usadas são perdidas; passa a vez ao próximo jogador.
- Um "turno" global incrementa a cada troca de jogador; a Rodada exibida na UI é derivada (`ceil(turno / nº jogadores)`), só como referência visual — o rulebook não nomeia "rodada" formalmente.

## `view=control` — Painel de Controle

- Nome do draft, contador de **Turno** e **Rodada** (derivada).
- Indicador visual dos 3 estágios (Comando / Ordens / Limpeza), com o atual destacado.
- Abas de jogador: uma por `DraftResult.playerId`. A aba do jogador ativo recebe destaque visual (borda dourada + glow, a "estação de comando" já definida no design original) — as demais ficam clicáveis para consulta, mas sem o destaque.
- Durante o estágio de **Ordens**: contador "Ordens: X/Y usadas", onde Y é calculado por padrão como `floor(armyPoints do jogador ativo / 150)` (mínimo 1), com um campo pequeno editável para ajustar caso o build total combinado na mesa seja diferente dos pontos realmente montados.
- Botões:
  - **Próximo Estágio** — avança Comando→Ordens→Limpeza; ao sair de Limpeza, passa para o Comando do próximo jogador e incrementa o turno. Zera `ordersUsed` e os marcadores de ordem (`unitOrders`) do jogador que está saindo de Limpeza.
  - **Ver Army** — navega para `view=army&player=<jogador ativo>` (ou o jogador selecionado na aba, se for diferente do ativo — permite consultar o army de qualquer jogador a qualquer momento, mas o seletor de tipo de ordem só fica interativo se for o army do jogador ativo durante o estágio de Ordens).

## `view=army` — Grade de dials

Idêntica ao design original, com uma adição: cada célula ganha um **seletor de tipo de ordem**.

- Container `h-screen overflow-hidden`; grade CSS `grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(2,1fr)` (3 colunas × 2 linhas) preenchendo a área abaixo do header fixo.
- Cada célula:
  - Cabeçalho compacto (nome, pontos, facção) — dados vêm direto do `DraftUnit` já em mãos, sem fetch extra.
  - Dial escalado para caber na célula via `ResizeObserver` + `transform: scale(fator)` (mesma técnica já usada em `unit-builder/preview/page.tsx`), calculando o fator pelo menor entre largura/altura disponíveis vs. os 500×500px do canvas do dial. Clique funciona direto na escala reduzida.
  - Unidades sem dial (cards secretos, tipos "em desenvolvimento", mechs colossais) mostram um card placeholder do mesmo tamanho, com nome/pontos e um badge.
  - **Seletor de tipo de ordem**, visível/interativo apenas quando: a célula pertence ao army do jogador ativo E o estágio atual é Ordens E a unidade ainda não tem ordem marcada neste turno (ou já tem uma, permitindo virar "empurrada"). Em qualquer outro contexto, mostra o estado de forma somente leitura (ou fica oculto se não fizer sentido, ex.: consultando o army de outro jogador).
    - **Mover** / **Ventilar** → marca o marcador de ordem imediatamente (some 1 em Ordens usadas).
    - **Combate à Distância** / **Corpo a Corpo** → abre o Assistente de Sequência de Ataque (ver seção abaixo).
    - **Assalto** e ataques especiais → desabilitados nesta versão ("em breve").
  - Uma 2ª marcação de ordem na mesma unidade no mesmo turno vira estado "**empurrada**" (aviso visual), sem aplicar dano automaticamente — o jogador registra o dano de push clicando no dial, como já faz hoje.
- Paginação: `armyUnits` fatiado em grupos de 6 (`Array.slice`); página fora do intervalo é clampada.

## Assistente de Sequência de Ataque

Ao escolher **Combate à Distância** ou **Corpo a Corpo** no seletor de uma unidade, abre um overlay sobre a grade, com os dials do atacante e do(s) alvo(s) selecionados fixados no topo (para clicar durante o processo), e abaixo o checklist oficial da "Attack Sequence" do rulebook (p. 28-29), traduzido:

1. Declarar o(s) alvo(s) do ataque (seleciona unidade(s) em contato/alcance na grade).
2. Declarar tentativa de captura, se aplicável.
3. Atacante cancela equipamento especial opcional e define modificadores ao valor de ataque.
4. Alvo cancela equipamento especial opcional e define modificadores ao valor de defesa.
5. Rolar o ataque (dados físicos) e determinar se acerta.
6. Calcular o dano — dial do alvo disponível na tela para aplicar o clique.
7. Aplicar calor gerado aos afetados (dial disponível para aplicar).
8. Gerou um ataque adicional? Se sim, volta ao passo 2 e repete o checklist.
9. Dar o marcador de ordem ao atacante — **conclui automaticamente** o marcador de ordem da unidade (equivalente ao que Mover/Ventilar fazem direto), somando 1 em Ordens usadas.
10. Aplicar dano de push e calor ao atacante, se houver (dial do atacante disponível).

Regras do assistente:
- Cada passo é uma checkbox manual; só é possível marcar o passo N+1 depois do passo N — garante que a sequência oficial é sempre seguida, sem pular etapas.
- Nenhuma conta é feita pelo app (sem soma de dado, sem comparação de ataque×defesa, sem cálculo de dano). O app só garante o roteiro; os valores continuam vindo dos dados físicos e sendo aplicados nos dials manualmente, como já funciona hoje em `/list`.
- Se o checklist for fechado/abandonado antes do passo 9, nenhum marcador de ordem é aplicado à unidade e nenhum progresso fica salvo — reabrir começa do passo 1.
- Progresso do checklist em si é estado efêmero de UI (não persiste em localStorage); só o resultado final (marcador de ordem + tipo) é salvo.

## Modelo de dados

`DraftUnit` (já existente em `src/lib/api.ts`) só tem `id`, `name`, `points`, `type`, `faction`, `quantity`, `isCard?`. Não tem `class`/`speedMode`/`combatDial`/`heatDial` — necessários para decidir qual dial renderizar. Cada célula da grade precisa buscar a `Unit` completa via `apiService.getUnit(id)` para classificar o tipo de dial. Isso duplica o fetch que `AppDial`/`InfantryDial` já fazem internamente (eles chamam `useSelectedUnit(unitId)` por conta própria) — é o mesmo padrão que a tela `/list` já usa hoje (fetch na página + fetch dentro do dial), então não é uma regressão de comportamento, só replicada por célula.

Regra de elegibilidade de dial (idêntica à já usada em `src/app/list/page.tsx`):
- `type` infantry/vehicle → `InfantryDial`.
- `type` mech, com `speedMode` mech/quadmech e `class` ≠ colossal → `AppDial`.
- Qualquer outro caso (incluindo `isCard: true`, cards secretos, mechs colossais, tipos futuros) → card placeholder sem dial.

### Sessão de jogo (persistência)

Novo hook `src/hooks/useGameSession.ts`, lendo/escrevendo em `localStorage` sob a chave `wargame_game_session_<draftId>`:

```ts
type GameSessionState = {
  turn: number
  stage: 'command' | 'order' | 'cleanup'
  activePlayerId: number
  buildTotalOverride?: { [playerId: number]: number }
  players: {
    [playerId: number]: {
      ordersUsed: number
      unitOrders: {
        [instanceKey: string]: {
          status: 'none' | 'ordered' | 'pushed'
          orderType?: 'move' | 'vent' | 'ranged' | 'close'
        }
      }
      units: {
        [instanceKey: string]: { damageClicks: number; heatClicks: number }
      }
    }
  }
}
```

- `instanceKey` = `` `${index}-${unit.id}` ``, onde `index` é a posição da unidade dentro do array `armyUnits` daquele jogador no momento em que a sessão é carregada — separa o progresso de duas cópias da mesma unidade no army (mesmo `id` de catálogo repetido).
- Cada `GameDialCard` (célula da grade) lê/escreve `units[instanceKey]` via `useGameSession`, passando como `externalDamageClicks`/`externalHeatClicks` + `onDamageChange`/`onHeatChange` para `AppDial`/`InfantryDial` — sem alterar esses componentes.
- Ao avançar de estágio (ver "Painel de Controle"), o hook zera `ordersUsed` e `unitOrders` do jogador que está saindo de Limpeza.
- Botão **"Resetar Partida"** no painel de controle: com confirmação, apaga a chave `wargame_game_session_<draftId>` inteira — zera turno (volta a 1), estágio (Comando), jogador ativo (primeiro `playerId`), e todos os dados de todos os jogadores (dano, calor, ordens). Pensado para ser usado antes de uma nova partida com o mesmo draft.

## Visual

Reaproveita o design system já estabelecido no app (não um novo, dado que é uma extensão de um produto com identidade visual madura): fundo verde-oliva escuro em gradiente (`#080c05`→`#0d1208`→`#0a0f06`), dourado `#c9a84c` para destaque/pontos, verde `#7a9a5a` para labels, tipografia monoespaçada com tracking largo em maiúsculas, bordas com `corner-clip-sm` — os mesmos tokens usados em `/my-collection`, `/list` e `/unit-builder/preview`.

Elemento de assinatura do Modo Jogo: a aba do jogador ativo funciona como uma "estação de comando" — destaque dourado aceso, indicando claramente qual army está em tela. Sem animações além de transições de estado sutis já usadas no resto do app.

## Erros e casos de borda

- Draft sem `armyUnits` para o jogador selecionado → estado vazio explicando que o army está vazio, com link de volta para `/drafts` para montá-lo.
- Falha ao buscar uma `Unit` individual (API fora do ar) → aquela célula específica mostra um estado de erro compacto, sem quebrar a grade inteira (outras células continuam funcionando).
- `localStorage` corrompido/indisponível → mesmo tratamento defensivo que o resto do app já usa via `safeLocalStorage` (`src/lib/storage.ts`).
- Trocar de estágio/jogador com o Assistente de Sequência de Ataque aberto → não deveria acontecer (overlay bloqueia a navegação do painel de controle); se acontecer por alguma rota inesperada, o checklist é descartado sem aplicar marcador de ordem.

## Verificação

Sem testes automatizados novos (o app não tem suíte de testes hoje). Verificação manual no navegador:
- Criar/usar um Draft com >6 unidades no army de um jogador, confirmar paginação e que a grade nunca gera scroll.
- Clicar em dials de mech e infantaria dentro da grade, confirmar que dano/calor incrementam e ficam destacados como na tela `/list`.
- Avançar estágios (Comando→Ordens→Limpeza→próximo jogador) e confirmar que o turno incrementa e os marcadores de ordem/contador zeram na troca.
- Dar ordem de Mover/Ventilar a uma unidade e confirmar que marca na hora.
- Dar ordem de Combate à Distância/Corpo a Corpo, percorrer o checklist do Assistente de Sequência de Ataque do passo 1 ao 10 sem poder pular etapas, confirmar que completar o passo 9 marca o marcador de ordem.
- Dar uma 2ª ordem à mesma unidade no turno e confirmar que vira "empurrada".
- Recarregar a página e confirmar que turno/estágio/ordens/dano/calor persistiram.
- Clicar "Resetar Partida", confirmar que zera turno, estágio, jogador ativo e todos os dados de todos os jogadores.
- Trocar de aba de jogador no painel de controle e confirmar que "Ver Army" mostra o army correto.
