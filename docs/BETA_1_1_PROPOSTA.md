# Beta 1.1 — Proposta para aprovação, revisão 0.1

Data: 25/10/2026. **Status: B11-01 a B11-14 aprovados pelo autor em 25/10/2026.**
Implementação autorizada em branch separada. Publicação depende de autorização posterior. O Beta 1.0 continua publicado.
Este documento formaliza e substitui o agrupamento preliminar B11-01–B11-07;
nenhum item daquele agrupamento havia recebido aprovação automática.

## Objetivo e quatro frentes

1. Ajuste: informações da rodada e momento de decisão entre rodadas.
2. Melhoria: estratégias específicas de ataque/defesa e combinações com efeito real.
3. Melhoria: compras acessíveis e economia individual compreensível.
4. Adição: treinamento persistente do elenco e catálogo de agentes disponíveis.

Os feedbacks do autor apontam dificuldade para escolher compras com o assistente
ativo, estratégias pouco variadas e explicações insuficientes para compreender
vitórias/derrotas. A interface atual inicia com o assistente de compras ligado e
bloqueia os seletores individuais nesse modo. O relato de sete vitórias seguidas
por derrotas não veio acompanhado do respectivo save; sua causa não foi identificada.

## Ajuste de informação

### B11-01 — Intervalo controlado pelo treinador

Após cada rodada, apresentar a análise e a preparação da próxima. O padrão será
uma rodada por confirmação: **Confirmar compras e jogar rodada**. Revisões são
possíveis até essa confirmação. Mostrar o plano e o gasto efetivamente confirmados.

A simulação automática será uma escolha explícita, com ação de pausa. Parar a
sequência na troca de lados e na entrada da prorrogação para apresentar as regras
e permitir revisão. Uma rodada já em cálculo termina e é salva antes da pausa.
Não permite modificar retroativamente uma decisão ou o resultado calculado.

### B11-02 — Cronologia compreensível da rodada

Mostrar plano inicial e acontecimentos com horários relativos: primeiro contato,
eliminações, trades, utilitários relevantes, vantagem numérica, plant/desarme e
fim. Usar um resumo legível e uma opção de detalhes, com histórico consultável das
rodadas da partida atual, em vez de limitar a análise à última rodada.

Durante a apresentação, usar informações disponíveis ao treinador. A leitura do
adversário na preparação seguinte deve vir do comportamento observado, sem mostrar
antecipadamente seu plano secreto ou resultados futuros. O pós-rodada pode oferecer
um relatório mais completo, claramente identificado.

### B11-03 — Análise baseada em fatos

Separar a condição objetiva de encerramento dos fatores observados. Exemplo:
"Derrota por desarme; a equipe perdeu dois jogadores sem trade e enfrentou a
retomada em inferioridade numérica". Destacar trocas de lado, economia, composição,
primeiro contato e execução do objetivo quando os eventos sustentarem a observação.

Não converter correlação em causa comprovada ou afirmar que uma estratégia era
errada somente porque perdeu. Não existe proposta de penalização por sequência
de vitórias nem de vencedor forçado. Moral variável não será usada para explicar
resultados enquanto esse sistema não estiver implementado.

## Melhoria de estratégias

### B11-04 — Catálogos separados pelo lado atual

Propor quatro planos de ataque e quatro de defesa. Na tela entre rodadas, exibir
somente os do lado em que a equipe joga. Após a troca, recuperar ou solicitar o
plano daquele lado. O catálogo inicial fica assim:

| Lado / plano | Objetivo | Atributos relevantes | Vulnerabilidade a avaliar |
| --- | --- | --- | --- |
| Ataque: Execução rápida | Pressionar um ponto com chegada coordenada | Movimentação, mira, utilitários | Contenção preparada |
| Ataque: Controle e leitura | Coletar informação e explorar exposição | Leitura, disciplina, comunicação | Consumo de tempo e defesa paciente |
| Ataque: Pressão dividida | Distribuir pressão e combinar entradas | Comunicação, posicionamento, movimentação | Isolamento e retomada coordenada |
| Ataque: Finta e rotação | Induzir uma resposta e mudar o foco | Leitura, comunicação, movimentação | Pressão que identifica a finta |
| Defesa: Contenção | Segurar entradas e atrasar o ataque | Posicionamento, disciplina, utilitários | Pressão em rotas distintas |
| Defesa: Pressão avançada | Contestar espaço e obter informação cedo | Mira, movimentação, leitura | Ataque que coleta informação e pune exposição |
| Defesa: Retomada | Preservar recursos e coordenar a recuperação | Comunicação, utilitários, movimentação | Perda excessiva de espaço ou entradas isoladas |
| Defesa: Leitura e resposta | Observar e ajustar a distribuição defensiva | Leitura, comunicação, disciplina | Execução que chega antes da resposta |

