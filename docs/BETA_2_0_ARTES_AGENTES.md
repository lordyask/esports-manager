# NEXUS — Integração das artes dos agentes no Beta 2.0

**13/11/2026 · v1.0 · Desenvolvimento, sem publicação.**

## Resultado e decisão de escopo

Os oito agentes têm artes integradas no produto: Estalo, Ímpeto, Farol, Pulso, Bruma, Prisma, Trava e Bastião. Foram usados os cards e key arts finais guardados nas pastas oficiais de cada agente no Drive. Não foram geradas novas versões dos personagens.

**Decisão de Yask nesta etapa:** os ajustes de equilíbrio seguirão gradualmente durante o Beta 2.0. A calibração global deixa de ser uma condição geral para iniciar a estreia. Os achados anteriores, incluindo a vulnerabilidade ofensiva da formação com Lurker no lugar de Second, permanecem registrados para acompanhamento. Bugs que travem o fluxo, corrompam progresso ou impeçam usar as telas ainda exigem correção antes da publicação.

Branch: `development/beta-2.0-agent-art`. Base: `f5d62d0c6a8e4c009e88648846133ca8c1ec83e8`. Motor **0.5.1**, regras `nexus-2.0-reworks-r1`, política de IA `tactical-r3` e **schema 6**, preservados. Esta integração visual não exige reiniciar uma carreira compatível nem cria nova migração.

## Onde as imagens aparecem

| Tela | Entrega |
|---|---|
| Agentes | Key art dos oito agentes, card oficial expansível e links para ampliar as duas peças em nova aba |
| Preparação | Imagem do agente escalado junto ao seletor; nomes dos atletas, familiaridade, responsabilidade e IGL preservados |
| Treinamento de atributo | Imagem do agente escalado |
| Treinamento de agente | Imagem do agente escolhido como foco do treino, sem trocar automaticamente a escalação |

As regras das quatro habilidades, limitações e familiaridades continuam disponíveis como texto HTML. O atleta **Prisma, J11**, permanece distinto da agente Prisma: sua sugestão inicial continua Farol, com a imagem correspondente. Avatares e nomes dos atletas não foram substituídos pela identidade dos agentes.

## Arquivos aprovados utilizados

Cada agente recebeu card, key art e uma prévia leve. O tamanho abaixo é o do card no produto; as proporções particulares de cada original foram mantidas.

