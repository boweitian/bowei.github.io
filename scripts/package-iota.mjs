// Refresh the encrypted snapshot from the existing server-built dist directory.
// Never place the credential file or the decrypted archive in this repository.
import {readFile, writeFile, mkdir, mkdtemp, rm, stat} from 'node:fs/promises';
import {createCipheriv, createHash, randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';

const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== '--dist' || args[2] !== '--env-file')
  throw new Error('Usage: node scripts/package-iota.mjs --dist /absolute/dist --env-file /private/netlify.env');
const dist = resolve(args[1]), config = resolve(args[3]);
if (((await stat(config)).mode & 0o077) !== 0) throw new Error('Credential file must have mode 0600');
const env = Object.fromEntries((await readFile(config, 'utf8')).trim().split('\n').map(line => {
  const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)];
}));
const token = env.IOTA_BRIDGE_TOKEN;
if (!token || token.length < 32) throw new Error('A private IOTA_BRIDGE_TOKEN is required');
const temporary = await mkdtemp(join(tmpdir(), 'iota-package-'));
try {
  const archive = join(temporary, 'site.tar.gz');
  execFileSync('tar', ['-czf', archive, '-C', dist, '.']);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(token).digest(), iv);
  const ciphertext = Buffer.concat([cipher.update(await readFile(archive)), cipher.final()]);
  await mkdir('iota-assets', {recursive: true});
  await writeFile('iota-assets/site.tar.gz.enc', Buffer.concat([Buffer.from('IOTAENC1'), iv, cipher.getAuthTag(), ciphertext]));
  console.log('Updated encrypted IOTA snapshot');
} finally { await rm(temporary, {recursive: true, force: true}); }
