import { MUSIC, type MusicKey } from '../systems/Audio';

export type StageId = 'barrio' | 'metro' | 'bar' | 'tienda' | 'festival' | 'azotea' | 'tomate' | 'biblioteca' | 'chino' | 'mall' | 'arenal' | 'casona' | 'ciudadela' | 'rio' | 'laboratorio'
  /** Exclusivo del jefe del modo historia (no aparece en la selección de escenario). */
  | 'ampli';

export interface StageDef {
  id: StageId;
  /** Número que se muestra en la selección y en la pantalla VS. */
  number: string;
  name: string;
  /** Lugar / descripción corta. */
  place: string;
  /** Clave de la textura del fondo (1920×1080 o proporción 16:9). */
  texture: string;
  /**
   * Ruta de la imagen (relativa a public/). Si está vacía y la textura no existe,
   * se dibuja un fondo provisional por código (systems/StageArt.ts).
   */
  image?: string;
  music: MusicKey;
  /** Color de acento en la selección. */
  color: number;
  css: string;
}

export const STAGES: Record<StageId, StageDef> = {
  barrio: {
    id: 'barrio',
    number: '01',
    name: 'BARRIO BRAVO',
    place: 'LIMA, PERÚ',
    texture: 'bar', // se carga en PreloadScene junto al arte anime
    music: MUSIC.barrio,
    color: 0xec694c,
    css: '#ec694c',
  },
  metro: {
    id: 'metro',
    number: '02',
    name: 'ESTACIÓN DEL METRO',
    place: 'ANDÉN · ÚLTIMO TREN',
    texture: 'stage-metro',
    image: 'assets/stages/metro.png',
    music: MUSIC.metro,
    color: 0x3dd6ff,
    css: '#3dd6ff',
  },
  bar: {
    id: 'bar',
    number: '03',
    name: 'EL ÚLTIMO TRAGO',
    place: 'BAR DE MALA MUERTE',
    texture: 'stage-bar',
    image: 'assets/stages/bar.png',
    music: MUSIC.stage,
    color: 0xff3fa4,
    css: '#ff3fa4',
  },
  tienda: {
    id: 'tienda',
    number: '04',
    name: 'LA TIENDA DE INSTRUMENTOS',
    place: 'PROHIBIDO TOCAR STAIRWAY',
    texture: 'stage-tienda',
    image: 'assets/stages/tienda.png',
    music: MUSIC.tienda,
    color: 0xffb347,
    css: '#ffb347',
  },
  festival: {
    id: 'festival',
    number: '05',
    name: 'EL FESTIVAL DEL CERRO',
    place: 'ANDES · AL AIRE LIBRE',
    texture: 'stage-festival',
    image: 'assets/stages/festival.png',
    music: MUSIC.festival,
    color: 0x7cd65b,
    css: '#7cd65b',
  },
  azotea: {
    id: 'azotea',
    number: '06',
    name: 'LA AZOTEA DEL ENSAYO',
    place: 'LIMA DE NOCHE',
    texture: 'stage-azotea',
    image: 'assets/stages/azotea.png',
    music: MUSIC.azotea,
    color: 0x6c8cff,
    css: '#6c8cff',
  },
  tomate: {
    id: 'tomate',
    number: '07',
    name: 'LA FERIA DEL TOMATE',
    place: 'UN PUEBLO DE ESPAÑA · EUROPA',
    texture: 'stage-tomate',
    image: 'assets/stages/tomate.png',
    music: MUSIC.tomate,
    color: 0xff4d2e,
    css: '#ff4d2e',
  },
  biblioteca: {
    id: 'biblioteca',
    number: '08',
    name: 'LA BIBLIOTECA DEL ROCK',
    place: 'SILENCIO, SALVO EN LOS SOLOS',
    texture: 'stage-biblioteca',
    image: 'assets/stages/biblioteca.png',
    music: MUSIC.biblioteca,
    color: 0xe0b862,
    css: '#e0b862',
  },
  chino: {
    id: 'chino',
    number: '09',
    name: 'EL BARRIO CHINO',
    place: 'CALLE CAPÓN · LIMA DE NOCHE',
    texture: 'stage-chino',
    image: 'assets/stages/chino.png',
    music: MUSIC.chino,
    color: 0xff5a5f,
    css: '#ff5a5f',
  },
  mall: {
    id: 'mall',
    number: '10',
    name: 'EL MALL DEL ROCK',
    place: 'TODAS LAS TIENDAS · UN SOLO GÉNERO',
    texture: 'stage-mall',
    image: 'assets/stages/mall.png',
    music: MUSIC.mall,
    color: 0xc77dff,
    css: '#c77dff',
  },
  arenal: {
    id: 'arenal',
    number: '11',
    name: 'EL ARENAL',
    place: 'VILLA EL SALVADOR · LIMA, PERÚ',
    texture: 'stage-arenal',
    image: 'assets/stages/arenal.png',
    music: MUSIC.arenal,
    color: 0xf2b45a,
    css: '#f2b45a',
  },
  casona: {
    id: 'casona',
    number: '12',
    name: 'EL SALÓN DEL VIRREY',
    place: 'CASONA COLONIAL · CENTRO DE LIMA',
    texture: 'stage-casona',
    image: 'assets/stages/casona.png',
    music: MUSIC.casona,
    color: 0xc9a227,
    css: '#e0b53a',
  },
  ciudadela: {
    id: 'ciudadela',
    number: '13',
    name: 'LA CIUDADELA DEL SOL',
    place: 'ENTRE LAS NUBES · CUSCO, PERÚ',
    texture: 'stage-ciudadela',
    image: 'assets/stages/ciudadela.png',
    music: MUSIC.ciudadela,
    color: 0xff9f1c,
    css: '#ff9f1c',
  },
  rio: {
    id: 'rio',
    number: '14',
    name: 'EL MUELLE DEL RÍO',
    place: 'AMAZONÍA PERUANA · DE NOCHE',
    texture: 'stage-rio',
    image: 'assets/stages/rio.png',
    music: MUSIC.rio,
    color: 0x2ecc71,
    css: '#2ecc71',
  },
  /** Escondido hasta que llegue su arte final: no está en STAGE_ORDER ni en la historia (se prueba con ?lab&stage=laboratorio). */
  laboratorio: {
    id: 'laboratorio',
    number: '15',
    name: 'EL LABORATORIO DEL ROCK',
    place: 'DONDE NACIÓ NOSU · LIMA DEL FUTURO',
    texture: 'stage-laboratorio',
    // image: 'assets/stages/laboratorio.png',
    music: MUSIC.stage,
    color: 0xff2ba6,
    css: '#ff2ba6',
  },
  ampli: {
    id: 'ampli',
    number: '??',
    name: 'EL INTERIOR DEL AMPLI',
    place: 'DONDE NACE EL ACOPLE',
    texture: 'stage-ampli',
    // image: 'assets/stages/ampli.png',
    music: MUSIC.boss,
    color: 0x7df9ff,
    css: '#7df9ff',
  },
};

export const STAGE_ORDER: StageId[] = ['barrio', 'metro', 'bar', 'tienda', 'festival', 'azotea', 'tomate', 'biblioteca', 'chino', 'mall', 'arenal', 'casona', 'ciudadela', 'rio'];
