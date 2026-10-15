# CODEX — GENERACIÓN DE ASSETS PARA JUEGO DE PELEA 2D

## CONTEXTO DEL PROYECTO

El proyecto es un videojuego de pelea 2D desarrollado en Phaser.

EL JUEGO YA EXISTE Y ESTÁ FUNCIONANDO.

Tu tarea consiste exclusivamente en diseñar, generar e integrar los
assets visuales de los personajes.

NO debes:

- Crear un juego nuevo.
- Reescribir la arquitectura.
- Modificar las mecánicas de combate.
- Cambiar las físicas.
- Modificar controles.
- Reemplazar personajes existentes.
- Alterar hitboxes o hurtboxes.
- Cambiar la lógica de selección de personajes.

Debes trabajar sobre el proyecto actual.

---

# 1. INSPECCIÓN INICIAL

Antes de generar cualquier recurso:

1. Inspecciona la estructura del proyecto.
2. Identifica cómo están implementados los personajes.
3. Revisa los spritesheets existentes.
4. Determina dimensiones, escala y resolución.
5. Identifica las animaciones utilizadas.
6. Comprueba cómo Phaser carga los assets.
7. Reutiliza las convenciones existentes.

IMPORTANTE:

Todos los personajes deben compartir un estilo artístico consistente.

No inventes dimensiones ni formatos antes de inspeccionar el código.

---

# 2. DIRECCIÓN ARTÍSTICA

ESTILO:

- Videojuego de pelea arcade de los años 90.
- Inspiración general: Street Fighter Alpha, King of Fighters y Fatal Fury.
- Pixel art detallado o sprites 2D, según el estilo existente.
- Personajes expresivos y caricaturescos.
- Proporciones ligeramente exageradas.
- Colores definidos.
- Siluetas reconocibles.
- Animaciones fluidas.
- Diseños originales.

TEMÁTICA:

El videojuego presenta guitarristas ficticios que participan en
un torneo de combate absurdo.

Cada personaje representa una personalidad musical diferente.

El humor debe ser sarcástico, exagerado y ridículo.

Los diseños no deben reproducir rostros de personas reales.

---

# 3. ROSTER COMPLETO — 12 PERSONAJES

## 01 — ERP PROJECT

### The Bedroom Legend

APARIENCIA:

- Hombre adulto.
- Alto.
- Complexión robusta.
- Cabello oscuro corto.
- Expresión seria.
- Apariencia de guitarrista de rock moderno.

VESTIMENTA:

- Camiseta negra.
- Jeans oscuros.
- Zapatillas negras.
- Guitarra eléctrica moderna.

PERSONALIDAD VISUAL:

- Postura relajada.
- Actitud de guitarrista solista.
- Movimientos seguros.
- Expresión de concentración.

DETALLES:

- Puede llevar una guitarra eléctrica azul o negra.
- Estética moderna y minimalista.

IMPORTANTE:
Si este personaje ya existe, conservar su diseño original.

---

## 02 — MAYINBLUES

### The Five String Master

APARIENCIA:

- Hombre adulto.
- Complexión delgada.
- Cabello oscuro.
- Apariencia de guitarrista clásico de blues.
- Expresión tranquila.

VESTIMENTA:

- Camisa azul oscuro.
- Jeans.
- Botas.
- Guitarra eléctrica de cinco cuerdas.

PERSONALIDAD VISUAL:

- Postura relajada.
- Actitud despreocupada.
- Movimientos elegantes.
- Apariencia de bluesman experimentado.

DETALLES:

- La guitarra debe tener cinco cuerdas visibles.
- Puede llevar una correa de guitarra de cuero.

IMPORTANTE:
Conservar los sprites existentes si ya están implementados.

---

## 03 — GEORGE

### The Intonation Judge

APARIENCIA:

- Hombre adulto.
- Piel blanca.
- Cabello negro corto.
- Lentes ópticos de montura negra.
- Complexión ligeramente robusta.
- Algo subido de peso.
- Rostro redondeado.
- Expresión seria y crítica.

VESTIMENTA:

- Camisa negra elegante.
- Pantalones oscuros.
- Zapatos negros.

PERSONALIDAD VISUAL:

- Postura erguida.
- Mirada de desaprobación.
- Actitud de profesor exigente.
- Gestos de superioridad intelectual.

DETALLES:

