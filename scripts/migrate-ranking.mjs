// Migra el ranking de una fila por cuenta (ranking/<uid>) a una por historia (ranking/<uid>_<personaje>).
// Usa la sesión del Firebase CLI (`firebase login`). Sin --apply solo muestra lo que haría.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const apply = process.argv.includes('--apply');
const token = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8')).tokens.access_token;
const base = 'https://firestore.googleapis.com/v1/projects/pg-fighters/databases/(default)/documents';
const call = async (method, url, body) => {
  const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const data = await r.json();
  if (data.error) throw new Error(`${method} ${url}: ${data.error.message}`);
  return data;
};

const { documents = [] } = await call('GET', `${base}/ranking?pageSize=300`);
for (const doc of documents) {
  const id = doc.name.split('/').pop();
  if (id.includes('_')) continue;
  const fighter = doc.fields.fighter?.stringValue;
  const target = `${id}_${fighter}`;
  console.log(`${id} (${doc.fields.name?.stringValue}) → ${target}`);
  if (!apply) continue;
  await call('PATCH', `${base}/ranking/${target}`, { fields: doc.fields });
  await call('DELETE', `${base}/ranking/${id}`);
}
if (!apply) console.log('\n(simulación: corre con --apply para migrar)');
