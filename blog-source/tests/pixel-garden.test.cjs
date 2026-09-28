const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/pixel-garden.js'), 'utf8');
class Element {
  constructor() {
    this.dataset = {}; this.style = {}; this.children = []; this.events = {};
    this.classList = { add() {}, remove() {} };
    this.clientWidth = 362; this.offsetLeft = 24; this.offsetTop = 146;
    this.textContent = '';
  }
  addEventListener(name, callback) { this.events[name] = callback; }
  setAttribute(name, value) { this[name] = value; }
  append(...elements) { this.children.push(...elements); }
  replaceChildren() { this.children = []; }
  querySelector(selector) { return this.children.find(el => `.${el.className}` === selector); }
  click() { this.events.click(); }
}

async function setup({ reduced = false, offline = false, cacheAge = null } = {}) {
  const elements = Object.fromEntries(['grid', 'cat', 'message', 'status', 'wander', 'retry'].map(key => [key, new Element()]));
  const garden = new Element();
  garden.dataset.user = 'boweitian';
  garden.querySelector = selector => elements[selector.replace('#garden-', '')];
  const contributions = Array.from({ length: 366 }, (_, i) => {
    const date = new Date('2025-09-28T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + i);
    return { date: date.toISOString().slice(0, 10), count: i % 5, level: i % 5 };
  });
  const intervals = new Map();
  const motion = { matches: reduced, addEventListener(name, cb) { this.change = cb; } };
  let requests = 0;
  vm.runInNewContext(source, {
    document: { querySelector: () => garden, createElement: () => new Element(), hidden: false },
    window: { addEventListener() {} },
    matchMedia: () => motion,
    localStorage: {
      getItem: () => cacheAge === null ? null : JSON.stringify({ saved: Date.now() - cacheAge, data: { contributions } }),
      setItem() {}
    },
    fetch: async () => {
      requests++;
      if (offline) throw Error('Offline');
      return { ok: true, json: async () => ({ contributions }) };
    },
    AbortSignal, Date,
    setTimeout: () => 1, clearTimeout() {},
    setInterval: callback => { intervals.set(1, callback); return 1; },
    clearInterval: id => intervals.delete(id)
  });
  await new Promise(resolve => setImmediate(resolve));
  return { ...elements, intervals, motion, requests };
}

test('walking and resting update both button and upper message', async () => {
  const ui = await setup();
  ui.wander.click();
  assert.equal(ui.wander.textContent, 'Take a rest');
  assert.equal(ui.wander['aria-pressed'], 'true');
  assert.match(ui.message.textContent, /^Wandering/);
  ui.intervals.get(1)();
  assert.match(ui.message.textContent, /^Wandering/);
  ui.wander.click();
  assert.equal(ui.wander.textContent, 'Take a walk');
  assert.equal(ui.wander['aria-pressed'], 'false');
  assert.equal(ui.message.textContent, 'Taking a little rest.');
  assert.equal(ui.intervals.size, 0);
});

test('selecting a day uses encouraging feedback without raw dates or counts', async () => {
  const ui = await setup();
  assert.equal(ui.grid.children.length, 182);
  ui.wander.click();
  const day = ui.grid.children.find(el => el.dataset.count === 1);
  day.click();
  assert.equal(ui.message.textContent, 'A small step still moves you forward.');
  assert.doesNotMatch(ui.message.textContent, /\d{4}-\d{2}-\d{2}|\d+ contribution/);
  assert.equal(ui.intervals.size, 0);
  const busyDay = ui.grid.children.find(el => el.dataset.count === 4);
  busyDay.click();
  assert.equal(ui.message.textContent, 'A bright day in your orbit. Keep going!');
  const restDay = ui.grid.children.find(el => el.dataset.count === 0);
  restDay.click();
  assert.equal(ui.message.textContent, 'Taking a little rest.');
  ui.wander.click();
  ui.cat.click();
  assert.equal(ui.wander.textContent, 'Take a walk');
  assert.equal(ui.intervals.size, 0);
  assert.match(ui.message.textContent, /Purr|company|break/);
});

test('reduced motion uses single steps, including preference changes', async () => {
  const ui = await setup({ reduced: true });
  assert.equal(ui.wander.textContent, 'Take a step');
  ui.wander.click();
  assert.equal(ui.message.textContent, 'One little step at a time.');
  assert.equal(ui.intervals.size, 0);
  ui.motion.matches = false;
  ui.motion.change();
  assert.equal(ui.wander.textContent, 'Take a walk');
});

test('offline and cached states remain readable and retryable', async () => {
  const offline = await setup({ offline: true });
  assert.match(offline.status.textContent, /unavailable/);
  assert.equal(offline.retry.hidden, false);
  offline.wander.click();
  assert.match(offline.message.textContent, /^Waiting/);
  const fresh = await setup({ cacheAge: 1000 });
  assert.equal(fresh.requests, 0);
  assert.doesNotMatch(fresh.status.children[1].textContent, /cached/i);
  assert.match(fresh.status.children[1].textContent, /^Through \d{4}-\d{2}-\d{2}$/);
  const stale = await setup({ offline: true, cacheAge: 7200000 });
  assert.match(stale.status.children[1].textContent, /Update unavailable/);
  assert.equal(stale.retry.hidden, false);
});

test('component source contains no Chinese labels or removed helper text', () => {
  const index = fs.readFileSync(path.join(__dirname, '../index.qmd'), 'utf8');
  assert.doesNotMatch(index + source, /[\u3400-\u9fff]|A LITTLE EVERY DAY|garden-hint/);
  assert.match(index, /Code Orbit/);
});
