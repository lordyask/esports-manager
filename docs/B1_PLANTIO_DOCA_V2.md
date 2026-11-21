# Candidata ao Beta 2.1.1 · Plantio na Doca V2

Base verificada em 21/11/2026: `main` e `851a11e4d68357914ede422092cb29179e5bebdf` coincidiam. Na política r5, a IA descartava um defensor visível em travessia quando o setor de origem informado ainda era a Inspeção. Na r6, o atacante usa sua lista de inimigos visualmente confirmados para decidir se começa o plantio. Quando enxerga alguém, continua avaliando as ações táticas existentes.

## Registro aos 7.000 ms

Atacante pronto no ponto e defensor partindo de `mid` aos 5.000 ms. Aos 7.000 ms, o defensor percorreu 80% da conexão até a ligação. Em cada linha, o atacante tinha visão individual e linha de tiro. Sondas com habilidades indisponíveis e disparo automático desligado. A decisão foi enviada a `issue` nas duas versões.

| Ponto | Equipe atacante | Semente | Defensor observado | Decisão r5 | plant_start r5 | Decisão r6 | plant_start r6 |
|---|---|---:|---|---|---|---|---|
| A | A | 17 | B0, mid → link_a | plant | sim | wait | não |
| A | A | 73 | B0, mid → link_a | plant | sim | wait | não |
| A | B | 17 | A0, mid → link_a | plant | sim | wait | não |
| A | B | 73 | A0, mid → link_a | plant | sim | wait | não |
| B | A | 17 | B0, mid → link_b | plant | sim | wait | não |
| B | A | 73 | B0, mid → link_b | plant | sim | wait | não |
| B | B | 17 | A0, mid → link_b | plant | sim | wait | não |
| B | B | 73 | A0, mid → link_b | plant | sim | wait | não |

Em execuções independentes, a r6 permitiu o plantio aos 6.874 ms e o evitou aos 6.875 ms, primeiro instante de exposição. Em um teste com IA e combate ligados, a decisão do atacante foi alinhada ao primeiro contato aos 7.000 ms. Ele manteve a arma disponível e disparou até os 7.500 ms.

## Controles e compatibilidade

- Ponto livre, parede, contato já perdido e fumaça na entrada observada permitiram plantar. Defensor parado e visível ou fumaça em outra entrada mantiveram a contestação. O filtro óptico respeitou a equipe do observador nos dois sentidos.
- O comando direto sob pressão e o plantio iniciado antes da exposição puderam completar seu curso. O desarme urgente continuou disponível sob contato.
- Novas sessões do usuário e dos NPCs usam r6 com `require-ready-r2`. A sessão r5 do Beta 2.1 usa as revisões guardadas no save. Com um save sintético gerado pelo código publicado em `851a11e`, o mesmo comando de segundo round produziu uma sessão idêntica byte a byte. SHA-256 da sessão serializada: `8e7f2f08ed365ec33ae18e51d30225ac636a08b506b80f7cf9522a898f6a054e`. Um histórico de 20 rounds exportado pela base também foi lido integralmente pela candidata.
- A identificação pública do produto continua Beta 2.1. O incremento tem identificador mecânico próprio e aguarda revisão para lançamento.

Os testes usam os perfis comuns do projeto. [Decisão de plantio](../test/doca-v2-plant.test.ts) · [Continuação de partidas](../test/defensive-policy-compatibility.test.ts) · [Prontidão de movimento](../test/movement-recovery.test.ts)

```sh
node --test --test-isolation=none test/doca-v2-plant.test.ts test/defensive-policy-compatibility.test.ts test/movement-recovery.test.ts
npm test
npm run typecheck
PAGES_BASE_PATH=/esports-manager npm run build
PAGES_BASE_PATH=/esports-manager node scripts/check-export.ts
```
