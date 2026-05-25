const BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export type Framework = "html" | "tailwind" | "react" | "vue";

export interface ConvertResult {
  code: string;
}

export class ConvertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConvertError";
  }
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
  paymentToken?: string,
): Promise<ConvertResult> {
  const image_b64 = await fileToBase64(file);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (paymentToken) headers["X-Payment-Token"] = paymentToken;

  const res = await fetch(`${BASE}/convert`, {
    method: "POST",
    headers,
    body: JSON.stringify({ image_b64, mime_type: file.type, framework }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try { message = (JSON.parse(text) as { detail?: string }).detail ?? text; } catch {}
    throw new ConvertError(message || "Conversion failed.");
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
      if (!raw) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }

      if (parsed === "__DONE__") {
        if (result) return result;
        throw new ConvertError("Stream ended without result.");
      }

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "type" in parsed &&
        (parsed as { type: string }).type === "result"
      ) {
        const inner = JSON.parse((parsed as unknown as { content: string }).content);
        result = { code: inner.code };
        continue;
      }

      if (typeof parsed === "string") {
        if (parsed.startsWith("[ERROR]")) throw new ConvertError(parsed.replace("[ERROR] ", ""));
        if (!parsed.startsWith("[TRACE]")) onLog(parsed);
      }
    }
  }

  if (result) return result;
  throw new ConvertError("Stream ended unexpectedly.");
}
