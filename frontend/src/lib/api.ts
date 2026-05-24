import { getJwt } from "./supabase";

const BASE = "/api";

export type Framework = "html" | "tailwind" | "react" | "vue";

export interface ConvertResult {
  code: string;
  remaining: number;
}

export interface UsageResult {
  tier: "free" | "paid";
  used: number;
  limit: number;
  remaining: number;
}

export interface HistoryItem {
  id: string;
  framework: Framework;
  code: string;
  created_at: string;
}

export class PaywallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaywallError";
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const jwt = await getJwt();
  if (!jwt) throw new AuthError("Not signed in.");
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function convertScreenshot(
  file: File,
  framework: Framework,
  onLog: (line: string) => void,
): Promise<ConvertResult> {
  const image_b64 = await fileToBase64(file);
  const headers = await authHeaders();

  const res = await fetch(`${BASE}/convert`, {
    method: "POST",
    headers,
    body: JSON.stringify({ image_b64, mime_type: file.type, framework }),
  });

  if (res.status === 402) throw new PaywallError("Conversion limit reached.");
  if (res.status === 401) throw new AuthError("Please sign in.");
  if (res.status === 429) throw new Error("Too many requests. Wait a moment.");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Conversion failed.");
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: ConvertResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop()!;

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === ": ping") continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }

      if (parsed === "__DONE__") {
        if (result) return result;
        throw new Error("Stream ended without result.");
      }

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "type" in parsed &&
        (parsed as { type: string }).type === "result"
      ) {
        const inner = JSON.parse((parsed as unknown as { content: string }).content);
        result = { code: inner.code, remaining: inner.remaining };
        continue;
      }

      if (typeof parsed === "string") {
        if (parsed.startsWith("[ERROR]")) {
          throw new Error(parsed.replace("[ERROR] ", ""));
        }
        if (!parsed.startsWith("[TRACE]")) {
          onLog(parsed);
        }
      }
    }
  }

  if (result) return result;
  throw new Error("Conversion stream ended unexpectedly.");
}

export async function getUsage(): Promise<UsageResult> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/usage`, { headers });
  if (!res.ok) throw new Error("Failed to fetch usage.");
  return res.json();
}

export async function getHistory(): Promise<HistoryItem[]> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/history`, { headers });
  if (!res.ok) throw new Error("Failed to fetch history.");
  const data = await res.json();
  return data.history;
}
