import { classifyCallToolError } from "@/lib/app-data/errors";
import type { CallToolResult } from "@/lib/app-data/types";
import type { MandateId } from "./types";
import { HAND_SPECS, specsForMandates, type HandSpec } from "./hands";

export type ReachGate =
  | { kind: "ok"; data: unknown; label: string }
  | { kind: "blocked"; error: string }
  | {
      kind: "gate";
      pending?: boolean;
      loginRequired?: boolean;
      loginUrl?: string;
      error: string;
    };

function asRecord(args: unknown): Record<string, unknown> {
  if (!args || typeof args !== "object" || Array.isArray(args)) return {};
  return args as Record<string, unknown>;
}

function normalizeArgs(spec: HandSpec, raw: Record<string, unknown>): Record<string, unknown> {
  const args = { ...raw };
  if (spec.name.includes("drive_search") && typeof args.query === "string" && !args.q) {
    args.q = args.query;
  }
  if (spec.name.includes("drive_read") && typeof args.id === "string" && !args.fileId) {
    args.fileId = args.id;
  }
  if (spec.name.startsWith("gmail_") && typeof args.q === "string" && !args.query) {
    args.query = args.q;
  }
  if (typeof args.maxResults === "number") {
    args.maxResults = Math.min(15, Math.max(1, Math.round(args.maxResults)));
  }
  return args;
}

function clipResult(data: unknown): string {
  try {
    const text = JSON.stringify(data);
    if (!text) return "empty";
    return text.length > 3200 ? `${text.slice(0, 3200)}…[truncated]` : text;
  } catch {
    return String(data).slice(0, 1200);
  }
}

export async function executeHand(
  name: string,
  rawArgs: unknown,
  mandates: MandateId[],
): Promise<ReachGate> {
  const allowed = specsForMandates(mandates);
  const spec = allowed.find((s) => s.name === name);
  if (!spec) {
    const known = HAND_SPECS.find((s) => s.name === name);
    if (known) {
      return {
        kind: "blocked",
        error: `Hand not authorized for ${known.label}. Missing mandate.`,
      };
    }
    return { kind: "blocked", error: `Unknown hand: ${name}` };
  }

  const { callTool } = await import("@/lib/app-data/client.server");
  const result: CallToolResult = await callTool(
    spec.name,
    normalizeArgs(spec, asRecord(rawArgs)),
    { connectorType: spec.connectorType },
  );

  if (result.ok) {
    return { kind: "ok", data: result.data, label: spec.label };
  }

  const classified = classifyCallToolError(result);
  if (classified?.kind === "pending" || result.pending) {
    return {
      kind: "gate",
      pending: true,
      error: classified?.message ?? "Connecting to your data…",
    };
  }
  if (classified?.kind === "login" || result.loginRequired) {
    return {
      kind: "gate",
      loginRequired: true,
      loginUrl: result.loginUrl,
      error: classified?.message ?? "Continue with Grok to load your data.",
    };
  }

  return {
    kind: "blocked",
    error: classified?.message ?? result.errorMessage ?? "The hand could not reach.",
  };
}

export function formatToolOutput(gate: ReachGate): string {
  if (gate.kind === "ok") return clipResult(gate.data);
  if (gate.kind === "gate") {
    return JSON.stringify({
      gated: true,
      pending: gate.pending ?? false,
      loginRequired: gate.loginRequired ?? false,
      message: gate.error,
    });
  }
  return JSON.stringify({ error: gate.error });
}
