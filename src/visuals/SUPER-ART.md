# Arte del súper (contrato para el agente de diseño)

## Assets integrados

- `public/assets/portrait-mayin.png` y `portrait-erp.png`: bustos transparentes compartidos entre la entrada del súper (imagen completa), el roster y el HUD (frame cuadrado `face`). Carga: `super-cutin-mayin` / `super-cutin-erp`.
- `public/assets/super-mayin.png` y `super-erp.png`: cuatro sprites de cuerpo completo tocando guitarra, registrados como `mayin-super-0..3` / `erp-super-0..3`. Mayin lleva guitarra sunburst de cinco cuerdas; ERP guitarra negra con borde rojo. El renderer reproduce el blues a 6 fps y el shred a 12 fps. Cada frame se ancla al suelo y mantiene una escala corporal común. Tener estos frames desactiva automáticamente la guitarra provisional.
- Generados con la herramienta integrada `imagegen`, usando las hojas base de cada personaje como referencia de identidad y estilo. Las notas y los efectos conservan su animación existente.

### Prompts de producción

Portraits: un único busto hasta la cintura, tres cuartos mirando a la derecha, expresión segura, puños cerca del pecho, fondo transparente, contornos anime y sombreado cel. Conservar exactamente rostro, pelo, ropa y proporciones de la referencia: Mayin gordito, lentes rectangulares, rulos cortos, barba corta y polo azul; ERP sin barba ni lentes, pelo castaño corto, polo negro y tatuaje ramificado en el antebrazo. Sin guitarra, texto, marco ni fondo. Usar el busto completo para el súper y recortar cabeza/hombros para iconos.

Sprites: exactamente cuatro figuras de cuerpo completo en cuadrícula 2×2 transparente, misma identidad y ropa de las hojas base, mirando a la derecha, guitarra completa dentro de cada celda, pies plantados y escala anatómica constante. Mayin toca guitarra eléctrica semi-hueca sunburst: preparación, rasgueo descendente, bend ascendente y acorde final. ERP toca guitarra eléctrica negra puntiaguda con borde rojo: preparación, downstroke rápido, tapping a dos manos y acorde final. Sin sombras de suelo, auras, texto ni paneles. Corrección de Mayin: cinco cuerdas y cinco clavijas en cada pose, tres arriba y dos abajo; conservar el resto de la hoja.

La lógica y las transiciones ya están hechas. Todo el arte de esta lista es **opcional**: mientras no exista, el juego usa marcadores dibujados por código. Basta con cargar cada archivo con la clave indicada; no hay que cambiar código de combate.

## Secuencia
1. **Retrato a pantalla completa** (`scenes/SuperCutInScene.ts`, unos 2,3 s): la pelea se congela, se oculta el HUD y entra el busto del personaje con el nombre del súper y su frase escribiéndose.
   - MAYINBLUES: "Hola amigo, ¿cómo estás?"
   - ERP: "Lenguaje mata shred."
2. **Solo de guitarra** (`entities/GuitarSolo.ts`): se vuelve al escenario en penumbra con un foco. El personaje toca y las notas vuelan hacia el rival; algunas golpean y la última tumba.
   - ERP: pasaje rápido de licks (shred), unos 2,5 s, con muchas notas pequeñas y veloces.
   - MAYINBLUES: saca su guitarra de **5 cuerdas** y toca un blues, unos 2,5 s, con notas grandes y ondulantes.

## Claves de arte
| Clave | Qué es | Notas |
|---|---|---|
| `super-cutin-mayin`, `super-cutin-erp` | Busto/retrato para la pantalla completa | Textura suelta, fondo transparente, mirando a la derecha, unos 1000 px de alto. Se ancla abajo al centro. Para el lado derecho se refleja solo. |
| `<prefijo>super` o `<prefijo>super-0..n` | Pose tocando la guitarra (cuerpo + guitarra) | Frames en el atlas del luchador (`pata-anime` / `edu-anime`, prefijos `mayin-` / `erp-`), pivot en los pies, 12 fps. **Si existe, no se dibuja la guitarra provisional.** |
| `super-guitar-mayin`, `super-guitar-erp` | Guitarra sola (si no hay pose propia) | Textura suelta, mástil hacia la derecha, origen en el punto donde se sujeta. Mayin: 5 cuerdas, estilo blues. ERP: guitarra de shred. |
| `super-note-mayin`, `super-note-erp` | Nota musical que vuela | Textura suelta de unos 64 px. Si no existe, se usan los caracteres ♪ ♫ ♬. |

Los colores de acento salen de `color` en `data/fighters.ts` (Mayin azul, ERP rojo).

## Cómo revisarlo
Abre `/?sprites`: la pestaña SPRITES marca qué poses tienen arte propio, ANIMACIÓN → [S] muestra el retrato, y ENTRENAMIENTO → [8] lanza el súper completo.

## Tiempos y daño
Las notas del solo, cuáles golpean y su daño están en `data/solos.ts`. Una animación de `super-0..n` debería durar unos 2,5 s (lo que dura el solo) o hacer loop.
