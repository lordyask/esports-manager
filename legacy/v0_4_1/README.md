# Leitura de arquivos anteriores — motor 0.4.1

Snapshot exato de `src/`, `lib/` e `data/` do commit `1207e16113a35ff8537bfbf8e8bdda9fd3f273ba`, anterior aos reworks. Os arquivos de implementação não são editados para acompanhar as regras atuais.

O produto usa os decodificadores e estatísticas desta árvore apenas para validar e consultar arquivos antigos, incluindo Véu e o kit anterior de Bastião. Partidas antigas não entram no motor 0.5.0 nem recebem treino, dinheiro ou continuação retroativa.

Os testes antigos de calendário, habilidades e Beta 1.3 apontam explicitamente para esta árvore e são regressão do leitor/regras congeladas, não certificação dos kits novos. A validação atual usa `test/reworks.test.ts`, `test/career-reset.test.ts`, os testes atuais de circuito/mapas e os scripts `validate-reworks.ts` / `validate-circuit.ts`.

A simulação congelada só é executada fora do produto, nos testes e na amostra comparativa controlada. Não há ação na interface para continuar uma campanha antiga.
