# Esports Manager — Validação do Beta 1.0

Motor 0.3.0 · Regras GDD FPS Web 1.3 · Publicado no GitHub Pages. Registro atualizado em 24/10/2026; pacote de origem RC1.

## Situação da entrega

Beta implementado e publicado para teste de partida em https://lordyask.github.io/esports-manager/, com código em https://github.com/lordyask/esports-manager, branch `main`. A primeira tentativa parou porque o Pages estava desativado; após sua ativação, a segunda tentativa concluiu com sucesso. A atualização posterior da identidade visual também passou pelo workflow e foi publicada.

A indisponibilidade inicial da ferramenta de prévia foi superada. O Chrome do ambiente de verificação executou montagem do elenco, preparação, cálculo de rodada, sequência até o encerramento, relatório e recuperação do mesmo progresso após recarga. Esses testes foram pontuais e não completam o checklist de compatibilidade, acessibilidade, importação, duas abas e dispositivos físicos. Um arquivo de avaliação de Chrome Android foi validado e reproduzido separadamente.

As decisões P01–P07 e T01–T05 foram consideradas, com o ajuste posterior aprovado: Beta local pelo GitHub Pages, adiando contas, banco em nuvem e execução autoritativa no servidor. As regras de MOBA do documento histórico não foram reintroduzidas.

## Implementado

Elenco aprovado de 24 candidatos, cinco contratos dentro de 12.000 mensais, identidade da organização, agentes únicos por equipe, familiaridades aprovadas, responsabilidades e IGL selecionado. Potencial permanece informação de contratação e não adiciona força imediata. Valores de salários, atributos, habilidades e economia preservados.

O motor portátil usa SHA-256 compatível com Node/UTF-8, sem dependência de `node:crypto` na simulação. Sessões avançam uma rodada por comando em worker, usam seed por rodada e guardam resultados/recibos. Compras podem variar entre os cinco; a ajuda ocorre após reservar compras próprias. Equipamento preservado reduz recompra; saldos continuam individuais.

IndexedDB confirma o progresso em transação com revisão global. Uma aba antiga não pode sobrescrever a confirmação de outra. Exportação/importação verifica formato, versão, checksum e estrutura. Checksum local não autentica resultados. Há um progresso ativo; exporte antes de substituir ou mudar de navegador.

Interface em português com montagem de elenco, preparação, economia individual, acompanhamento por rodada, sequência automática e relatórios. A sequência pausa após 30 rodadas por interação; pode continuar e não define vencedor. Ritmo normal/acelerado muda o intervalo entre rodadas, não os cálculos.

A marca EM aprovada foi aplicada ao menu e rodapé, com SVGs de fundo claro/escuro, favicon, ícones de atalho Android/iOS e manifesto. Os arquivos e metadados foram conferidos no build para a raiz e para `/esports-manager`; as duas imagens da marca carregaram no site publicado. A instalação de atalhos em aparelhos físicos permanece pendente.

## Verificações concluídas

| Verificação | Evidência |
| --- | --- |
| Testes automatizados | 76 aprovados; 0 falhas; nenhum ignorado |
| TypeScript estrito | `tsc --noEmit` concluído |
| Build estática na raiz | Concluída |
| Build em `/esports-manager` | Concluída |
| Arquivos estáticos referenciados | Encontrados na raiz e no subcaminho; worker emitido |
| Lote exploratório da versão final | 1.080 mapas; 0 erros de execução |
| Novas seeds após congelar a política | 270 mapas; 0 erros de execução |
| Rodadas desses dois lotes | 29.693 |
| Casos anteriores de prorrogação longa | Quatro repetidos com mesma seed/composição/lado/plano |
| Chrome no ambiente de verificação | Elenco, preparação, rodada, partida completa, relatório e recarga exercitados no site publicado |
| Arquivo de avaliação de Chrome Android | Exportação e diagnóstico recebidos; integridade, reprodução e economia conferidas |
| Compatibilidade completa em celular / outros navegadores | Pendente; exportação de um aparelho não substitui a avaliação visual e de todas as interações |
| GitHub Actions na conta do usuário | Testes, TypeScript, build e deploy concluídos com sucesso nas publicações da aplicação e da marca |
| Identidade visual | SVGs, imagens carregadas, manifesto e referências de ícones verificados; instalação em aparelhos não exercitada |

