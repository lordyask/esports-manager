# Candidata Doca V2 — Como preservar e importar seu progresso

Este documento descreve a candidata de desenvolvimento com motor 0.6.1, ainda não publicada. A versão publicada pode ter comportamento diferente.

## Antes de atualizar

1. Abra a versão antiga no mesmo navegador em que jogou.
2. Use **Exportar progresso** e guarde o JSON original. Caso queira estatísticas separadas, exporte também o Histórico. CSV serve para consulta; não restaura uma carreira.
3. Mantenha esse backup mesmo depois de conferir a versão nova. Não edite o JSON e não apague os dados do navegador para atualizar.

## O que acontece com cada arquivo

| Arquivo | Comportamento na candidata Doca V2 |
| --- | --- |
| Beta 1.0 / motor 0.3.0 | Preservado no Acervo para consulta e exportação; partida antiga não continua nas regras novas |
| Beta 1.1 a 1.3 / motor 0.4.1 | Save validado e preservado no Acervo; sem transferência de XP, caixa, contratos ou resultados para a carreira atual |
| Desenvolvimento anterior / motor 0.5.0 | Campanha e acervo anterior preservados para consulta; sem continuação ativa sob 0.6.1 |
| Desenvolvimento 0.5.1, incluindo RC1 e Beta 2.0/schema 6 | Preservado no Acervo para consulta e exportação, sem continuar partida ou circuito no motor novo |
| Doca V2 anterior / motor 0.6.0 | Preservado no Acervo com os resultados e a regra de lados da época; partidas e circuitos em andamento não continuam automaticamente no motor novo |
| Histórico JSON do motor atual | Importa partidas concluídas sem substituir a campanha ou o treino atual; limite de 20 registros e deduplicação por partida |
| Arquivo incompatível, incompleto ou alterado | Importação recusada. Guarde o original; não há conversão genérica ou correção automática de arquivos |

Um salvamento local de motor anterior abre a tela de recuperação sem modificá-lo. Exporte o original; somente depois de confirmar a importação de outro save ou o reinício, o original é copiado para o Acervo, se o limite permitir. Não há transferência automática de elenco, identidade, XP, caixa ou contratos. O original conserva agentes, resultados e estado de partida da época.

## Importar explicitamente

Use **Importar progresso**, na lateral ou em **Preferências e dados**. Ao importar uma versão antiga, confirme a inclusão no Acervo: a campanha atual é mantida. Ao importar um save compatível do motor atual, a confirmação avisa que o progresso ativo será substituído; exporte o atual antes de aceitar.

O Acervo permite consultar e exportar o arquivo original. Ele não avança partidas, distribui XP nem paga novamente os prêmios antigos. Não misture resultados produzidos por motores diferentes. Um save do Beta 2.0 não deve ser importado no Beta 1.3.

## Reiniciar

**Reiniciar carreira** abre uma confirmação e permite exportar antes. Redefine campeonato, elenco, contratos, caixa, treinos, XP e partida ativa. Mantém nome, sigla, cor, escudo, histórico concluído e Acervo; a campanha reiniciada fica em consulta. **Reiniciar organização** também redefine os quatro campos de identidade. Cancelar ou pressionar Escape antes de confirmar não executa o reinício.

## Recuperação e cuidados

- Progresso local depende do navegador, perfil e origem do site. Uma prévia local não compartilha automaticamente os dados do GitHub Pages; use exportação/importação.
- Se houver aviso de arquivo inválido, exporte o original oferecido pela recuperação antes de iniciar outra carreira. Guardar um arquivo não validado no Acervo não torna seu conteúdo jogável.
- Se outra aba tiver salvado depois, o jogo recusa a gravação desatualizada. Recarregue a aba antes de tentar novamente.
- O limite é de 64 MB para o save completo, incluindo o Acervo. Para liberar espaço, exporte e remova somente os registros escolhidos; não há exclusão automática de backups arquivados.
- O resgate automático do banco muito antigo do Beta 1.0 depende do suporte do navegador. Caso não apareça, importe o backup JSON que você guardou.

Versão do produto e versão do save têm funções distintas: motor, regras e hash mecânico determinam se uma campanha pode continuar. Mesmo com schema 6, 0.6.0 e 0.6.1 são mecânicas diferentes: a nova regra troca os lados após seis rodadas. As sementes e os resultados antigos não são recalculados.
