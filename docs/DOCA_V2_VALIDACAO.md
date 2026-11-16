# Doca V2 — candidata de desenvolvimento

Esta branch parte da `main` em `61dc03d`. Ela não atualiza `main` nem publica o jogo. Identificadores: produto `2.0.0-doca-v2.dev.1`; motor `0.6.0`; regras `nexus-2.0-doca-v2-r1`; mapa `doca-v2`, revisão `doca-v2-central-2`; política `doca-v2-tactical-r4`; clubes `independent-repertoire-r2`; sementes `domain-separated-r1`; registro de equipamento `round-equipment-r1`. O save permanece schema 6, mas a versão mecânica é incompatível com a 0.5.1.

## Planta e modelo

A referência aprovada não tem escala. A visualização é um diagrama esquemático que usa a mesma lista de conexões do motor. As coordenadas são apenas para desenho; os custos da tabela de travessia são parâmetros abstratos, em milissegundos equivalentes de caminhada, e não distâncias em metros.

- Base atacante central, com zonas internas para saída oeste, centro e leste. A rota oeste passa por Recepção e Corredor A; a leste, por Manutenção e Corredor B. Nenhuma lateral exige Triagem.
- Triagem, duas curvas, Inspeção e Ligações A/B formam o meio. Cada ligação entra em seu respectivo ponto.
- Base defensora central, em recuo ligado ao centro da Galeria de Serviço. Galeria A — centro — Galeria B permite rotação sem entrar na base defensora. Cada extremidade se liga à parte traseira do seu ponto.
- O bloco técnico não é atravessável. Há posições de cobertura separadas dentro dos pontos. As conexões são bidirecionais; uma barreira ativa pode bloqueá-las temporariamente.

O grafo de deslocamento, as linhas de visão e as permissões de disparo são conjuntos distintos. Um par de setores adjacentes não implica visão: curvas, saídas das bases e coberturas podem ocultar um adversário. A travessia de uma conexão considera os dois participantes e a exposição perto das extremidades. Alcance usa a distância aproximada pelo grafo: curto até 2.500 ms equivalentes, médio até 6.000, longo acima disso. Fumaças e barreiras aplicáveis bloqueiam a visão; projéteis precisam de uma linha autorizada; a marcação exige visão e mantém apenas a última posição após perdê-la. Não há física 3D nem colisão por pixel.

## Preparação e tempos

Os cinco jogadores de cada lado começam dentro de suas bases. Os primeiros 5.000 ms simulados permitem organização dentro delas; ordens, compras e distribuição podem ser revistas nos controles antes da confirmação. A simulação automática não espera cinco segundos de relógio real. Disparos, habilidades e objetivos ficam bloqueados até a liberação simultânea. O relógio de ação de 100 s começa depois; eventos gravados usam tempo total, e a interface identifica preparação e tempo de ação.

Nas medidas abaixo, cada ator caminha sem habilidade, barreira, combate ou espera da IA. Os tempos são medidos desde a liberação. Ao final de cada conexão existe 1 s de recuperação antes de começar a seguinte; não há recuperação adicional incluída após o destino final. A preparação pode levar o atacante até a saída interna antes da liberação.

| Origem → destino | Caminho | Tempo |
| --- | --- | ---: |
| Saída oeste do ataque → A | Recepção, Corredor A | 11,7 s |
| Saída leste do ataque → B | Manutenção, Corredor B | 11,7 s |
| Centro da base atacante → A ou B | saída lateral correspondente | 13,5 s |
| Centro da base atacante → Inspeção | Triagem e duas curvas | 13,5 s |
| Centro da base defensora → A ou B | centro e extremidade da galeria | 8,5 s |
| Centro da base defensora → Inspeção | galeria, A e Ligação A | 15,5 s |
| Extremidade A → extremidade B da galeria | centro da galeria, sem base | 6,0 s |

Assim, sem interferência, um defensor enviado diretamente ao ponto pode chegar cerca de 3,2 s antes de um atacante já organizado na saída lateral; o ataque pode chegar à Inspeção antes de um defensor que saia da base. Contato nas entradas pode acontecer antes de alguém atingir o centro do ponto. Decisões, habilidades, confrontos e espera da IA alteram esses tempos.

## Estratégia e informação

