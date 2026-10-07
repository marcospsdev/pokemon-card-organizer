# PokéDex Sorter

Organizador físico de cartas Pokémon pela National Pokédex + Pokédex interativa.
React 19 + TypeScript + Vite, mobile-first, sem backend (tudo salvo no dispositivo).

## Rodando

```bash
npm install
npm run dev          # http://localhost:5173
npm run dev:https    # HTTPS na rede local — necessário para a câmera no celular
npm run build
```

## Fluxo

1. **Nova organização** → abre o scanner contínuo.
2. **Scanner**: a câmera fica aberta; cada carta é lida por OCR (Tesseract), o texto passa por
   fuzzy matching contra os nomes da PokéAPI e a carta é registrada. A mesma carta não é contada
   duas vezes: o scanner trava na carta atual e só libera quando ela sai do quadro.
   Baixa confiança → folha de confirmação com sugestões.
3. **Resumo**: cartas, Pokémon diferentes, duplicadas, primeiro/último, correção manual.
4. **Organizar**: modo guiado ("Coloque depois de Charizard", fileira/posição na mesa) e modo
   avançado (sequência completa + "Conferir mesa" com drag & drop via Shopify Draggable).
5. **Concluído**.

## Arquitetura

- `src/services/pokeApiService.ts` — índice da National Pokédex (gerações + tipos, cache em IndexedDB) e detalhes.
- `src/services/ocrService.ts` — `OcrEngine` (Tesseract.js, carregado sob demanda).
- `src/services/pokemonRecognitionService.ts` — `PokemonRecognitionService` desacoplado do OCR.
- `src/services/pokemonMatcher.ts` — normalização + distância de edição ponderada (caracteres confundíveis no OCR).
- `src/services/sortingService.ts` — agrupamento de duplicatas, ordenação, instruções físicas, cartas fora de ordem.
- `src/hooks/useContinuousScanner.ts` — máquina de estados do scanner e trava por carta.
- `src/store/*` — Zustand com persistência local.
