import { mayin } from './mayin';
import { stageShow } from './staging';
import type { FighterId } from '../../data/fighters';
import { acople } from './acople';
import { pepper } from './pepper';
import { erp } from './erp';
import { ferdex } from './ferdex';
import { rematada } from './rematada';
import { clavito } from './clavito';
import { jeanpierre } from './jeanpierre';
import { jesex } from './jesex';
import type { SuperShow } from './kit';
import { chantal } from './chantal';
import { escalas } from './escalas';
import { markus } from './markus';
import { pentalick } from './pentalick';
import { tayloy } from './tayloy';
import { turboshred } from './turboshred';
import { george } from './george';
import { platanero } from './platanero';
import { ricardo } from './ricardo';
import { kimberly } from './kimberly';
import { mimetico } from './mimetico';
import { slandor } from './slandor';
import { toxicity } from './toxicity';

/** Presentación propia de todos los luchadores, incluido el solo original de Mayin. */
const shows: Record<FighterId, SuperShow> = {
  erp, mayin, george, pepper, slandor, pentalick, mimetico, clavito, chantal, jeanpierre,
  ferdex, turboshred, toxicity, rematada, escalas, tayloy, jesex, markus, platanero, ricardo, kimberly, acople,
};

export const SHOWS = Object.fromEntries(
  Object.entries(shows).map(([id, show]) => [id, stageShow(show)]),
) as Record<FighterId, SuperShow>;
