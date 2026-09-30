# Summit Quest — pokyny pre Claude

## UI: vždy sa riaď dizajnovým systémom

Pred **akoukoľvek** zmenou UI (landing, zákaznícka appka `(app)`, admin panel
`/admin`, e-maily, error stránky) si prečítaj a dodrž:

- [`design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md) — záväzné pravidlá
  (farby, typografia, medzery, rádiusy, gridy, shelly, komponenty, pohyb,
  prístupnosť, checklist).
- [`design/tokens.css`](../design/tokens.css) — jediný zdroj hodnôt.

Pravidlá v skratke:
- Len sémantické tokeny (`bg-surface`, `text-muted`, `bg-primary`…); žiadne hexy,
  Tailwind default farby ani arbitrary hodnoty.
- Rádius len `xs / control / card / dialog / pill`. Medzery len zo 4 px stupnice.
- Max 1 primárne tlačidlo na blok, max 1 accent (Blaze) prvok na obrazovku.
- Landing, appka aj admin zdieľajú tie isté komponenty — líšia sa len hustotou.
- Pred ukončením UI úlohy prejdi checklist v sekcii 11 dizajnového systému.
- Ak pravidlo chýba, najprv ho doplň do `DESIGN-SYSTEM.md`, potom kóduj.

`design/index.html`, `src/styles/field-guide.css` a `src/styles/summit.css`
sú legacy vzhľad — nepreberaj z nich nič.
