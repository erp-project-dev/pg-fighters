/** Dirección pública del juego (para mandársela a la PC). */
const GAME_URL = 'https://erp-project-dev.github.io/pg-fighters/';

/**
 * Equipo solo táctil: ningún puntero fino (mouse o trackpad). Una PC con pantalla táctil
 * o una tablet con trackpad pasan directo al juego.
 */
export const touchOnly = (): boolean => {
  try {
    return !window.matchMedia('(any-pointer: fine)').matches && navigator.maxTouchPoints > 0;
  } catch {
    return false;
  }
};

const STYLE = `
.pgm { position: fixed; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; padding: 24px 16px;
  background: radial-gradient(ellipse at top, #24202e 0%, #0b0a0e 70%); color: #e9e5d9; font-family: 'Barlow', system-ui, sans-serif; overflow-y: auto; }
.pgm-card { width: 100%; max-width: 420px; text-align: center; }
.pgm-logo { font-family: 'Barlow Condensed', sans-serif; font-style: italic; font-weight: 900; line-height: 0.82; margin: 0 0 28px; }
.pgm-logo b { display: block; font-size: 110px; color: #e9e5d9; text-shadow: 5px 5px 0 #000; }
.pgm-logo span { display: block; font-size: 64px; color: #dfff00; text-shadow: 0 0 24px #dfff0066; }
.pgm h1 { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 30px; line-height: 1.1; margin: 0 0 14px; text-transform: uppercase; }
.pgm p { font-size: 17px; line-height: 1.45; margin: 0 0 12px; color: #c9c5b9; }
.pgm-actions { display: flex; flex-direction: column; gap: 12px; margin: 26px 0 22px; }
.pgm a.pgm-btn, .pgm button.pgm-btn { display: block; padding: 15px 18px; border: 0; border-radius: 6px; font: 800 20px 'Barlow Condensed', sans-serif;
  letter-spacing: 1px; text-transform: uppercase; text-decoration: none; cursor: pointer; }
.pgm-wa { background: #dfff00; color: #0b0a0e; }
.pgm-copy { background: transparent; color: #e9e5d9; box-shadow: inset 0 0 0 2px #e9e5d9; }
`;

/** Aviso a pantalla completa: el juego solo se juega en computadora; en táctil no se carga nada. */
export const mobileNotice = (): void => {
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.append(style);

  const text = `¡A pelear! PG Fighters, el juego de pelea de Peru Guitar. Ábrelo en tu compu: ${GAME_URL}`;
  const box = document.createElement('div');
  box.className = 'pgm';
  box.innerHTML = `
    <div class="pgm-card">
      <div class="pgm-logo"><b>PG</b><span>FIGHTERS</span></div>
      <h1>🎸 Solo para computadora</h1>
      <p>Se juega con teclado: moverse, combos, especiales y ultimates necesitan teclas de verdad.</p>
      <p>Ábrelo en tu PC o laptop y entra a pelear.</p>
      <div class="pgm-actions">
        <a class="pgm-btn pgm-wa" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">Mandarme el link por WhatsApp</a>
        <button class="pgm-btn pgm-copy" type="button">Copiar link</button>
      </div>
    </div>`;
  document.body.append(box);

  const copy = box.querySelector<HTMLButtonElement>('.pgm-copy')!;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(GAME_URL);
      copy.textContent = '¡Link copiado!';
    } catch {
      copy.textContent = GAME_URL;
    }
  });
};
