# Arte del roster

Todos los luchadores tienen arte propio menos EL VIRREY, INTI y AMU, que usan un cuerpo provisional teñido hasta que llegue su atlas. Los datos (nombre, título, biografía, frase, estilo, colores, poder y ultimate) están en `src/data/fighters.ts`.

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
| 22 | `nosu` | NOSU | `public/assets/characters/nosu/animations/` y retrato |
| 23 | `virrey` | EL VIRREY | **pendiente** (cuerpo provisional) |
| 24 | `inti` | INTI | **pendiente** (cuerpo provisional) |
| 25 | `amu` | AMU | **pendiente** (cuerpo provisional) |
| 23 | `virrey` | EL VIRREY | **pendiente** (cuerpo provisional) |
| 24 | `inti` | INTI | **pendiente** (cuerpo provisional) |
| 25 | `amu` | AMU | **pendiente** (cuerpo provisional) |
| ?? | `acople` | EL ACOPLE | `public/assets/characters/acople/` |

## Encargos pendientes
- **`virrey`, `inti`, `amu` · paquetes completos**: 27 hojas independientes de ocho cuadros y retrato por personaje, con conceptos originales basados en sus fichas actuales. Referencias iniciales también pendientes; los briefs de vestuario son propuestas de producción. Virrey: peluca, capa y bastón ascendente; Inti: tocapus, mascapaicha y charango eléctrico; Amu: pintura de huito/achiote, llanchama y manguaré. No sustituir el instrumento de Amu por guitarra. Cola exacta: `codex/output/roster-expansion/jobs.json`. Registrar ids de arte solo cuando existan assets finales válidos.

- **`george` · diseño corregido integrado, revisión en juego pendiente**: Concepto original aprobado por imagen del usuario: personaje de cuerpo robusto y abdomen visible, cabello negro ondulado y despeinado de largo medio, lentes rectangulares oscuros, barba y bigote negros con canas marcadas en el mentón. Casaca negra abierta con capucha y cordones claros, camiseta negra con estampado claro de púa y silueta de guitarra, jeans azules holgados y zapatillas de skate negras con cordones y suela blancos. Conservar volumen corporal y ropa en todas las poses; no usar la versión delgada de pelo corto y sin barba. Adaptar como caricatura original coherente con el juego. No añadir marcas comerciales. El piloto de 27 hojas anterior queda invalidado por diseño, conservado en codex para archivo. Las 27 hojas corregidas y el retrato están integrados; el ultimate de ocho cuadros está incluido en `special-attack`. El atlas clásico y cuerpo independiente anterior se conservan como respaldo. Verificación técnica y limitaciones en `codex/output/george-design-correction/integration-status.json`. Cola: `codex/output/george-design-correction/`.

- **`nosu` · paquete completo integrado, revisión visual en juego pendiente**: diseño aprobado por imagen del usuario: androide de silueta estilizada, armadura cerámica blanca, articulaciones mecánicas negras, visor angular magenta sin rostro humano, audífonos circulares integrados y dos antenas largas en el casco. Aros luminosos magenta en orejas, hombros y rodillas; dedos articulados y botas del diseño de referencia. No usar la antigua pantalla verde, cables como pelo ni cambiar el casco. Adaptar a ilustración anime con sombreado cel coherente con el juego. 27 hojas separadas de ocho cuadros, retrato y cuerpo de ultimate. Poder básico: emisión de onda magenta desde la palma, sin proyectil pintado dentro de los cuadros. Ultimate: conservar el robot, tocando una guitarra lisa sin marcas conectada a su pecho; el instrumento es un accesorio del ultimate. Mantener el diseño en todas las poses. Fuentes, prompts y cola en `codex/assets/characters/nosu/` y `codex/output/nosu-rebuild/`. Las 27 hojas y el retrato están generados e integrados mediante `animations/atlas.json`; hashes de fuente verificados. El cuerpo del ultimate está incluido en `special-attack`. Revisión visual completa en juego pendiente; no regenerar hojas válidas.

- **`virrey` · paquete completo (poses, retrato y, si se puede, ultimate)**: virrey colonial caricaturesco, concepto original. Hombre maduro, delgado y estirado, con nariz en alto y gesto de superioridad. Peluca blanca empolvada con rulos, casaca larga de terciopelo granate con bordados de oro, chaleco crema, gorguera de encaje, capa corta, medias blancas y zapatos con hebilla dorada. Bastón de mando con pomo de oro. Guitarra eléctrica de forma barroca (cuerpo dorado con filigranas). Color de acento dorado (`#e0b53a`) y granate. Poder básico: un pergamino real enrollado que vuela y estalla con un sello de lacre rojo. Ultimate: toca con la pierna sobre un amplificador dorado mientras le llueven monedas.
- **`inti` · paquete completo (poses, retrato y, si se puede, ultimate)**: guerrero músico inca, concepto original y digno (no burlesco). Joven adulto de complexión fuerte, piel morena, pelo negro largo. Mascapaicha (borla roja en la frente) y llauto trenzado, orejeras circulares de oro, túnica (unku) con tocapus geométricos en naranja, rojo y turquesa con detalles en neón, brazaletes de oro, ojotas. Charango eléctrico con cuerpo de madera y un sol de oro grabado, y una quena colgada al cuello. Color de acento naranja sol (`#ff9f1c`). Poder básico: un disco solar de oro que gira y crece. Ultimate: toca de espaldas a un sol gigante con los rayos girando.
- **`amu` · paquete completo (poses, retrato y, si se puede, ultimate)**: chico de una comunidad ribereña de la Amazonía peruana, concepto original, tratado como héroe y con respeto (nada de estereotipos ni rasgos exagerados). Unos 17 años, delgado y atlético, sin polo, pelo negro lacio con cerquillo. Pintura corporal de huito (líneas negras geométricas en brazos y pecho) y de achiote (rojo) en las mejillas; collares de semillas y dientes de huayruro (rojo y negro), falda de llanchama (corteza batida, color crema), descalzo. En lugar de guitarra lleva dos mazos de madera para tocar el manguaré, y en el ultimate toca un manguaré (tambor de tronco tallado) que aparece a su lado. Color de acento verde selva (`#2ecc71`) y rojo achiote. Poder básico: tres ondas de tambor seguidas, en anillos verdes y rojos.

