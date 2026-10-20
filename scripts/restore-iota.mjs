// Preserve the directly deployed app during normal Hugo homepage deployments.
// All inputs are the site's public files; there are no keys or environment variables.
import {mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {createHash} from 'node:crypto';

const source = new URL(process.argv[2] || 'https://bowei.netlify.app/iota/');
const output = resolve(process.argv[3] || 'public');
const app = join(output, 'iota');
const manifestResponse = await fetch(new URL('deploy-manifest.json', source), {cache: 'no-store', signal: AbortSignal.timeout(60000)});
if (!manifestResponse.ok) throw new Error('Existing public IOTA deployment is unavailable; keeping the current production deployment.');
const manifest = await manifestResponse.json();
if (manifest.version !== 1 || !Array.isArray(manifest.files) || manifest.files.length > 2000 || !manifest.files.length)
  throw new Error('Invalid IOTA deployment manifest');
const backend = new URL(manifest.backend);
if (backend.protocol !== 'https:' || !/^[a-z0-9-]+\.trycloudflare\.com$/.test(backend.hostname) || backend.port || backend.pathname !== '/' || backend.search || backend.hash)
  throw new Error('Invalid public model backend');
const seen = new Set();
let total = 0;
for (const file of manifest.files) {
  if (typeof file.path !== 'string' || !file.path || file.path.startsWith('/') || file.path.includes('\\') || file.path.split('/').some(s => ['.', '..', ''].includes(s)) || seen.has(file.path))
    throw new Error('Unsafe or duplicate asset path');
  if (!/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size < 0)
    throw new Error('Invalid asset checksum');
  seen.add(file.path); total += file.size;
}
if (total > 300 * 1024 * 1024) throw new Error('IOTA snapshot exceeds the expected size');
await rm(app, {recursive: true, force: true});
await mkdir(app, {recursive: true});
let next = 0;
async function download() {
  while (next < manifest.files.length) {
    const file = manifest.files[next++];
    let bytes;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const url = new URL(file.path.split('/').map(encodeURIComponent).join('/'), source);
        const response = await fetch(url, {signal: AbortSignal.timeout(90000)});
        if (!response.ok) throw new Error('Asset unavailable');
        bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length !== file.size || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error('Asset checksum mismatch');
        break;
      } catch (error) {
        if (attempt === 2) throw new Error('Unable to preserve IOTA asset: ' + file.path, {cause: error});
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    const target = join(app, file.path);
    await mkdir(resolve(target, '..'), {recursive: true});
    await writeFile(target, bytes);
  }
}
await Promise.all(Array.from({length: 6}, download));
await writeFile(join(app, 'deploy-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const redirectsPath = join(output, '_redirects');
let previous = '';
try {previous = await readFile(redirectsPath, 'utf8');} catch (error) {if (error.code !== 'ENOENT') throw error;}
previous = previous.split('\n').filter(line => !/^\/iota(?:\s|\/)/.test(line)).join('\n');
const rules = ['/iota /iota/ 301'];
for (const operation of ['studio/chat', 'studio/compare', 'studio/walk', 'studio/direction', 'route'])
  rules.push(`/iota/api/${operation} ${backend.origin}/api/async/${operation} 200!`);
rules.push(`/iota/api/* ${backend.origin}/api/:splat 200!`);
await writeFile(redirectsPath, rules.join('\n') + '\n' + previous);
console.log(`Preserved ${manifest.files.length} public IOTA files at /iota/; no runtime keys required.`);