O plano rápido concentra o grupo na rota principal. Controle atravessa o meio para obter informação e espaço. Divisão usa acesso principal e ligação do meio com espera por outra parte do grupo. Finta chega ao corredor/ponto falso, registra a pressão e depois muda para o alvo previsto. A chegada é registrada na cronologia; ela não concede automaticamente informação ao adversário através de paredes. Defensores reagem a observações disponíveis. Quando dois são atribuídos ao mesmo ponto, um pode ocupar sua posição de cobertura até haver contato observado. Jogadores isolados e superados numericamente priorizam manter a arma pronta; plantio e desarme consideram inimigos visíveis, salvo urgência do desarme. Avanço envia mais jogadores ao meio; contenção distribui entre pontos; leitura espera evidência mais forte antes de rotacionar; retomada mantém reserva na galeria. Estas são políticas discretas, não uma IA de FPS completa.

O treinador pode atribuir A, B, Inspeção ou Galeria individualmente. O padrão depende do plano. Nenhum ponto é preenchido automaticamente se o treinador escolher enviar os cinco ao outro; uma reação posterior depende das informações obtidas. A mesma geometria e regras de ação valem para ambos os times. Os clubes usam seus elencos e repertórios, e escolhas de ponto e de estratégia deixam de estar acopladas pelo mesmo módulo.

## Evidências funcionais

`npm test` inclui circuito completo de 28 confrontos, os sete adversários, checkpoints, economia, partidas e históricos. Os testes próprios cobrem bases, bloqueio e liberação aos 5 s, tempo de ação, conectividade, galeria contínua, saídas independentes, curvas, cobertura, fumaça, rastreamento, plantio/desarme em A/B por ambos os lados, ordem explícita de cinco em B e mudança de direção após a finta. A entrada dos perfis é invertida nos testes determinísticos. Também foram verificados os dois históricos fornecidos, com 24 e 13 rounds, pelo leitor congelado 0.5.1; seus arquivos não estão no repositório.

Em 512 rodadas sintéticas de mapa completo, com oito sementes repetidas entre 16 combinações de ataque/defesa, dois pontos e ambos os lados, nenhum primeiro contato ocorreu durante a preparação; ele apareceu entre 12,2 e 22 s de tempo total (7,2 a 17 s de ação). Houve 404 plantios, 13 desarmes, 8.694 usos de habilidades e **470 vitórias do ataque**. Os resultados dentro da mesma semente são correlacionados; esta amostra não certifica o equilíbrio global. Ainda assim, a vantagem ofensiva e a baixa frequência de desarmes são sinais fortes de que a defesa e a retomada precisam de revisão adicional antes de qualquer lançamento.

Na candidata espacial anterior, com acesso defensivo de 10 s, sem a nova ocupação de cobertura e sem as últimas decisões sob ameaça, os mesmos cenários tiveram 465 vitórias do ataque, 399 plantios e seis desarmes. A candidata atual encurtou o acesso para 8,5 s e modificou comportamentos ao mesmo tempo: a comparação não isola a causa das diferenças e **não demonstra correção do desequilíbrio**. O ataque em grupo pode concentrar fogo contra defensores que chegam em etapas; a passagem exposta pela galeria, a espera após o deslocamento e o uso de utilitários merecem investigação em testes separados.

Em 2.000 confrontos isolados com sementes distintas, times idênticos e equipamentos iguais, a equipe identificada como A venceu 982; o ataque venceu 956. Houve 33 eliminações mútuas, decididas em favor da defesa antes do plant conforme a regra vigente. Inverter a ordem de entrada dos perfis produziu resultado idêntico nos 2.000 casos. Esse teste não elimina vieses em outras composições ou em partidas com movimentação.

O Chromium foi exercitado em 1280 e 390 px: preparação, distribuição dos cinco em B, cálculo em worker, gravação, teclado na planta, recuperação de save antigo e cópia exata ao importar outro. Sem erro JavaScript ou transbordamento horizontal nesses cenários. Isso não substitui testes em aparelhos físicos.

## Economia — comparação controlada, sem alteração adotada

Preços, compras, proteção, preservação, reset da metade e política econômica permanecem como no motor anterior. Com saldo inicial de 9.000 por jogador e nenhum item preservado, a compra efetiva foi:

Cada round novo grava, para os dez jogadores, a arma, proteção, cargas, ultimate, agente e atributos efetivos após as compras e antes do combate. Isso inclui itens preservados e compras parciais; intenção e transações continuam separadas. O registro também acompanha cada confronto NPC e consta no CSV de rodadas e no relatório da partida.

| Ordem | Arma | Proteção | Cargas compradas | Gasto por jogador |
| --- | --- | ---: | --- | ---: |
| Eco | básica | 25 | 1ª | 800 |
| Semi | intermediária | 25 | 1ª e 2ª | 3.000 |
| Forte | principal | 50 | 1ª, 2ª e 3ª | 6.000 |

