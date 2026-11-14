# NEXUS — Base visual do Beta 2.0

Atualizado em 12/11/2026. Aplicação de desenvolvimento, sem publicação.

## Autoridade

As decisões IV-01 a IV-04 registradas no Brand Guidelines regem a identidade. O monograma oficial é o N fornecido pelo autor. Estudos com X não o substituem. A autorização desta etapa é finalizar a base visual, preservando o Beta 1.3 público. Medidas, raios e espaçamentos desta implementação são escolhas técnicas de aplicação, não novas decisões canônicas.

## Marca e tipografia

- Monograma original copiado sem redesenho para `public/brand/nexus-monogram.png`.
- Assinatura de interface com N e nome NEXUS; descrição Esports Manager subordinada. Slogan principal: Connect. Dominate. Ascend.
- Fontes locais Orbitron 500/600/700 e Exo 2 400/500/600/700 via `next/font/local`. Os arquivos e as licenças SIL Open Font License estão em `app/fonts/`. O navegador não precisa consultar Google Fonts.
- Fonte dos arquivos: Google Fonts, famílias Exo 2 e Orbitron. Licenças obtidas do repositório oficial google/fonts, diretórios `ofl/exo2` e `ofl/orbitron`.
- Ícones de navegador e instalação exportados do monograma original; manifesto e metadados usam NEXUS. A aparência em aparelhos físicos continua sujeita a conferência própria.

## Paleta e controles

| Token | Cor | Uso |
|---|---|---|
| Fundo | `#0B0B0D` | Deep Black |
| Painel | `#1A1C20` | Charcoal |
| Prata | `#C0C2C6` | Conteúdo, bordas e identidade |
| Ação | `#B8945A` | Primário e item ativo |
| Interação | `#0087C8` | Foco e realces contidos |

Tonalidades derivadas por opacidade e um texto claro de apoio servem à legibilidade, sem criar outra cor principal. `--accent` é fixo na marca; `--team-accent` recebe a personalização da organização e só colore escudos e elementos da equipe. Primários não mudam ao trocar a cor da organização.

Primários dourados, secundários grafite/prata, foco ciano e estado pressionado perceptível. Desabilitados permanecem nativamente bloqueados e distinguíveis; o calendário explica seus impedimentos. Excluir histórico e reiniciar organização têm borda tracejada e rótulo explícito; as confirmações existentes foram preservadas. A atualização da cor também responde ao evento `input`, evitando atraso na prévia.

## Navegação e hierarquia

Sidebar desktop expandida com ícone e texto, recolhida com ícones e nomes acessíveis. A preferência é local ao navegador. No celular, botão de abrir/fechar e grade de itens, fechada após navegar. O item ativo usa dourado e `aria-current`.

Cabeçalho mostra contexto, dia do ciclo quando existente, organização, salvamento e preferências. Não apresenta temporada, caixa ou recursos ainda não implementados. Preferências reúne redução de movimento e acesso a exportação/importação; o diálogo nativo permite Escape e contém o foco enquanto aberto.

O dashboard destaca o próximo adversário e o mapa quando há calendário. Painéis e cartões existentes recebem superfícies, tipografia e densidade comuns. Painel premium prioriza o confronto; dados usam tratamento de tabela; formulários destacam foco; jogadores mantêm seus dados e seleção existentes. A aplicação completa de perfis premium, cinco famílias de componentes e broadcast cinematográfico permanece para o acabamento de telas.

## Acessibilidade e responsividade

Link para pular ao conteúdo, ícones com nomes nos controles, foco visível e respeito a `prefers-reduced-motion`. A opção local pode reduzir movimentos mesmo sem preferência no sistema, sem mudar o ritmo ou resultado da simulação.

Quadros de conferência de 320, 390, 768, 960 e 1280 px permitem verificar os media queries reais da página. Esse método não equivale a aparelho físico ou emulação completa de toque/Safari. Tabelas densas têm rolagem própria. Em telas estreitas, o placar fica acima das duas equipes para preservar leitura dos nomes.

## Limites desta entrega

Base visual aplicada. Motor, XP, calendário, perfis NPC, finanças e formato dos saves não foram alterados por esta etapa. Circuito financeiro, artes finais de todos os agentes, perfil premium completo, broadcast final e homologação ampla de acessibilidade continuam em seus pacotes próprios. Nenhum push ou deploy faz parte desta entrega.

## Registro histórico

### Acabamento do modelo A — 12/11/2026

O painel aprovado Tactical Premium UI (modelo A) orienta o acabamento em `app/tactical-premium.css`. Os itens ativos e botões primários receberam gradiente dourado e profundidade discreta; cabeçalho, painéis e controles receberam superfícies grafite e bordas metálicas contidas. Isso concretiza a direção aprovada e não altera a paleta principal.

O início agora usa `HomeDashboard`, com cenário decorativo de arena em WebP e o N original sobreposto como arquivo separado, sem redesenho. A arte de cenário foi gerada para esta aplicação: não representa um mapa, campeonato ou ambiente jogável. Adversário, mapa, dia, placar e disponibilidade de treinamento vêm do estado existente. Não há moeda, prêmio, temporada ou competição fictícia importada da referência.

O CSS adapta o banner, cartões e navegação para telas estreitas. Nesta revisão, a conferência visual em navegador ficou pendente pelo bloqueio anterior da infraestrutura de prévia. As conferências de viewport documentadas na revisão anterior não homologam este acabamento. Consulte `BETA_2_0_MODELO_A.md` para o resultado técnico desta entrega.

A identidade EM verde, aprovada em outubro, continua documentada no histórico Git e descreve as versões públicas anteriores. Nesta branch de desenvolvimento, as assinaturas SVG antigas sem uso foram substituídas pela marca NEXUS. O arquivo raster original não é declarado um mestre vetorial nem uma nova variante flat aprovada.
