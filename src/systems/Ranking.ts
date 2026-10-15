import type { FighterId } from '../data/fighters';

/** Proyecto de Firebase (la apiKey de una app web es pública; la base la protegen las reglas). */
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBQA2aMdmFfx-8kXUWuiO5SkhnRx2c7Tl8',
  authDomain: 'pg-fighters.firebaseapp.com',
  projectId: 'pg-fighters',
  storageBucket: 'pg-fighters.firebasestorage.app',
  messagingSenderId: '1048513368434',
  appId: '1:1048513368434:web:420fd685ea631792f14deb',
};

const COLLECTION = 'ranking';
/** Partida de la historia en curso: un documento por cuenta (`progress/<uid>`). */
const PROGRESS = 'progress';
const NAME_KEY = 'pg-fighters-player';

export const NAME_MAX = 12;

export interface RankEntry {
  id: string;
  name: string;
  score: number;
  /** Peleas ganadas en la historia (13 = completada). */
  level: number;
  /** Total de peleas de la historia. */
  total: number;
  fighter: FighterId;
  updatedAt: number;
}

/** "PELEA 7/13", "EL ACOPLE" o "COMPLETADO". */
export const levelLabel = (e: Pick<RankEntry, 'level' | 'total'>): string =>
  e.level >= e.total ? 'COMPLETADO' : e.level === e.total - 1 ? 'EL ACOPLE' : `PELEA ${e.level + 1}/${e.total}`;

type Lite = typeof import('firebase/firestore/lite');
type AuthMod = typeof import('firebase/auth');
interface Firebase {
  fs: Lite;
  db: import('firebase/firestore/lite').Firestore;
  am: AuthMod;
  auth: import('firebase/auth').Auth;
}

export interface Player {
  uid: string;
}

let ready: Promise<Firebase> | null = null;
let user: Player | null = null;

/** Firebase se carga recién la primera vez que se usa (no pesa en el arranque del juego). */
const connect = () => {
  ready ??= Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore/lite')]).then(([app, am, fs]) => {
    const fb = app.initializeApp(FIREBASE_CONFIG);
    const auth = am.getAuth(fb);
    am.onAuthStateChanged(auth, (u) => {
      user = u ? { uid: u.uid } : null;
    });
    return { fs, db: fs.getFirestore(fb), am, auth };
  });
  return ready;
};

/**
 * Cuenta anónima de Firebase (se crea sola al entrar a la historia; la sesión queda en el navegador) y Firestore: ranking global (una fila por cuenta con
 * su mejor puntaje) y la partida de la historia de cada cuenta. Sin conexión, todo falla en silencio.
 */
export const Ranking = {
  /** Cuenta conectada (null = sin sesión o todavía no se sabe). */
  get user(): Player | null {
    return user;
  },

  /** Carga Firebase y espera a saber si hay una sesión guardada. */
  async init(): Promise<Player | null> {
    const { auth } = await connect();
    await auth.authStateReady();
    return user;
  },

  /** Sesión guardada del navegador o, si no hay, una cuenta anónima nueva. Lanza sin conexión. */
  async signIn(): Promise<Player> {
    const { am, auth } = await connect();
    if (await this.init()) return user!;
    const cred = await am.signInAnonymously(auth);
    user = { uid: cred.user.uid };
    return user;
  },

  /** Partida guardada de la cuenta conectada (null = no tiene). Lanza si no se pudo leer. */
  async loadProgress<T>(): Promise<T | null> {
    const { fs, db } = await connect();
    if (!(await this.init())) return null;
    const snap = await fs.getDoc(fs.doc(db, PROGRESS, user!.uid));
    return snap.exists() ? (snap.data() as T) : null;
  },

  async saveProgress(state: object): Promise<void> {
    try {
      const { fs, db } = await connect();
      if (!(await this.init())) return;
      // Firestore no acepta campos `undefined`: el viaje por JSON los quita.
      await fs.setDoc(fs.doc(db, PROGRESS, user!.uid), JSON.parse(JSON.stringify(state)));
    } catch (e) {
      console.warn('[progreso] no se pudo guardar', e);
    }
  },

  async clearProgress(): Promise<void> {
    try {
      const { fs, db } = await connect();
      if (!(await this.init())) return;
      await fs.deleteDoc(fs.doc(db, PROGRESS, user!.uid));
    } catch (e) {
      console.warn('[progreso] no se pudo borrar', e);
    }
  },

  /** Guarda la partida en la fila de la cuenta solo si supera su mejor puntaje. */
  async submit(entry: Omit<RankEntry, 'id'>): Promise<void> {
    try {
      const { fs, db } = await connect();
      if (!(await this.init())) return;
      const ref = fs.doc(db, COLLECTION, user!.uid);
      const best = await fs.getDoc(ref);
      if (best.exists() && (best.data().score as number) >= entry.score) return;
      await fs.setDoc(ref, entry);
    } catch (e) {
      console.warn('[ranking] no se pudo guardar', e);
    }
  },

  /** Mejores puntajes (espera a saber la sesión para poder marcar la fila propia). */
  async top(n = 20): Promise<RankEntry[]> {
    const { fs, db } = await connect();
    await this.init();
    const snap = await fs.getDocs(fs.query(fs.collection(db, COLLECTION), fs.orderBy('score', 'desc'), fs.limit(n)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RankEntry, 'id'>) }));
  },

  /** Último nombre usado en este navegador. */
  get savedName(): string {
    try {
      return localStorage.getItem(NAME_KEY) ?? '';
    } catch {
      return '';
    }
  },

  set savedName(name: string) {
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      /* sin almacenamiento */
    }
  },
};
