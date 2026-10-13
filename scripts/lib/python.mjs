// scripts/lib/python.mjs — which Python to run (beats.py, doctor). PYTHON in env or .env wins;
// otherwise `python` on Windows (where `python3` is often MSYS2 or the Store stub) and `python3` elsewhere.
import {loadEnv} from './fish.mjs';

export function python() {
  loadEnv();
  return process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
}
