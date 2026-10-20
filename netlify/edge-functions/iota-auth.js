import {authorized, json, unauthorized} from "../lib/auth.mjs";

export default async function(request, context) {
  const env = Object.fromEntries(["IOTA_ACCESS_USERNAME", "IOTA_ACCESS_PASSWORD", "IOTA_BRIDGE_TOKEN"]
    .map(key => [key, Netlify.env.get(key)]));
  if (!env.IOTA_ACCESS_USERNAME || !env.IOTA_ACCESS_PASSWORD || !env.IOTA_BRIDGE_TOKEN)
    return json({error: "IOTA 尚未完成服务配置。"}, 503);
  const bridge = new URL(request.url).pathname === "/iota/api/bridge";
  if (!(await authorized(request, env, bridge))) return unauthorized();
  const response = await context.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {path: ["/iota", "/iota/*"]};
