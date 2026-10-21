# Publicar o Beta pelo GitHub Pages

## Antes de publicar

Este é um candidato de teste. Conclua o checklist manual; a verificação visual não foi possível no ambiente de desenvolvimento. Não há publicação feita nesta entrega.

A combinação GitHub Free + Pages exige repositório público. Assim, o código e os parâmetros do jogo ficarão públicos. Guarde apenas código fictício e arquivos de desenvolvimento; não envie credenciais, arquivos pessoais ou salvamentos de avaliadores.

## Pelo repositório

1. Crie ou escolha um repositório público na sua conta. Sugestão de nome: `esports-manager`. A escolha do nome não é obrigatória: o workflow usa o caminho real.
2. Extraia o pacote de código. Envie o conteúdo da pasta `codigo/` para a raiz do repositório, incluindo `package.json`, `package-lock.json`, `app/`, `lib/`, `src/`, `data/`, `test/`, `scripts/`, `.github/` e os arquivos de configuração. Não envie só o ZIP nem coloque `codigo/` como uma pasta extra na raiz.
3. Use a branch `main`. Se o repositório usa outro nome, ajuste `branches: [main]` em `.github/workflows/pages.yml`.
4. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
5. Em **Actions**, selecione **Verificar e publicar Beta** e execute **Run workflow**, ou envie um commit para `main`.
6. Espere as etapas `build` e `deploy` concluírem. Se falhar, abra a etapa em vermelho e copie a mensagem para investigação; não ignore os testes.
7. O próprio workflow/Settings Pages exibirá o endereço publicado. Abra esse endereço em computador e celular e conclua o checklist.

A pasta `.github` é parte essencial da entrega. Se a interface de upload não a incluir, use GitHub Desktop ou Git para enviar o projeto completo.

## Com Git, para quem já usa

Dentro da raiz do código extraído, use o endereço real do repositório criado. Não digite senhas ou tokens em arquivos do projeto.

```bash
git init -b main
git add .
git commit -m "Prepare Esports Manager Beta 1.0 RC1"
git remote add origin ENDERECO_REAL_DO_REPOSITORIO
git push -u origin main
```

Para manter o histórico original, o pacote inclui um Git bundle separado. Restaure com `git clone source-history.bundle esports-manager`, entre na pasta e use a branch `beta/github-pages`. Crie/atualize `main` com o conteúdo da versão revisada antes de publicar. O bundle não contém `node_modules` nem as builds estáticas.

## Como o caminho é tratado

O workflow usa `actions/configure-pages` e transmite `base_path` para `PAGES_BASE_PATH`. Isso atende tanto o endereço principal de usuário quanto um site em `/nome-do-repositorio/`. O build é estático; o Pages não executa uma API Node.js.

O diretório `site-estatico/` do pacote é uma exportação para a raiz de um servidor HTTP. É útil para inspeção local, mas o workflow deve gerar a publicação novamente para o caminho do repositório real.

## Atualizações e salvamentos

Cada commit na branch configurada refaz as verificações e publica a nova versão. Antes de atualizar o motor, exporte os saves de teste: esta entrega não migra formatos incompatíveis. Se o domínio/caminho de origem mudar, o banco local anterior não acompanhará o site automaticamente; use exportação/importação quando as versões forem compatíveis.

Não envie arquivos de progresso ou diagnóstico ao repositório público. Eles devem ser compartilhados separadamente, quando necessário para reproduzir um problema.

## Referências verificadas

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://nextjs.org/docs/app/guides/static-exports
