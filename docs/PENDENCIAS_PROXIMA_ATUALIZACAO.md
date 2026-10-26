# Pendências para a próxima atualização

Registro iniciado em 26/10/2026, após o lançamento do Beta 1.1.1.

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
