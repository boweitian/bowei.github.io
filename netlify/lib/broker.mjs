import {randomBytes} from "node:crypto";
import {workerAuthorized, json, unauthorized} from "./auth.mjs";

const METHODS = new Set(["/studio/chat", "/studio/compare", "/studio/walk", "/studio/direction", "/route"]);
const ID = /^\d{13}-[a-f0-9]{32}$/;
const LEASE = 360_000;
const RETENTION = 900_000;
const HEARTBEAT = 60_000;
const get = (store, key) => store.get(key, {type: "json"});

async function body(request, max = 120000) {
  if (!(request.headers.get("content-type") || "").startsWith("application/json"))
    throw {status: 415, message: "Use application/json"};
  const length = Number(request.headers.get("content-length") || 0);
  if (length > max) throw {status: 413, message: "Request too large"};
  const reader = request.body?.getReader();
  if (!reader) throw {status: 400, message: "Expected a JSON object"};
  let size = 0;
  const chunks = [];
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) { await reader.cancel(); throw {status: 413, message: "Request too large"}; }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  try {
    const value = JSON.parse(new TextDecoder().decode(buffer));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw Error();
    return value;
  } catch { throw {status: 400, message: "Expected a JSON object"}; }
}

function onlineStatus(heartbeat, now) {
  const state = heartbeat?.status;
  const alive = !!heartbeat && now - heartbeat.updated_at < HEARTBEAT;
  const online = alive && state?.online === true;
  return {...(state || {}), application: "iota-interactive", online,
    message: online ? state.message : "模型暂未连接，可继续浏览实测结果。"};
}

export function createBroker(store, env, now = Date.now) {
  return async function handle(request) {
    const url = new URL(request.url);
    const path = url.pathname.slice("/iota/api".length);
    if (!url.pathname.startsWith("/iota/api/")) return json({error: "Not found"}, 404);
    const bridge = path === "/bridge";
    if (bridge && !env.IOTA_BRIDGE_TOKEN) return json({error: "IOTA 尚未完成服务配置。"}, 503);
    if (bridge && !(await workerAuthorized(request, env))) return unauthorized();
    if (!["GET", "POST"].includes(request.method)) return json({error: "Method not allowed"}, 405);
    if (request.method === "POST") {
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin) return json({error: "Cross-origin submission denied"}, 403);
    }
    try {
      if (bridge) {
        if (request.method !== "POST") return json({error: "Method not allowed"}, 405);
        const input = await body(request, 2_000_000);
        if (!input.status || typeof input.status.online !== "boolean")
          return json({error: "Worker status required"}, 400);
        await store.setJSON("heartbeat", {status: input.status, updated_at: now()});
        // Results are idempotent. A network retry cannot execute the GPU job twice.
        if (input.result) {
          const result = input.result;
          if (!ID.test(result.id) || !Number.isInteger(result.status) || result.status < 200 || result.status > 599)
            return json({error: "Invalid worker result"}, 400);
          if (await get(store, "results/" + result.id)) return json({accepted: true});
          const active = await store.getWithMetadata("active", {type: "json"});
          if (active?.data.id !== result.id || active.data.expires_at <= now())
            return json({error: "Job lease expired"}, 409);
          await store.setJSON("results/" + result.id,
            {status: result.status, body: result.body, expires_at: now() + RETENTION}, {onlyIfNew: true});
          await store.setJSON("active", {id: result.id, phase: "done", expires_at: now()}, {onlyIfMatch: active.etag});
          return json({accepted: true});
        }
        if (input.cleanup === true) {
          const {blobs} = await store.list({prefix: "results/"});
          await Promise.all(blobs.filter(entry => Number(entry.key.slice(8, 21)) < now() - LEASE - RETENTION)
            .map(entry => store.delete(entry.key)));
        }
        const active = await store.getWithMetadata("active", {type: "json"});
        if (input.claim !== false && active && active.data.phase === "queued" && active.data.expires_at > now() && input.status.online) {
          const {modified} = await store.setJSON("active", {...active.data, phase: "running"}, {onlyIfMatch: active.etag});
          if (modified) return json({job: {id: active.data.id, path: active.data.path, body: active.data.body}});
        }
        return json({job: null});
      }
      if (path === "/status" && request.method === "GET")
        return json(onlineStatus(env.IOTA_BRIDGE_TOKEN ? await get(store, "heartbeat") : null, now()));
      if (path === "/latest" && request.method === "GET") return json({latest: null});
      if (path.startsWith("/jobs/") && request.method === "GET") {
        const id = path.slice(6);
        if (!ID.test(id)) return json({error: "Not found"}, 404);
        const result = await get(store, "results/" + id);
        if (result && result.expires_at > now()) return json(result.body, result.status);
        const active = await get(store, "active");
        if (active?.id === id && active.expires_at > now()) return json({pending: true}, 202);
        return json({error: "本次生成已过期，请重新提交。"}, 410);
      }
      if (!METHODS.has(path) || request.method !== "POST") return json({error: "Not found"}, 404);
      if (!env.IOTA_BRIDGE_TOKEN) return json({error: "模型暂未连接，请稍后重试。"}, 503);
      const input = await body(request);
      delete input.display_in_browser;
      if (!onlineStatus(await get(store, "heartbeat"), now()).online)
        return json({error: "模型暂未连接，请稍后重试。"}, 503);
      const id = String(now()) + "-" + randomBytes(16).toString("hex");
      const active = await store.getWithMetadata("active", {type: "json"});
      if (active && active.data.expires_at > now())
        return json({error: "模型正在处理另一条请求，请完成后再试。"}, 429, {"Retry-After": "10"});
      const condition = active ? {onlyIfMatch: active.etag} : {onlyIfNew: true};
      const {modified} = await store.setJSON("active",
        {id, path: "/api" + path, body: input, phase: "queued", expires_at: now() + LEASE}, condition);
      if (!modified) return json({error: "模型正在处理另一条请求，请完成后再试。"}, 429);
      return json({job_id: id, poll_url: "/iota/api/jobs/" + id}, 202);
    } catch (error) {
      if (error.status) return json({error: error.message}, error.status);
      // Storage errors must not leak provider credentials or conversation payloads.
      console.error("IOTA broker storage operation failed");
      return json({error: "服务暂时不可用，请稍后重试。"}, 503);
    }
  };
}