Os nomes/taxonomia acima substituem a apresentação atual no Beta 1.1; é necessário
mapear os planos antigos na importação de configurações. As interações da tabela
são hipóteses de design a validar, não taxas de vitória demonstradas.

### B11-05 — Combinações e vantagens condicionais

Escolher um plano principal e, opcionalmente, uma instrução complementar:

- Ataque: priorizar trades, preparar a entrada com utilitários ou preservar jogadores.
- Defesa: priorizar trades, rotacionar com cautela ou preservar recursos para a retomada.

Cada cartão explica objetivo, exigência, força e fraqueza. Sinalizar combinações
incompatíveis e explicar como o complemento altera o plano; não acumular ordens
contraditórias. A lista de combinações válidas será fechada antes da implementação.

As estratégias devem modificar decisões, rotas, ritmo, coordenação e prioridades
observáveis. Os atributos entram na qualidade de execução, sem duplicar bônus
já usados no motor. A compra e a composição também afetam a viabilidade do plano.
Não somar um bônus global de vitória que substitua os acontecimentos da rodada.

A ideia de "1 em 3" ou "1 em 6" será usada como referência de cenários de teste,
não como uma chance universal para qualquer confronto. Uma equipe superior pode
superar desvantagem tática; a chance efetiva deve emergir da execução e ser medida.
Não prometer probabilidades específicas antes dos testes controlados.

### B11-06 — Base tática para sustentar as estratégias

Revisar seleção de alvos, distribuição inicial e atribuição de acontecimentos para
reduzir favorecimento por identificadores internos. Usar critérios de situação e
execução, mantendo reprodução determinística e informações permitidas à IA.

Conectar responsabilidades às decisões: Entry abre espaço; Second acompanha a
entrada e busca trade; Support prepara utilitários; Anchor contém o ponto;
Lurker explora rotas separadas; Main OP prioriza posições adequadas à preparação
de precisão; IGL orienta chamadas com as informações observadas. São tendências,
não garantias de estatística individual ou de sobreviver.

Composições sem determinada função continuam permitidas, com aviso e uma política
de contingência explícita. Não obrigar Entry nem converter automaticamente um
Second em Entry sem informação ao treinador. A escolha de agente e a função são
camadas diferentes e não concedem o mesmo bônus duas vezes.

## Melhoria de compras

### B11-07 — Escolha manual acessível e sugestão editável

Apresentar seletores Eco/Semi/Forte utilizáveis antes da confirmação. O treinador
pode escolher individualmente ou aplicar um plano aos cinco. **Sugerir compras**
preenche uma proposta editável, sem desabilitar silenciosamente os seletores.
Se houver modo de gestão automática da sequência, identificá-lo explicitamente.

Durante cálculo e em situações determinadas pelas regras, mostrar a razão do
bloqueio. Na prorrogação, explicar o kit fornecido em vez de sugerir uma compra
manual indisponível. Preservar a preparação confirmada e indicar alterações ainda
não aplicadas; nenhuma escolha visual pode ser ignorada na rodada executada.

### B11-08 — Contabilidade visível, preços preservados

Por jogador: saldo antes, plano desejado, gasto próprio, ajuda enviada/recebida,
saldo após a compra, equipamento preservado e itens do pacote que ficaram incompletos.
O resumo da equipe mostra o gasto total e a viabilidade do plano.

Manter referências do zero: Eco até 1.000, Semi 3.000, Forte 6.000 por jogador;
a preservação de equipamento reduz recompra. Manter os preços internos, saldo
inicial de cada metade, teto de créditos, rendimentos e regras de ajuda aprovados.

Uma instrução Forte sem saldo não pode ser apresentada como kit completo. A
mensagem deve distinguir o limite econômico do pacote efetivamente obtido, inclusive
no Eco, sem chamar toda compra econômica de erro. Não permitir saldo negativo.
Armas, coletes e habilidades individuais não serão selecionados separadamente.

## Adição: desenvolvimento do elenco

