# Estado del arte del roster

Generación: herramienta integrada `image_gen` con las hojas anime del proyecto como referencia de estilo. Todos los diseños son ficticios.

| Personaje | ID | Paquete visual |
| --- | --- | --- |
| ERP PROJECT | erp | Nuevo paquete pendiente: 19/27 fuentes presentes; crouch y crouchPunch requieren reparación; ocho movimientos faltantes; arte anterior conservado, sin conectar |
| MAYINBLUES | mayin | Nuevo paquete pendiente: 19/27 fuentes presentes; special-attack requiere instrumento aprobado; ocho movimientos faltantes; arte anterior conservado, sin conectar |
| GEORGE | george | Diseño corregido integrado: 27 animaciones de ocho cuadros y retrato; reproducción en juego pendiente de verificar |
| PEPPER | pepper | Atlas clásico conservado. Nuevo paquete: 19/27 fuentes presentes; crouch y special-attack requieren reparación; ocho movimientos faltantes, sin conectar |
| SLANDOR | slandor | Completo |
| PENTALICK | pentalick | Completo |
| MIMÉTICO | mimetico | Completo |
| CLAVITO | clavito | Completo |
| CHANTAL | chantal | Completo |
| JEAN-PIERRE | jeanpierre | Completo |
| FERDEX | ferdex | Completo |
| TURBOSHRED | turboshred | Completo |
| TOXICITY | toxicity | Completo |
| LA REMATADA | rematada | Completo |
| DOCTOR ESCALAS | escalas | Completo |
| TAYLOY | tayloy | Completo |
| JESEX | jesex | Completo |
| MARKUS | markus | Completo |
| PLATANERO | platanero | Completo |
| RICARDO | ricardo | Completo |
| KIMBERLY | kimberly | Completo |
| NOSU | nosu | Integrado: 27 animaciones de ocho cuadros y retrato; revisión visual en juego pendiente |
| EL VIRREY | virrey | Integrado: 27 animaciones de ocho cuadros y retrato; pruebas de juego a cargo del usuario |
| INTI | inti | Integrado: 27 animaciones de ocho cuadros y retrato; dash y derrota reparados; pruebas de juego a cargo del usuario |
| AMU | amu | Integrado: 27 animaciones de ocho cuadros y retrato; atlas y build verificados; personaje y retrato comprobados en combate |
| EL ACOPLE | acople | Completo |

Los paquetes clásicos usan `atlas.png`/`atlas.json`; NOSU, George, Virrey, Inti y Amu usan el multiatlas `animations/atlas.json` con sus páginas y `metadata.json` en pelea y laboratorio. Las hojas de origen y los prompts viven en `codex/` (ver `AGENTS.md`).

ERP, Mayin y Pepper: generación integrada interrumpida por `429 usage_limit_reached`; reintento confirmado tras pedir continuar. No se usó API de pago. Registro para retomar y validaciones en `codex/output/animation-integration/erp-mayin-pepper/`. Ninguno de estos tres fue agregado a `REGENERATED_ART_IDS`; las pruebas de juego quedan a cargo del usuario.
