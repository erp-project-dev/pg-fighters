"""Comprime las páginas de animación (public/assets/characters/<id>/animations/*.png) a paleta de 256 colores.

Reemplaza cada PNG en su lugar (mismo tamaño y misma posición de cuadros, así que atlas.json sigue valiendo).
A la vista no cambia y pesan ~85 % menos. Una página ya en paleta se salta, así que se puede correr de nuevo
después de cada entrega de arte.

Uso: python scripts/compress_animations.py [id ...]   (sin ids: todos los personajes con animations/)
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'public/assets/characters'


def compress(path: Path) -> tuple[int, int]:
    before = path.stat().st_size
    img = Image.open(path)
    if img.mode == 'P':
        return before, before
    q = img.convert('RGBA').quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    q.save(path, optimize=True)
    return before, path.stat().st_size


def main() -> None:
    ids = sys.argv[1:] or sorted(p.parent.name for p in ROOT.glob('*/animations'))
    total_before = total_after = 0
    for fighter in ids:
        folder = ROOT / fighter / 'animations'
        if not folder.is_dir():
            print(f'{fighter}: sin animations/, se salta')
            continue
        before = after = 0
        for png in sorted(folder.glob('*.png')):
            b, a = compress(png)
            before += b
            after += a
        print(f'{fighter}: {before / 1e6:.1f} MB -> {after / 1e6:.1f} MB')
        total_before += before
        total_after += after
    print(f'TOTAL: {total_before / 1e6:.1f} MB -> {total_after / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
