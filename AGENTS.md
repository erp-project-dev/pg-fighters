# Instrucciones para agentes (Codex y otros)

PG Fighters es un juego de peleas 2D en Phaser. **Codex hace el arte; Claude hace la lógica.** Lee esto antes de crear o mover archivos.

## Dónde va cada cosa

| Qué | Dónde | ¿Se sube a git? |
|---|---|---|
| Arte final que carga el juego: `atlas.png`, `atlas.json`, `metadata.json`, `portrait.png` | `public/assets/characters/<id>/` | Sí |
| Cuerpos animados del ultimate: `<id>-atlas.png`, `<id>-atlas.json` | `public/assets/ultimate-bodies/` | Sí |
| Escenarios finales | `public/assets/stages/<id>.png` | Sí |
| **Material de trabajo**: hojas de origen (`sheet.png`, `movement.png`, `solo.png`, `*-sheet.png`, `portrait-source.png`…), cortes de reparación, prompts, README, notas, previews, archivo viejo | **`codex/`** con la misma estructura (`codex/assets/characters/<id>/`, `codex/assets/ultimate-bodies/`, `codex/assets/stages/`, `codex/output/`) | **No** (`codex/` está en `.gitignore`) |

- En `public/` va **solo lo que el juego carga**. Todo lo demás va a `codex/`.
- Los scripts de `scripts/` ya leen las hojas desde `codex/` y escriben el arte final en `public/`. Si creas un script nuevo, sigue ese mismo patrón.
- La build (`vite.config.ts`) además quita de la web cualquier `.md`, `.txt`, prompt, `sheet.png`, `movement.png`, `preview.jpg` o `layout.json` que quede en `public/`, pero no dependas de eso: ponlos en `codex/`.

## Ids y nombres

- Cada personaje usa **un solo nombre en todo**: el id (`src/data/fighters.ts`), la carpeta, los cuadros del atlas (`<id>-<pose>`) y los archivos son el mismo. Ids actuales: `erp`, `mayin`, `george`, `pepper`, `slandor`, `pentalick`, `mimetico`, `clavito`, `chantal`, `jeanpierre`, `ferdex`, `turboshred`, `toxicity`, `rematada`, `escalas`, `tayloy`, `jesex`, `markus`, `platanero`, `ricardo`, `kimberly` y el jefe `acople`.
- **No uses nombres ni apodos de personas reales** en ningún archivo, carpeta, prompt ni nota.
- Para registrar un personaje nuevo: su id en `ROSTER_ART_IDS` (`src/visuals/roster/RosterArt.ts`) y, si tiene cuerpos de ultimate, en `ULTIMATE_BODY_IDS` (`src/visuals/roster/UltimateBodies.ts`).

## Diseño de personajes

- Todos los personajes son **ficticios y paródicos** (ver el aviso legal en `src/scenes/DisclaimerScene.ts`).
- Los diseños deben ser **caricaturas originales**: no reproducir la cara ni la apariencia reconocible de personas reales, aunque el concepto venga de una imagen de referencia.
- En prompts y notas, habla de "concepto original" o "diseño aprobado", nunca de la "identidad" de una persona.
- Encargos de arte pendientes: `src/visuals/ROSTER-ART.md`.
