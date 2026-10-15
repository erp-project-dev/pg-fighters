# PG Fighters

Juego de pelea 2D estilo arcade (Street Fighter) en **Phaser 4 + TypeScript + Vite**. Resolución nativa 1920×1080. Escenario: El Sótano, un bar de rock en Lima.

```sh
npm install
npm run dev       # servidor de desarrollo
npm run build     # typecheck + build de producción
```

## Flujo de pantallas

Boot → Carga → **Título** ("PRESIONA ENTER" → menú) → **Selección** (roster) → **Escenario** → **VS** → **Pelea** + HUD → **Resultados** (revancha / cambiar luchador / menú). Desde el título: Arcade, **Entrenamiento**, Controles y Dificultad (fácil, normal, difícil). ESC en la pelea abre la pausa con la lista de movimientos.

## Controles

| Acción     | Tecla                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Moverse    | A D / ← →                                                             |
| Saltar     | W / ↑ (con dirección: salto diagonal)                                 |
| Agacharse  | S / ↓                                                                 |
| Bloquear   | mantener **atrás** (agachado para la barrida)                         |
| Puño (P)   | J / clic izquierdo                                                    |
| Patada (K) | K / clic derecho                                                      |
| Dash       | Espacio (con atrás: backdash) o doble toque → → / ← ←                 |
| Súper      | **E** con la barra SÚPER llena (también cancela un golpe que conecta) |
| Pausa      | ESC                                                                   |

## Movimientos (mirando a la derecha; a la izquierda se invierten)

| Movimiento        | Entrada                      | Notas                                                                                                                                                                                                                                                        |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Poder (proyectil) | ↓ ↘ → + P                    | Uno en pantalla por luchador. Se esquiva saltando.                                                                                                                                                                                                           |
| Uppercut          | → ↓ ↘ + P                    | Antiaéreo, invulnerable al arrancar. Muy castigable si falla.                                                                                                                                                                                                |
| Ultimate          | **E**                        | Requiere la barra ULTIMATE llena. Retrato a pantalla completa con frase (sin HUD) y luego un solo de guitarra: ERP hace shred, MayinBlues toca un blues con su guitarra de 5 cuerdas. Las notas golpean y la última tumba. Arte: `src/visuals/SUPER-ART.md`. |
| Barrida           | ↓ + K                        | Tumba. Solo se bloquea agachado.                                                                                                                                                                                                                             |
| Golpes aéreos     | P / K saltando               | Se bloquean de pie.                                                                                                                                                                                                                                          |
| Cadena            | P P K                        | El tercer golpe tumba y pega un 30% más.                                                                                                                                                                                                                     |
| Cancelar          | golpe que conecta → especial | Ej.: P, P, ↓ ↘ → + P.                                                                                                                                                                                                                                        |

Sensación arcade: hitstop en cada impacto, chispas, sacudida de cámara, combo counter, escalado de daño en combos, barra roja de daño reciente, empuje en la esquina, K.O. con cámara lenta, PERFECT y anunciador.

## Modo entrenamiento

Menú → ENTRENAMIENTO. Pelea sin tiempo ni K.O. contra un muñeco; la vida se recarga al terminar cada combo.

- **Q** muñeco: quieto, agachado, bloquea todo, bloqueo de pie, bloqueo agachado, salta, CPU.
- **I** barra SÚPER infinita · **T** velocidad (100/50/25%) · **G** cajas de golpe · **R** reiniciar posición.
- **1–9** combos de demostración (el juego los ejecuta solo).
- En pantalla: historial de entradas, datos del último golpe (arranque/activo/recuperación en frames, resultado y daño) y combo actual/mejor.

## Laboratorio (`?lab`)

Abrir `http://localhost:5173/?lab` (o `?lab=<id>` para empezar con un luchador, p. ej. `?lab=toxicity`). Entra directo a la práctica: nadie muere, la vida se recarga al terminar cada combo y la barra ULTIMATE está siempre llena. Valen todas las teclas del modo entrenamiento.

- **ESC** abre el roster encima de la pelea (los 19 luchadores **y El Acople**, jugable para probarlo): flechas para elegir, **ENTER** o clic reinicia al instante con ese luchador, **TAB** alterna entre tu luchador y el rival, **F** cambia el escenario, **V** abre el laboratorio de sprites, **M** vuelve al menú y **ESC** regresa a la pelea.

