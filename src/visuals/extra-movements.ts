import Phaser from 'phaser';

/** Visual contract only: the combat owner decides inputs, damage and transitions. */
export interface VisualFighter {
  id: number;
  x: number;
  y: number;
  dir: number;
  hp: number;
  action: string;
  walk?: boolean;
  crouching?: boolean;
  blocking?: boolean;
  grounded?: boolean;
  stun?: number;
}
export type ExtraPose = 'walk1'|'walk2'|'jump'|'crouch'|'block'|'uppercut'|'airKick'|'victory'|'ko';
const poses: ExtraPose[] = ['walk1','walk2','jump','crouch','block','uppercut','airKick','victory','ko'];
const aliases: Record<string,ExtraPose> = {
  crouch:'crouch', duck:'crouch', crouching:'crouch', block:'block', guard:'block', blocking:'block',
  uppercut:'uppercut', launcher:'uppercut', airKick:'airKick', 'air-kick':'airKick', jumpKick:'airKick',
  victory:'victory', win:'victory', ko:'ko', defeat:'ko', dead:'ko', jump:'jump',
};
interface FrameInfo { originX:number; originY:number; height:number }

export class ExtraMovements {
  private overlays: Phaser.GameObjects.Image[] = [];
  private frames: FrameInfo[][] = [];
  private scales: number[] = [];
  static preload(scene: Phaser.Scene): void {
    scene.load.image('pata-extra','/assets/pata-extra-anime.png');
    scene.load.image('edu-extra','/assets/edu-extra-anime.png');
  }
  constructor(private scene: Phaser.Scene) {
    for(const [id,key] of ['pata-extra','edu-extra'].entries()) {
      const texture=scene.textures.get(key);
      const source=texture.getSourceImage() as HTMLImageElement;
      const canvas=document.createElement('canvas');
      canvas.width=source.width;canvas.height=source.height;
      const ctx=canvas.getContext('2d')!;ctx.drawImage(source,0,0);
      this.frames[id]=[];
      for(let i=0;i<9;i++) {
        // Hand measured frame regions keep long limbs inside each pose.
        const regions = id===0
          ? [[0,0,430,450],[440,0,400,450],[850,0,404,430],[0,450,430,430],[440,450,390,415],[850,430,404,450],[0,880,435,374],[440,865,360,389],[805,950,449,304]]
          : [[0,0,510,370],[520,0,460,365],[1020,0,516,340],[0,375,510,315],[560,365,420,335],[1030,340,506,380],[0,690,560,334],[600,700,360,324],[990,740,546,284]];
        const referenceWidth=id===0?1254:1536,referenceHeight=id===0?1254:1024;
        const region=regions[i];
        const left=Math.round(region[0]*source.width/referenceWidth),top=Math.round(region[1]*source.height/referenceHeight);
        const width=Math.round(region[2]*source.width/referenceWidth),height=Math.round(region[3]*source.height/referenceHeight);
        const pixels=ctx.getImageData(left,top,width,height).data;
        let minY=height,maxY=0,minX=width,maxX=0;
        for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>100){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
        let feet=0,count=0;
        for(let y=Math.max(minY,maxY-10);y<=maxY;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>100){feet+=x;count++}
        this.frames[id][i]={originX:(i===8?(minX+maxX)/2:count?feet/count:(minX+maxX)/2)/width,originY:maxY/height,height:maxY-minY};
        texture.add(poses[i],0,left,top,width,height);
      }
      // Standing/walking poses determine scale, never enlarge crouches or fallen poses.
      this.scales[id]=300/Math.max(1,this.frames[id][0].height);
      this.overlays[id]=scene.add.image(0,0,key,'walk1').setVisible(false);
    }
  }
  select(f:VisualFighter,time:number,mode:string,winner?:number): ExtraPose|undefined {
    if(mode==='over')return f.id===winner?'victory':f.hp<=0||winner!==undefined?'ko':undefined;
    if(time<(f.stun??0))return undefined;
    const explicit=aliases[f.action];
    if(explicit)return explicit;
    if(f.blocking)return 'block';
    if(f.crouching)return 'crouch';
    if(f.grounded===false||f.y<518)return f.action==='kick'?'airKick':'jump';
    if(f.walk&&f.action==='idle')return Math.floor(time/110)%2?'walk1':'walk2';
    return undefined;
  }
  render(f:VisualFighter,base:Phaser.GameObjects.Image,time:number,mode:string,winner?:number): void {
    const overlay=this.overlays[f.id];overlay.setVisible(false);base.setVisible(true);
    const pose=this.select(f,time,mode,winner);
    if(!pose)return;
    const info=this.frames[f.id][poses.indexOf(pose)];
    const bob=pose.startsWith('walk')?Math.sin(time/55)*2:0;
    overlay.setFrame(pose).setOrigin(info.originX,info.originY).setScale(this.scales[f.id]);
    overlay.setPosition(f.x,f.y+15+bob).setFlipX(f.dir<0).setDepth(5+f.y/1000).setVisible(true);
    base.setVisible(false);
  }
  destroy(): void {for(const image of this.overlays)image.destroy();}
}
