(() => {
  const garden = document.querySelector('#pixel-garden');
  if (!garden) return;
  const grid = garden.querySelector('#garden-grid');
  const cat = garden.querySelector('#garden-cat');
  const message = garden.querySelector('#garden-message');
  const status = garden.querySelector('#garden-status');
  const wander = garden.querySelector('#garden-wander');
  const retry = garden.querySelector('#garden-retry');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const cacheKey = `pixel-garden:${garden.dataset.user}:v1`;
  let timer, hopTimer, selected;
  let cells = [];

  function hop() {
    cat.classList.remove('happy');
    void cat.offsetWidth;
    cat.classList.add('happy');
    clearTimeout(hopTimer);
    hopTimer = setTimeout(() => cat.classList.remove('happy'), 950);
  }

  function visit(cell, announce = true) {
    selected?.classList.remove('selected');
    selected = cell;
    cell.classList.add('selected');
    // Stay above the chosen cell, leaving it available for pointer/keyboard input.
    cat.style.left = `${Math.max(0, Math.min(grid.clientWidth - 54, cell.offsetLeft - 22))}px`;
    cat.style.top = `${grid.offsetTop + cell.offsetTop - 55}px`;
    if (announce) message.textContent = `${cell.dataset.date} · ${cell.dataset.count} 次贡献${Number(cell.dataset.count) ? '，长出小绿芽！' : '，休息也是日常。'}`;
    hop();
  }

  function stopWalking() {
    clearInterval(timer);
    timer = null;
    wander.setAttribute('aria-pressed', 'false');
    wander.textContent = '让小黑散步';
  }

  wander.addEventListener('click', () => {
    if (timer) return stopWalking();
    if (!cells.length) {
      message.textContent = '等花园加载好，再一起散步吧。';
      return;
    }
    const step = () => {
      if (!document.hidden) visit(cells[Math.floor(Math.random() * cells.length)], false);
    };
    step();
    // Reduced-motion visitors can still move the cat one step at a time.
    if (reducedMotion.matches) return;
    timer = setInterval(step, 3500);
    wander.setAttribute('aria-pressed', 'true');
    wander.textContent = '让小黑歇一会';
  });
  reducedMotion.addEventListener('change', stopWalking);
  cat.addEventListener('click', () => {
    hop();
    message.textContent = ['喵～摸摸头，继续加油。', '今天的绿色，我替你看好啦。', '写累了就休息一下吧。'][Math.floor(Math.random() * 3)];
  });
  window.addEventListener('resize', () => { if (selected) visit(selected, false); });
  window.addEventListener('pagehide', stopWalking);

  function validDays(data) {
    if (!Array.isArray(data?.contributions) || !data.contributions.length) throw Error('No contributions');
    const days = data.contributions;
    if (!days.every(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isInteger(day.count) && day.count >= 0 && Number.isInteger(day.level) && day.level >= 0 && day.level <= 4)) throw Error('Invalid contributions');
    return [...days].sort((a, b) => a.date.localeCompare(b.date));
  }

  function render(data, cached = false) {
    const days = validDays(data);
    const byDate = new Map(days.map(day => [day.date, day]));
    const end = new Date(`${days.at(-1).date}T00:00:00Z`);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay() - 25 * 7);
    stopWalking();
    grid.replaceChildren();
    cells = [];
    selected = null;
    for (let i = 0; i < 182; i++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + i);
      const key = date.toISOString().slice(0, 10);
      const day = byDate.get(key);
      const cell = document.createElement(day ? 'button' : 'span');
      cell.className = 'garden-day';
      if (day) {
        cell.type = 'button';
        Object.assign(cell.dataset, { date: key, count: day.count, level: day.level });
        cell.title = `${key}: ${day.count} contributions`;
        cell.setAttribute('aria-label', cell.title);
        cell.addEventListener('click', () => { stopWalking(); visit(cell); });
        cells.push(cell);
      } else {
        cell.style.visibility = 'hidden';
        cell.setAttribute('aria-hidden', 'true');
      }
      grid.append(cell);
    }
    const total = days.reduce((sum, day) => sum + day.count, 0);
    status.textContent = `近一年 ${total.toLocaleString()} 次贡献 · 截至 ${days.at(-1).date}${cached ? '（本地缓存）' : ''}`;
    if (cells.length) visit(cells.at(-1), false);
  }

  async function load() {
    retry.hidden = true;
    let cached;
    try {
      cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached) {
        render(cached.data, true);
        if (Date.now() - cached.saved < 3600000) return;
      }
    } catch { cached = null; }
    if (!cached) status.textContent = '正在读取 GitHub 贡献…';
    try {
      const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(garden.dataset.user)}?y=last`, { signal: AbortSignal.timeout(12000), credentials: 'omit' });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const data = await response.json();
      render(data);
      try { localStorage.setItem(cacheKey, JSON.stringify({ saved: Date.now(), data })); } catch { /* Storage is optional. */ }
    } catch {
      status.textContent = cached ? `${status.textContent} · 更新暂不可用` : '贡献数据暂时不可用，可以稍后重试或访问 GitHub。';
      retry.hidden = false;
    }
  }
  retry.addEventListener('click', load);
  load();
})();