Em confronto isolado 5×5, todos expostos no mesmo ponto, atributos iguais, sem habilidades ou deslocamento, a equipe com o kit listado primeiro venceu: Eco × Eco 60/120; Eco × Semi 24/120; Eco × Forte 24/120; Semi × Semi 60/120; Semi × Forte 24/120; Forte × Forte 60/120. As 120 condições repetem apenas 15 sementes em combinações espelhadas de equipe, lado e ponto: não são 120 observações independentes. O segundo conjunto de sementes e atributos +8 controlados estão nos dados gerados. Kits iguais são espelhados, portanto seu agregado 60/120 não mede sozinho vantagem por identificação.

O teste por componente revelou uma pendência: com proteção 25 para ambos, intermediária 34 e principal 40 precisam de quatro acertos para vencer 125 de vida+proteção; a comparação ficou em 60/120 para cada lado. Com arma básica 30, proteção 25 e 50 também exigem cinco acertos no cenário isolado. Uma experiência temporária mudou dano básico 30→29 e principal 40→42: distinguiu esses limiares, mas Eco × Forte caiu para 0/120 na amostra exploratória e na amostra adicional. Esses valores experimentais **não foram adotados**; zero na amostra não prova derrota impossível. É necessário estudar alternativas com mais sementes independentes, partidas completas, distribuições de proteção e consequências econômicas antes de ajustar o dano.

Os relatórios sintéticos registram eliminações, dano bruto de arma, sobreviventes, durações, plantios, desarmes, usos de habilidades e kits efetivos. O ensaio com e sem habilidades não isola cada habilidade e mistura suas decisões e deslocamentos. A sequência original Eco não foi usada como alvo de calibração. Não há conclusão de equilíbrio global.

No ensaio exploratório de 64 rodadas completas com arma e proteção iguais, um lado recebeu cargas e o outro não: o lado com cargas venceu 33 e realizou 480 habilidades; o outro realizou zero. Oito sementes foram repetidas entre lados e pontos, e decisões e agentes interagem com os efeitos; o resultado não isola a contribuição de cada habilidade. O momento e a utilidade das habilidades precisam de amostras maiores.

Reproduzir a amostra sintética (Node 24):

```sh
node scripts/validate-doca-v2.ts
node scripts/validate-doca-v2.ts --holdout
node scripts/validate-doca-v2.ts --experimental-damage
node scripts/validate-doca-v2.ts --experimental-damage --holdout
node scripts/validate-doca-v2-fairness.ts
node scripts/validate-doca-v2-spatial.ts
```

Para reproduzir o comparativo anterior, extraia os arquivos `src`, `test/fixtures.ts` e `package.json` do commit `545367e` para um diretório temporário e execute o último comando com `NEXUS_SPATIAL_ENGINE_ROOT` apontando para ele. O teste de navegador usa `node scripts/doca-v2-browser-fixtures.ts` e `node scripts/validate-doca-v2-browser.mjs` após `npm run build`; requer Chromium e Playwright locais e usa apenas saves sintéticos.

## Saves, sementes e limites

Saves e históricos dos motores 0.3.0, 0.4.1, 0.5.0 e 0.5.1 permanecem consultáveis/exportáveis por leitores congelados. Na abertura de um save local antigo a candidata não grava nem substitui o original; apresenta recuperação e exportação. Após confirmação de importar outro arquivo ou reiniciar, guarda os bytes originais em Acervo. A partida antiga fica interrompida no Acervo e não continua sob as regras novas; não há migração automática de elenco, XP ou finanças. O limite do save total, incluindo cópias, é 64 MB; caso a cópia não caiba, a gravação é recusada e o original permanece. Arquivos inválidos podem ser conservados sem validação, para exportação, sem prometer leitura.

Os resultados concluídos não são recalculados. Partidas novas recebem semente por partida e rodada com separação de domínio; um mesmo save 0.6.0 com a mesma revisão preserva sua reprodução determinística. Reutilizar uma semente 0.5.1 no motor 0.6.0 não reproduz o resultado antigo: geometria, ações, desempate e política mudaram. O arquivo original e os eventos gravados são a referência da partida anterior.

Persistem limitações: a planta usa áreas abstratas, as coberturas não são colisores gráficos e as habilidades/estratégias precisam de amostras maiores, principalmente em retomadas, informação limitada e trocas de direção; a força aparente do ataque na amostra requer investigação. Não há certificação de equilíbrio entre clubes nem revisão estrutural adicional dos mapas.
