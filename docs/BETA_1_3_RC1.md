# Beta 1.3 — validação e lançamento

Atualizado em 29/10/2026. Após o parecer de validação, o autor autorizou expressamente: “Aprovado pode fazer o lançamento do beta 1.3”. Essa autorização substitui a restrição anterior de não publicar. Rótulos oficializados como Beta 1.3; publicação pelo Pages concluída e conferida. A validação da candidata RC1 está preservada abaixo.

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

Limite de arquivo/checkpoint: 64 MiB, com erro antes da gravação se ultrapassado. O limite não garante a quota disponível no navegador. Armazenamento continua local; exportar é a forma de backup. Reiniciar a organização preserva o histórico concluído; excluir partidas exige ação explícita. Datas novas são horários do dispositivo; datas ausentes em arquivos antigos permanecem desconhecidas.

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

Validação final concluída: [workflow 40720519242](https://github.com/lordyask/esports-manager/actions/runs/40720519242), commit funcional `2290301373e751f4595beb56b6f1db1457e37805`, terminou com sucesso em 28/10/2026. Incluiu 113 testes, TypeScript, grade de treino/partidas, build e os dois fluxos de Chromium, em 1280×900 e 390×844.

O fluxo desktop confirmou treino individual de atributo; o fluxo móvel confirmou treino individual de agente. Ambos preservaram alvo/foco ao navegar e recarregar, impediram nova confirmação, respeitaram cancelamento de início, salvaram compras automáticas, concluíram uma partida, geraram novo código, exportaram JSON e os dois CSVs, excluíram/recarregaram/reimportaram sem duplicação. Reiniciar a organização preservou as duas partidas do histórico. Não houve erro de página nem excesso horizontal nas telas verificadas. Capturas de treino e histórico foram inspecionadas; resultados duráveis em `validation/beta13/browser-results.json`. O artefato de capturas do workflow tem retenção de 14 dias.

As duas referências privadas dos níveis médio e experiente também foram importadas pela candidata, reexportadas e reabertas sem modificar suas sessões. A análise das sessões atuais identificou equipamento e aberturas como fatores observados. Essa conferência não refez o lote de balanceamento e não publicou arquivos privados.

Durante a validação, o teste foi ajustado para reconhecer os rótulos completos dos campos e aguardar o salvamento assíncrono da caixa de compras. A proteção de reinício foi ampliada para preservar o histórico concluído. Não houve mudança dos coeficientes de combate.

**Parecer: apta a publicação como Beta experimental, sem bloqueadores encontrados no escopo aprovado.** Nenhum ajuste adicional de design é exigido por esta rodada de testes. Android físico, iOS/Safari, acessibilidade completa e equilíbrio global permanecem sem homologação; a emulação de tela móvel não os substitui. A alteração de política econômica R13-01 permanece fora desta candidata.

**Lançamento autorizado pelo autor.** Integração em `main` e publicação pelo Pages autorizadas. A oficialização altera somente rótulos de versão e documentação; motor, regras e parâmetros validados permanecem iguais. Deploy concluído; recibo abaixo.

## Publicação confirmada — 29/10/2026

- Lançamento expressamente autorizado pelo autor após aprovação do parecer.
- Código funcional publicado: `33ed9e3a1bf4638461c1d1d7661c6c14ff90ac88`; candidato validado integrado em `main` por avanço direto, preservando sua ancestralidade.
- [Workflow de publicação](https://github.com/lordyask/esports-manager/actions/runs/40809888123): testes (113 aprovados), TypeScript, build e deploy concluídos com sucesso.
- Conferência no site público: título e identificação visual **Beta 1.3**, navegação até **Histórico de partidas**, capacidade de 20 partidas e controles de importação/exportação. Perfil de QA sem partidas armazenadas; esta conferência não afirma migrar um save real do usuário.
- [Comprovante visual](../validation/beta13/release-live.jpg). Validação funcional completa desktop/móvel da candidata permanece no workflow 40720519242.
- Sem erros da aplicação nos logs consultados. Mensagens da extensão do navegador não pertencem ao jogo.
- Rótulos e versão de exportação oficializados; motor 0.4.1, regras e balanceamento preservados. Android físico, iOS/Safari e acessibilidade completa continuam sem homologação.
