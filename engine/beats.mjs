// engine/beats.mjs — run beats.py with the right Python for this OS.   npm run beats -- <audio> [--out beats.json]
// Pure pass-through: same args, same cwd, same output, same exit code.
import {spawnSync} from 'node:child_process';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {python} from '../scripts/lib/python.mjs';

const r = spawnSync(python(), [join(dirname(fileURLToPath(import.meta.url)), 'beats.py'), ...process.argv.slice(2)], {stdio: 'inherit'});
if (r.error) console.error(`could not run ${python()}: ${r.error.message}\n  set PYTHON=/path/to/python in .env (npm run doctor checks it)`);
process.exit(r.status ?? 1);
