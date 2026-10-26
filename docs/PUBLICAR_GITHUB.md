# Publicação e manutenção — GitHub Pages

Atualizado em 26/10/2026. O lançamento do Beta 1.1 foi autorizado pelo autor; acompanhar o workflow de publicação até sua conclusão.

## Ambiente ativo

- Site: https://lordyask.github.io/esports-manager/
- Código: https://github.com/lordyask/esports-manager
- Branch: `main`.
- Pages: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
- Workflow: `.github/workflows/pages.yml`, **Verificar e publicar Beta**.
- Aplicação estática com persistência local; sem API Node.js hospedada no Pages.

A publicação inicial parou porque o Pages não estava habilitado. Depois da
ativação pelo autor, a tentativa 2 do [workflow inicial](https://github.com/lordyask/esports-manager/actions/runs/39688311712)
concluiu testes, TypeScript, build e deploy. A atualização da marca também passou
pelo [workflow seguinte](https://github.com/lordyask/esports-manager/actions/runs/39691526627).
Não é necessário criar outro repositório ou reenviar o pacote inicial.

## Atualizar a aplicação existente

1. Preparar e revisar as alterações com o escopo autorizado pelo autor.
2. Executar os testes e verificações adequados. Para código da aplicação, o fluxo
   existente exige `npm test`, `npm run typecheck` e `npm run build`.
3. Conferir o caminho de projeto com `PAGES_BASE_PATH=/esports-manager npm run build`
   quando houver mudança de configuração, metadados ou arquivos públicos.
4. Concluir os itens aplicáveis do [checklist](CHECKLIST_BETA.md), mantendo clara
   a diferença entre testes em código, navegador e aparelhos físicos.
5. Somente quando o lançamento estiver autorizado, enviar o código à `main`:
   commits comuns nessa branch disparam a publicação automática.
6. Acompanhar **Actions → Verificar e publicar Beta**. `build` e `deploy` devem
   concluir com sucesso. Se falhar, investigar a etapa correspondente.
7. Abrir o endereço do site e verificar a alteração publicada e o progresso salvo.

L01, L02 e L03 do Beta 1.1 foram aprovadas em 26/10/2026. O autor autorizou oficializar e publicar a atualização. A preparação foi validada com 96 testes e 1.176 partidas; a integração em `main` executa os testes e o deploy.
Para o registro exclusivamente documental, usa-se mensagem de commit com
`[skip ci]` para evitar republicar a aplicação pelo workflow de push.

## Caminhos, ícones e arquivos estáticos

O workflow usa `actions/configure-pages` e transmite `base_path` para
`PAGES_BASE_PATH`. O build usa esse valor para o subcaminho da aplicação, as
imagens da marca, os links de favicon e o manifesto de atalho. A configuração
expõe o mesmo valor ao código cliente por `NEXT_PUBLIC_BASE_PATH`.

Os arquivos finais do build ficam em `out/`, e o workflow envia esse diretório.
O Pages não recebe `node_modules` nem executa o servidor de desenvolvimento.
A identidade visual está em `public/brand/`, com favicon e ícone Apple na raiz
pública. Consulte [IDENTIDADE_VISUAL.md](IDENTIDADE_VISUAL.md).

## Novas instalações e pacote histórico

Estas instruções só se aplicam a uma cópia nova ou restauração:

1. Escolher um repositório e habilitar o Pages para GitHub Actions conforme o
   ambiente da conta. O projeto atual utiliza um repositório público.
2. Enviar os fontes à raiz, incluindo `.github/`, `app/`, `lib/`, `src/`, `public/`,
   `data/`, `test/`, `scripts/`, `package.json`, lockfile e configurações.
3. Usar `main`, ou adaptar o gatilho do workflow à branch escolhida.
4. Executar o workflow e confirmar o endereço efetivamente informado pelo deploy.

O ZIP RC1 e seu Git bundle são fotografias da entrega anterior à publicação e
à marca. Sua documentação reflete aquele momento. Para continuar o projeto,
preferir os fontes e os registros atuais do repositório; não restaurar o pacote
antigo sobre a versão publicada sem revisão. Não enviar o ZIP como se fosse o site.

## Salvamentos

Antes de mudar a versão do motor, definir a compatibilidade/migração e preservar
os saves. O Beta 1.1 mantém o banco 1.0 intacto e oferece baixar seu backup original na visão geral. A importação explícita traz a organização com XP zero e preserva o relatório antigo; a partida antiga não continua no motor novo. Arquivos internos de ensaio 0.4.0 não são migrados silenciosamente.
O mesmo site usa um progresso local por origem; mudar navegador ou domínio não
transfere esse progresso. Exportação/importação atende versões compatíveis.

O repositório é público. Salvamentos e diagnósticos dos avaliadores são
compartilhados separadamente para análise; não anexá-los ao código ou ao histórico
público. Nunca incluir credenciais ou arquivos pessoais.
