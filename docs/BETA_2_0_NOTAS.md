# NEXUS — Beta 2.0 · RC1

Versão candidata preparada em 13/11/2026. Identificador de distribuição: `2.0.0-rc.1`. Motor: `0.5.1`. Regras: `nexus-2.0-reworks-r1`. Saves: schema 6. A identificação do produto é independente da versão do motor.

## Novidades

- Identidade Tactical Premium UI, com menus, painéis, indicadores e recursos visuais oficiais da NEXUS.
- Artes dos oito agentes no catálogo, na Preparação e no Treinamento. As miniaturas distinguem jogador, agente escalado e foco do treino. Cards e artes completas podem ser ampliados.
- Doca e Cume integrados, com cinco setores e oito conexões em cada mapa. Coberturas desenhadas continuam visuais; a simulação opera por setores.
- Calendário de 28 dias e uma oportunidade diária de treino individual ou coletivo. Avançar o calendário não treina automaticamente; oportunidades puladas são perdidas.
- Circuito de oito equipes: a organização do jogador e sete adversários, com 28 confrontos, classificação, desempates, contratos, despesas e premiação. Adversários mantêm atributos fixos neste beta.
- Prisma substitui Véu nas campanhas novas. Reworks de Prisma e Bastião integrados ao motor; IA coordena neutralização de dispositivos e respeita interrupções.
- Reiniciar carreira mantém a identidade da organização e preserva histórico concluído e campanha no Acervo. Reiniciar organização também redefine nome, sigla, cor e escudo.
- Partidas e resultados salvos por rodada, histórico, análise e exportação. Acervo mantém arquivos antigos em consulta e exportação, com suas regras originais.

## Correções incluídas no fechamento

- Preparação abre antes de consumir a sessão de treino.
- Rótulos de função IGL deixam de aparecer vazios.
- Navegação e importação aguardam a leitura inicial do salvamento.
- O laboratório direciona para treinar ou pular o treino antes de iniciar uma partida; a carreira preserva a confirmação para encerrar a oportunidade do dia.
- Miniatura e identificação do agente voltam à disposição correta no campo de escalação.
- Cabeçalho, rodapé, título da página, manifesto, exportações e diagnóstico identificam a mesma candidata Beta 2.0 · RC1.

## Saves e limites

Leia [BETA_2_0_SAVES.md](BETA_2_0_SAVES.md) antes de importar ou reiniciar. Saves de Beta 1.x e do motor 0.5.0 ficam no Acervo, sem continuar uma campanha ativa nas regras novas. Saves do desenvolvimento 0.5.1/schema 6 com a mesma revisão mecânica continuam compatíveis.

O progresso é local ao navegador e ao endereço de origem; não existe conta ou sincronização online. Exporte um backup antes de trocar de dispositivo, navegador ou limpar seus dados. Limites atuais: arquivo de até 64 MB e até 20 partidas no histórico ativo; o circuito preserva os próprios resultados.

O equilíbrio será ajustado gradualmente durante o Beta 2.0. A limitação ofensiva observada em composições com Lurker no lugar de Second continua em acompanhamento. Uma amostra de integração não certifica equilíbrio global.

Esta candidata não publica o jogo. O workflow `beta20-candidate.yml` valida testes, saves, circuito e exportações na raiz e no caminho do GitHub Pages. O workflow público `pages.yml` continua separado, acionado por `main` ou manualmente. Android físico, Safari e sincronização entre dispositivos não são certificados por esses testes.
