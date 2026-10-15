---
name: push
description: Reglas para hacer push en PG Fighters. Úsalo cuando el usuario pida "push", "sube los cambios", "publica" o similar, y también antes de cualquier git push. Nunca hagas push si el usuario no lo pidió explícitamente; al pedirlo, propone si la versión es patch, minor o major y actualiza package.json.
---

# Push en PG Fighters

Hacer push a `main` publica el sitio en GitHub Pages. Por eso:

## 1. Nunca hagas push sin que te lo pidan

- **No ejecutes `git push`** a menos que el usuario lo pida explícitamente en ese mensaje ("haz push", "sube", "publica"…).
- Hacer commit no implica push. Terminar una tarea no implica push. Un push aprobado antes no autoriza el siguiente.
- Si crees que convendría subir, dilo en una línea y espera.

## 2. Cuando pida push: primero la versión

Antes de subir, revisa lo que se va a publicar (`git log origin/main..HEAD`, `git diff origin/main --stat` y lo que esté sin commitear) y dile al usuario qué tipo de versión es, con la versión actual de `package.json` y la propuesta:

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| **major** | Cambio grande que rompe lo anterior: partidas o cuentas guardadas incompatibles, rediseño completo, cambio de reglas del juego | `1.4.2 → 2.0.0` |
| **minor** | Algo nuevo: personaje, escenario, modo, pantalla o función nueva | `1.4.2 → 1.5.0` |
| **patch** | Arreglos, ajustes de balance, retoques de arte o textos | `1.4.2 → 1.4.3` |

Formato de la respuesta:

> Cambios: <resumen corto>
> Versión: **minor** — 1.4.2 → 1.5.0 (motivo en una línea)
> ¿Subo con esa versión?

Espera la confirmación (el usuario puede elegir otro tipo).

## 3. Al confirmar

1. Actualiza `"version"` en `package.json` (y `package-lock.json` si existe) con `npm version <tipo> --no-git-tag-version`.
2. Corre la build (`npm run build`) y, si existen, los tests. Si fallan, para y avisa.
3. Haz commit (incluye el cambio de versión; mensaje en español).
4. `git push` como **último paso, separado**, nunca encadenado con el commit: el usuario puede escribir "espera" a último momento.
