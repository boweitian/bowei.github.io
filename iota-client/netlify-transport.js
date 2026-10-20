/* Keep the existing UI and native model responses; only transport is asynchronous. */
(() => {
  const nativeFetch = window.fetch.bind(window);
  const sleep = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const cancel = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, ms);
    signal?.addEventListener('abort', cancel, {once: true});
  });
  window.fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return nativeFetch(input, options);
    const request = input instanceof Request ? new Request(input, options) : new Request(url, options);
    url.pathname = '/iota' + url.pathname;
    // Materialize the small JSON body: streaming uploads require HTTP/2 and can
    // otherwise fail before reaching the function (including local previews).
    const response = await nativeFetch(url, {method: request.method, headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      credentials: request.credentials, cache: request.cache, signal: request.signal});
    if (request.method !== 'POST' || response.status !== 202) return response;
    const queued = await response.json();
    const poll = new URL(queued.poll_url, location.origin);
    if (poll.origin !== location.origin || !/^\/iota\/api\/jobs\/\d{13}-[a-f0-9]{32}$/.test(poll.pathname))
      throw new Error('模型任务地址无效。');
    const deadline = Date.now() + 360000;
    while (Date.now() < deadline) {
      await sleep(2500, request.signal);
      const result = await nativeFetch(poll, {cache: 'no-store', credentials: 'same-origin', signal: request.signal});
      if (result.status !== 202) return result;
    }
    return Response.json({error: '本次生成超时，请稍后重试。'}, {status: 504});
  };
})();
