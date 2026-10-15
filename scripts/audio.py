"""Generate original rock loop and combat effects; no third-party recordings."""
import math, random, wave, struct
from pathlib import Path
random.seed(17)
RATE=22050
out=Path('public/assets')
def save(name,data):
    with wave.open(str(out/(name+'.wav')),'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(RATE)
        f.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v)) * 29000)) for v in data))
def noise_effect(name,duration,low):
    data=[]; prev=0
    for i in range(int(duration*RATE)):
        t=i/RATE; env=(1-t/duration)**2
        prev=.65*prev+.35*random.uniform(-1,1)
        data.append(env*(prev*.7+math.sin(2*math.pi*(low*t-40*t*t))*.5))
    save(name,data)
noise_effect('punch',.19,125); noise_effect('kick',.27,78);noise_effect('swing',.15,370)
# 4 bars at 120 bpm: distorted root/fifth riff, bass, kick, snare and hats.
duration=8; data=[0.]*(RATE*duration)
roots=[82.41,82.41,98,73.42]*4
for step in range(32):
    start=step*.25; freq=roots[step//2]; length=.22 if step%4!=3 else .31
    for i in range(int(length*RATE)):
        pos=int(start*RATE)+i
        if pos>=len(data):break
        t=i/RATE; env=min(1,t/.008)*math.exp(-t*10)
        guitar=sum(math.sin(2*math.pi*freq*r*t) for r in (1,1.5,2))
        data[pos]+=.15*math.tanh(guitar*3)*env+.09*math.sin(2*math.pi*freq*.5*t)*env
    for i in range(int(.08*RATE)):
        pos=int(start*RATE)+i
        if pos<len(data): data[pos]+=.045*random.uniform(-1,1)*math.exp(-i/RATE*65)
for beat in range(16):
    start=beat*.5
    for i in range(int(.23*RATE)):
        pos=int(start*RATE)+i
        if pos>=len(data):break
        t=i/RATE
        if beat%2==0:data[pos]+=.38*math.sin(2*math.pi*(55*t+7*(1-math.exp(-t*35))))*math.exp(-t*22)
        else:data[pos]+=.23*random.uniform(-1,1)*math.exp(-t*24)+.1*math.sin(2*math.pi*180*t)*math.exp(-t*30)
save('last-call',data)