- Puede acomodarse los lentes durante su animación idle.
- Puede cruzar los brazos.
- Debe transmitir obsesión por la precisión musical.

---

## 04 — PEPPER

### The Producer Diva

APARIENCIA:

- Hombre negro de piel oscura.
- Muy alto.
- Complexión delgada.
- Cabello negro largo.
- Chullo negro con orejeras.
- Expresión confiada y presumida.

VESTIMENTA:

- Casaca urbana negra.
- Camiseta oscura.
- Pantalones ajustados.
- Botas negras.
- Audífonos profesionales alrededor del cuello.

PERSONALIDAD VISUAL:

- Actitud de estrella musical.
- Movimientos teatrales.
- Postura relajada.
- Gestos exagerados de superioridad.
- Apariencia de productor musical moderno.

DETALLES:

- El chullo negro es obligatorio.
- El cabello largo debe sobresalir debajo del chullo.
- Los audífonos deben ser visibles.
- Su silueta debe destacar por su gran altura.

---

## 05 — SLANDOR

### The Golden Heir

APARIENCIA:

- Hombre alto.
- Piel clara.
- Cabello rubio corto.
- Rostro juvenil.
- Facciones delicadas.
- Complexión delgada.
- Apariencia extremadamente cuidada.
- Expresión presumida.

VESTIMENTA:

- Chaqueta blanca de diseñador.
- Detalles dorados.
- Camiseta negra.
- Pantalones elegantes.
- Zapatos de lujo.
- Reloj dorado.

PERSONALIDAD VISUAL:

- Apariencia de heredero millonario.
- Movimientos refinados y teatrales.
- Postura sofisticada.
- Sonrisa arrogante.
- Actitud de persona acostumbrada a los privilegios.

ACCESORIOS:

- Guitarra eléctrica dorada de lujo.
- Reloj ostentoso.
- Accesorios exclusivos.

DETALLES:

- Debe transmitir riqueza y extravagancia.
- Su diseño debe parecer el de un príncipe moderno.
- Evitar que parezca un luchador musculoso.

---

## 06 — PENTALICK

### The Five Lick Legend

APARIENCIA:

- Hombre adulto.
- Piel blanca.
- Cabello rojo intenso.
- Complexión delgada y atlética.
- Rostro expresivo.
- Mirada desafiante.

VESTIMENTA:

- Camiseta negra de metal.
- Jeans negros.
- Botas de rockero.
- Muñequeras de cuero.

ACCESORIOS:

- Guitarra eléctrica de metal.
- Correa negra.

PERSONALIDAD VISUAL:

- Rockero clásico.
- Postura agresiva.
- Movimientos exagerados.
- Actitud de estrella de metal.

DETALLES:

- El cabello rojo debe ser claramente visible.
- Puede llevar una guitarra de diseño agresivo.
- Su estética debe recordar a un guitarrista de heavy metal.

---

## 07 — MIMÉTICO

### The Lick Apprentice

APARIENCIA:

- Hombre adulto de muy baja estatura.
- Cabello verde corto.
- Complexión compacta.
- Rostro juvenil.
- Expresión desafiante.
- Apariencia energética.

VESTIMENTA:

- Chaqueta verde oscuro.
- Camiseta negra.
- Pantalones ajustados.
- Botas de combate.

ACCESORIOS:

- Guitarra eléctrica compacta.

PERSONALIDAD VISUAL:

- Luchador pequeño y explosivo.
- Actitud extremadamente competitiva.
- Movimientos rápidos.
- Gestos exagerados.
- Postura agresiva.

DETALLES:

- La baja estatura es su característica principal.
- El cabello verde debe destacar.
- Su diseño debe contrastar con personajes altos.

---

## 08 — CLAVITO

### The Urban Metal Prophet

APARIENCIA:

- Hombre adulto.
- Complexión atlética.
- Cabello negro moderno.
- Expresión de estrella urbana.
- Apariencia extravagante.

VESTIMENTA:

- Chaqueta futurista.
- Camiseta negra.
- Pantalones urbanos.
- Zapatillas modernas.
- Cadenas plateadas.

ACCESORIOS:

- Guitarra eléctrica futurista.
- Accesorios musicales modernos.

PERSONALIDAD VISUAL:

- Mezcla de metalero y artista urbano.
- Movimientos exagerados.
- Actitud de superestrella.
- Estética llamativa.
- Postura de músico que se considera revolucionario.

