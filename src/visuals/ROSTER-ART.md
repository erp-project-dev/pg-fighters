# Arte del roster

Todos los luchadores tienen arte propio. Los datos (nombre, título, biografía, frase, estilo, colores, poder y ultimate) están en `src/data/fighters.ts`.

| Nº | id | Nombre | Arte |
|---|---|---|---|
| 01 | `erp` | ERP PROJECT | hojas anime base (`AnimeAtlas.ts`) |
| 02 | `mayin` | MAYINBLUES | hojas anime base (`AnimeAtlas.ts`) |
| 03 | `george` | GEORGE | `public/assets/characters/george/` |
| 04 | `pepper` | PEPPER | `public/assets/characters/pepper/` |
| 05 | `slandor` | SLANDOR | `public/assets/characters/slandor/` |
| 06 | `pentalick` | PENTALICK | `public/assets/characters/pentalick/` |
| 07 | `mimetico` | MIMÉTICO | `public/assets/characters/mimetico/` |
| 08 | `clavito` | CLAVITO | `public/assets/characters/clavito/` |
| 09 | `chantal` | CHANTAL | `public/assets/characters/chantal/` |
| 10 | `jeanpierre` | JEAN-PIERRE | `public/assets/characters/jeanpierre/` |
| 11 | `ferdex` | FERDEX | `public/assets/characters/ferdex/` |
| 12 | `turboshred` | TURBOSHRED | `public/assets/characters/turboshred/` |
| 13 | `toxicity` | TOXICITY | `public/assets/characters/toxicity/` |
| 14 | `rematada` | LA REMATADA | `public/assets/characters/rematada/` |
| 15 | `escalas` | DOCTOR ESCALAS | `public/assets/characters/escalas/` |
| 16 | `tayloy` | TAYLOY | `public/assets/characters/tayloy/` |
| 17 | `jesex` | JESEX | `public/assets/characters/jesex/` |
| 18 | `markus` | MARKUS | `public/assets/characters/markus/` |
| 19 | `platanero` | PLATANERO | `public/assets/characters/platanero/` |
| 20 | `ricardo` | RICARDO | `public/assets/characters/ricardo/` |
| 21 | `kimberly` | KIMBERLY | `public/assets/characters/kimberly/` |
| ?? | `acople` | EL ACOPLE | `public/assets/characters/acople/` |

## Qué entrega cada personaje
1. **Atlas de poses** (`atlas.png` + `atlas.json`, frames `<id>-<pose>`) mirando a la derecha, fondo transparente. Lista de poses en `systems/FighterArt.ts` (`POSES`); las que falten se simulan solas.
2. **Retrato** `portrait.png` (512×512) y `metadata.json` con las escalas.
3. **Opcional**: cuatro cuadros del ultimate tocando la guitarra en `public/assets/ultimate-bodies/<id>-atlas.*`.

## Cómo conectarlo
Agregar el id a `ROSTER_ART_IDS` en `src/visuals/roster/RosterArt.ts` (y a `ULTIMATE_BODY_IDS` si tiene cuerpos de ultimate). Se revisa con `/?sprites` y jugando en `/?lab=<id>`. El material de trabajo (hojas de origen, prompts, notas) va en `codex/`: ver `AGENTS.md`.

Sin rostros ni apariencia reconocible de personas reales: son caricaturas originales.
