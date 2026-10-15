import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import pkg from './package.json' with { type: 'json' };

/** Material de trabajo del arte (notas, prompts, hojas de origen) que el juego no carga. */
const WORK_FILES = /(\.md|\.txt|prompts?\.json|sources\.json|(^|-)sheet\.png|movement\.png|preview\.jpg|layout\.json)$/;

/** Quita del build el material de trabajo: queda en el repositorio, pero no se publica. */
const stripWorkFiles = (): Plugin => ({
  name: 'strip-work-files',
  apply: 'build',
  closeBundle() {
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (WORK_FILES.test(name)) rmSync(path);
      }
    };
    walk('dist/assets');
  },
});

/**
 * Service worker de caché (sw/sw.js): se publica con la huella de cada archivo del juego, para que la
 * segunda visita cargue del disco y una versión nueva solo descargue lo que cambió.
 */
const serviceWorker = (): Plugin => ({
  name: 'service-worker',
  apply: 'build',
  closeBundle() {
    const manifest: Record<string, string> = {};
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else manifest[relative('dist', path).split('\\').join('/')] = createHash('md5').update(readFileSync(path)).digest('hex').slice(0, 12);
      }
    };
    walk('dist/assets');
    const source = readFileSync('sw/sw.js', 'utf8').replace('const MANIFEST = __MANIFEST__;', `const MANIFEST = ${JSON.stringify(manifest)};`);
    writeFileSync('dist/sw.js', source);
  },
});

export default defineConfig({
  // Rutas relativas: el build funciona en la raíz o en una subcarpeta.
  base: './',
  // Versión del juego (package.json), visible en la pantalla principal.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { chunkSizeWarningLimit: 2000 },
  // El orden importa: primero se quita el material de trabajo y después se arma el manifiesto.
  plugins: [stripWorkFiles(), serviceWorker()],
});
