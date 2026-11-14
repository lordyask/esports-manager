# Motor 0.5.0 preservado para consulta

Origem: commit `f7c7b0840613afabf2737076bde2223fd7b8fd81`, antes da correção da IA. Snapshot de `src/`, `lib/` e `data/`. Única adaptação de implementação: três caminhos de importação em `lib/archive.ts` apontam para a árvore irmã `v0_4_1`, pois o arquivo mudou de diretório. Hashes e a exceção constam de `validation/balance/prior-engine-integrity.json`.

O produto usa o decodificador, histórico e estatísticas anteriores para consulta; não continua esses circuitos com a política nova. Acervos embutidos válidos são preservados e também ficam acessíveis separadamente, respeitando o limite de 64 MiB. O arquivo completo original permanece exportável. A simulação anterior é usada apenas fora do produto na comparação controlada do balanceamento.
