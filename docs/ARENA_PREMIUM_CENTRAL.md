# Arena Premium — Central de Comando

A branch visual parte de `codex/doca-v2-spatial` no commit `b4ed5dd`. O pacote aprovado foi conferido com `git apply --check` e aplicado sem substituir as versões atuais dos arquivos da aplicação. A alteração de `beta.tsx` troca somente o componente da central; `layout.tsx` carrega o CSS isolado. O cenário de Doca é decorativo e não altera o mapa da simulação.

A central usa o monograma e as fontes locais existentes, a arte oficial do agente selecionado e os dados do workspace. O destaque acompanha partida ativa, processamento pendente, próximo jogo ou estado inicial. O treino e os atalhos usam os destinos e bloqueios anteriores. O gráfico mostra resultados do ciclo atual; sem carreira ativa, usa o histórico concluído disponível. Sem dados de atleta, agente ou resultados, os painéis apresentam estados vazios. O atleta é identificado por iniciais, sem retrato inventado.

Em relação à referência, os nomes, números, placares e caixa são os dados da carreira carregada; não se usa o conteúdo demonstrativo da imagem. No celular, os painéis se empilham para preservar leitura e controles. O diálogo de habilidades lista os dados oficiais do jogo e o perfil exibe os atributos treinados.

## Verificação

- `npm run typecheck`, `PAGES_BASE_PATH=/esports-manager npm run build` e `npm test`.
- Chromium local em 1920×1080, 1280×900, 768×900, 390×844 e 360×800. Foram conferidos carregamento dos assets e das fontes em `/esports-manager`, ausência de overflow horizontal e dimensões dos painéis.
- Navegação, foco visível por teclado, diálogos de agente e atleta com Enter/Escape e retorno de foco, preferência de movimento reduzido, troca de atleta e suas informações reais.
- Estados sem elenco, histórico sem carreira, nome longo, treino encerrado, partida em andamento e processamento de NPCs pendente; conferência de destinos e bloqueios. Os testes usam saves sintéticos gerados pela lógica existente e verificam que a consulta não altera seus bytes.

Para reproduzir, com Node 24, dependências instaladas, Chromium e Playwright disponíveis:

```bash
node scripts/arena-command-fixtures.ts
PAGES_BASE_PATH=/esports-manager npm run build
node scripts/validate-arena-command.mjs
```

As capturas em [`validation/arena-premium/screenshots`](../validation/arena-premium/screenshots) usam exclusivamente a carreira sintética de teste, não um save do usuário. Os dados de cenário e os resultados do navegador estão em [`browser-results.json`](../validation/arena-premium/browser-results.json). A verificação móvel usa viewport do Chromium e não substitui testes em Android físico ou Safari/iOS. Esta etapa não faz merge nem publicação.
