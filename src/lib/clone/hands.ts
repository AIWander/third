import {
  ConnectorType,
  GoogleCalendarTools,
  GoogleDriveTools,
  type ConnectorTypeName,
} from "@/lib/app-data/types";
import type { MandateId } from "./types";

export type OpenAiTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type HandSpec = {
  name: string;
  label: string;
  connectorType: ConnectorTypeName;
  mandates: MandateId[];
  mutate: boolean;
  description: string;
  parameters: Record<string, unknown>;
};

const READ: MandateId[] = [
  "research",
  "watch",
  "draft",
  "protect",
  "mirror",
  "execute",
];

export const HAND_SPECS: HandSpec[] = [
  {
    name: GoogleDriveTools.search,
    label: "Drive",
    connectorType: ConnectorType.GoogleDrive,
    mandates: READ,
    mutate: false,
    description:
      "Search the operator's Google Drive. Use a short Drive query (name, type, topic).",
    parameters: {
      type: "object",
      properties: {
        q: {
          type: "string",
          description: "Drive search query, e.g. name contains 'brief' or mime type.",
        },
      },
      required: ["q"],
    },
  },
  {
    name: GoogleDriveTools.readFile,
    label: "Drive",
    connectorType: ConnectorType.GoogleDrive,
    mandates: READ,
    mutate: false,
    description: "Read a Drive file by id returned from search or list.",
    parameters: {
      type: "object",
      properties: {
        fileId: { type: "string", description: "Drive file id" },
      },
      required: ["fileId"],
    },
  },
  {
    name: GoogleDriveTools.listFolder,
    label: "Drive",
    connectorType: ConnectorType.GoogleDrive,
    mandates: READ,
    mutate: false,
    description: "List files in a Drive folder. Omit folderId for the root.",
    parameters: {
      type: "object",
      properties: {
        folderId: { type: "string", description: "Folder id, optional" },
      },
    },
  },
  {
    name: GoogleDriveTools.createFolder,
    label: "Drive",
    connectorType: ConnectorType.GoogleDrive,
    mandates: ["execute"],
    mutate: true,
    description: "Create a Drive folder. Only when the Execute hand is authorized.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        parentId: { type: "string", description: "Optional parent folder id" },
      },
      required: ["name"],
    },
  },
  {
    name: GoogleCalendarTools.listCalendars,
    label: "Calendar",
    connectorType: ConnectorType.GoogleCalendar,
    mandates: READ,
    mutate: false,
    description: "List the operator's Google calendars.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: GoogleCalendarTools.search,
    label: "Calendar",
    connectorType: ConnectorType.GoogleCalendar,
    mandates: READ,
    mutate: false,
    description:
      "Search calendar events. Prefer ISO times. Use for what's on the schedule.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text event search" },
        timeMin: { type: "string", description: "ISO start (inclusive)" },
        timeMax: { type: "string", description: "ISO end (exclusive)" },
      },
    },
  },
  {
    name: GoogleCalendarTools.getEvent,
    label: "Calendar",
    connectorType: ConnectorType.GoogleCalendar,
    mandates: READ,
    mutate: false,
    description: "Get one calendar event by id.",
    parameters: {
      type: "object",
      properties: {
        eventId: { type: "string" },
        calendarId: { type: "string", description: "Defaults to primary" },
      },
      required: ["eventId"],
    },
  },
  {
    name: GoogleCalendarTools.availability,
    label: "Calendar",
    connectorType: ConnectorType.GoogleCalendar,
    mandates: READ,
    mutate: false,
    description: "Check free/busy availability in a time range.",
    parameters: {
      type: "object",
      properties: {
        timeMin: { type: "string", description: "ISO start" },
        timeMax: { type: "string", description: "ISO end" },
        calendarId: { type: "string" },
      },
      required: ["timeMin", "timeMax"],
    },
  },
  {
    name: "gmail_search",
    label: "Mail",
    connectorType: ConnectorType.Gmail,
    mandates: READ,
    mutate: false,
    description:
      "Search the operator's Gmail with Gmail operators (from:, subject:, newer_than:, is:unread).",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        maxResults: { type: "number", description: "Default 8, max 15" },
      },
      required: ["query"],
    },
  },
  {
    name: "gmail_get_message",
    label: "Mail",
    connectorType: ConnectorType.Gmail,
    mandates: READ,
    mutate: false,
    description: "Read one Gmail message by id from search results.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Gmail message id" },
      },
      required: ["id"],
    },
  },
];

export function specsForMandates(mandates: MandateId[]): HandSpec[] {
  return HAND_SPECS.filter((spec) => {
    if (spec.mutate && !mandates.includes("execute")) return false;
    return spec.mandates.some((m) => mandates.includes(m));
  });
}

export function reachLabels(mandates: MandateId[]): string[] {
  return [...new Set(specsForMandates(mandates).map((s) => s.label))];
}

export function toOpenAiTools(specs: HandSpec[]): OpenAiTool[] {
  return specs.map((spec) => ({
    type: "function" as const,
    function: {
      name: spec.name,
      description: spec.description,
      parameters: spec.parameters,
    },
  }));
}

export function handPromptBlock(mandates: MandateId[]): string {
  const specs = specsForMandates(mandates);
  if (specs.length === 0) {
    return `Live reach: none. You have no authorized hands that open mail, files, or calendar. If asked to look them up, refuse and name the missing hand (Research, Watch, Draft, Execute, Protect, or Mirror).`;
  }
  const labels = [...new Set(specs.map((s) => s.label))].join(", ");
  return `Live reach (use tools, do not invent the operator's mail/files/schedule):
- Open channels: ${labels}.
- Call a tool whenever the operator asks about their real inbox, Drive, or calendar.
- If a tool returns login/pending/not connected, say the hand is gated and they must continue from Grok — do not fabricate contents.
- Never send mail, never trash files. Create a Drive folder only with the Execute hand.
- Compress tool results. Quote only what is needed.`;
}