## Laboratorio de sprites (`?sprites`)

Abrir `http://localhost:5173/?sprites` (o desde el laboratorio con **V**). Pensado para revisar el arte:

- **SPRITES**: las 28 poses de cada personaje, marcando **ARTE** (propio) o **SIMULADA ← base**, con suelo, ancla (cruz), altura de la guardia (línea punteada) y alcance del golpe (rojo).
- **ANIMACIÓN**: reproductor con play/pausa, cuadro a cuadro (← →), velocidad (− +), voltear (F), fantasma (O), ver el retrato del súper (S) y datos del frame (tamaño, ancla, escala, alto en pantalla).
- **ESPECIALES** (tecla 3): el luchador contra un muñeco, con botones para ver al instante su poder, uppercut, súper (retrato + solo con su melodía) y combo P·P·SÚPER. C pasa al siguiente luchador; ESC vuelve al laboratorio.
- **ENTRENAMIENTO** (tecla 4): abre la práctica con el personaje elegido. C cambia de personaje, B muestra el escenario de fondo.

## Escenarios

Definidos en `src/data/stages.ts`; se eligen después del personaje (también hay ALEATORIO).

| #   | Escenario                                                                                                                                        | Arte                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 01  | BARRIO BRAVO · Lima                                                                                                                              | `public/assets/barrio-anime.png`                                                             |
| 02  | ESTACIÓN DEL METRO · andén con grafitis                                                                                                          | `public/assets/stages/metro.png`                                                             |
| 03  | EL ÚLTIMO TRAGO · bar de mala muerte, mesas y banda en vivo                                                                                      | `public/assets/stages/bar.png`                                                               |
| 04  | LA TIENDA DE INSTRUMENTOS · guitarras colgadas, amplis y el vendedor contando plata                                                              | `public/assets/stages/tienda.png`                                                            |
| 05  | EL FESTIVAL DEL CERRO · escenario andino al aire libre, banderines y público                                                                     | `public/assets/stages/festival.png`                                                          |
| 06  | LA AZOTEA DEL ENSAYO · Lima de noche, tanques, cables y un vecino furioso                                                                        | `public/assets/stages/azotea.png`                                                            |
| 07  | LA FERIA DEL TOMATE · pueblo español en plena guerra de tomates                                                                                  | `public/assets/stages/tomate.png`                                                            |
| 08  | LA BIBLIOTECA DEL ROCK · estanterías de libros y vinilos, vitral con guitarra, mesa de lectura                                                   | `public/assets/stages/biblioteca.png` |
| 09  | EL BARRIO CHINO · Calle Capón de noche, portada roja, chifas y faroles                                                                           | `public/assets/stages/chino.png` |
| 10  | EL MALL DEL ROCK · centro comercial donde todo es rock: tiendas de guitarras, vinilos y polos de banda, escalera mecánica y una guitarra gigante | `public/assets/stages/mall.png` |
| 11  | EL ARENAL · desierto: cerros de arena, casas de ladrillo a medio hacer, cisterna y mototaxi                                                      | `public/assets/stages/arenal.png` |

Las imágenes se cargan desde el campo `image` de `data/stages.ts` y se comparten entre miniaturas, selección, VS y pelea. Para añadir otra imagen, guardarla en `public/assets/stages/<id>.png` y registrar su ruta en ese campo. El suelo de la pelea está en y = 940; los pies de los luchadores se apoyan ahí. Cada escenario tiene su música en el campo `music` (ver la tabla de Audio).

## Personajes

Roster centralizado en `src/data/fighters.ts` (21 luchadores y el jefe El Acople): nombre, título, biografía satírica, frase, estilo de combate, color, estadísticas, nombres de movimientos y solo del ultimate. Cada uno tiene su poder básico propio (`data/powers.ts`: dibujo y comportamiento) y su ultimate animado (`visuals/supers/`), con su melodía sintetizada (`data/solos.ts`) y el daño total parejo entre todos.

