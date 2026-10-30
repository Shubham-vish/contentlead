import os from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";

export function loadApi() {
  return JSON.parse(readFileSync(path.join(os.homedir(), ".skilltown-desktop", "api.json"), "utf8"));
}

export function createEditorClient({ readDiscovery = loadApi, fetchImpl = (...args) => fetch(...args) } = {}) {
  let target;
  const requireTarget = () => {
    if (!target) throw new Error("Explicit --tab-id and --content-id are required before API execution.");
    return target;
  };
  const setTarget = ({ tabId, contentId } = {}) => {
    target = undefined;
    if (typeof tabId !== "string" || !tabId.trim() || typeof contentId !== "string" || !contentId.trim()) {
      throw new Error("Explicit --tab-id and --content-id must be nonempty strings.");
    }
    target = Object.freeze({ tabId, contentId });
  };
  async function request(method, pathname, body) {
    const cfg = readDiscovery();
    if (!Number.isInteger(cfg?.port) || cfg.port < 1 || cfg.port > 65535 ||
        typeof cfg.token !== "string" || !cfg.token.trim() || /[\r\n]/.test(cfg.token)) {
      throw new Error("Invalid Desktop discovery port/token; no request sent.");
    }
    const response = await fetchImpl(`http://127.0.0.1:${cfg.port}${pathname}`, {
      method,
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(120000),
    });
    let result;
    try { result = await response.json(); }
    catch { throw new Error(`Desktop returned non-JSON for ${pathname} (HTTP ${response.status}).`); }
    if (!response.ok || result?.status === "failed" || result?.status === "error" || result?.success === false) {
      throw new Error(`Desktop request failed: ${pathname} (HTTP ${response.status}). Inspect state before retrying.`);
    }
    return result;
  }
  async function assertTarget() {
    const pinned = requireTarget();
    const out = await request("POST", "/api/execute", {
      tabId: pinned.tabId, type: "query.getCapabilities", params: { expectedContentId: pinned.contentId },
    });
    const capabilities = out?.result;
    if (out?.status !== "success" || capabilities?.hydration?.status !== "ready" ||
        capabilities.hydration.contentId !== pinned.contentId || capabilities.readyForWrites !== true ||
        !Array.isArray(capabilities.commands)) {
      throw new Error("Target project is unverified, hydrating, read-only or different; no operation dispatched.");
    }
    if (target !== pinned) throw new Error("Target changed during readiness inspection.");
    return capabilities;
  }
  async function execute(type, params = {}) {
    const pinned = requireTarget();
    if (params.expectedContentId !== undefined && params.expectedContentId !== pinned.contentId) {
      throw new Error("Command content assertion differs from the explicit target.");
    }
    const capabilities = await assertTarget();
    if (target !== pinned) throw new Error("Target changed during readiness inspection.");
    if (!capabilities.commands.includes(type)) throw new Error(`Unsupported renderer command: ${type}`);
    const out = await request("POST", "/api/execute", {
      tabId: pinned.tabId, type, params: { ...params, expectedContentId: pinned.contentId },
    });
    if (out?.status !== "success") throw new Error(`Command ${type} did not complete successfully; do not replay blindly.`);
    return out;
  }
  return {
    setTarget, assertTarget, execute,
    post: async (pathname, body) => {
      const pinned = requireTarget();
      await assertTarget();
      if (target !== pinned) throw new Error("Target changed during readiness inspection.");
      return request("POST", pathname, body);
    },
    health: () => request("GET", "/api/health"),
  };
}
