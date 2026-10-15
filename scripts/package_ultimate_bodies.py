"""Package four drawn guitar-playing poses without overwriting any original atlas.
Run with Pillow: python scripts/package_ultimate_bodies.py [fighter ...]
"""
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/ultimate-bodies'
# Hojas de origen de los cuerpos (no se suben).
SHEETS = ROOT / 'codex/assets/ultimate-bodies'
IDS = ['george', 'pepper', 'slandor', 'pentalick', 'mimetico', 'clavito',
       'chantal', 'jeanpierre', 'ferdex', 'turboshred', 'toxicity', 'rematada', 'escalas',
       'tayloy', 'jesex', 'markus', 'platanero']


def package(fighter):
    source_name = fighter
    fighter = {'markus': 'markus', 'ron': 'platanero'}.get(fighter, fighter)
    if source_name != fighter:
        import shutil
        shutil.copy2(SHEETS / f'{source_name}-sheet.png', SHEETS / f'{fighter}-sheet.png')
    base = ROOT / 'public/assets/characters' / fighter
    sheet = Image.open(SHEETS / f'{fighter}-sheet.png').convert('RGBA')
    atlas = Image.open(base / 'atlas.png').convert('RGBA')
    data = json.loads((base / 'atlas.json').read_text())
    original = data['frames'][f'{fighter}-super']['frame']
    cells = []
    for i in range(4):
        left = (i % 2) * sheet.width // 2
        top = (i // 2) * sheet.height // 2
        right = ((i % 2) + 1) * sheet.width // 2
        bottom = ((i // 2) + 1) * sheet.height // 2
        cell = sheet.crop((left, top, right, bottom))
        bounds = cell.getchannel('A').point(lambda a: 255 if a > 80 else 0).getbbox()
        if not bounds:
            raise ValueError(f'{fighter}: empty cell {i}')
        cells.append(cell.crop(bounds))
    # A shared anatomical scale preserves natural head/shoulder movement between frames.
    ratio = original['h'] / min(im.height for im in cells)
    cells = [im.resize((round(im.width * ratio), round(im.height * ratio)), Image.Resampling.LANCZOS)
             for im in cells]
    padding = 8
    row_width = sum(im.width + padding * 2 for im in cells)
    row_height = max(im.height for im in cells) + padding * 2
    width = max(atlas.width, row_width)
    height = atlas.height + row_height
    if width > 4096 or height > 4096:
        raise ValueError(f'{fighter}: atlas exceeds 4096: {width}x{height}')
    combined = Image.new('RGBA', (width, height))
    combined.alpha_composite(atlas)
    x = padding
    for i, im in enumerate(cells):
        y = atlas.height + padding
        combined.alpha_composite(im, (x, y))
        # Feet anchor: centroid of opaque pixels in the bottom 12 rows.
        alpha = im.getchannel('A')
        feet = [(xx, yy) for yy in range(max(0, im.height - 12), im.height)
                for xx in range(im.width) if alpha.getpixel((xx, yy)) > 100]
        anchor = sum(xx for xx, _ in feet) / len(feet) if feet else im.width / 2
        data['frames'][f'{fighter}-super-{i}'] = {
            'frame': {'x': x, 'y': y, 'w': im.width, 'h': im.height},
            'rotated': False, 'trimmed': False,
            'sourceSize': {'w': im.width, 'h': im.height},
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': im.width, 'h': im.height},
            'pivot': {'x': anchor / im.width, 'y': 1},
        }
        x += im.width + padding * 2
    image_name = f'{fighter}-atlas.png'
    data['meta']['image'] = image_name
    data['meta']['size'] = {'w': width, 'h': height}
    combined.save(DEST / image_name, optimize=True)
    (DEST / f'{fighter}-atlas.json').write_text(json.dumps(data, indent=2) + '\n')
    # Only switch completed packages into the loader, so work in progress uses original art.
    available = [name for name in IDS if (DEST / f'{name}-atlas.json').exists()]
    catalog = ROOT / 'src/visuals/roster/UltimateBodies.ts'
    catalog.write_text("import type { FighterId } from '../../data/fighters';\n\n"
        + "/** Completed four-frame body animations; original atlases are preserved. */\n"
        + 'export const ULTIMATE_BODY_IDS: readonly FighterId[] = '
        + json.dumps(available, indent=2) + ';\n')
    print(f'{fighter}: 4 super frames; {width}x{height}')


if __name__ == '__main__':
    for fighter in sys.argv[1:] or IDS:
        package(fighter)