| Nº | Luchador | Título | Poder (↓ ↘ → + P) |
| --- | --- | --- | --- |
| 01 | ERP PROJECT | El músico de cuarto | Pulso negro |
| 02 | MAYINBLUES | El peso pesado del blues | Onda blues |
| 03 | GEORGE | El juez de la afinación | Onda desafinada |
| 04 | PEPPER | La diva de la producción | Masterización pesada |
| 05 | SLANDOR | El heredero dorado | Lluvia de guitarras doradas |
| 06 | PENTALICK | La leyenda de los cinco licks | Lick número uno (otra vez) |
| 07 | MIMÉTICO | El aprendiz del lick | Lick prestado |
| 08 | CLAVITO | El profeta del metal urbano | Tormenta de arpegios |
| 09 | CHANTAL | El mozo de los licks | Bandeja de acordes |
| 10 | JEAN-PIERRE | Monsieur six strings | Bonjour express |
| 11 | FERDEX | Discípulo de los sabios de curcuman | Acorde revolucionario |
| 12 | TURBOSHRED | La máquina de shred | Ráfaga de mil notas |
| 13 | TOXICITY | La monja del mal genio | Agua bendita hirviendo |
| 14 | LA REMATADA | La guitarra de mayinblues | Oferta relámpago |
| 15 | DOCTOR ESCALAS | El erudito de las seis cuerdas | Bestseller en tapa dura |
| 16 | TAYLOY | Heredero del clan de la púa de jade | Secreto del shred |
| 17 | JESEX | El magnate de la escuela del rock | Cheque en blanco |
| 18 | MARKUS | El guardián de las escalas orientales | Segunda aumentada |
| 19 | EL PLATANERO | El profesor del vhs | Plátano teledirigido |
| 20 | RICARDO | El renacido del rock | Riff de raíz |
| 21 | KIMBERLY | La influencer del mástil | Escudo de seguidores |
| ?? | EL ACOPLE | La entidad del feedback | Poder robado |

La CPU elige un rival al azar entre los demás. El diálogo antes del ROUND 1 está en `data/dialogs.ts`; si una pareja no tiene diálogo escrito, cada uno dice su frase de presentación. Arte de los luchadores: `src/visuals/ROSTER-ART.md`.

## Arte de los luchadores (guía para assets)

`src/systems/FighterArt.ts` resuelve cada **pose** a un frame del atlas del personaje (`art.texture` + `art.prefix` en `fighters.ts`):

- Frame único: `<prefijo><pose>`, por ejemplo `mayin-crouch`.
- Animación: `<prefijo><pose>-0`, `-1`, … (12 fps).
- Retrato opcional: `<prefijo>portrait`. Si no existe, se recorta la cara de `idle` (`art.face`).
- El **pivot debe estar en los pies**. Los atlas JSON de TexturePacker con `pivot` lo aplican solos.
- La escala se calcula para que `idle` mida `art.height` px.

Poses: `idle walk walkBack crouch jump fall dash backdash punch kick crouchPunch sweep airPunch airKick special uppercut super hurt crouchHurt block crouchBlock knockdown down getup intro win ko`.

El juego carga las hojas anime base y extra de cada personaje desde `public/assets/`, registradas en `src/systems/AnimeAtlas.ts`. Incluyen guardia, puño, patada, daño, pasos, salto, agachado, bloqueo, uppercut, patada aérea, victoria y caída. Las poses restantes usan la tabla `FALLBACK`.

Para un atlas nuevo por personaje: cargarlo en `PreloadScene` (`this.load.atlas('mayin', ...)`) y cambiar `art: { texture: 'mayin', prefix: '' }`. Los proyectiles y efectos se dibujan por código (`entities/Projectile.ts`, `systems/Fx.ts`).

## Audio

| Archivo                                          | Uso                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `public/assets/audio/music/menu.mp3`             | Menús, selección de personaje y escenario, resultados e historia ("Instrumental Rock") |
| `public/assets/audio/music/stage-sotano.mp3`     | El Último Trago ("Instrumental Blues")                                                 |
| `public/assets/audio/music/stage-barrio.mp3`     | Barrio Bravo ("Midnight Rumble")                                                       |
| `public/assets/audio/music/stage-festival.mp3`   | El Festival del Cerro                                                                  |
| `public/assets/audio/music/stage-metro.mp3`      | Estación del Metro ("Neon Commuter")                                                   |
| `public/assets/audio/music/stage-azotea.mp3`     | La Azotea del Ensayo ("Instrumental Rock")                                             |
| `public/assets/audio/music/stage-tomate.mp3`     | La Feria del Tomate ("Fuego y Acero")                                                  |
| `public/assets/audio/music/stage-tienda.mp3`     | La Tienda de Instrumentos ("Instrumental Box")                                         |
| `public/assets/audio/music/boss-acople.mp3`      | Pelea final contra El Acople, en El Interior del Ampli ("Teeth in the Sink")           |
| `public/assets/audio/music/stage-biblioteca.mp3` | La Biblioteca del Rock                                                                 |
| `public/assets/audio/music/stage-arenal.mp3`     | El Arenal ("Oriental Rock")                                                            |
| `public/assets/audio/music/stage-chino.mp3`      | El Barrio Chino ("Callejón del Club", de RockStreet)                                   |
| `public/assets/audio/music/stage-mall.mp3`       | El Mall del Rock ("La Disquería", de RockStreet)                                       |
| `public/assets/{punch,kick,swing}.wav`           | Efectos (generados por `scripts/audio.py`)                                             |

