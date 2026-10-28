# Beta 1.3 RC1 — candidata em validação, sem lançamento

Atualizado em 28/10/2026. O autor autorizou aplicar e testar as propostas para receber um parecer antes de publicar. A branch `review/beta-1.3` contém a candidata; `main` e o site público continuam no Beta 1.1.1. Não mesclar nem acionar o workflow Pages sem autorização posterior.

## Implementado

- H13-01 a H13-07: histórico de até 20 partidas concluídas, lista, consulta de rodadas/planos/compras, perfis históricos, exportação JSON por partida ou completa, CSV por jogadores/rodadas, exclusão explícita e importação com deduplicação. Migração da sessão atual concluída e da anterior disponíveis, sem inventar datas antigas. Partidas antigas já substituídas precisam de seus arquivos exportados.
- Ao atingir 20 entradas, iniciar outra partida é bloqueado até liberar espaço. Não ocorre exclusão automática. Importar histórico durante uma partida reserva uma vaga para seu resultado. Excluir a partida atual do histórico não apaga a sessão atual; isso é explicado na confirmação.
- S13-01/02: código aleatório criptográfico gerado ao criar a partida; evita códigos já presentes no histórico e o anterior. Recarga não sorteia novamente. Campo manual removido da preparação, código preservado no relatório/exportação. Reprodução técnica continua possível com os perfis e comandos exportados.
- B13-03: confirmação da dificuldade antes de iniciar; cancelar não cria sessão.
- B13-04: análise factual por partida, até duas prioridades coletivas, pontos positivos e uma sugestão individual quando os critérios a sustentam. Comparações de atributos são oportunidades de desenvolvimento, não causalidade demonstrada. Economia reconstruída pelos registros, sem simular o combate novamente. Lado inicial corrigido no relatório.
- B13-05/06: coletivo ou individual, uma oportunidade compartilhada, individual 2× XP somente ao titular escolhido; preservação das escolhas; valor atual, XP e estimativa de sessões até +1. Limites e custos mantidos.
- Clareza da sequência: botão explicita a próxima pausa; informa repetição de planos e uso de compras manuais/automáticas; preferência de compras salva.

Não há previsão de vitória pré-jogo. Preços, dificuldades 45/60/75, combate e política de compra automática não foram alterados. R13-01 continua uma investigação separada; a aprovação mais recente priorizou histórico e sementes. Não há estatísticas acumuladas de carreira.

## Compatibilidade e armazenamento

Motor 0.4.1 e regras `gdd-1.3+b11-rc1` preservados. Novo save schema 3, que aceita leitura do schema 2. O schema antigo não entende recibos individuais nem garante preservar o histórico: um save 1.3 não deve ser reimportado no 1.1.1. Banco IndexedDB mantido; falha de importação preserva o progresso existente. Importação de histórico mescla apenas partidas; importação de progresso completo solicita confirmação de substituição.

Limite de arquivo/checkpoint: 64 MiB, com erro antes da gravação se ultrapassado. O limite não garante a quota disponível no navegador. Armazenamento continua local; exportar é a forma de backup. Datas novas são horários do dispositivo; datas ausentes em arquivos antigos permanecem desconhecidas.

## Evidências locais

| Verificação | Resultado |
| --- | --- |
| Testes automatizados | 113 aprovados, zero falhas (103 anteriores e 10 novos) |
| Grade de treino | 768 combinações; 9.159 sessões; 22 combinações individuais interrompidas ao atingir limite, conforme regra |
| Estimativa de evolução | Previsão até +1 conferida contra sessões executadas; conservação de XP e isolamento do titular conferidos |
| Partidas sintéticas | 72: 3 mapas × 3 dificuldades × 4 códigos × 2 lados; todas encerradas até 30 rodadas, placares consistentes |
| Capacidade | 20 cópias sintéticas com IDs distintos, 13 rodadas cada; save de 5.374.503 bytes; exportação/importação preservou os dados |
| TypeScript e build Pages | Aprovados; 25 pacotes JS; manifesto, ícones e Worker conferidos |

Grade e resultados em `scripts/beta13-validation.ts` e `validation/beta13/rc1-validation.json`. Estes lotes não comprovam equilíbrio global nem desempenho em Android físico. Testes de capacidade usam uma composição/partida repetida para testar volume e integridade, não 20 partidas independentes.

## Validação de interface e parecer

O navegador local não pôde ser instalado: o download retornou arquivo inválido. Foi preparado o workflow `beta13-review.yml`, sem tarefa de publicação, para executar Chromium em servidor local isolado no runner, nas larguras 1280 e 390. Ele exercita migração de save, troca/recarga dos modos de treino, cancelamento de início, compras automáticas, partida completa, histórico, JSON/CSV, exclusão, reimportação e duplicatas. As capturas e resultados são artefatos de teste, não um site publicado.

Estado nesta revisão: testes locais aprovados; execução de interface no GitHub ainda pendente. Não declarar a candidata pronta para publicação antes de conferir o resultado. Android físico, iOS/Safari e acessibilidade completa continuam sem homologação.
