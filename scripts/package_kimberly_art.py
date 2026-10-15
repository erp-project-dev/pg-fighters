"""Package Kymberly's combat, movement and four-frame guitar solo assets."""
import json
from PIL import Image
from package_roster_art import ROOT, SRC, extract, package


def main():
    package('kimberly')
    folder = ROOT / 'kimberly'
    atlas = Image.open(folder / 'atlas.png').convert('RGBA')
    data = json.loads((folder / 'atlas.json').read_text())
    metadata = json.loads((folder / 'metadata.json').read_text())
    poses = [f'super-{i}' for i in range(4)]
    sprites, boxes = extract(SRC / 'kimberly' / 'solo.png', poses, 2)
    target = data['frames']['kimberly-idle']['frame']['h'] * 1.05
    ratio = target / max(s[0].height for s in sprites.values())
    resized = {pose: (sprite.resize((round(sprite.width*ratio), round(sprite.height*ratio)), Image.Resampling.LANCZOS), px, py)
               for pose, (sprite, px, py) in sprites.items()}
    width = max(atlas.width, sum(s[0].width + 12 for s in resized.values()) + 12)
    canvas = Image.new('RGBA', (width, atlas.height + round(target) + 24))
    canvas.paste(atlas, (0, 0))
    x, y = 6, atlas.height + 12
    for pose, (sprite, px, py) in resized.items():
        canvas.paste(sprite, (x, y))
        w, h = sprite.size
        data['frames'][f'kimberly-{pose}'] = {'frame': {'x': x, 'y': y, 'w': w, 'h': h},
            'rotated': False, 'trimmed': False, 'sourceSize': {'w': w, 'h': h},
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'pivot': {'x': px, 'y': py}}
        metadata['scales'][pose] = 1
        metadata['paintedPoses'].append(pose)
        metadata['sourceRegions'][f'solo/{pose}'] = boxes[pose]
        x += w + 12
    data['meta']['size'] = {'w': canvas.width, 'h': canvas.height}
    canvas.save(folder / 'atlas.png')
    (folder / 'atlas.json').write_text(json.dumps(data, indent=2) + '\n')
    (folder / 'metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
    preview = Image.new('RGB', (1000, 1080), (25, 29, 40))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(preview)
    for i, pose in enumerate(metadata['paintedPoses']):
        r = data['frames'][f'kimberly-{pose}']['frame']
        sprite = canvas.crop((r['x'], r['y'], r['x']+r['w'], r['y']+r['h']))
        sprite.thumbnail((155, 145))
        x, y = i % 6 * 166, i // 6 * 180
        preview.paste(sprite, (x+(166-sprite.width)//2, y), sprite)
        draw.text((x+3, y+148), pose, fill='white')
    preview.save(folder / 'preview.jpg', quality=92)
    print(f"Kymberly: {len(metadata['paintedPoses'])} painted poses; {len(data['frames'])} atlas frames")


if __name__ == '__main__':
    main()
