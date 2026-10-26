# Beta 1.1.1 — correção do fluxo de treinamento

Data: 26/10/2026. O autor aprovou T01–T05 e autorizou corrigir, testar e publicar, incluindo a verificação do modo de atributos.

## Diagnóstico e aplicação

O componente TrainingPanel mantinha foco, atributo e agentes em useState local. Ao trocar de aba o componente era desmontado e perdia as escolhas ainda não confirmadas. A falha afetava ambos os modos, sem perda do XP já confirmado.

- T01: estado controlado pelo workspace e gravado em IndexedDB a cada alteração; ambos os modos são preservados, inclusive no recarregamento e na exportação.
- T02: nome, responsabilidade, indicação de IGL, agente escalado (ou sugerido quando ainda não escalado), classe e familiaridade atual na ficha.
- T03: detalhes locais com oito atributos e oito familiaridades atuais, incluindo evolução confirmada.
- T04: agente treinado independente do agente escalado. Treinar outro agente não troca a composição.
- T05: estado de salvamento das escolhas separado da confirmação da sessão e resumo de foco/ganhos/XP restantes após confirmar.

O treino continua coletivo, opcional e limitado a uma sessão por partida completa. Rascunhos não concedem XP, não consomem sessões e não modificam os custos. Confirmação, pular treino e preparar uma nova partida encerram o rascunho anterior. Alterar titulares mantém escolhas por ID, removendo as de quem saiu.

## Compatibilidade

Motor 0.4.1, regras `gdd-1.3+b11-rc1`, schema 2 e banco `esports-manager-beta-1.1` mantidos. A nova propriedade trainingPreparation é opcional e validada ao abrir/importar; arquivos do Beta 1.1 sem ela continuam legíveis. A versão da interface, exportação e diagnóstico passa a 1.1.1. O banco Beta 1.0 permanece preservado. Nenhuma alteração em src/, preços, fórmula de XP ou balanceamento.

## Validação

- 103 testes automatizados aprovados, incluindo sete regressões novas.
- Persistência real com fake-indexeddb: atributo Disciplina, troca para agentes individuais, retorno ao atributo e recarga sem consumo de treino/XP.
- Treino de agente independente da escalação e dos atributos; escolhas vinculadas à identidade após mudança de titulares.
- Leitura de save 1.1; rejeição de foco/atributo/agente inválidos.
- Confirmação do atributo salvo uma única vez após recarga; próxima partida libera nova oportunidade sem perder evolução.
- TypeScript e builds estáticos na raiz e no caminho `/esports-manager`.
- As 1.176 partidas do Beta 1.1 são evidência histórica do motor sem alterações, não um novo lote executado nesta correção.

## Publicação

Autorizada. Aguardar conclusão de build/deploy do GitHub Actions e conferir os dois modos no endereço público antes de anunciar como concluída. O navegador de teste não alcança o localhost do executor; a conferência visual será realizada no Pages após o deploy. Android físico permanece sem homologação nesta sessão.
