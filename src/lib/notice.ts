import { hazardById } from "@/lib/hazards";
import type { Ticket } from "@/lib/types";
import type { Town } from "@/lib/towns";

export function buildNotice(ticket: Ticket, town: Town): string {
  const hazard = hazardById(ticket.hazardClass);
  return [
    "CIVICPATCH DEFECT NOTICE",
    "version: 1",
    `record: ${ticket.id}`,
    `municipality: ${town.kind} of ${town.name}, ${town.state}`,
    `desk: ${town.department}`,
    `framework: ${town.statute}`,
    `reported_at: ${ticket.createdAt}`,
    `reporter: ${ticket.reporterName}`,
    `place: ${ticket.address}`,
    `latitude: ${ticket.lat.toFixed(5)}`,
    `longitude: ${ticket.lng.toFixed(5)}`,
    `classification: ${hazard.open311}`,
    `description: ${ticket.description.replace(/\s+/g, " ").trim()}`,
    "purpose: Records that a road defect was reported for public maintenance. Not an injury claim. Not legal advice.",
  ].join("\n");
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
