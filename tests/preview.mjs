// Local integration harness only. Production always uses Netlify Blobs.
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {Readable} from 'node:stream';
import {createBroker} from '../netlify/lib/broker.mjs';
import {authorized, unauthorized} from '../netlify/lib/auth.mjs';
import {MemoryStore} from './memory-store.mjs';

const env = {};
for (const line of (await readFile(process.env.IOTA_TEST_ENV_FILE, 'utf8')).trim().split('\n')) {
  const index = line.indexOf('=');
  env[line.slice(0, index)] = line.slice(index + 1);
}
const broker = createBroker(new MemoryStore(), env);
const root = resolve('static');
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png'};
const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, 'http://127.0.0.1:8788');
    const options = {method: incoming.method, headers: incoming.headers};
    if (!['GET', 'HEAD'].includes(incoming.method)) {options.body = Readable.toWeb(incoming); options.duplex = 'half';}
    const request = new Request(url, options);
    let response;
    if (url.pathname.startsWith('/iota/api/')) response = await broker(request);
    else if (!(await authorized(request, env))) response = unauthorized();
    else {
      let path = resolve(root, '.' + decodeURIComponent(url.pathname));
      if (!path.startsWith(root + '/')) throw Error('Invalid path');
      if ((await stat(path)).isDirectory()) path += '/index.html';
      response = new Response(await readFile(path), {headers: {'Content-Type': types[extname(path)] || 'application/octet-stream'}});
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch { outgoing.writeHead(404); outgoing.end('Not found'); }
});
server.listen(8788, '127.0.0.1', () => console.log('IOTA integration harness listening on 127.0.0.1:8788'));
