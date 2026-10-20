import {createDecipheriv, createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, mkdtemp, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';

const token = process.env.IOTA_BRIDGE_TOKEN;
if (!token || token.length < 32) throw new Error('Set IOTA_BRIDGE_TOKEN in Netlify build and runtime environment variables before deploying.');
const encrypted = await readFile('iota-assets/site.tar.gz.enc');
if (encrypted.subarray(0, 8).toString() !== 'IOTAENC1') throw new Error('Invalid IOTA snapshot');
const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(token).digest(), encrypted.subarray(8, 20));
decipher.setAuthTag(encrypted.subarray(20, 36));
const archive = Buffer.concat([decipher.update(encrypted.subarray(36)), decipher.final()]);
const temporary = await mkdtemp(join(tmpdir(), 'iota-build-'));
try {
  const file = join(temporary, 'site.tar.gz');
  await writeFile(file, archive, {mode: 0o600});
  const names = execFileSync('tar', ['-tzf', file], {encoding: 'utf8'}).trim().split('\n');
  if (names.some(name => name.startsWith('/') || name.split('/').includes('..'))) throw new Error('Invalid archive path');
  await rm('static/iota', {recursive: true, force: true});
  await mkdir('static/iota', {recursive: true});
  execFileSync('tar', ['-xzf', file, '-C', 'static/iota']);
  const transport = await readFile('iota-client/netlify-transport.js');
  await writeFile('static/iota/netlify-transport.js', transport);
  async function patch(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await patch(path);
      else if (entry.name.endsWith('.html')) {
        let html = await readFile(path, 'utf8');
        // Root-relative assets must stay inside the application.
        html = html.replace(/((?:src|href)=["'])\/(?!\/|iota\/)/g, '$1/iota/');
        html = html.replace(/<head([^>]*)>/i, '<head$1><script src="/iota/netlify-transport.js"></script>');
        await writeFile(path, html);
      } else if (entry.name.endsWith('.css')) {
        const css = await readFile(path, 'utf8');
        await writeFile(path, css.replace(/url\((["']?)\/(?!\/|iota\/)/g, 'url($1/iota/'));
      }
    }
  }
  await patch('static/iota');
  console.log('Prepared password-protected IOTA snapshot at /iota/');
} finally { await rm(temporary, {recursive: true, force: true}); }
