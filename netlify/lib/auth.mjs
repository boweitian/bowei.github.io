const encoder = new TextEncoder();

// Hash both inputs before comparison so token length does not affect the loop.
export async function sameSecret(actual, expected) {
  if (!expected) return false;
  const hash = async value => new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  const [a, b] = await Promise.all([hash(actual), hash(expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function authorized(request, env, bridge = false) {
  const header = request.headers.get("authorization") || "";
  if (bridge) return !!env.IOTA_BRIDGE_TOKEN && sameSecret(header, "Bearer " + env.IOTA_BRIDGE_TOKEN);
  if (!env.IOTA_ACCESS_USERNAME || !env.IOTA_ACCESS_PASSWORD) return false;
  if (!header.startsWith("Basic ")) return false;
  try {
    return sameSecret(atob(header.slice(6)), env.IOTA_ACCESS_USERNAME + ":" + env.IOTA_ACCESS_PASSWORD);
  } catch { return false; }
}

export function json(value, status = 200, headers = {}) {
  return Response.json(value, {status, headers: {"Cache-Control": "private, no-store", ...headers}});
}

export function unauthorized() {
  return json({error: "请输入 IOTA 用户名与访问密码。"}, 401,
    {"WWW-Authenticate": 'Basic realm="IOTA demo", charset="UTF-8"'});
}
