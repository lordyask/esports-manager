# Contato e recuperação na execução rápida

Conclusão do caso já registrado com semente 7, Doca V2, ataque A com execução rápida para o ponto A e distribuição defensiva 2 A / 2 B / 1 meio. Os dez jogadores têm atributos e equipamentos equivalentes; não há cargas de habilidades. Os tempos abaixo incluem os cinco segundos de preparação. Como o registro anterior não conservava posições e ações do ataque, uma reprodução pontual acrescentou esses estados, sem repetir a bateria.

| Tempo | Observação |
| --- | --- |
| 12,25 s | Os cinco atacantes chegam ao Corredor A e ficam em recuperação até 13,25 s. |
| 13,00 s | Primeiro contato: o ataque está no Corredor A; os defensores B0, B2 e B4 estão atravessando da Galeria A para o ponto, a 80% da conexão. A visão passa pela exposição junto ao ponto A, não por visão automática entre corredor e galeria. B4 foi designado ao meio e passa por A; há cinco atacantes contra três defensores presentes. |
| 13,00 s | O ataque vê os três defensores, mas sua IA e seus disparos automáticos aguardam a recuperação. Os defensores em movimento veem os cinco atacantes e podem adquirir alvo e disparar em deslocamento, com intervalo dobrado. B0 já adquire um alvo; sua travessia termina antes de o disparo ocorrer. Não há habilidades disponíveis neste cenário. |
| 13,25 s | Termina a recuperação do ataque; os atacantes começam a avançar pelo Corredor A em direção ao ponto e podem disparar durante a travessia. |
| 13,50–14,50 s | B0, B2 e B4 chegam ao ponto e entram em recuperação de um segundo. Os disparos automáticos e as decisões da IA desses jogadores aguardam; o disparo que B0 havia preparado em movimento é cancelado. |
| 14,25 s | Os atacantes disparam durante o deslocamento; B2 e B4 recebem dano na proteção. A recuperação da defesa ainda não terminou. |
| 14,50–15,00 s | A defesa fica pronta aos 14,50 s e seus primeiros disparos ocorrem aos 15,00 s, após o intervalo da arma. |
| 16,25 s | Primeira eliminação: B2 é eliminado por A3. |

A janela sem resposta defensiva resulta da mesma regra de recuperação aplicada aos dois lados em momentos diferentes, da possibilidade existente de disparar durante a travessia e da concentração de cinco atacantes contra três defensores presentes. Os atacantes também ficaram sem disparar na própria recuperação. O caso não demonstra um bônus por lado nem uma falha na aplicação da recuperação **aos disparos automáticos**; tampouco prova que a distribuição 2–2–1 ou os tempos estejam equilibrados em geral.

## Inconsistência independente: comandos diretos

Na revisão anterior à correção, cópias isoladas mostraram que a IA decidia aguardar quando `ready` era falso, mas `TacticalRound.issue` aceitava um comando direto de movimento durante a recuperação: A0 aos 13,00 s, pronto somente aos 13,25 s; e B0 aos 13,50 s, pronto somente aos 14,50 s. O caminho de comandos agendados também chama `issue`.

Essa falha é simétrica e **não causou** a sequência automática descrita: nela não foram usados comandos diretos. Os disparos continuam sujeitos a `readyAt`. O uso demonstrado é pela API interna/roteiro de simulação; não foi identificado um controle da interface que envie esse comando durante o round.

Na candidata `dev.4`, `issue` recusa somente novos comandos de movimento da Doca V2 enquanto `now < readyAt`, antes de qualquer cancelamento ou mutação; em `readyAt`, o comando segue às validações normais. A regra vale para os dois times, inclusive durante a organização na preparação. Espera, habilidades e objetivos mantêm suas validações existentes; o tempo de recuperação não mudou.

A identidade mecânica distingue essa correção. Uma partida 0.6.1 já iniciada mantém a regra anterior de movimento até terminar; novas partidas usam a validação nova. Os testes verificam, para ambos os times e lados, recusa sem efeitos antes do prazo, aceitação exatamente no prazo e depois, destinos inválidos ou bloqueados, comandos agendados, preservação de ações e a preparação.

A reprodução e as duas sondagens estão em [`scripts/trace-fast-entry.ts`](../scripts/trace-fast-entry.ts) e [`validation/defensive-occupation/fast-entry-trace.json`](../validation/defensive-occupation/fast-entry-trace.json). Execute `node scripts/trace-fast-entry.ts` na raiz do repositório para reproduzir a evidência **da revisão anterior**, explicitamente selecionada pelo script.
