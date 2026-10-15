"""Pack Ricardo's generated pose grids into the existing Phaser atlas format.
Requires Pillow. Originals are preserved as named source sheets.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from package_roster_art import extract as extract_silhouettes

# Hojas de origen en codex/ (no se suben); el paquete final va a public/.
SRC = Path(__file__).resolve().parents[1] / 'codex/assets/characters/ricardo'
ROOT = Path(__file__).resolve().parents[1] / 'public/assets/characters/ricardo'
ROOT.mkdir(parents=True, exist_ok=True)
GROUPS = {
 'guard': ['idle', 'walk-0', 'walk-1', 'crouch'],
 'air': ['jump', 'fall', 'airPunch', 'airKick'],
 'attacks': ['punch', 'kick', 'special', 'uppercut'],
 'low': ['crouchPunch', 'sweep', 'crouchHurt', 'crouchBlock'],
 'reaction': ['hurt', 'block', 'knockdown', 'ko'],
 'movement': ['dash-0', 'dash-1', 'dash-2', 'backdash-0', 'backdash-1', 'backdash-2'],
 'ceremony': ['intro', 'win', 'getup', 'super'],
 'solo': ['super-0', 'super-1', 'super-2', 'super-3'],
}
TARGET = {'crouch': 208, 'crouchPunch': 208, 'sweep': 180, 'crouchHurt': 208,
          'crouchBlock': 208, 'jump': 285, 'fall': 285, 'airPunch': 285, 'airKick': 270,
          'uppercut': 345, 'knockdown': 210, 'ko': 125, 'getup': 225}


def extract(group, names):
    path = SRC / ('low-v2.png' if group == 'low' and (SRC / 'low-v2.png').exists() else f'{group}.png')
    sheet = Image.open(path).convert('RGBA')
    if sheet.getchannel('A').getextrema()[0] == 255:
        raise ValueError(f'{group}: no transparency')
    cols = 3 if group == 'movement' else 2
    try:
        isolated, _ = extract_silhouettes(path, names, cols)
        sprites = [(name, isolated[name][0]) for name in names]
    except ValueError:
        # The low punch touches the next pose's ponytail; keep the full fist in its region.
        sprites = []
        for index, name in enumerate(names):
            x, y = index % cols, index // cols
            seam = (545 if y == 0 else 580) if group == 'low' else sheet.width // 2
            left, right = (0, seam) if x == 0 else (seam, sheet.width)
            cell = sheet.crop((left, y*sheet.height//2, right, (y+1)*sheet.height//2))
            if group == 'low' and index == 0:
                alpha = cell.getchannel('A')
                cleanup = ImageDraw.Draw(alpha)
                cleanup.rectangle((490, 0, cell.width, 309), fill=0)
                cleanup.rectangle((460, 366, cell.width, 610), fill=0)
                cell.putalpha(alpha)
            # Keep the main body; adjacent poses can leave isolated fingers or hair in a cell.
            from PIL import ImageFilter
            data = bytearray(cell.getchannel('A').point(lambda a: 255 if a > 100 else 0).tobytes())
            cw, ch = cell.size
            largest = []
            for pixel in range(len(data)):
                if not data[pixel]: continue
                stack, points = [pixel], []
                data[pixel] = 0
                while stack:
                    v = stack.pop(); points.append(v)
                    yy, xx = divmod(v, cw)
                    for q in ([v-1] if xx else []) + ([v+1] if xx+1<cw else []) + ([v-cw] if yy else []) + ([v+cw] if yy+1<ch else []):
                        if data[q]: data[q] = 0; stack.append(q)
                if len(points)>len(largest): largest=points
            mask=Image.new('L',cell.size)
            for v in largest: mask.putpixel((v%cw,v//cw),255)
            mask=mask.filter(ImageFilter.MaxFilter(3))
            alpha=cell.getchannel('A'); alpha.paste(0,(0,0),mask.point(lambda a: 0 if a else 255)); cell.putalpha(alpha)
            box = alpha.getbbox()
            if not box: raise ValueError(f'{group}/{name}: empty cell')
            sprites.append((name, cell.crop(box)))
    # Shared scale within guitar and dash sequences preserves drawn pose changes.
    heights = sorted(im.height for _, im in sprites)
    common = (300 if group == 'movement' else 315) / (heights[0] if group == 'solo' else heights[len(heights)//2])
    result = {}
    for name, im in sprites:
        ratio = common if group in ('solo', 'movement') else TARGET.get(name, 300) / im.height
        im = im.resize((max(1, round(im.width*ratio)), max(1, round(im.height*ratio))), Image.Resampling.LANCZOS)
        alpha = im.getchannel('A')
        feet = [x for y in range(max(0,im.height-8), im.height) for x in range(im.width)
                if alpha.getpixel((x,y))>100]
        anchor = sum(feet)/len(feet) if feet and name not in ('ko','knockdown') else im.width/2
        result[name] = (im, anchor/im.width)
    return result


def package():
    sprites = {}
    for group, names in GROUPS.items(): sprites.update(extract(group,names))
    x,y,row_h = 8,8,0
    placements = {}
    for name,(im,_) in sorted(sprites.items(),key=lambda item:-item[1][0].height):
        if x+im.width+8>2048: x,y,row_h=8,y+row_h+16,0
        placements[name]=(x,y)
        x+=im.width+16
        row_h=max(row_h,im.height)
    height=y+row_h+8
    if height>4096: raise ValueError('Atlas exceeds 4096 pixels')
    atlas=Image.new('RGBA',(2048,height));frames={}
    for name,(im,pivot) in sprites.items():
        x,y=placements[name];atlas.alpha_composite(im,(x,y))
        frames['ricardo-'+name]={'frame':{'x':x,'y':y,'w':im.width,'h':im.height},
          'rotated':False,'trimmed':False,'sourceSize':{'w':im.width,'h':im.height},
          'spriteSourceSize':{'x':0,'y':0,'w':im.width,'h':im.height},'pivot':{'x':pivot,'y':1}}
    aliases={'walkBack-0':'walk-1','walkBack-1':'walk-0','down':'ko',
      'crouchPunch-0':'crouch','crouchPunch-1':'crouchPunch','crouchPunch-2':'crouch',
      'sweep-0':'crouch','sweep-1':'sweep','sweep-2':'crouch','throw':'special'}
    for alias,source in aliases.items(): frames['ricardo-'+alias]=frames['ricardo-'+source]
    atlas.save(ROOT/'atlas.png',optimize=True)
    (ROOT/'atlas.json').write_text(json.dumps({'frames':frames,'meta':{'image':'atlas.png','format':'RGBA8888',
       'size':{'w':atlas.width,'h':atlas.height},'scale':'1'}},indent=2)+'\n')
    (ROOT/'metadata.json').write_text(json.dumps({'scales':{name:1 for name in [*sprites,*aliases]},
       'paintedPoses':list(sprites),'hasMovement':True,'sourceGroups':GROUPS},indent=2)+'\n')
    portrait=Image.open(SRC/'portrait-source.png').convert('RGBA');portrait.thumbnail((512,512),Image.Resampling.LANCZOS)
    icon=Image.new('RGBA',(512,512));icon.alpha_composite(portrait,((512-portrait.width)//2,512-portrait.height));icon.save(ROOT/'portrait.png')
    preview=Image.new('RGB',(1400,1000),'#202028'); draw=ImageDraw.Draw(preview)
    for index,(name,(sprite,_)) in enumerate(sprites.items()):
        tile=sprite.copy();tile.thumbnail((188,165),Image.Resampling.LANCZOS)
        tx,ty=(index%7)*200,(index//7)*200
        preview.paste(tile,(tx+(200-tile.width)//2,ty+175-tile.height),tile)
        draw.text((tx+8,ty+183),name,fill='white')
    preview.save(SRC/'preview.jpg',quality=90)
    print(f'Ricardo: {len(sprites)} drawn poses, {len(frames)} atlas frames, 512px portrait, atlas {atlas.size}')

if __name__=='__main__': package()
