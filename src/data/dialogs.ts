import { FIGHTERS, type FighterId } from './fighters';

export interface DialogLine {
  speaker: FighterId;
  text: string;
}

/**
 * Diálogo antes del ROUND 1 de cada enfrentamiento (sin importar quién es el jugador).
 * Clave: los dos ids ordenados alfabéticamente y unidos con "-".
 */
const DIALOGS: Record<string, DialogLine[]> = {
  'amu-erp': [
    { speaker: 'amu', text: 'Tú también lo escuchaste, ¿no? El zumbido. Nadie más me cree.' },
    { speaker: 'erp', text: 'Lo escucho todas las noches con los audífonos puestos. Pensé que era mi ampli.' },
    { speaker: 'amu', text: 'No es tu ampli. Pero antes de cazarlo, quiero ver si tu ritmo aguanta.' },
  ],
  'amu-inti': [
    { speaker: 'inti', text: 'Bajaste del río. Yo bajé de la montaña. Venimos a lo mismo.' },
    { speaker: 'amu', text: 'Entonces ya sabes que el agua y la piedra se pelean desde siempre.' },
    { speaker: 'inti', text: 'Y siempre gana el que suena más fuerte.' },
  ],
  'amu-virrey': [
    { speaker: 'virrey', text: '¿Y este muchacho sin camisa? En mi reino se toca con chaleco.' },
    { speaker: 'amu', text: 'En mi río se toca con lo que tienes. Y tú no tienes ritmo.' },
    { speaker: 'virrey', text: 'Insolente. Serán dos tributos.' },
  ],
  'inti-virrey': [
    { speaker: 'virrey', text: 'Vaya, vaya. El hijo del sol. ¿Ya pagaste tu derecho de piso?' },
    { speaker: 'inti', text: 'Este piso lo puse yo. Piedra por piedra.' },
    { speaker: 'virrey', text: 'Pues por decreto real, ahora es mío. Y tu charango también.' },
    { speaker: 'inti', text: 'Ven por él.' },
  ],
  'erp-mayin': [
    { speaker: 'erp', text: 'MayinBlues... después de tiempo.' },
    { speaker: 'mayin', text: 'Hola amigo, ¿cómo estás?' },
  ],
  'escalas-tayloy': [
    { speaker: 'tayloy', text: 'Tres bestsellers con «todos los secretos»… Falso profeta.' },
    { speaker: 'escalas', text: 'Todo está documentado, joven. Con bibliografía.' },
    { speaker: 'tayloy', text: 'Los secretos verdaderos no se venden. Se heredan.' },
    { speaker: 'escalas', text: 'Entonces toma nota. Esta lección no viene en el libro.' },
  ],
  'george-nosu': [
    { speaker: 'nosu', text: 'Por fin un humano que afina. Lástima que tarde cuarenta minutos.' },
    { speaker: 'george', text: 'Tú afinas perfecto… pero sin alma. Eso también está desafinado.' },
  ],
  'nosu-pepper': [
    { speaker: 'pepper', text: 'Eso necesita más producción.' },
    { speaker: 'nosu', text: 'Negativo. Necesita menos productor.' },
    { speaker: 'pepper', text: '¿Y tú qué sabes de mezcla, tostadora?' },
    { speaker: 'nosu', text: 'Todo. Lo aprendí anoche. Larga vida al código.' },
  ],
  'rematada-mayin': [
    { speaker: 'mayin', text: 'Hola amigo, ¿cómo estás?' },
    { speaker: 'rematada', text: '¿AMIGO? ¡Me vendiste al peso en Marketplace!' },
    { speaker: 'mayin', text: 'Era precio de remate… y tenías una cuerda de más.' },
    { speaker: 'rematada', text: 'Años de maltrato, Mayin. Hoy te destierro de este mundo.' },
  ],
};

/**
 * Diálogo de un enfrentamiento. Si no hay uno escrito para la pareja, cada uno dice su frase
 * de presentación: primero el rival (`b`, la CPU) y luego el jugador (`a`).
 */
export const dialogFor = (a: FighterId, b: FighterId): DialogLine[] =>
  DIALOGS[[a, b].sort().join('-')] ?? [
    { speaker: b, text: FIGHTERS[b].intro },
    { speaker: a, text: FIGHTERS[a].intro },
  ];
