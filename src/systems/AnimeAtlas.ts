import Phaser from 'phaser';

/** Presentation-only adapter for the current combat renderer. */
export const poseScale = new Map<string, number>();

/**
 * Guard and victory cells touch in the extra sheets (the raised fist). Regions in sheet reference px;
 * `clear` lists what to erase from the guard copy and from the victory copy respectively.
 */
const VICTORY_SPLIT: Record<string,{block:number[];win:number[];clear:[number[][],number[][]];winScale:number}> = {
  edu: { block:[560,365,420,335], win:[600,683,360,341], clear:[[[700,683,280,20]],[[560,683,140,20]]], winScale:1.19 },
  pata: { block:[440,450,390,410], win:[440,856,360,398], clear:[[[600,856,120,10]],[[470,856,80,5],[730,856,80,5]]], winScale:1.25 },
};
export function registerAnimeAtlases(scene: Phaser.Scene): void {
  for(const [id,prefix] of [['pata','mayin-'],['edu','erp-']]) {
    const base=scene.textures.get(`${id}-base`).getSourceImage() as HTMLImageElement;
    const extra=scene.textures.get(`${id}-extra`).getSourceImage() as HTMLImageElement;
    const low=scene.textures.get(`${id}-low`).getSourceImage() as HTMLImageElement;
    const dashSheet=scene.textures.get(`${id}-dash`).getSourceImage() as HTMLImageElement;
    const fighterId=id==='pata'?'mayin':'erp';
    const superSheet=scene.textures.get(`super-sheet-${fighterId}`).getSourceImage() as HTMLImageElement;
    const portrait=scene.textures.get(`super-cutin-${fighterId}`);
    const portraitSource=portrait.getSourceImage() as HTMLImageElement;
    // The full bust is shared with the cut-in; icons use a dedicated face crop.
    const faceSize=Math.round(portraitSource.height*(id==='pata'?.46:.49));
    portrait.add('face',0,Math.round(portraitSource.width*.29),Math.round(portraitSource.height*(id==='pata'?.035:0)),faceSize,faceSize);
    // Isolate the two touching silhouettes before registering rectangular frames.
    const lowSweep=document.createElement('canvas');
    const lowRecovery=document.createElement('canvas');
    for(const [canvas,recovery] of [[lowSweep,false],[lowRecovery,true]] as const) {
      canvas.width=low.width;canvas.height=low.height;
      const ctx=canvas.getContext('2d')!;
      ctx.drawImage(low,0,0);
      if(id==='pata') {
        const sx=low.width/1254,sy=low.height/1254;
        ctx.clearRect((recovery?760:775)*sx,700*sy,(recovery?15:479)*sx,440*sy);
        if(!recovery)ctx.clearRect(760*sx,1140*sy,494*sx,114*sy);
      }
    }
    // The raised victory fist reaches into the guard's cell: each pose gets a copy without the other's pixels.
    const ref=id==='pata'?[1254,1254]:[1536,1024];
    const [guard,victory]=(VICTORY_SPLIT[id].clear).map((rects)=>{
      const canvas=document.createElement('canvas');canvas.width=extra.width;canvas.height=extra.height;
      const ctx=canvas.getContext('2d')!;ctx.drawImage(extra,0,0);
      for(const [cx,cy,cw,ch] of rects) ctx.clearRect(cx*extra.width/ref[0],cy*extra.height/ref[1],cw*extra.width/ref[0],ch*extra.height/ref[1]);
      return canvas;
    });
    const key=`${id}-anime`;
    const sources=[base,extra,low,lowSweep,lowRecovery,superSheet,dashSheet,guard,victory];
    const texture=scene.textures.create(key,sources)!;
    let idleHeight=1,extraScale=1;
    const add=(name:string,index:number,region:number[])=>{
      const source=sources[index];
      const [x,y,w,h]=region.map(Math.round);
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d')!;ctx.drawImage(source,x,y,w,h,0,0,w,h);
      const pixels=ctx.getImageData(0,0,w,h).data;
      let minX=w,minY=h,maxX=0,maxY=0;
      for(let b=0;b<h;b++)for(let a=0;a<w;a++)if(pixels[(b*w+a)*4+3]>100){minX=Math.min(minX,a);maxX=Math.max(maxX,a);minY=Math.min(minY,b);maxY=Math.max(maxY,b)}
      let sum=0,count=0;
      for(let b=Math.max(minY,maxY-10);b<=maxY;b++)for(let a=minX;a<=maxX;a++)if(pixels[(b*w+a)*4+3]>100){sum+=a;count++}
      const frame=texture.add(prefix+name,index,x+minX,y+minY,maxX-minX+1,maxY-minY+1)!;
      frame.customPivot=true;frame.pivotX=((count?sum/count:(minX+maxX)/2)-minX)/frame.realWidth;frame.pivotY=1;
      if(name==='idle')idleHeight=frame.realHeight;
      if(name==='walk-0')extraScale=idleHeight/frame.realHeight;
      poseScale.set(`${key}/${prefix+name}`,index===1?extraScale:1);
      if(name==='idle'){
        const size=Math.min(frame.realHeight*.29,frame.realWidth*.55);
        const faceX=x+minX+frame.realWidth*.48-size/2;
        texture.add(prefix+'portrait',index,faceX,y+minY,size,size);
      }
    };
    for(const [i,name] of ['idle','punch','kick','hurt'].entries()){
      const split=i<2?.5:.565,left=i%2?base.width*split:0;
      add(name,0,[left,Math.floor(i/2)*base.height/2,i%2?base.width-left:base.width*split,base.height/2]);
    }
    const regions=id==='pata'
      ? [[0,0,430,450],[440,0,400,450],[850,0,404,430],[0,450,430,430],[440,450,390,415],[850,430,404,450],[0,880,435,374],[440,865,360,389],[805,950,449,304]]
      : [[0,0,510,370],[520,0,460,365],[1020,0,516,340],[0,375,510,315],[560,365,420,335],[1030,340,506,380],[0,690,560,334],[600,700,360,324],[990,740,546,284]];
    const names=['walk-0','walk-1','jump','crouch','block','uppercut','airKick','win','ko'];
    regions.forEach((r,i)=>add(names[i],1,r.map((n,j)=>n*(j%2?extra.height/(id==='pata'?1254:1024):extra.width/(id==='pata'?1254:1536)))));
    {
      const {block,win,winScale}=VICTORY_SPLIT[id];
      for(const [index,name,region] of [[7,'block',block],[8,'win',win]] as const) {
        texture.remove(prefix+name);
        add(name,index,region.map((n,j)=>n*(j%2?extra.height/ref[1]:extra.width/ref[0])));
        poseScale.set(`${key}/${prefix+name}`,extraScale);
      }
      // The victory pose is painted smaller: scaled so the head reaches the guard height (walk-0 head to feet / win head to feet).
      poseScale.set(`${key}/${prefix}win`,extraScale*winScale);
    }
    // Dedicated low attacks share the guard's anatomical scale and ground anchor.
    const crouch=texture.get(prefix+'crouch');
    const targetCrouchHeight=crouch.realHeight*extraScale;
    // The extended sweep crosses the sheet midpoint; equal cells clip the shoe.
    const lowReference=id==='pata'?[1254,1254]:[1536,1024];
    const regionsLow=(id==='pata'
      ? [[0,0,627,650],[627,0,627,650],[0,700,780,554],[760,700,494,554]]
      : [[0,0,768,545],[768,0,768,545],[0,545,830,479],[850,545,686,479]])
      .map(r=>r.map((n,j)=>n*(j%2?low.height/lowReference[1]:low.width/lowReference[0])));
    texture.remove(prefix+'crouch');
    add('crouch',2,regionsLow[0]);
    const lowScale=targetCrouchHeight/texture.get(prefix+'crouch').realHeight;
    poseScale.set(`${key}/${prefix}crouch`,lowScale);
    add('crouchPunch',2,regionsLow[1]);
    add('sweep',3,regionsLow[2]);
    for(const pose of ['crouchPunch','sweep']) {
      poseScale.set(`${key}/${prefix+pose}`,lowScale);
      for(const [i,region] of [regionsLow[0],regionsLow[pose==='sweep'?2:1],regionsLow[3]].entries()) {
        add(`${pose}-${i}`,i===2?4:pose==='sweep'&&i===1?3:2,region);
        poseScale.set(`${key}/${prefix+pose}-${i}`,lowScale);
      }
    }
    for(const [name,baseName] of [['walkBack-0','walk-1'],['walkBack-1','walk-0'],['fall','jump'],['down','ko'],['knockdown','ko'],['intro','idle']]){
      const f=texture.get(prefix+baseName);
      const alias=texture.add(prefix+name,f.sourceIndex,f.cutX,f.cutY,f.cutWidth,f.cutHeight)!;
      alias.customPivot=true;alias.pivotX=f.pivotX;alias.pivotY=f.pivotY;
      poseScale.set(`${key}/${prefix+name}`,poseScale.get(`${key}/${prefix+baseName}`)??1);
    }
    // Dedicated painted dash/backdash sequences. A shared scale preserves the
    // crouched silhouette instead of stretching every frame to standing height.
    // Measured regions: the extended rear/front shoes cross equal-cell borders.
    const dashRegions=id==='pata'
      ? [[40,130,480,382],[520,116,565,396],[1096,92,408,420],
         [55,567,470,422],[631,516,337,411],[1107,549,405,445]]
      : [[11,117,469,377],[524,80,592,414],[1116,42,411,452],
         [18,549,423,427],[645,518,337,420],[1094,525,436,458]];
    dashRegions.forEach((region,i)=>add(`${i<3?'dash':'backdash'}-${i%3}`,6,
      region.map((n,j)=>n*(j%2?dashSheet.height/1024:dashSheet.width/1536))));
    const dashScale=idleHeight/texture.get(prefix+'backdash-2').realHeight;
    for(const pose of ['dash','backdash']) for(let i=0;i<3;i++) {
      poseScale.set(`${key}/${prefix+pose}-${i}`,dashScale);
    }
    // Shared body scale and horizontal anchor; each cell's feet stay on the floor.
    const cellW=superSheet.width/2,cellH=superSheet.height/2;
    let superScale=1,anchorX=0;
    for(let i=0;i<4;i++) {
      const x=(i%2)*cellW,y=Math.floor(i/2)*cellH;
      const name=`super-${i}`;
      add(name,5,[x,y,cellW,cellH]);
      const frame=texture.get(prefix+name);
      if(i===0) {
        superScale=idleHeight/frame.realHeight;
        anchorX=frame.cutX-x+frame.pivotX*frame.realWidth;
      }
      frame.pivotX=(anchorX-(frame.cutX-x))/frame.realWidth;
      frame.pivotY=1;
      poseScale.set(`${key}/${prefix+name}`,superScale);
    }
  }
}