### Escenarios nuevos (1920×1080, sin personajes, piso a la altura de los demás escenarios)
- **`casona` · El Salón del Virrey** → `public/assets/stages/casona.png`: casona colonial del Centro de Lima convertida en bar de rock. Balcones de cajón de madera tallada, zócalo de azulejos sevillanos, candelabros con velas, retratos al óleo de virreyes ficticios con lentes oscuros, amplificadores dorados, piso en damero y alfombra roja. Luz cálida de velas.
- **`ciudadela` · La Ciudadela del Sol** → `public/assets/stages/ciudadela.png`: ciudadela inca de piedra entre nubes, inspirada en Machu Picchu, al atardecer. Andenes con pasto, muros de piedras poligonales encajadas, una portada trapezoidal, amplificadores escondidos entre las piedras, una llama mirando y un sol enorme detrás de los picos.
- **`rio` · El Muelle del Río** → `public/assets/stages/rio.png`: muelle de madera de noche sobre un río amazónico. Selva oscura con palmeras de aguaje, un manguaré gigante (dos troncos tallados) en el muelle, un peque-peque con parlantes, un delfín rosado saltando, luna reflejada en el agua y luciérnagas.
- **`laboratorio` · El Laboratorio del Rock** → `public/assets/stages/laboratorio.png` (pendiente): laboratorio de alta tecnología donde se fabricó a NOSU, con su misma estética. Paredes de paneles cerámicos blancos con juntas negras (como la armadura de NOSU), franjas de luz magenta (`#ff2ba6`) y LEDs. Al fondo, una pantalla gigante que muestra la onda de una canción siendo masterizada; a los costados, racks de servidores con luces parpadeando y brazos robóticos blancos que sostienen guitarras eléctricas lisas sin marcas. Cables ordenados, monitores de estudio y una consola de mezcla futurista. Piso negro brillante con rejilla de neón magenta en perspectiva. Luz fría y limpia, sin personajes. Mientras no llegue el PNG, el juego dibuja un fondo provisional por código con estos mismos elementos.

Al entregar un escenario, descomentar su `image` en `src/data/stages.ts`.

- **`kimberly` · ultimate (`super-0` a `super-3`)**: sale con otra ropa (top blanco con tirantes y medias con liguero). Repintar con el diseño aprobado del resto de poses: polera lila, falda negra a cuadros y pantis negras.
- **Pose `win` en general**: pintarla a la misma escala de cuerpo que la guardia. Hoy varias se corrigen por código (`WIN_FIT` en `RosterArt.ts`, `VICTORY_SPLIT` en `AnimeAtlas.ts`); si se repinta una, quitar su corrección.

## Qué entrega cada personaje
1. **Atlas de poses** (`atlas.png` + `atlas.json`, frames `<id>-<pose>`) mirando a la derecha, fondo transparente. Lista de poses en `systems/FighterArt.ts` (`POSES`); las que falten se simulan solas.
2. **Retrato** `portrait.png` (512×512) y `metadata.json` con las escalas.
3. **Opcional**: cuatro cuadros del ultimate tocando la guitarra en `public/assets/ultimate-bodies/<id>-atlas.*`.

## Cómo conectarlo
Agregar el id a `ROSTER_ART_IDS` en `src/visuals/roster/RosterArt.ts` (y a `ULTIMATE_BODY_IDS` si tiene cuerpos de ultimate). Se revisa con `/?sprites` y jugando en `/?lab=<id>`. El material de trabajo (hojas de origen, prompts, notas) va en `codex/`: ver `AGENTS.md`.

Sin rostros ni apariencia reconocible de personas reales: son caricaturas originales.

## Escenarios nuevos pendientes

- `casona`: Salón del Virrey, casona colonial convertida en local de rock.
- `ciudadela`: Ciudadela del Sol, plaza andina de piedra entre nubes al atardecer.
- `rio`: Muelle del Río, plataforma de madera amazónica de noche.
- `laboratorio`: Laboratorio del Rock, laboratorio de alta tecnología al estilo de NOSU (**pendiente**: falta el PNG).

Los tres escenarios ya tienen PNG finales generados, revisados y conectados localmente en STAGES. Río se comprobó además dentro de una pelea; los personajes todavía se están produciendo. Suelo horizontal libre en el 35 % inferior, pies al 87 % de altura. Fuentes en `codex/assets/stages/`; finales en `public/assets/stages/<id>.png`. Solo entonces activar `image` en `src/data/stages.ts`.
