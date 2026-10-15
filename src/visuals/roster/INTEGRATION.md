# Arte del roster: contrato para Claude

Alcance: sólo recursos visuales, atlas y carga. ERP y Mayin conservan sus recursos originales. No editar combate, físicas, controles, hitboxes, daño, IA ni selección para incorporar este arte.

`RosterArt.ts` expone `preloadRosterArt(scene)` y `registerRosterArt(scene)`. La primera carga atlas y retratos. La segunda cambia únicamente `def.art.texture`, `prefix`, `placeholder` y `tint` para los personajes ya presentes. Conserva `art.height`, que también interviene en el combate actual.

Claves: `roster-<id>`, frames `<id>-<pose>` compatibles con `FighterArt.ts`, retratos `super-cutin-<id>` y frame `face`. Cada personaje vive en `public/assets/characters/<id>/`: fuentes generadas, atlas PNG/JSON, retrato RGBA 512×512 y metadatos de recorte/escala. `chantal` es el ID existente de Chantal.

Las fuentes incluyen 20 figuras en la hoja principal: guardia, dos pasos, salto, agachado, puño, patada, especial, daño, bloqueo, puño agachado, barrida, puño aéreo, patada aérea, uppercut, caída, derrota, victoria, solo con guitarra y retrato. Una hoja complementaria aporta tres cuadros de dash, tres de backdash, levantarse, daño agachado y bloqueo agachado. Las poses de caminar atrás invierten los pasos existentes; caída aérea comparte salto; intro comparte guardia; suelo comparte derrota; agarre comparte el gesto de especial. Los ataques bajos conservan la secuencia visual guardia → golpe → guardia que utiliza el juego.

El empaquetador `scripts/package_roster_art.py` detecta las siluetas del alfa, extrae cada figura conservando sus píxeles, separa rectángulos contiguos y crea un atlas convencional de Phaser. No aplica eliminación de fondo, chroma key ni dibujos procedurales. Los pivotes se derivan de los pies. Los metadatos normalizan la resolución de las hojas de movimiento respecto a la guardia de cada personaje. Para regenerar: Python con Pillow, ejecutar el script con los IDs deseados.

Las hojas son keyframes pintados para el sistema actual; no son animaciones dibujadas a 12 cuadros únicos por segundo. No cambiar sus duraciones ni mecánicas para utilizar este arte. Las estaturas jugables actuales se conservan; cualquier ajuste de `art.height` debe coordinarse con lógica porque afecta el alcance vertical actual.

Prompts y especificaciones de identidad: `public/assets/characters/generation-prompts.json`, `supplemental-prompts.json` y `repair-prompts.json`. Brief original: `BRIEF.md`. Estado de la entrega y verificaciones: `STATUS.md`.
