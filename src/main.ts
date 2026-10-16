import { mobileNotice, touchOnly } from './mobileNotice';

/**
 * El juego se carga aparte: en un celular o tablet solo táctil solo sale el aviso de que se juega
 * con teclado, sin descargar el motor ni el arte: ahí el juego no se puede jugar.
 */
const play = () => void ready().then(() => import('./game')).then((m) => m.startGame());

/**
 * Caché (sw/sw.js, solo en la versión publicada). Se espera a que tome el control —máximo 3 s— para
 * que ya la primera visita quede guardada y la segunda cargue del disco.
 */
async function ready(): Promise<void> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./sw.js');
    // Que el navegador no borre los ~300 MB guardados cuando le falte espacio (más probable si se instaló como app).
    void navigator.storage?.persist?.();
    if (navigator.serviceWorker.controller) return;
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
      setTimeout(resolve, 3000);
    });
  } catch {
    // Sin caché (navegador sin soporte o modo privado): el juego carga igual.
  }
}

if (touchOnly()) mobileNotice();
else play();
