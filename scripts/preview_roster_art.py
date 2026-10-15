"""Build a review contact sheet from existing packaged assets, without altering them."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]/'public/assets/characters'
work=Path(__file__).resolve().parents[1]/'codex/assets/characters'
characters=json.loads((work/'generation-prompts.json').read_text())['characters']
canvas=Image.new('RGB',(1200,1110),(19,20,27))
draw=ImageDraw.Draw(canvas)
try:
 font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf',20)
 small=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',14)
except OSError:
 font=small=ImageFont.load_default()
for i,c in enumerate(characters):
 x,y=(i%4)*300,(i//4)*370
 draw.rounded_rectangle((x+8,y+8,x+292,y+362),radius=12,fill=(31,33,43),outline=(67,73,91))
 portrait=Image.open(root/c['id']/'portrait.png').convert('RGBA')
 portrait.thumbnail((278,278))
 canvas.paste(portrait,(x+11,y+22),portrait)
 draw.text((x+18,y+312),c['name'],font=font,fill=(243,244,247))
 metadata=json.loads((root/c['id']/'metadata.json').read_text())
 draw.text((x+18,y+341),f"{len(metadata['paintedPoses'])-1} frames + portrait / RGBA",font=small,fill=(165,193,204))
canvas.save(work/'roster-preview.jpg',quality=92)
print(work/'roster-preview.jpg')
