import { hazardById } from "@/lib/hazards";
import type { HazardClass, Ticket, TicketStatus } from "@/lib/types";

export const SURGE_AFTER_HOURS = 72;
export const SURGE_STEP = 0.08;
export const SURGE_CAP_STEPS = 6;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function basePayout(hazard: HazardClass, regionalIndex: number): number {
  return round2(hazardById(hazard).schedule * regionalIndex);
}

export function surgeFactor(
  approvedAt: string | undefined,
  status: TicketStatus,
  now = Date.now(),
): number {
  if (status !== "APPROVED_FOR_BID" || !approvedAt) return 1;
  const hours = (now - new Date(approvedAt).getTime()) / 3_600_000;
  if (hours <= SURGE_AFTER_HOURS) return 1;
  const steps = Math.min(
    SURGE_CAP_STEPS,
    Math.floor((hours - SURGE_AFTER_HOURS) / 24),
  );
  return round2(1 + steps * SURGE_STEP);
}

export function currentOffer(
  ticket: Ticket,
  regionalIndex: number,
  now = Date.now(),
): number {
  if (ticket.lockedRate != null) return ticket.lockedRate;
  const base =
    ticket.rateAtApproval ?? basePayout(ticket.hazardClass, regionalIndex);
  if (ticket.status === "APPROVED_FOR_BID") {
    return round2(base * surgeFactor(ticket.approvedAt, ticket.status, now));
  }
  return base;
}
