# NEXUS — Circuito, classificação e finanças

12/11/2026 · Desenvolvimento do Beta 2.0 · Sem publicação

## Entrega

Yask autorizou executar o pacote após o plano de fechamento. A implementação amplia a base do modelo A, commit `557d6c1`, na branch `development/beta-2.0-circuit-finance`. A conferência visual pendente não foi declarada concluída por essa autorização.

- Novo circuito com oito equipes, sete rodadas, quatro partidas por rodada e 28 jogos únicos.
- Os sete confrontos do jogador mantêm dias, mapas, adversários e lados iniciais. Cada clube começa quatro vezes de um lado e três do outro.
- Os 21 jogos NPC usam `advanceSession`, a mesma execução de rodadas das partidas do jogador, com compras e habilidades normais.
- Repertórios por clube variam entre estratégias existentes, por semente e rodada. A política não recebe o plano do usuário e não acrescenta bônus de combate. Atributos e familiaridades NPC continuam fixos.
- Classificação derivada dos resultados: vitória 3, empate 1, derrota 0. Desempates: vitórias, pontos no grupo empatado, saldo global, rodadas vencidas e sorteio final persistido.
- Mini tabela calculada uma única vez para o grupo empatado em pontos e vitórias; não reiniciada em subgrupos.
- Caixa inicial 30.000, inscrição 1.000, cinco contratos de 365 dias, folha proporcional, operação, extrato, prêmio e encerramento consultáveis.
- Países dos 24 candidatos adicionados conforme a consolidação, filtro por país, identificação dos 35 NPCs, atributos e resultados anteriores no pré-jogo.
- Resumo do ciclo com resultados, estatísticas agregadas dos titulares e acesso à evolução atual do elenco.

## Fluxo e retomada

O Calendário apresenta os custos e prêmios antes da inscrição. Confirmar inicia nova evolução e cria somente o crédito inicial e a inscrição; cancelar não grava contratos ou cobranças.

O resultado do jogador é salvo antes do processamento dos outros três jogos da rodada. A interface calcula esses jogos no worker de rodadas e confirma cada partida concluída separadamente. Ao interromper, somente os jogos ainda sem resultado serão recalculados. Uma partida NPC parcialmente calculada não tem checkpoint por rodada; sua retomada reinicia essa partida com a mesma semente. Jogos NPC concluídos não são sorteados novamente.

A classificação oficial permanece na última rodada completa até existirem os quatro resultados novos. O calendário bloqueia o avanço enquanto houver jogos pendentes. No dia 28, campeão e prêmio só são fechados após os 28 resultados.

O sorteio excepcional desempata apenas grupos que continuam iguais após os critérios numéricos. Sua ordem deriva de SHA-256 da semente do ciclo e dos identificadores, e fica registrada com os participantes. Não há novo sorteio ao recarregar.

## Finanças e contratos

O extrato é reconstruído a partir dos dias fechados e da colocação final. Não há soma cega de lançamentos a cada clique. Cada origem tem identificação única: entrada, inscrição, salários/operacão de cada semana e premiação.

Valores em centavos inteiros. Obrigação salarial acumulada após `d` dias: `round(folha_mensal × 100 × d / 30)`. O pagamento semanal é a diferença entre os acumulados, compensando centavos residuais. A rotina histórica `src/career.ts/accrueWeek` não é usada por esta implementação.

Ao sair de um dia, o calendário fecha o período antes de abrir o próximo. Assim, saltar do dia 4 ao 8 paga o fechamento do dia 7. O dia 28 é fechado depois dos quatro jogos finais. Treinos não têm taxa e os créditos das rodadas não se convertem em caixa.

| Folha mensal | Salários em 28 dias | Operação + inscrição | Saldo sem prêmio |
|---|---:|---:|---:|
| 11.900,00 | 11.106,67 | 3.800,00 | 15.093,33 |
| 12.000,00 | 11.200,00 | 3.800,00 | 15.000,00 |

Prêmios: 8.000 / 5.000 / 3.000 / 2.000 / 1.000 / 1.000 / 0 / 0. Apenas a parcela da organização do usuário entra no seu caixa, uma única vez. Salários ficam fixos apesar da evolução. Ao fechar os 28 dias, os contratos ainda têm 337 dias restantes.

## Progresso e compatibilidade

Novas campanhas usam `Career.version = 2`, save schema 5 e identificação `2.0.0-dev.circuit`. Schemas 2/3/4 continuam legíveis. Agendas anteriores permanecem no formato anterior, identificado pela interface, sem inventar resultados NPC ou cobrar despesas passadas. O circuito financeiro começa em campanha nova, com exportação disponível antes de reiniciar.

O circuito guarda resultados, perfis iniciais, estatísticas, planos, sementes e recibos de compras em registro próprio. As partidas do jogador também são copiadas ao histórico comum enquanto houver espaço. Com 20 partidas no histórico, a cópia adicional é omitida, e o resultado competitivo continua preservado e consultável no circuito. Não há exclusão silenciosa das partidas antigas. Excluir uma cópia do histórico não muda classificação ou caixa.

O registro compacto do circuito não guarda todos os eventos espaciais de cada jogo NPC. Ele mantém os dados citados para consulta e reprodução técnica. O replay visual completo NPC não faz parte desta entrega.

## Validação executada

Registros em `validation/circuit/`:

- 150 testes automatizados aprovados: regressões anteriores, grade, políticas, classificação, desempates, centavos, contratos, duplicações, importação e armazenamento com conflito de revisão.
- Matriz de seis circuitos completos: dois elencos legais, três rotinas (sem treino, coletivo e individual), 168 partidas e 3.275 rodadas.
- Atributos e familiaridades NPC preservados. Jogos do usuário e dos NPCs passaram pelas mesmas funções de rodada.
- Reimportação em partidas e entre jogos NPC; fechamento financeiro conferido em todos os ciclos.
- Maior save da amostra: 9.583.535 bytes, incluindo histórico prévio de 20 partidas; abaixo do limite de 64 MiB.
- Checagem de tipos, exportações na raiz e em `/esports-manager`, assets, manifesto e worker: registros nos logs correspondentes.
- Renderização React dos estados de inscrição, caixa, processamento pendente, bloqueio de operação, encerramento e dashboard. Não é execução de cliques nem inspeção de CSS.

As sementes diferem entre as rotinas da matriz; as colocações não medem efeito causal de um tipo de treino. A amostra não homologa equilíbrio global, desempenho em aparelhos ou taxa de vitória esperada. Os testes de armazenamento usam IndexedDB simulado; não substituem conferência em aparelhos reais.

## Limites e próximas pendências

Sem novo teste em navegador: a restrição da prévia e a rejeição automática anterior não foram contornadas. Portanto, os fluxos de clique, foco renderizado, layout desktop/móvel e desempenho real continuam pendentes. As expectativas do teste de navegador do calendário foram atualizadas, mas esse teste não foi executado nesta entrega. O workflow do novo pacote foi preparado, sem execução remota ou publicação.

As artes finais dos oito agentes não foram integradas neste pacote funcional. A aprovação e o mapeamento dos arquivos finais continuam necessários. Mercado, staff, patrocínios, popularidade numérica e continuidade com evolução acumulada não foram adicionados.

Antes do lançamento: integrar as artes finais; inspecionar o produto renderizado em computador/celular; corrigir problemas encontrados; fechar versão, documentação e nota da candidata; executar a conferência final e publicar pelo GitHub conforme a liberação de lançamento. O Beta 1.3 pode ser substituído quando essa candidata estiver pronta, preservando sua referência de recuperação no Git.
