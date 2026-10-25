# Checklist de avaliação — Beta 1.0

Atualizado em 24/10/2026. O site está publicado. Este checklist registra o alcance
das verificações concluídas e o trabalho ainda pendente; não é uma homologação
completa do aplicativo.

## Como interpretar os registros

- `[x] Navegador`: observado no Chrome do ambiente de verificação, no site publicado.
- `[x] Auditoria`: conferido no salvamento/diagnóstico de avaliação e/ou sua reprodução;
  não comprova a aparência ou todos os controles do aparelho.
- `[x] Build`: arquivos e referências conferidos na exportação estática.
- `[ ]`: verificação manual ainda não concluída ou sem evidência suficiente.

Testes automatizados não marcam automaticamente um item manual como concluído.
A exportação recebida de Chrome Android também não conclui o checklist visual do
celular. Registrar aparelho, sistema, navegador e passos nas próximas avaliações.

## Organização e elenco

- [ ] Alterar organização/sigla/cor/escudo, salvar e recuperar todos os campos pela interface.
- [ ] Filtrar candidatos, ordenar por salário/potencial e expandir os oito atributos.
- [x] Navegador: selecionar cinco candidatos e observar o bloqueio dos demais botões de seleção.
- [x] Navegador/Auditoria: elenco dentro do teto; soma de 7.500 no teste do navegador e 9.300 no arquivo avaliado.
- [ ] Montar um elenco acima de 12.000 e confirmar que a preparação fica bloqueada.
- [ ] Selecionar Norte, Risco, Pingo, Nimbo e Cedro: salário total 11.900.
- [ ] Avaliar a clareza da distinção entre potencial e força atual na tela.

## Preparação

- [x] Navegador: cinco agentes diferentes e IGL exibidos; seguir à partida com a composição válida.
- [ ] Conferir na interface todas as familiaridades 85/65/45/10 e alterar responsabilidades/IGL.
- [ ] Repetir um agente e verificar o bloqueio ao iniciar a partida.
- [ ] Montar uma composição sem uma das quatro classes e verificar aviso sem bloqueio extra.
- [ ] Alterar cenário e código reproduzível pela interface e conferir a partida iniciada.
- [x] Auditoria: decisões táticas diferentes entre rodadas constam do arquivo e são reproduzíveis.
- [x] Navegador: adversário de atributos 60 explicitamente identificado como sintético.

## Economia e partida

- [x] Navegador: abertura da primeira metade com 1.000 créditos por jogador.
- [ ] Desligar o assistente e combinar Eco, Semi e Forte entre os cinco pela interface.
- [x] Navegador: previsão de compra, saldo e aviso de kit parcial exibidos.
- [x] Auditoria: gastos não ultrapassam os saldos, nenhum crédito negativo e teto de 12.000 respeitado no arquivo avaliado.
- [x] Navegador: jogar uma rodada e conferir acontecimentos e estatísticas.
- [ ] Clicar duas vezes rapidamente no comando e confirmar um único avanço.
- [x] Navegador: simular sequência em ritmo acelerado até o encerramento da partida.
- [ ] Pausar uma sequência em andamento, revisar o plano e continuar.
- [x] Auditoria: reinício para 1.000 por jogador antes da rodada 13 e troca de lados.
- [ ] Conferir pela interface o kit da prorrogação e a vitória por dois após o par de lados.
- [ ] Repetir decisões com o mesmo código em ritmos diferentes e comparar os resultados no navegador.

## Persistência

- [x] Navegador: recarregar após a partida salva e recuperar o mesmo relatório/placar de 17 rodadas.
- [ ] Recarregar durante uma partida em andamento e continuar da rodada salva.
- [ ] Abrir duas abas, avançar na primeira e tentar gravar na segunda; conferir conflito e recarga.
- [x] Auditoria: exportação de progresso e diagnóstico de Chrome Android recebidos e válidos; contêm a mesma partida.
- [ ] Exportar, iniciar novo teste e importar; conferir elenco, placar, créditos e relatório na interface.
- [ ] Importar arquivo incompatível/corrompido e conferir rejeição sem perda do progresso atual.
- [ ] Verificar controles de importação/exportação da tela inicial em celular.
- [ ] Simular falha de armazenamento e conferir mensagem sem anunciar salvamento concluído.

## Relatório e apresentação

- [x] Navegador: partida concluída em 17 rodadas, placar 4–13, vencedor e relatório exibidos.
- [x] Auditoria: partida de avaliação de 15 rodadas, placar 13–2; resultados e estado final reproduzidos exatamente.
- [x] Auditoria: estatísticas e gastos conferidos com eventos e recibos do arquivo avaliado.
- [ ] Verificar rolagem da tabela em tela estreita, menus, textos e botões em aparelho físico.
- [ ] Verificar navegação por teclado e foco visível em computador.
- [x] Auditoria: diagnóstico identifica motor 0.3.0, cenário e código; arquivo recebido sem mensagem de erro.
- [ ] Reproduzir falha real e verificar se seu diagnóstico oferece informação suficiente.

## Publicação e marca

- [x] Navegador: acessar o site público no endereço informado pelo deploy.
- [x] GitHub: workflows da publicação inicial e da marca concluídos com sucesso.
- [x] Navegador: logos do menu/rodapé carregadas e ausência de excesso de largura na janela observada.
- [x] Build: imagens, links de favicon, ícone Apple e manifesto funcionam na raiz e em `/esports-manager`.
- [x] Navegador: referências de favicon/manifesto usam o subcaminho correto no site publicado.
- [ ] Adicionar atalho e conferir ícone/nome/apresentação em Android físico.
- [ ] Adicionar atalho e conferir ícone/nome/apresentação em iPhone físico.
- [ ] Completar a matriz de navegadores e aparelhos, incluindo acessibilidade e desempenho.

## Evidências e registro de problemas

Evidências detalhadas e workflows estão em [VALIDACAO_BETA.md](../VALIDACAO_BETA.md).
O estado de desenvolvimento e as pendências de produto estão em
[REGISTRO_PROJETO.md](REGISTRO_PROJETO.md).

Para novos problemas, registrar: versão; aparelho/navegador; passos; esperado;
ocorrido; frequência; diagnóstico quando pertinente. Não publicar arquivos
brutos com dados dos avaliadores no repositório aberto.

Classificação: bloqueador (não abre/não salva/perde progresso), alto (regra ou
resultado inconsistente), médio (interação/informação prejudicada), baixo
(aparência/texto). A liberação de uma atualização exige avaliar os problemas
relevantes ao seu escopo; os casos ainda pendentes não devem ser descritos como
verificados apenas por haver publicação ou testes de código aprovados.
