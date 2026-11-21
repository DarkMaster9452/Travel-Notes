# Summit Quest — pokyny pre Claude

## UI: vždy sa riaď dizajnovým systémom

Pred **akoukoľvek** zmenou UI (landing, zákaznícka appka `(app)`, admin panel
`/admin`, e-maily, error stránky) si prečítaj a dodrž:

- [`design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md) — záväzné pravidlá
  (farby, typografia, medzery, rádiusy, gridy, shelly, komponenty, pohyb,
  prístupnosť, checklist).
- [`design/tokens.css`](../design/tokens.css) — jediný zdroj hodnôt.

Pravidlá v skratke:
- Mesačný quest je jadro produktu: vždy prvý a najväčší. `accent` (Sunset)
  a `feature` (Sun) patria len jemu.
- Žiadne gradienty. Žiadna fotka sa neopakuje (Unsplash cez `src/lib/images.ts`).
- Každý quest ukazuje turistickú značku (KST), obtiažnosť (merač vrcholov),
  dĺžku, stúpanie a čas.
- Len sémantické tokeny (`bg-surface`, `text-muted`, `bg-primary`…); žiadne hexy,
  Tailwind default farby ani arbitrary hodnoty.
- Rádius len `xs / control / card / dialog / pill`. Medzery len zo 4 px stupnice.
- Max 1 primárne tlačidlo na blok, accent len pre mesačný quest.
- Landing, appka aj admin zdieľajú tie isté komponenty — líšia sa len hustotou.
- Pred ukončením UI úlohy prejdi checklist v sekcii 11 dizajnového systému.
- Ak pravidlo chýba, najprv ho doplň do `DESIGN-SYSTEM.md`, potom kóduj.

- Pred dokončením spusti `npm run lint:design` (aj `npm run typecheck` a `npm run lint`).
- Komponenty hľadaj v `src/components/ui` (primitívy) a `src/components/domain` (quest,
  značka, obtiažnosť, nálepka…); texty v `src/lib/i18n` (SK / EN / DE).

Admin panel (`src/app/admin`, `src/components/sq`, `src/styles/summit.css`) a
`design/index.html` sú posledný legacy vzhľad — nepreberaj z nich nič. Keď sa bude
admin prerábať, postav ho na tých istých `ui/` a `domain/` komponentoch.