### B11-09 — Uma sessão coletiva por partida

Uma sessão para os cinco titulares antes de cada **partida completa**, não a cada
rodada. O treinador escolhe:

- Atributos: um dos oito atributos atuais, treinado pelos cinco.
- Agentes: um agente escolhido individualmente para cada jogador.

São alternativas exclusivas na mesma sessão. Propor treino opcional: o treinador
pode pular, sem acumular sessões não usadas para partidas futuras. Uma sessão
pode ser confirmada apenas uma vez; nova oportunidade após concluir o jogo anterior.
Recarregar, cancelar preparação ou mudar de aba não cria outra oportunidade.

Mostrar antecipadamente quem progride e quem atingiu um limite. Se ninguém puder
receber progresso no foco escolhido, impedir a confirmação e permitir outro foco.
Não acrescentar custo financeiro, fadiga ou sorte de sucesso ao treinamento nesta
versão. A decisão principal é onde investir a oportunidade limitada.

### B11-10 — XP por atributo e dificuldade crescente

Cada jogador possui XP separado para cada atributo. Ao alcançar o custo, ganhar
+1 ponto; preservar o excedente para o próximo avanço. Mostrar valor atual, XP
atual, custo do próximo ponto e resultado da sessão.

| Atributo atual | XP para ganhar +1 |
| --- | ---: |
| 1–59 | 200 |
| 60–69 | 300 |
| 70–79 | 400 |
| 80–89 | 600 |
| 90–99 | 800 |

A dificuldade usa o nível atual, inclusive quando o jogador muda de faixa. Limite
individual 100. Manter a nota geral como média dos oito atributos e o potencial
como teto dessa média: não conceder +1 se isso ultrapassar o teto. Potencial não
é o teto de cada atributo separadamente. Informar os bloqueios antes do treino e
não transferir automaticamente o XP para outro atributo.

Esta regra, se aprovada, substitui o ganho isolado de até 0,1 existente em
`src/career.ts`, que nunca foi integrado ao fluxo do Beta 1.0. Os números da tabela
são proposta nova e não foram validados em um ciclo de partidas do Beta 1.1.

### B11-11 — Potencial acelera o aprendizado de forma moderada

Base proposta: 100 XP por jogador/sessão. Para o catálogo atual, acrescentar 2 XP
por ponto de potencial acima de 70, até o máximo de 150 XP. Fórmula inicial:
`100 + 2 × (limitar(potencial, 70, 95) − 70)`.

| Potencial | XP por sessão |
| --- | ---: |
| 70 | 100 |
| 80 | 120 |
| 90 | 140 |
| 95 | 150 |

O fator vale para treino de atributo e de agente. Não reduzir também o custo nem
somar outro multiplicador de atributo/mental: o potencial tem um único efeito de
velocidade, além do teto geral. O valor do potencial não aumenta com o treino.

Exemplos aritméticos, supondo espaço até o teto geral e doze sessões no mesmo
atributo: valor 50 chega a 56 com 100 XP/sessão ou a 59 com 150; valor 80 chega a
82 ou a 83. Isso ilustra a curva, não comprova equilíbrio da partida.

Salários contratuais e teto de contratação atuais permanecem fixos neste Beta;
folha salarial e renovação automática não são adicionadas por esta proposta.

### B11-12 — Catálogo de agentes e treino de familiaridade

Adicionar a aba **Agentes** com os oito existentes: classe, identidade de jogo,
quatro habilidades explicadas, forças, limitações, aplicações táticas e familiaridade
de cada titular. Nenhum agente novo ou compra separada de habilidades nesta versão.

No treino de agente, o XP pertence ao par jogador/agente e não pode ser transferido.
Os valores 85/65/45/10 permanecem como familiaridades iniciais; treinar passa a
atualizar um registro próprio de cada jogador. Curva proposta:

| Familiaridade atual | XP para ganhar +1 |
| --- | ---: |
| 0–49 | 50 |
| 50–69 | 75 |
| 70–84 | 100 |
| 85–94 | 150 |
| 95–99 | 200 |

Preservar excedentes, recalcular o custo a cada ponto e limitar a 100. A diferença
para os atributos é intencional: familiaridade é uma preparação específica de
agente e deve oferecer progresso mais rápido. Precisa de calibração própria.