DETALLES:

- Fusionar elementos visuales del metal y la música urbana.
- Mantener una apariencia original.
- Evitar copiar vestimentas de artistas reales.

---

## 09 — CHANTAL

### The Andean Waiter

APARIENCIA:

- Hombre adulto peruano de rasgos andinos.
- Piel cobriza.
- Cabello negro corto.
- Complexión delgada.
- Rostro expresivo.
- Expresión amable, pero desafiante.

VESTIMENTA:

- Uniforme clásico de mozo de restaurante.
- Camisa blanca de manga larga.
- Chaleco negro elegante.
- Corbatín negro.
- Pantalón negro de vestir.
- Zapatos negros.
- Delantal negro amarrado a la cintura.

ACCESORIOS:

- Bandeja plateada de restaurante.
- Guitarra eléctrica colgada en la espalda.
- Paño blanco sobre el antebrazo.

PERSONALIDAD VISUAL:

- Postura extremadamente educada.
- Sonrisa de atención al cliente.
- Actitud de guerrero que nunca pierde la compostura.
- Movimientos elegantes.
- Apariencia de mozo profesional convertido en luchador.

DETALLES:

- Puede sostener una bandeja con una mano.
- Su pose idle puede incluir acomodarse el corbatín.
- Su pose de victoria puede incluir una reverencia.
- El uniforme de mozo debe ser inmediatamente reconocible.
- Mantener un diseño original y caricaturesco.

---

## 10 — JEAN-PIERRE

### Monsieur Six Strings

APARIENCIA:

- Hombre adulto.
- Apariencia de caballero francés elegante.
- Complexión delgada.
- Cabello castaño oscuro bien peinado.
- Rostro refinado.
- Expresión tranquila.
- Apariencia sofisticada.

VESTIMENTA:

- Traje negro moderno.
- Camisa blanca.
- Pañuelo rojo.
- Zapatos elegantes.

ACCESORIOS:

- Guitarra eléctrica de lujo.
- Detalles plateados.

PERSONALIDAD VISUAL:

- Elegancia francesa exagerada.
- Postura de esgrimista.
- Movimientos refinados.
- Actitud de músico virtuoso internacional.

DETALLES:

- Puede realizar una reverencia antes de combatir.
- Su vestimenta debe contrastar con los guitarristas de metal.
- Debe parecer un caballero sofisticado.

---

## 11 — FERDEX

### The Progressive Guitarist

APARIENCIA:

- Hombre adulto.
- Piel trigueña.
- Complexión robusta.
- Ligeramente gordito.
- Bigote negro prominente.
- Cabello negro corto.
- Rostro expresivo.
- Apariencia de músico brasileño.

VESTIMENTA:

- Camisa tropical abierta.
- Camiseta interior.
- Pantalones oscuros.
- Zapatillas urbanas.
- Detalles verdes y amarillos.

ACCESORIOS:

- Guitarra eléctrica moderna.

PERSONALIDAD VISUAL:

- Relajado.
- Carismático.
- Expresivo.
- Estilo de guitarrista de fusión brasileña.
- Movimientos fluidos.

DETALLES:

- El bigote debe ser prominente.
- La complexión debe ser ligeramente robusta.
- Mantener una estética tropical y musical.

---

## 12 — TURBOSHRED

### The Shred Machine

APARIENCIA:

- Hombre adulto.
- Complexión delgada pero extremadamente musculosa.
- Musculatura muy definida.
- Brazos marcados.
- Abdominales visibles.
- Hombros definidos.
- Cabello largo.
- Rostro anguloso.
- Expresión intensa.

IMPORTANTE:
No debe parecer un fisicoculturista enorme.

Debe tener un cuerpo delgado, fibroso y muy marcado,
similar al de un atleta de calistenia.

VESTIMENTA:

- Camiseta sin mangas.
- Pantalones negros ajustados.
- Botas de rockero.
- Muñequeras.

ACCESORIOS:

- Guitarra eléctrica de shred.
- Correa negra.

PERSONALIDAD VISUAL:

- Postura agresiva.
- Movimientos rápidos.
- Actitud competitiva.
- Presencia intimidante.

DETALLES:

- Priorizar definición muscular sobre volumen.
- El cabello largo debe ser visible.
- Su silueta debe transmitir velocidad y potencia.

