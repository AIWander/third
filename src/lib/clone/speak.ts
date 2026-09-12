import { createServerFn } from "@tanstack/react-start";
import { handPromptBlock, specsForMandates, toOpenAiTools } from "./hands";
import { buildSystemPrompt } from "./prompt";
import type { ChatMessage, CloneDossier } from "./types";

export type SpeakInput = {
  message: string;
  dossier: CloneDossier;
  history: ChatMessage[];
};

export type SpeakResult =
  | {
      ok: true;
      text: string;
      reaches: string[];
      loginRequired?: boolean;
      loginUrl?: string;
      pending?: boolean;
    }
  | {
      ok: false;
      error: string;
      loginRequired?: boolean;
      loginUrl?: string;
      pending?: boolean;
    };

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type LlmMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type CompletionsBody = {
  choices?: {
    finish_reason?: string;
    message?: {
      content?: string | null;
      tool_calls?: ToolCall[];
    };
  }[];
};

const MODEL = "grok-4.20-0309-non-reasoning";
const MAX_ROUNDS = 3;

async function complete(
  apiKey: string,
  messages: LlmMessage[],
  tools: ReturnType<typeof toOpenAiTools>,
  temperature: number,
): Promise<CompletionsBody | { error: string }> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 360,
      temperature,
      ...(tools.length
        ? { tools, tool_choice: "auto", parallel_tool_calls: true }
        : {}),
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return { error: `xAI API error ${res.status}` };
  return (await res.json()) as CompletionsBody;
}

export const speakAsClone = createServerFn({ method: "POST" })
  .validator((input: SpeakInput) => {
    const message = String(input?.message ?? "").trim().slice(0, 2000);
    if (!message) throw new Error("empty");
    return {
      message,
      dossier: input.dossier,
      history: Array.isArray(input.history) ? input.history.slice(-8) : [],
    };
  })
  .handler(async ({ data }): Promise<SpeakResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "The live channel is dark in this environment." };
    }

    const mandates = data.dossier.mandates ?? [];
    const specs = specsForMandates(mandates);
    const tools = toOpenAiTools(specs);
    const heat = data.dossier.traits?.heat ?? 0.4;
    const temperature = 0.25 + heat * 0.7;

    const messages: LlmMessage[] = [
      {
        role: "system",
        content: `${buildSystemPrompt(data.dossier)}\n\n${handPromptBlock(mandates)}`,
      },
      ...data.history.map((m) => ({
        role: (m.role === "hand" ? "assistant" : "user") as "assistant" | "user",
        content: m.text.slice(0, 1500),
      })),
      { role: "user", content: data.message },
    ];

    try {
      const { executeHand, formatToolOutput } = await import("./hands.server");
      const reaches: string[] = [];
      let loginRequired = false;
      let loginUrl: string | undefined;
      let pending = false;

      for (let round = 0; round < MAX_ROUNDS; round++) {
        const body = await complete(apiKey, messages, tools, temperature);
        if ("error" in body) {
          return { ok: false, error: "The channel refused. Try again in a moment." };
        }
        const choice = body.choices?.[0];
        const msg = choice?.message;
        const calls = msg?.tool_calls ?? [];

        if (!calls.length) {
          const text = msg?.content?.trim() ?? "";
          if (!text) return { ok: false, error: "The channel went thin." };
          return {
            ok: true,
            text,
            reaches,
            ...(loginRequired ? { loginRequired, loginUrl } : {}),
            ...(pending ? { pending: true } : {}),
          };
        }

        messages.push({
          role: "assistant",
          content: msg?.content ?? null,
          tool_calls: calls,
        });

        for (const call of calls.slice(0, 4)) {
          let parsed: unknown = {};
          try {
            parsed = JSON.parse(call.function.arguments || "{}");
          } catch {
            parsed = {};
          }
          const gate = await executeHand(call.function.name, parsed, mandates);
          if (gate.kind === "ok" && !reaches.includes(gate.label)) {
            reaches.push(gate.label);
          }
          if (gate.kind === "gate") {
            pending = pending || Boolean(gate.pending);
            if (gate.loginRequired) {
              loginRequired = true;
              loginUrl = gate.loginUrl ?? loginUrl;
            }
          }
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: formatToolOutput(gate),
          });
        }
      }

      const last = messages.filter((m) => m.role === "tool").at(-1);
      if (pending || loginRequired) {
        return {
          ok: true,
          text: loginRequired
            ? "The hands are gated. Continue with Grok to open mail, files, and calendar."
            : "The hands are still connecting. Hold a moment, then ask again.",
          reaches,
          loginRequired,
          loginUrl,
          pending,
        };
      }
      return {
        ok: true,
        text:
          last && "content" in last
            ? "Reached. Ask me to brief what I found."
            : "The channel went thin.",
        reaches,
      };
    } catch {
      return { ok: false, error: "The channel dropped." };
    }
  });