Pode haver dois jogadores treinando o mesmo agente na sessão; a escalação de uma
partida continua exigindo cinco agentes diferentes. Treinar um agente não aumenta
Mira nem outro atributo automaticamente. Progredir familiaridade afeta sua condição
já existente no motor, sem acrescentar um segundo bônus oculto.

### B11-13 — Organização persistente e compatibilidade

Separar **Nova partida com o elenco** de **Reiniciar organização**. A primeira
mantém atributos evoluídos, familiaridades e XP; a segunda exige confirmação e
aviso sobre o progresso substituído. Resultados antigos preservam os perfis da
época e não são recalculados depois do treinamento.

O mínimo para a adição funcionar é manter a organização entre partidas de teste;
isso não implementa calendário, campeonato, mercado ou carreira financeira completa.

Preservar os arquivos originais do Beta 1.0. Propor importação assistida da organização,
escalação e configurações, iniciando XP em zero. Mapear nomes de planos antigos
quando necessário e exibir as escolhas convertidas. Se houver partida antiga,
seu último relatório pode ser preservado para consulta; ela não continua nem é
reexecutada com regras novas. Orientar concluir no Beta 1.0 antes da migração quando
se quiser terminar aquela partida. Uma falha de importação não apaga o progresso
atual. Compatibilidade só será anunciada após testes com arquivos reais.

## Validação e lançamento

### B11-14 — Implementação e liberação em etapas

Aprovar escopo e regras antes de implementar. Propor esta ordem:

1. Base tática e modelo de eventos/informações.
2. Estratégias e aplicação efetiva das compras, com interface de intervalo.
3. Treinamento, aba de agentes e persistência/migração.
4. Verificação integrada e relatório de resultados para o autor.
5. Publicação apenas após autorização de lançamento.

Critérios mínimos de aceitação:

- Decisões selecionadas correspondem às executadas e aparecem no registro.
- Ataque/defesa e suas opções acompanham corretamente a troca de lados.
- Resumos distinguem eventos observados de interpretações; não inventam causas.
- Compras individuais/mistas funcionam no celular e nunca ultrapassam o saldo.
- Treino é único por preparação de partida, XP permanece após recarga, limites
  funcionam e trocar foco não transfere experiência.
- Saves novos, importação antiga e duas abas têm testes de persistência relevantes.
- Mesmas entradas/regras/seed reproduzem o resultado; treino não modifica partidas antigas.
- Comparações de estratégias usam mesmas composições, atributos, economia e pares
  de lados, além de novas seeds; abranger níveis e composições distintos.
- Testes específicos para tratamento por IDs preservam funções/posições/decisões
  e investigam viés, sem exigir que todo cenário tenha taxa de 50%.
- Casos de Enlace e prorrogações longas entram na regressão. Correção de execução
  não será apresentada como equilíbrio comprovado.
- Testes em Chrome Android e computador, com navegação, legibilidade, escolhas,
  importação/exportação e recuperação de progresso. Outros ambientes devem ter
  seu alcance explicitamente registrado.

Potencial, XP, familiaridade e interações táticas precisam de simulação após a
implementação. Se os testes indicarem mudança material nos valores aprovados,
apresentar o resultado e a revisão proposta antes de incorporá-la como regra.

## Escopo preservado e exclusões

Permanecem identidade aprovada, 24 candidatos e oito agentes atuais, teto salarial,
planos econômicos e preços existentes, cenários abstratos e hospedagem do Beta no
GitHub Pages. Novas regras deste documento dependem de aprovação explícita.

Ficam fora: loja de armas/coletes/habilidades individuais, novos agentes,
mapa visual, contratação de treinador, calendário/campeonato de carreira,
mercado de transferências, moral dinâmica/pausa tática com efeito psicológico,
folha salarial em operação, contas online e migração de hospedagem para Supabase/Vercel.
Nenhum desses sistemas é adicionado implicitamente pelo treinamento.

## Registro de aprovação

O autor aprovou todos os itens B11-01 a B11-14, incluindo as regras e curvas desta revisão. Ajustes posteriores continuam possíveis mediante registro e aprovação quando materiais. A aprovação não autoriza publicação.

A série Beta 1 fica concentrada em partida, rodadas, estratégias, compras, treinamento e agentes. Beta 2.0 é a direção futura para novas adições de conteúdo e ajustes de balanceamento; seu catálogo e escopo ainda não foram definidos. Correções necessárias ao funcionamento e equilíbrio do Beta 1 continuam possíveis, sem antecipar os conteúdos do Beta 2.0.
