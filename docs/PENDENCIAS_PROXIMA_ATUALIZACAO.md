# Pendências para a próxima atualização

28/10/2026: histórico e sementes aprovados para aplicação/testes; H01/H02 e exportação por partida de H03 agora têm implementação candidata no [Beta 1.3 RC1](BETA_1_3_RC1.md). H04 e a mudança da política de compras continuam fora da candidata. A lista abaixo preserva o registro anterior das discussões.

Registro iniciado em 26/10/2026, após o lançamento do Beta 1.1.1.

Revisão de 27/10: consulte [REVISAO_BETA_1_3.md](REVISAO_BETA_1_3.md) para os testes executados, a falha limitada de identificação de lado no relatório e as propostas R13-01 a R13-04. Nenhum lançamento autorizado. As propostas adicionais continuam dependentes de decisão.

Atualização de 27/10/2026: o [escopo do Beta 1.3](BETA_1_3_ESCOPO.md) registra a aprovação de B13-03/04/05/06, com análise pós-partida e treinamento coletivo ou individual. B13-01/02 foram adiados. Essa decisão não aprova automaticamente os itens H/M abaixo nem autoriza um novo lançamento.

O autor decidiu adiar o histórico de partidas e reunir as pendências para uma revisão conjunta. A decisão autoriza registrar os itens, sem implementar nem publicar funcionalidades agora. A versão, o desenho final e a ordem de implementação serão definidos na revisão.

| Código | Item registrado | Estado |
| --- | --- | --- |
| H01 | Histórico de partidas concluídas com placar, cenário e elenco | Adiado para revisão da próxima atualização |
| H02 | Consultar o relatório de cada partida do histórico | Adiado para revisão da próxima atualização |
| H03 | Exportar uma ou várias partidas em JSON e CSV para análise | Adiado para revisão da próxima atualização |
| H04 | Estatísticas acumuladas por jogador e equipe | Adiado para revisão da próxima atualização |

## Situação atual confirmada

O Beta 1.1.1 guarda a sessão atual, uma sessão anterior em `previous` e, se importado, um relatório histórico do Beta 1.0. Preparar a próxima partida substitui `previous`; não existe uma coleção de todas as partidas. Exportar progresso/partida baixa o workspace em JSON, não um CSV de estatísticas. O armazenamento é local neste navegador.

Até existir o histórico, exportar cada partida concluída e guardar os arquivos com nomes diferentes permite preservar os dados para análise posterior.

## Próxima revisão

Receber e analisar as partidas que o autor pretende enviar. Separar fatos dos arquivos, limitações de informação e hipóteses de ajuste. Registrar novos problemas com evidências antes de definir soluções. Não declarar resultados de partidas ainda não recebidas nem atribuir causas sem os acontecimentos registrados.

Na revisão do histórico, ainda será necessário definir retenção/volume de dados, tratamento de duplicatas e partidas antigas, inclusão de partidas incompletas nos agregados e campos da exportação. Essas questões não têm solução aprovada neste registro.

## Revisão de partidas inteiramente automáticas — 26/10/2026

Orientação do autor: usar como referências de partidas somente as duas sessões atuais dos arquivos enviados, nos níveis médio e experiente. Excluir `previous` e qualquer partida fácil da amostra de referência. Repetições e testes controlados são diagnósticos separados, sem aumentar artificialmente o número de partidas observadas. Os arquivos privados de usuários não devem ser publicados no repositório.

| Código | Pendência a avaliar | Critério para a próxima revisão |
| --- | --- | --- |
| M01 | Planejamento de compra automática em sequências de derrotas | Comparar a política atual com decisões que reservem recursos para um Forte futuro; conferir perdas, conservação, compartilhamento e explicações do Semi repetido. Não mudar preços sem aprovação. |
| M02 | Calibração dos níveis de adversário | Comparar atributos 45/60/75 com elencos legais de teto 12.000, diferentes códigos, planos, mapas e lados. Distinguir correção de cálculo de adequação da dificuldade. |
| M03 | Comportamento de funções e primeiras baixas | Investigar interação do Lurker com rotas, visibilidade inicial, foco de alvos e instrução de trades. Mudança de função em um teste não demonstra sozinha que essa função precisa ser removida. |
| M04 | Partida nova versus reprodução do mesmo teste | Tornar claro que repetir elenco, condições, planos e código reproduz o resultado. Avaliar códigos novos para partidas novas, preservando opção explícita de reprodução. |
| M05 | Explicação das decisões automáticas | Mostrar plano efetivamente usado, razão da compra e diferença entre kit solicitado e disponível, com evidência registrada da rodada. |
| M06 | Dependência do lado inicial e do ponto no Pátio | Testar pares com os mesmos códigos e elencos, invertendo o lado inicial ou o ponto de ataque; revisar rotas, posicionamento e visibilidade inicial antes de atribuir toda a diferença à dificuldade. |

Estado: pendências de investigação e design para revisão conjunta; nenhum ajuste de motor, economia ou dificuldade aprovado ou publicado por este registro.
