const iotaOrigin = 'https://bowei-iota.netlify.app';

const forwardedHeaders = [
  'accept',
  'authorization',
  'content-type',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'origin',
  'range',
  'referer',
];

export default async function proxyIota(request) {
  const original = new URL(request.url);
  const upstream = new URL(iotaOrigin);
  upstream.pathname = original.pathname;
  upstream.search = original.search;

  const headers = new Headers({'accept-encoding': 'identity'});
  for (const name of forwardedHeaders) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  const gateCookie = request.headers.get('cookie')?.split(/;\s*/).find(cookie => cookie.startsWith('iota_gate='));
  if (gateCookie) headers.set('cookie', gateCookie);

  const response = await fetch(upstream, {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'manual',
  });

  const location = response.headers.get('location');
  if (!location || response.status < 300 || response.status >= 400) return response;

  const destination = new URL(location, upstream);
  if (destination.origin !== iotaOrigin) return response;

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('location', destination.pathname + destination.search + destination.hash);
  return new Response(response.body, {status: response.status, headers: responseHeaders});
}

export const config = {
  path: ['/iota', '/iota/*', '/iota-demonstration', '/iota-demonstration/*'],
};