---

# 4. GENERACIÓN DE SPRITES

Para cada personaje nuevo:

1. Crear un diseño visual consistente.
2. Generar el sprite principal.
3. Crear los frames necesarios según las animaciones
   que utiliza actualmente el juego.
4. Mantener proporciones y escala.
5. Usar fondos transparentes.
6. Evitar diferencias de tamaño entre frames.
7. Mantener consistente la apariencia del personaje.
8. Organizar los archivos según la estructura existente.

Inspeccionar si el proyecto utiliza:

- Spritesheets.
- Texture atlases.
- PNG individuales.
- Animaciones generadas mediante código.

Adaptarse al formato actual.

No asumir dimensiones ni número de frames sin
inspeccionar primero el proyecto.

---

# 5. ANIMACIONES

Inspeccionar primero las animaciones existentes.

Si el juego utiliza estas animaciones, generar
los frames correspondientes:

- Idle.
- Walk forward.
- Walk backward.
- Jump.
- Crouch.
- Punch.
- Kick.
- Special attack.
- Hit reaction.
- Knockdown.
- Victory.
- Defeat.

No agregar animaciones innecesarias.

Todos los frames deben:

- Mantener escala consistente.
- Respetar la posición de los pies.
- Evitar deformaciones.
- Mantener vestimenta y accesorios.
- Tener transparencia correcta.

---

# 6. RETRATOS PARA EL ROSTER

Crear un retrato de selección para cada personaje.

REQUISITOS:

- Mostrar rostro y parte superior del cuerpo.
- Expresión representativa de su personalidad.
- Mantener el estilo arcade.
- Mantener dimensiones uniformes.
- Fondo transparente o compatible con el diseño existente.
- No incluir nombres dentro de la imagen.

Los retratos deben ser coherentes con los sprites
utilizados durante el combate.

---

# 7. ORGANIZACIÓN DE ARCHIVOS

Respetar la estructura existente.

Si no existe una organización definida, proponer:

public/assets/characters/
erp/
mayin/
george/
pepper/
slandor/
pentalick/
mimetico/
clavito/
chantal/
jeanpierre/
ferdex/
turboshred/

Cada carpeta puede contener:

- portrait.png
- idle.png
- walk.png
- jump.png
- attack.png
- hit.png
- victory.png

IMPORTANTE:
Esta estructura es referencial.

Utilizar el formato real del proyecto si ya existe.

---

# 8. REQUISITOS DE CALIDAD

- Cada personaje debe ser reconocible por su silueta.
- Mantener consistencia de colores y proporciones.
- Evitar cambios de vestimenta entre animaciones.
- Evitar deformaciones en manos y guitarras.
- Mantener transparencia correcta.
- No incluir fondos dentro de los sprites.
- No utilizar imágenes de personas reales.
- No copiar personajes existentes de otros videojuegos.
- No generar texto dentro de los sprites.
- Mantener la dirección visual del personaje entre frames.

---

# 9. INTEGRACIÓN EN PHASER

Guardar los assets en las carpetas correspondientes.

Actualizar únicamente las referencias necesarias
para que Phaser pueda cargar los nuevos recursos.

No modificar:

- Combate.
- Físicas.
- Controles.
- Hitboxes.
- Hurtboxes.
- Sistema de daño.
- Inteligencia artificial.

Si algún personaje ya existe, conservar sus
sprites originales salvo que se solicite reemplazarlos.

Si faltan herramientas para generar imágenes,
informar la limitación.

No sustituir los sprites finales por dibujos
procedurales de baja calidad sin autorización.

---

# 10. RESULTADO ESPERADO

Entregar:

- Assets visuales de los personajes.
- Spritesheets compatibles con Phaser.
- Retratos para la pantalla de selección.
- Animaciones visuales requeridas por el juego.
- Archivos organizados correctamente.

Al finalizar, informar:

1. Personajes con assets completos.
2. Personajes con assets parciales.
3. Animaciones generadas.
4. Archivos creados.
5. Archivos modificados.
6. Recursos pendientes.
7. Problemas encontrados.

PRIORIDAD ABSOLUTA:

Mantener el estilo visual del juego existente.

NO reconstruir el videojuego.

NO modificar la lógica de combate.

SOLO CREAR E INTEGRAR ASSETS VISUALES.
