import test from 'node:test';
import assert from 'node:assert/strict';
import {createBroker} from '../netlify/lib/broker.mjs';
import {MemoryStore} from './memory-store.mjs';

function setup() {
  let clock = 1792500000000;
  const store = new MemoryStore();
  const env = {IOTA_ACCESS_USERNAME: 'test', IOTA_ACCESS_PASSWORD: 'private', IOTA_BRIDGE_TOKEN: 'x'.repeat(48)};
  const handle = createBroker(store, env, () => clock);
  const visitor = 'Basic ' + btoa('test:private');
  const worker = 'Bearer ' + env.IOTA_BRIDGE_TOKEN;
  async function call(path, data, auth = visitor, extras = {}) {
    const headers = {Authorization: auth, ...extras};
    if (data !== undefined) headers['Content-Type'] = 'application/json';
    const response = await handle(new Request('https://site.test/iota/api' + path,
      {headers, method: data === undefined ? 'GET' : 'POST', body: data === undefined ? undefined : JSON.stringify(data)}));
    return {status: response.status, body: await response.json()};
  }
  const beat = (extra = {}) => call('/bridge', {status: {online: true, studio: {model: 'real'}}, ...extra}, worker);
  return {store, env, handle, visitor, worker, call, beat, advance: ms => {clock += ms;}};
}

test('pages/API authentication fails closed; visitor and worker credentials are separate', async () => {
  const s = setup();
  assert.equal((await s.call('/status', undefined, '')).status, 401);
  assert.equal((await s.call('/status', undefined, s.worker)).status, 401);
  assert.equal((await s.call('/bridge', {status: {online: true}})).status, 401);
  assert.equal((await s.call('/status', undefined, 'Basic !!!')).status, 401);
  delete s.env.IOTA_BRIDGE_TOKEN;
  assert.equal((await s.call('/status')).status, 503);
});

test('offline model rejects work and stale heartbeats cannot imply online', async () => {
  const s = setup();
  assert.equal((await s.call('/studio/chat', {})).status, 503);
  await s.beat();
  assert.equal((await s.call('/status')).body.online, true);
  s.advance(61000);
  assert.equal((await s.call('/status')).body.online, false);
  assert.equal((await s.call('/studio/chat', {})).status, 503);
});

test('one real task is claimed once, result survives retries and retains model output exactly', async () => {
  const s = setup();
  await s.beat();
  const queued = await s.call('/studio/chat', {profile: {}, messages: [], display_in_browser: true});
  assert.equal(queued.status, 202);
  const {job_id: id} = queued.body;
  assert.equal((await s.call('/jobs/' + id)).status, 202);
  const claimed = await s.beat();
  assert.equal(claimed.body.job.id, id);
  assert.equal(claimed.body.job.path, '/api/studio/chat');
  assert.equal(claimed.body.job.body.display_in_browser, undefined);
  assert.equal((await s.beat()).body.job, null);
  const body = {message: {role: 'assistant', content: '模型原文\n'}, provenance: {device: 'GPU'}};
  const result = {id, status: 200, body};
  assert.equal((await s.beat({result})).status, 200);
  assert.equal((await s.beat({result})).status, 200);
  assert.deepEqual((await s.call('/jobs/' + id)), {status: 200, body});
  assert.equal((await s.call('/latest')).body.latest, null);
  assert.equal((await s.call('/studio/chat', {})).status, 202);
});

test('atomic compare-and-set admits one request and one worker under concurrency', async () => {
  const s = setup();
  await s.beat();
  const submissions = await Promise.all(Array.from({length: 12}, () => s.call('/studio/chat', {})));
  assert.equal(submissions.filter(r => r.status === 202).length, 1);
  assert.equal(submissions.filter(r => r.status === 429).length, 11);
  const claims = await Promise.all(Array.from({length: 12}, () => s.beat()));
  assert.equal(claims.filter(r => r.body.job).length, 1);
});

test('worker heartbeat cannot swallow a queued task while it is finishing another task', async () => {
  const s = setup();
  await s.beat();
  await s.call('/studio/chat', {});
  assert.equal((await s.beat({claim: false})).body.job, null);
  assert.ok((await s.beat()).body.job);
});

test('expired tasks release capacity, reject late completion, and results are cleaned up', async () => {
  const s = setup();
  await s.beat();
  const first = await s.call('/studio/chat', {});
  const id = first.body.job_id;
  await s.beat();
  s.advance(361000);
  assert.equal((await s.call('/jobs/' + id)).status, 410);
  assert.equal((await s.beat({result: {id, status: 200, body: {}}})).status, 409);
  const second = await s.call('/studio/chat', {});
  assert.equal(second.status, 202);
  await s.beat();
  await s.beat({result: {id: second.body.job_id, status: 500, body: {error: 'model failed'}}});
  assert.equal((await s.call('/jobs/' + second.body.job_id)).status, 500);
  s.advance(1300000);
  await s.beat({cleanup: true});
  assert.equal(s.store.records.has('results/' + second.body.job_id), false);
});

test('unsafe origins, unknown operations and oversized requests never enter the queue', async () => {
  const s = setup();
  await s.beat();
  assert.equal((await s.call('/studio/chat', {}, s.visitor, {Origin: 'https://evil.test'})).status, 403);
  assert.equal((await s.call('/arbitrary', {})).status, 404);
  assert.equal((await s.call('/studio/chat', [], s.visitor)).status, 400);
  assert.equal((await s.call('/studio/chat', {x: 'x'.repeat(120001)})).status, 413);
  assert.equal((await s.call('/jobs/guessable')).status, 404);
  const direct = await s.handle(new Request('https://site.test/.netlify/functions/iota-api', {headers: {Authorization: s.visitor}}));
  assert.equal(direct.status, 404);
  assert.equal(await s.store.get('active'), null);
});

test('storage exceptions produce a generic error without leaking credentials', async () => {
  const s = setup();
  s.store.get = async () => {throw new Error('private-token-do-not-leak');};
  const response = await s.call('/status');
  assert.equal(response.status, 503);
  assert.ok(!JSON.stringify(response.body).includes('private-token'));
});
