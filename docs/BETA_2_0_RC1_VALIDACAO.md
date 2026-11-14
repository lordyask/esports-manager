# Beta 2.0 · RC1 — Candidata e validação

**Registro histórico:** a situação remota descrita abaixo é a de 13/11/2026. Em 14/11, a candidata do ZIP foi enviada no commit [`be1d525`](https://github.com/lordyask/esports-manager/commit/be1d5251c6f71c21b4fce6115a2bbbe06721258e), com [validação concluída com sucesso no GitHub Actions](https://github.com/lordyask/esports-manager/actions/runs/43633150076).

Preparada em 13/11/2026, identificador `2.0.0-rc.1`. Branch de destino: `release/beta-2.0-rc1`, sem merge em `main` ou deploy público. Os resultados do GitHub Actions devem ser conferidos no commit exato dessa branch; executar localmente não equivale a aprovação remota.

## Fechamento local

As correções da revisão anterior estão incluídas: acesso à Preparação antes do treino, rótulos IGL, bloqueio de navegação na leitura inicial, botão correto para o treino no laboratório e disposição flexível da identidade do agente. Cabeçalho, rodapé, página, manifesto, save, histórico exportado e diagnóstico usam a identificação comum da candidata em `lib/release.ts`. Versões históricas no Acervo conservam sua identificação original.

Motor 0.5.1, revisão mecânica, schema 6, catálogos e artes foram preservados. O campo de identificação do produto não participa do checksum do conteúdo nem altera a compatibilidade de uma campanha com as mesmas regras. Três regressões adicionais verificam retomada de checkpoint de desenvolvimento, gravação atômica, Acervo do Beta 1.3 e leitura de histórico anterior sem o campo opcional de versão.

## Evidências locais desta candidata

| Verificação | Resultado |
| --- | --- |
| Suíte automatizada | 193 testes, zero falhas |
| TypeScript e exportações | Raiz e `/esports-manager`, com manifesto, recursos e worker |
| Identificação distribuída | Título, manifesto e bundle com RC1; sem página temporária de QA |
| Artes | 24 arquivos, dimensões e hashes; 14 estados estáticos por caminho |
| Reworks | 120 rodadas controladas, 120 comparações antigas e reexecuções com ordem invertida |
| Circuito | 6 campanhas, 168 partidas, 3.221 rodadas; dois elencos e três rotinas de treino |
| Persistência de circuito | Dia 28, classificação, prêmio único, contratos, caixa, histórico cheio e leitura após salvar |
| Adversários | Hash preservado, sem treino ou evolução automática |

## Conferência pelo navegador

A conexão da prévia foi recuperada nesta etapa. As pendências da conferência anterior foram retomadas, com uma organização sintética NEXUS QA / NQA.

- O save do desenvolvimento retomou a rodada 2 com o mesmo código. A sequência automática pausou no intervalo e terminou em 13–2. Relatório, Histórico e Circuito exibiram o resultado, com os três jogos dos adversários concluídos. Finanças mostraram os contratos e lançamentos correspondentes.
- Cancelar e Escape fecharam o diálogo sem reiniciar. Confirmar reiniciou a carreira, manteve a identidade e guardou os quatro jogos concluídos da rodada no Acervo. O backup exportado foi reimportado e restaurou o histórico de 13–2.
- Preparação voltou a abrir antes de treinar, o botão “Ir para o treinamento” abriu a sessão correta e as cinco identidades de agentes apresentaram `display:flex` com imagens carregadas. O rótulo IGL apareceu no recrutamento.
- Os oito cards carregaram ao expandir; Bruma manteve 1672 × 941 e Trava 1086 × 1448, com encaixe sem corte. A ampliação de Bruma abriu o arquivo original em nova aba.
- Conferência em iframe de 390 × 844 pixels CSS: menu abre, fecha e recolhe ao navegar. Preparação, Calendário, Circuito, Finanças e Agentes mantiveram largura de documento 375, dentro da área de 390. Tabelas grandes têm rolagem própria; preferências e reinício cabem na área vertical. Foco de teclado apresentou contorno e Escape fechou o diálogo.
- Não foram observados erros de aplicação entre os registros capturados do endereço da prévia. Registros da extensão do ambiente foram separados dessa verificação.

Os resultados legíveis por máquina estão em `validation/rc1/`. A captura desktop desta etapa mostra a candidata com a correção de escalação aplicada. A página temporária de largura móvel foi removida antes dos builds.

## GitHub e publicação

O workflow `.github/workflows/beta20-candidate.yml` executa a suíte, validação mecânica, circuitos completos, painéis estáticos e duas exportações. Possui somente permissão de leitura do repositório e de envio dos artefatos de validação; não contém etapa de publicação. Os logs e artefatos do run identificado na entrega final são a evidência remota.

Os resultados locais registrados acima são a referência preparada para comparação com o Actions, não uma previsão de sucesso remoto. Uma falha no Actions deve ser resolvida e a candidata novamente conferida no novo commit.

O workflow `pages.yml` continua separado. `main` permanece no Beta 1.3 até que seja autorizada a publicação. Antes de lançar, conferir notas, instruções de backup e o commit validado; após publicar, conferir carregamento, recursos, worker e salvamento no endereço público.

## Limites conhecidos

A revisão em iframe comprova o layout CSS nessa largura; não certifica Android físico, toque ou Safari. O fechamento de dia 28 e partidas completas em Cume foram exercitados na matriz técnica, enquanto o confronto finalizado pela interface foi em Doca. Uma tentativa de screenshot recortado excedeu o tempo; a captura normal foi usada. Os arquivos antigos continuam somente em consulta e exportação, conforme [as instruções de saves](BETA_2_0_SAVES.md). Balanceamento global não é um requisito concluído por esta amostra e seguirá gradual durante o beta.

## Situação remota desta entrega

**A validação final no GitHub ainda não foi executada.** A branch remota `release/beta-2.0-rc1` foi criada a partir de `42cdbe6dd19dda0cf20c3c85814d3d35ea46e2fd`, mas permanece nesse ponto; o commit da candidata ainda não foi associado à branch. Alguns arquivos binários foram preparados como objetos Git antes da interrupção, sem formar uma versão completa revisável na branch.

A revisão automática rejeitou o envio de `public/agents/pulso-keyart.webp`, afirmando que faltava autorização explícita para compartilhar essa arte externamente em um repositório público. A propriedade do destino e seu caráter público foram conferidos, assim como a natureza fictícia da arte. A revisão manteve o bloqueio após essa verificação; novas tentativas foram interrompidas.

Para concluir, é necessária autorização explícita de Yask para disponibilizar os arquivos visuais da candidata — artes dos oito agentes, mapas Doca/Cume, marca NEXUS, ícones e fontes incluídas — no repositório público `lordyask/esports-manager`. Isso torna os arquivos acessíveis no código do GitHub, mesmo mantendo o site do jogo sem lançamento. Após a autorização: terminar o envio, conferir a igualdade do conteúdo remoto com a candidata local, executar o Actions e registrar os resultados. O pacote completo para revisão foi preservado em arquivo ZIP; `main` e o Beta 1.3 continuam inalterados.