Os testes automatizados de IndexedDB usam `fake-indexeddb`. O protocolo do worker é exercitado em `worker_threads` com adaptação da interface de mensagens. O fluxo de navegador citado acima acrescenta uso real de IndexedDB e Web Worker no ambiente de verificação; a matriz de compatibilidade em aparelhos continua incompleta. Os testes nativos anteriores das 32 habilidades continuam incluídos. Os lotes de simulação não foram reexecutados para esta atualização exclusivamente documental.

## Evidências posteriores à preparação do pacote

- Publicação inicial: commit `d1932756e37aeae4419bfa8e435bbdc934ff9764`; [workflow 39688311712, tentativa 2](https://github.com/lordyask/esports-manager/actions/runs/39688311712), concluído com sucesso.
- Marca aprovada e ícones: commit `9815c64305a13ec912c892a1f70ae6530dc2cc74`; [workflow 39691526627](https://github.com/lordyask/esports-manager/actions/runs/39691526627), concluído com sucesso.
- Navegador do ambiente de verificação: elenco de cinco jogadores, salário 7.500, Pátio contra atributos 60; partida concluída em 17 rodadas, placar 4–13. O relatório e o progresso permaneceram após recarga.
- Arquivos fornecidos para avaliação: salvamento e diagnóstico da mesma partida, motor 0.3.0/regras `gdd-1.3`, Pátio contra atributos 45; placar 13–2 em 15 rodadas. Todas as rodadas e o estado final foram reproduzidos exatamente com as decisões registradas. Perfis, nomes, compras e resultado conferiram; o diagnóstico não continha erro.
- Na avaliação do salvamento, a contabilidade foi calculada também de forma independente: gastos totais 177.580/166.800, nenhum saldo negativo, limite de 12.000 respeitado e reinício de 1.000 antes da rodada 13. Salário total 9.300 de 12.000.
- O caso de avaliação registrou dez primeiras mortes para um jogador definido como Second Entry. A causa não foi isolada: o uso de IDs como critério de desempate e as políticas incompletas por função são hipóteses de contribuição a investigar, não uma atribuição causal demonstrada.

Os dados acima são resumos de verificação. Salvamentos, diagnóstico bruto, metadados do navegador e dados pessoais dos avaliadores não são incluídos no repositório público. Uma partida reproduzível não demonstra equilíbrio, causa de vitória ou desempenho geral do aparelho. O tempo de última rodada zero no diagnóstico não é uma medição de desempenho válida.

## Revisão da IA

Foram corrigidos: avanço impedido por contato em outra rota, travessia indiscriminada sob contato na própria rota, espera de controle no meio e ordem de distribuição da pressão dividida. Execução rápida usa a conexão direta quando disponível; controle prepara o meio; pressão dividida distribui trajetos. O IGL escolhido pelo usuário participa das chamadas de controle, com os mesmos atributos e sem bônus duplicado.

Isso muda decisões e trajetórias. **Não demonstra ganho global de equilíbrio.** A versão final ainda apresenta cenários extremos, e a taxa do ataque no Enlace piorou na comparação controlada com a versão anterior. A interface informa que o cenário precisa de calibração. Não foram alterados coeficientes aprovados para aproximar taxas de 50%.

### Comparação com as mesmas seeds

Composição fixa: Estalo, Farol, Bruma, Trava e Bastião em ambas as equipes; oito atributos 60; mesmas condições, compras e planos de cada célula; lado inicial alternado. As duas versões receberam os mesmos 270 mapas de referência (cinco pares por combinação).

| Cenário | Ataque venceu rodadas no motor 0.2.0 | Ataque venceu rodadas no motor 0.3.0 |
| --- | ---: | ---: |
| Pátio | 72,8% | 73,9% |
| Horizonte | 62,9% | 62,2% |
| Enlace | 45,4% | 22,8% |

A comparação mede alteração de comportamento sob estas condições; não estabelece a estratégia ideal para usuários. O lote antigo de 1.080 mapas do motor 0.2.0 variava composição entre grupos e não foi usado como comparação causal.

### Lote final e verificação adicional

O lote exploratório final contém vinte pares por combinação: 1.080 mapas. Suas seeds foram consultadas durante o desenvolvimento; não são uma validação cega. Após congelar a política, foram executados mais cinco pares inéditos por combinação: 270 mapas. São 27 combinações de cenário/ataque/defesa em cada lote.

| Cenário | Lote exploratório final: taxa do ataque | Novas seeds: taxa do ataque |
| --- | ---: | ---: |
| Pátio | 75,6% | 75,4% |
| Horizonte | 60,9% | 59,9% |
| Enlace | 22,2% | 22,7% |

No lote de 1.080: mediana de 23 rodadas e máximo de 54. Nas 270 novas seeds: máximo de 38. Nenhum desses dois lotes exigiu mais de 200 rodadas. Foram usadas naturalmente as 20 habilidades da composição fixa; isso não é avaliação competitiva dos oito agentes.

As rodadas de uma mesma partida não são observações independentes; cinco pares por célula na verificação adicional deixam incerteza alta. Os mesmos planos são usados nos dois lados de cada comparação espelhada. Não há validação de todas as combinações de elencos/condições.

### Regressões de prorrogação

Mesmas quatro seeds problemáticas do lote anterior, composição Ímpeto/Farol/Véu/Trava/Bastião e ataque Controle. Vitória continua exigindo dois de vantagem após um par de lados.

| Seed | Defesa | Rodadas antes | Rodadas agora |
| --- | --- | ---: | ---: |
| 20261028 | aggressive | 366 | 24 |
| 20261031 | aggressive | 230 | 128 |
| 20261025 | balanced | 248 | 92 |
| 20261032 | balanced | 218 | 50 |

Os quatro casos concluíram, mas partidas de 128 e 92 rodadas continuam longas. Há uma pendência real de equilíbrio, especialmente com outras composições. O limite computacional de 2.000 usado nesses diagnósticos não é uma regra de vitória e não foi incorporado como limite do campeonato.

## Pendências e limites relevantes

1. Completar `docs/CHECKLIST_BETA.md`, especialmente avaliação visual no celular, duas abas, importação/restauração, acessibilidade e falha de armazenamento. O fluxo principal e a recarga já foram exercitados no ambiente de verificação.
2. Revisar o equilíbrio do Enlace e a relação entre rotas, visão abstrata e coordenação. Mudanças nos coeficientes ou regras aprovados exigem proposta separada com evidências.
3. As responsabilidades de Entry/Second/Support/Anchor/Lurker são indicações visíveis; políticas específicas completas por função continuam pendentes. IGL e preparação Main OP já têm ligação com o motor.
4. O modelo continua com cinco setores, sem distância interna, ângulos ou cobertura física. Alvos empatados ainda usam ID. Isso pode introduzir vieses.
5. A carreira completa, progressão de moral entre partidas, evolução/potencial, calendário, campeonato e folha salarial em operação não estão conectados. As condições dos testes são explícitas e fixas.
6. “Pausar sequência” interrompe o avanço automático; ainda não implementa a pausa tática com efeito na moral.
7. Preparar migração de saves antes de atualizar o motor. Nesta versão, formatos incompatíveis são rejeitados, sem migração automática.
8. Consolidar os feedbacks dos avaliadores e definir o escopo do Beta 1.1 com o autor. A publicação do Beta 1.0 já foi concluída; nenhuma funcionalidade nova do Beta 1.1 está aprovada neste registro.

O Beta 1.0 permite avaliar o fluxo da partida e localizar problemas. Não é uma declaração de homologação completa de dispositivos ou equilíbrio competitivo.

## Reproduzir

Node.js 24 LTS: `npm ci`, `npm test`, `npm run typecheck`, `npm run build`. Teste exploratório: `npm run benchmark:controlled`. Novas seeds: `node scripts/controlled.ts --holdout`. Regressões antigas: `node scripts/overtime-regressions.ts`.

Evidências em `validation/`: TAP, TypeScript, logs de build, conferência dos arquivos estáticos, mapas dos lotes, comparação histórica e regressões de prorrogação. O histórico anterior está no Git bundle incluído no pacote.

Identificação da política final (`src/ai.ts`, SHA-256): `a71b698f52ef02317793fe668d3fbc8ff594e24d0d338522b0a209ca8a2b21b6`.