Los tonos del anunciador e impactos se sintetizan con WebAudio (`systems/Audio.ts`).

## Aviso

PG Fighters es una parodia hecha con cariño para la comunidad de Peru Guitar. Todos los personajes, nombres, historias y situaciones son ficticios. Cualquier parecido con personas reales, vivas o fallecidas, es pura coincidencia. Este juego no busca desprestigiar, ofender ni burlarse de nadie: es humor entre músicos, nada más. El aviso se muestra al abrir el juego (`scenes/DisclaimerScene.ts`) y en los créditos.

## Modo historia, cuenta y Firestore

No hay login: al abrir el menú se conecta sola una cuenta anónima de Firebase Auth (proveedor _Anonymous_, activado en la consola) y la sesión queda en el navegador. La primera vez se pide el nickname, que es **único** (no lo puede tener otra cuenta) y **queda fijo para siempre**. Sin conexión (o con ESC) se juega arcade y entrenamiento; la historia vuelve a pedir la conexión. Cada partida (13 peleas: 12 amigos y El Acople) sortea 12 amigos al azar (sin repetir ni incluir al elegido) y termina con El Acople; el número está en `STORY_RIVALS` (`src/data/story.ts`), con una pista por amigo.

Cada cuenta guarda **una sola partida** de la historia: CONTINUAR HISTORIA la retoma directo, y NUEVA HISTORIA elige luchador y, si ya había partida, avisa que se borrará cualquier progreso actual.

Firestore (proyecto `pg-fighters`) guarda tres colecciones:

- `ranking/{uid}`: mejor puntaje de la cuenta (con el personaje con que lo hizo).
- `progress/{uid}`: perfil de la cuenta, `{ name, run }`. La partida se borra al terminar la historia. Los formatos viejos (partida suelta o una por personaje) se convierten solos al leerlos: queda la última jugada. El desglose de la última pelea no se guarda (Firestore no acepta listas dentro de listas). Como la cuenta es anónima, borrar los datos del navegador o cambiar de equipo empieza una cuenta nueva. Si no se puede leer, la pantalla de conexión muestra el error y no deja seguir encima del perfil guardado.
- `names/n_<NICKNAME>`: `{ uid, name }`, reserva del nickname (en mayúsculas). Se crea una vez y no se cambia ni se borra.

Reglas necesarias (en la consola de Firebase, junto a las de `ranking`; sin ellas no se guarda el avance ni se puede elegir nickname):

```
match /progress/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
match /names/{name} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
}
```

## Estructura

```
src/
  config.ts              resolución, suelo, paleta, fuentes, escenas, rondas
  data/fighters.ts       roster y personajes
  data/moves.ts          tiempos, daño, alcance, alturas y cadenas de cada golpe
  entities/Fighter.ts    estados, física, lectura de movimientos (↓↘→), buffer, bloqueo, dash
  entities/Cpu.ts        IA por dificultad (bloquea, antiaéreos, castiga, combos, súper)
  entities/Projectile.ts poder
  entities/GuitarSolo.ts solo de guitarra del súper (notas que golpean)
  data/solos.ts          notas, tiempos y daño de cada solo
  data/stages.ts         escenarios (nombre, imagen, música, color)
  systems/StageArt.ts    fondo del escenario (imagen) o, si falta, uno dibujado por código
  scenes/SuperCutInScene retrato del súper a pantalla completa
  systems/               Input, Audio, Settings, FighterArt, Fx
  scenes/                Boot, Preload, Title, Controls, Select, Versus, Fight, Hud, Pause, Results
  ui/ui.ts               texto, menús, keycaps, fondos, transiciones
```

En desarrollo, el juego queda en `window.game`.
