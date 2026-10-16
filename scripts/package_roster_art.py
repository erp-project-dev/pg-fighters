"""Extract and pack generated sprite silhouettes into Phaser JSON atlases.
Requires Pillow. Preserves original RGBA, only isolates/repositions source sprites.
Usage: python scripts/package_roster_art.py [character ids...]
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageFilter

# El arte final (atlas, retrato, metadatos) va a public/; las hojas de origen y cortes viven en codex/ (no se suben).
ROOT = Path(__file__).resolve().parents[1] / 'public/assets/characters'
SRC = Path(__file__).resolve().parents[1] / 'codex/assets/characters'
BASE = ['idle', 'walk-0', 'walk-1', 'jump', 'crouch',
        'punch', 'kick', 'special', 'hurt', 'block',
        'crouchPunch', 'sweep', 'airPunch', 'airKick', 'uppercut',
        'knockdown', 'ko', 'win', 'super', 'portrait']
EXTRA = ['dash-0', 'dash-1', 'dash-2', 'backdash-0', 'backdash-1', 'backdash-2',
         'getup', 'crouchHurt', 'crouchBlock']
ALIASES = {'walkBack-0': 'walk-1', 'walkBack-1': 'walk-0', 'fall': 'jump',
           'intro': 'idle', 'down': 'ko', 'throw': 'special',
           'crouchPunch-0': 'crouch', 'crouchPunch-1': 'crouchPunch', 'crouchPunch-2': 'crouch',
           'sweep-0': 'crouch', 'sweep-1': 'sweep', 'sweep-2': 'crouch'}


def extract(path, poses, cols, row_counts=None, component_splits=None):
    im = Image.open(path).convert('RGBA')
    if im.getchannel('A').getextrema()[0] == 255:
        raise ValueError(f'{path}: opaque image')
    w, h = im.size
    data = bytearray(im.getchannel('A').point(lambda a: 255 if a > 160 else 0).tobytes())
    components = []
    for p in range(w*h):
        if not data[p]:
            continue
        stack = [p]
        data[p] = 0
        points = []
        x0, y0, x1, y1 = w, h, 0, 0
        while stack:
            v = stack.pop()
            y, x = divmod(v, w)
            points.append(v)
            x0, y0, x1, y1 = min(x0,x), min(y0,y), max(x1,x), max(y1,y)
            neighbors = ([v-1] if x else []) + ([v+1] if x+1<w else []) + ([v-w] if y else []) + ([v+w] if y+1<h else [])
            for q in neighbors:
                if data[q]:
                    data[q] = 0
                    stack.append(q)
        if len(points) > 1000:
            components.append({'box': [x0, y0, x1+1, y1+1], 'points': points})
    # Explicit packing seams for adjacent figures that touch in a source sheet.
    # Preserve source pixels; only assign each side to its own atlas region.
    for split in component_splits or []:
        matches = [c for c in components if c['box'] == split['box']]
        if len(matches) != 1:
            raise ValueError(f'{path}: component split does not match source bounds')
        comp = matches[0]
        axis = 'y' if 'y' in split else 'x'
        parts = [[v for v in comp['points'] if ((v // w if axis == 'y' else v % w) < split[axis]) == side]
                 for side in (True, False)]
        if any(not points for points in parts):
            raise ValueError(f'{path}: empty component split')
        components.remove(comp)
        for points in parts:
            xs, ys = [v % w for v in points], [v // w for v in points]
            components.append({'box': [min(xs), min(ys), max(xs)+1, max(ys)+1], 'points': points})
    if len(components) != len(poses):
        raise ValueError(f'{path}: {len(components)} silhouettes, expected {len(poses)}; manual regions required')
    components.sort(key=lambda c: c['box'][3])
    ordered = []
    start = 0
    for count in row_counts or [cols] * ((len(components)+cols-1)//cols):
        ordered.extend(sorted(components[start:start+count], key=lambda c: (c['box'][0]+c['box'][2])/2))
        start += count
    sprites = {}
    boxes = {}
    for pose, comp in zip(poses, ordered):
        x0,y0,x1,y1 = comp['box']
        box = [max(0,x0-3),max(0,y0-3),min(w,x1+3),min(h,y1+3)]
        left,top,right,bottom = box
        mask = Image.new('L', (right-left,bottom-top))
        mp = mask.load()
        for v in comp['points']:
            y,x=divmod(v,w)
            mp[x-left,y-top]=255
        # Include original antialias edge, exclude neighboring disconnected sprites.
        mask = mask.filter(ImageFilter.MaxFilter(5))
        sprite = im.crop(box)
        alpha = sprite.getchannel('A')
        alpha.paste(0, (0,0), mask.point(lambda a: 0 if a else 255))
        sprite.putalpha(alpha)
        feet = [(v%w)-left for v in comp['points'] if v//w >= y1-10]
        anchor = sum(feet)/len(feet) if feet else sprite.width/2
        if pose in ('knockdown','ko','portrait'):
            anchor = sprite.width/2
        sprites[pose] = (sprite, anchor/sprite.width, (y1-top)/sprite.height)
        boxes[pose] = box
    return sprites, boxes


def package(character):
    folder = ROOT / character
    folder.mkdir(parents=True, exist_ok=True)
    source_dir = SRC / character
    layout_path = source_dir/'layout.json'
    layout = json.loads(layout_path.read_text()) if layout_path.exists() else {}
    base_poses = [pose for pose in BASE if pose not in layout.get('omitBasePoses', [])]
    sprites, boxes = extract(source_dir/'sheet.png', base_poses, 5, layout.get('baseRows'), layout.get('componentSplits'))
    scales = {pose: 1 for pose in sprites}
    if (source_dir/'movement.png').exists():
        extra, extra_boxes = extract(source_dir/'movement.png', EXTRA, 3)
        movement_scale = sprites['idle'][0].height / extra['dash-2'][0].height
        sprites.update(extra)
        boxes.update({f'movement/{key}': val for key,val in extra_boxes.items()})
        scales.update({pose: movement_scale for pose in extra})
    if layout.get('repairPoses'):
        repaired, repair_boxes = extract(folder/layout['repairFile'], layout['repairPoses'], layout.get('repairCols',len(layout['repairPoses'])))
        for pose,sprite in repaired.items():
            if pose == 'idle':
                # artScale uses idle height as the reference for every other pose.
                # Keep that reference stable when replacing a high-resolution idle.
                height = sprites['idle'][0].height
                image,px,py = sprite
                width = max(1,round(image.width*height/image.height))
                sprite = (image.resize((width,height),Image.Resampling.LANCZOS),px,py)
            sprites[pose] = sprite
            scales[pose] = sprites['idle'][0].height * (1.15 if pose=='uppercut' else 1) / sprite[0].height
            boxes[f'repair/{pose}'] = repair_boxes[pose]
    repairs = [
        ('uppercuts.png', ['clavito','ferdex'], {'clavito':'uppercut','ferdex':'uppercut'}),
        ('block-uppercut.png', ['turboshred'], {'turboshred':'uppercut'}),
    ]
    for filename, ids, poses in repairs:
        source = SRC/'repairs'/filename
        if character in ids and source.exists():
            repaired, repair_boxes = extract(source, ids, 2)
            pose = poses[character]
            sprite = repaired[character]
            sprites[pose] = sprite
            # Raised fist makes an uppercut taller than neutral guard.
            scales[pose] = sprites['idle'][0].height * (1.15 if pose=='uppercut' else 1) / sprite[0].height
            boxes[f'repair/{pose}'] = repair_boxes[character]
    # Compact shelves avoid allocating the largest movement cell for every pose.
    placements = {}
    x,y,shelf_h = 6,6,0
    atlas_width = 2048
    used_width = 0
    for pose,(sprite,_,_) in sorted(sprites.items(),key=lambda item:-item[1][0].height):
        if x+sprite.width+6 > atlas_width:
            x,y,shelf_h = 6,y+shelf_h+12,0
        placements[pose]=(x,y)
        used_width=max(used_width,x+sprite.width+6)
        x+=sprite.width+12
        shelf_h=max(shelf_h,sprite.height)
    atlas = Image.new('RGBA', (used_width,y+shelf_h+6))
    frames = {}
    for pose,(sprite,px,py) in sprites.items():
        x,y = placements[pose]
        atlas.paste(sprite,(x,y))
        w,h=sprite.size
        frames[f'{character}-{pose}'] = {'frame': {'x':x,'y':y,'w':w,'h':h},
            'rotated':False,'trimmed':False,'sourceSize':{'w':w,'h':h},
            'spriteSourceSize':{'x':0,'y':0,'w':w,'h':h},'pivot':{'x':px,'y':py}}
    for alias,source in ALIASES.items():
        frames[f'{character}-{alias}']=frames[f'{character}-{source}']
        scales[alias]=scales[source]
    portrait=sprites['portrait'][0].copy()
    ratio=min(512/portrait.width,512/portrait.height)
    portrait=portrait.resize((round(portrait.width*ratio),round(portrait.height*ratio)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(512,512))
    canvas.paste(portrait,((512-portrait.width)//2,512-portrait.height))
    canvas.save(folder/'portrait.png')
    atlas.save(folder/'atlas.png')
    (folder/'atlas.json').write_text(json.dumps({'frames':frames,'meta':{
        'image':'atlas.png','format':'RGBA8888','size':{'w':atlas.width,'h':atlas.height},'scale':'1'}},indent=2)+'\n')
    (folder/'metadata.json').write_text(json.dumps({'sourceRegions':boxes,'scales':scales,
        'paintedPoses':list(sprites),'hasMovement':(source_dir/'movement.png').exists(),
        **({'visualHeight': layout['visualHeight']} if 'visualHeight' in layout else {})},indent=2)+'\n')
    print(f'{character}: {len(sprites)} painted poses, {len(frames)} atlas entries, 512x512 portrait')


if __name__=='__main__':
    for character in sys.argv[1:] or [p.parent.name for p in sorted(SRC.glob('*/sheet.png'))]:
        package(character)