| Agente | Classe na apresentação | Card em pixels | Fontes oficiais |
|---|---|---:|---|
| Estalo | Duelista | 1122 × 1402 | [Card](https://drive.google.com/file/d/1XE-CJ-hOtaz86W9Irree3eVl-CmpXBEA/view?usp=drivesdk) · [Key art](https://drive.google.com/file/d/19dsI_7V3RH_pUqdxwdyIJ8F4G-ctlQkr/view?usp=drivesdk) |
| Ímpeto | Duelista | 1122 × 1402 | [Card](https://drive.google.com/file/d/1OjtzxDQO7KypZjziEA-FEiTNwCb3Qc7-/view?usp=drivesdk) · [Key art](https://drive.google.com/file/d/1wsBZtyQN0yhoi8oTFGukWgJb5dFohG9k/view?usp=drivesdk) |
| Farol | Iniciadora | 1122 × 1402 | [Card](https://drive.google.com/file/d/1ocJRkd_76j71pDrY5c2U8G_YDvs8oIC8/view?usp=drivesdk) · [Key art](https://drive.google.com/file/d/1BoFQ0vp-VTDMtSLdWDkhwlg_s6agXU7s/view?usp=drivesdk) |
| Pulso | Iniciador | 1122 × 1402 | [Card](https://drive.google.com/file/d/1FxeDYLFaD0-efxSd2-7wW_0Ywfbh4SR5/view?usp=drivesdk) · [Key art](https://drive.google.com/file/d/1QS98zBJPiUl9e3yoe4adkxPEQG1canRi/view?usp=drivesdk) |
| Bruma | Controladora | 1672 × 941 | [Card](https://drive.google.com/file/d/1wTpZWqAfqHkHAJ0dHppoU_VojtXSgUv1/view?usp=drivesdk) · [Key art](https://drive.google.com/file/d/14Mciol78Mpiig5yOpvX1skmDz81CKIiu/view?usp=drivesdk) |
| Prisma | Controladora | 1122 × 1402 | [Card](https://drive.google.com/file/d/1OwBkr2rBW2Ltlde1G_abhtgXKzrLandp/view) · [Key art](https://drive.google.com/file/d/1Lc4SXniTINbo4v5aa7IBxaUcMw5rG6lj/view?usp=drivesdk) |
| Trava | Sentinela | 1086 × 1448 | [Card](https://drive.google.com/file/d/1iqWOqhsJ4vn3HHLOukwZSqVj0vhznHSH/view?usp=drivesdk) · [Key art](https://drive.google.com/file/d/1rOHoReVKRdlR07RURRRW-eQ8abhRV-7X/view?usp=drivesdk) |
| Bastião | Sentinela | 1122 × 1402 | [Card](https://drive.google.com/file/d/1xhZIUYhmlHrvm1V8TnNY8IxmJgjPQSCS/view) · [Key art](https://drive.google.com/file/d/12LXxBKQits_hfCQihKgUMoAWOQjQOdpc/view?usp=drivesdk) |

Os registros visuais de Pulso e Bruma também foram consultados. A key art de Bruma é a peça aprovada apesar das pequenas variações já reconhecidas no seu registro; não substitui a prancha de referência como base para novas criações. Nesta etapa não houve reinterpretação de rosto, máscara, roupa, anatomia ou cores.

## Fidelidade, leitura e desempenho

- As 16 peças aprovadas foram vinculadas nominalmente aos oito agentes. Nomes das 32 habilidades conferidos com o catálogo ativo.
- Imagens completas, sem corte do enquadramento ou deformação. O card horizontal de Bruma e o card vertical de Trava usam suas próprias dimensões, em vez de uma proporção fixa aplicada a todos.
- WebP para o produto, com carregamento adiado, decodificação assíncrona, dimensões explícitas e prévias menores. Os PNGs originais continuam no Drive.
- Cards completos mantêm sua resolução original. Key arts grandes foram reduzidas proporcionalmente, no máximo a 1.200 × 1.800; prévias usam no máximo 480 × 640. Conversão com perdas controladas: qualidade 90 nos arquivos principais novos e 86 nas prévias.
- Os dois cards WebP já integrados de Prisma/Bastião foram mantidos byte a byte; não houve recompressão desses arquivos.
- A paleta das personagens permanece dentro das imagens. Superfícies, botões, fontes e navegação seguem a identidade Tactical Premium UI aprovada, com base grafite, destaque dourado e interação ciano comedida.
- Textos alternativos, rótulos para os seletores e links de ampliação identificam cada agente. As cores e o texto embutido na imagem não são a única fonte de informação.

**24 imagens no produto**, incluindo as prévias. Originais consultados: 38.373.210 bytes. Arquivos WebP do produto: **4.863.904 bytes, cerca de 4,64 MiB**. As prévias e o carregamento adiado evitam solicitar necessariamente todo esse conjunto ao abrir a página inicial. Esses números medem os arquivos, não tempo de carregamento em rede móvel.

### Texto artístico e regra de partida

As artes aprovadas contêm descrições conceituais. A interface mantém o efeito mecânico em texto separado e informa que as regras das partidas devem ser consultadas abaixo do card. Por exemplo, Marca de Farol rastreia um alvo detectado sem criar bônus novo de dano; Salto tático de Ímpeto mantém seu efeito de posicionamento; Laço de Trava continua detectando/atrasando, sem transformar a descrição artística em uma nova imobilização. A integração não modifica habilidades para reproduzir literalmente ilustrações ou textos promocionais.

As classes visuais respeitam Iniciadora para Farol e Controladora para Bruma/Prisma. As quatro categorias de filtro e todos os vínculos mecânicos permanecem preservados.

## Validação executada

| Conferência | Resultado |
|---|---|
| Suíte automatizada existente, executada novamente | **190/190 testes passaram** |
| TypeScript | Sem erros |
| Estados React das artes/preparação/treino | **14 estados**, conferidos na raiz e com `/esports-manager` |
| Regressão estática de agentes/reinício/acervo | 5 estados anteriores aprovados |
| Arquivos de imagem | **24** decodificados; dimensões e proporções verificadas |
| Integridade dos assets | Hashes e caminhos conferidos na origem local e nas duas exportações |
| Builds estáticos | Raiz e `/esports-manager` aprovados |
| Marca, manifesto e worker | Referências da exportação conferidas nas duas bases |
| Mecânica, cadastros e saves | Implementação anterior preservada byte a byte nos arquivos relacionados |
| Navegador e Android físico | Conferência interativa ainda pendente |

A inspeção dos originais confirmou identidade, nomes das habilidades, classe, enquadramento e diferenças de proporção. Os checks React verificaram catálogo com oito agentes, 32 nomes de habilidades, associação dos arquivos, preparação bloqueada com os 15 controles desabilitados, mudança de imagem ao fornecer outra escalação, separação entre o atleta Prisma e a agente Prisma e seleção visual do foco de treino sem mutar o progresso.

A renderização estática não executa cliques, foco, teclado, abertura real das imagens, download ou cálculos de layout no navegador. Não foram certificados visualmente computador/celular nem feita medição de velocidade. O impedimento anterior da prévia não foi contornado. Nenhuma nova simulação de balanceamento foi necessária para esta alteração de apresentação; as evidências anteriores permanecem identificadas na sua entrega original.

## Evidências e reprodução

- Registro usado pela interface: `data/agent-art.json` e `lib/agent-art.ts`.
- Componentes: `app/agent-art.tsx`, `app/assignment-cards.tsx` e integração em `app/beta-panels.tsx` / `app/beta.tsx`.
- Proveniência dos originais, hashes e exportações: `validation/agent-art/sources.json`.
- Preservação da mecânica/proporções: `validation/agent-art/preservation.json`.
- Resultados: `tests.tap`, `panels-root.json`, `panels-subpath.json`, `assets-source.json`, `assets-root.json`, `assets-subpath.json` e logs em `validation/agent-art/`.

Com Node 24+ e `npm ci`:

```bash
npm test
npm run typecheck
node scripts/check-agent-art.ts
node validation/agent-art/check-panels.mjs
NEXT_PUBLIC_BASE_PATH=/esports-manager node validation/agent-art/check-panels.mjs
npm run build
node scripts/check-export.ts
node scripts/check-agent-art.ts --export
PAGES_BASE_PATH=/esports-manager npm run build
PAGES_BASE_PATH=/esports-manager node scripts/check-export.ts
PAGES_BASE_PATH=/esports-manager node scripts/check-agent-art.ts --export
```

O workflow da integração visual valida esta branch e a candidata em PR sem publicar. O workflow de balanceamento fica disponível na sua branch própria e por execução manual; a bateria extensa de equilíbrio deixa de rodar automaticamente em toda PR de fechamento. A suíte funcional continua sendo conferida. Não houve push, merge ou execução remota nesta entrega.

## O que falta para publicar

A integração dos arquivos finais dos oito agentes está concluída no desenvolvimento. Restam a conferência visual/interativa da versão acumulada em computador e celular, correções dos problemas eventualmente encontrados, identificação/notas da candidata e publicação com conferência do endereço público. O equilíbrio seguirá em acompanhamento durante o Beta 2.0, conforme a decisão registrada acima.

O pacote de código é cumulativo e inclui mapas, calendário, circuito, finanças, reworks, correções de IA e reinício de carreira. O Beta 1.3 publicado permanece sem alterações nesta etapa.
