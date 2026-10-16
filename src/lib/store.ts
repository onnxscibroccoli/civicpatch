import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GEOFENCE_METERS, isPastDate } from "@/lib/format";
import { buildNotice, sha256Hex } from "@/lib/notice";
import { basePayout, currentOffer } from "@/lib/rates";
import { emptyOnboarding, seedTickets } from "@/lib/seed";
import { townBySlug } from "@/lib/towns";
import type { Onboarding, QuizScore, Role, Ticket, TicketStatus } from "@/lib/types";

interface ReportInput {
  reporterName: string;
  description: string;
  hazardClass: Ticket["hazardClass"];
  lat: number;
  lng: number;
  address: string;
  townSlug: string;
  beforePhoto: string;
}

interface CivicState {
  role: Role;
  residentName: string;
  tickets: Ticket[];
  onboarding: Onboarding;
  scores: Record<string, QuizScore>;
  setRole: (role: Role) => void;
  setResidentName: (name: string) => void;
  patchOnboarding: (partial: Partial<Onboarding>) => void;
  recordQuiz: (slug: string, score: QuizScore) => void;
  activateCrew: () => void;
  sealNotices: () => Promise<void>;
  sweepExpired: () => void;
  report: (input: ReportInput) => string;
  approveForBid: (id: string) => void;
  rejectTicket: (id: string, reason: string) => void;
  claim: (id: string) => { ok: boolean; error?: string };
  release: (id: string) => { ok: boolean; error?: string };
      voidLease: (id: string) => void;
  submitWork: (
    id: string,
    photo: string,
    deltaMeters: number,
    mode: "gps" | "sandbox",
  ) => { ok: boolean; error?: string };
  acceptWork: (id: string) => void;
  returnWork: (id: string, note: string) => void;
  disburse: (id: string) => void;
  resetDemo: () => void;
}

function nextId(tickets: Ticket[]): string {
  const nums = tickets.map((ticket) => Number(ticket.id.replace("CP-", "")));
  const max = nums.reduce((hi, n) => (Number.isFinite(n) ? Math.max(hi, n) : hi), 2400);
  return `CP-${max + 1}`;
}

function withEvent(ticket: Ticket, label: string, detail?: string): Ticket {
  return {
    ...ticket,
    events: [
      ...ticket.events,
      { at: new Date().toISOString(), label, ...(detail ? { detail } : {}) },
    ],
  };
}

function initial() {
  return {
    role: "resident" as Role,
    residentName: "",
    tickets: seedTickets(),
    onboarding: emptyOnboarding(),
    scores: {} as Record<string, QuizScore>,
  };
}

export const useCivic = create<CivicState>()(
  persist(
    (set, get) => ({
      ...initial(),
      setRole: (role) => set({ role }),
      setResidentName: (residentName) => set({ residentName }),
      patchOnboarding: (partial) =>
        set({ onboarding: { ...get().onboarding, ...partial } }),
      recordQuiz: (slug, score) =>
        set({ scores: { ...get().scores, [slug]: score } }),
      activateCrew: () =>
        set({
          onboarding: {
            ...get().onboarding,
            activatedAt: new Date().toISOString(),
            step: 8,
          },
        }),
      sealNotices: async () => {
        const next: Ticket[] = [];
        let changed = false;
        for (const ticket of get().tickets) {
          if (ticket.noticeBody && ticket.noticeSha256) {
            next.push(ticket);
            continue;
          }
          const town = townBySlug(ticket.townSlug);
          const noticeBody = ticket.noticeBody ?? buildNotice(ticket, town);
          const noticeSha256 = ticket.noticeSha256 ?? (await sha256Hex(noticeBody));
          changed = true;
          next.push({ ...ticket, noticeBody, noticeSha256 });
        }
        if (changed) set({ tickets: next });
      },
      sweepExpired: () => {
        const now = Date.now();
        let changed = false;
        const tickets = get().tickets.map((ticket) => {
          if (
            ticket.status === "CLAIMED" &&
            ticket.claimExpiresAt &&
            new Date(ticket.claimExpiresAt).getTime() < now
          ) {
            changed = true;
            const returned: Ticket = {
              ...ticket,
              status: "APPROVED_FOR_BID",
              claimedAt: undefined,
              claimExpiresAt: undefined,
              contractorName: undefined,
              lockedRate: undefined,
            };
            return withEvent(
              returned,
              "Lease expired",
              "The job is back on the board.",
            );
          }
          return ticket;
        });
        if (changed) set({ tickets });
      },
      report: (input) => {
        const id = nextId(get().tickets);
        const createdAt = new Date().toISOString();
        const ticket: Ticket = {
          id,
          title: input.description.trim().slice(0, 80) || "Road hazard",
          description: input.description.trim(),
          hazardClass: input.hazardClass,
          status: "REPORTED",
          lat: input.lat,
          lng: input.lng,
          address: input.address.trim(),
          townSlug: input.townSlug,
          reporterName: input.reporterName.trim(),
          beforePhoto: input.beforePhoto,
          createdAt,
          events: [
            {
              at: createdAt,
              label: "Resident filed the report",
              detail: "A defect notice was sealed for the municipal desk.",
            },
          ],
        };
        set({
          tickets: [ticket, ...get().tickets],
          residentName: input.reporterName.trim(),
        });
        return id;
      },
      approveForBid: (id) => {
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id || ticket.status !== "REPORTED") return ticket;
            const town = townBySlug(ticket.townSlug);
            const rate = basePayout(ticket.hazardClass, town.index);
            const next = withEvent(
              {
                ...ticket,
                status: "APPROVED_FOR_BID" as TicketStatus,
                approvedAt: new Date().toISOString(),
                rateAtApproval: rate,
              },
              "Engineer posted the job",
              "Schedule price is on the board.",
            );
            return next;
          }),
        });
      },
      rejectTicket: (id, reason) => {
        const clean = reason.trim();
        if (!clean) return;
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id) return ticket;
            if (ticket.status === "VERIFIED_PAID") return ticket;
            return withEvent(
              { ...ticket, status: "REJECTED", rejectReason: clean },
              "Desk closed the record",
              clean,
            );
          }),
        });
      },
      claim: (id) => {
        const { onboarding } = get();
        if (!onboarding.activatedAt || !onboarding.businessName.trim()) {
          return { ok: false, error: "Activate your crew before claiming work." };
        }
        if (isPastDate(onboarding.insuranceExpires)) {
          return {
            ok: false,
            error: "The insurance date on your crew profile has passed.",
          };
        }
        let error: string | undefined;
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id) return ticket;
            if (ticket.status !== "APPROVED_FOR_BID") {
              error = "That job is no longer open.";
              return ticket;
            }
            const town = townBySlug(ticket.townSlug);
            const locked = currentOffer(ticket, town.index);
            const now = new Date();
            const exp = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            return withEvent(
              {
                ...ticket,
                status: "CLAIMED",
                claimedAt: now.toISOString(),
                claimExpiresAt: exp.toISOString(),
                contractorName: onboarding.businessName.trim(),
                lockedRate: locked,
              },
              "Crew claimed the job",
              `${onboarding.businessName.trim()} has 24 hours.`,
            );
          }),
        });
        return error ? { ok: false, error } : { ok: true };
      },
      release: (id) => {
        const name = get().onboarding.businessName.trim();
        let error: string | undefined;
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id) return ticket;
            if (ticket.status !== "CLAIMED" || ticket.contractorName !== name) {
              error = "Only the crew holding this lease can release it.";
              return ticket;
            }
            return withEvent(
              {
                ...ticket,
                status: "APPROVED_FOR_BID",
                claimedAt: undefined,
                claimExpiresAt: undefined,
                contractorName: undefined,
                lockedRate: undefined,
              },
              "Crew released the lease",
              "The job is back on the board.",
            );
          }),
        });
        return error ? { ok: false, error } : { ok: true };
      },
      voidLease: (id) => {
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id || ticket.status !== "CLAIMED") return ticket;
            return withEvent(
              {
                ...ticket,
                status: "APPROVED_FOR_BID",
                claimedAt: undefined,
                claimExpiresAt: undefined,
                contractorName: undefined,
                lockedRate: undefined,
              },
              "Desk voided the lease",
              "The job is back on the board.",
            );
          }),
        });
      },
      submitWork: (id, photo, deltaMeters, mode) => {
        const name = get().onboarding.businessName.trim();
        const pass = deltaMeters <= GEOFENCE_METERS;
        let error: string | undefined;
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id) return ticket;
            if (ticket.status !== "CLAIMED" || ticket.contractorName !== name) {
              error = "This lease is not yours.";
              return ticket;
            }
            return withEvent(
              {
                ...ticket,
                status: "WORK_SUBMITTED",
                afterPhoto: photo,
                workSubmittedAt: new Date().toISOString(),
                spatialDeltaM: Math.round(deltaMeters * 10) / 10,
                geofencePass: pass,
                captureMode: mode,
                payoutStatus: pass ? "HELD_IN_ESCROW" : undefined,
              },
              "Completion photo submitted",
              pass
                ? `${deltaMeters.toFixed(1)} m from the pin. Inside the 15 m check.`
                : `${deltaMeters.toFixed(1)} m from the pin. Flagged for a person to review.`,
            );
          }),
        });
        return error ? { ok: false, error } : { ok: true };
      },
      acceptWork: (id) => {
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id || ticket.status !== "WORK_SUBMITTED") return ticket;
            return withEvent(
              {
                ...ticket,
                status: "VERIFIED_PAID",
                payoutStatus: "PENDING_DISBURSEMENT",
              },
              "Engineer accepted the repair",
              "Payment queued for disbursement.",
            );
          }),
        });
      },
      returnWork: (id, note) => {
        const clean = note.trim() || "Sent back for a clearer completion photo.";
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id || ticket.status !== "WORK_SUBMITTED") return ticket;
            return withEvent(
              {
                ...ticket,
                status: "APPROVED_FOR_BID",
                claimedAt: undefined,
                claimExpiresAt: undefined,
                contractorName: undefined,
                lockedRate: undefined,
                afterPhoto: undefined,
                workSubmittedAt: undefined,
                spatialDeltaM: undefined,
                geofencePass: undefined,
                captureMode: undefined,
                payoutStatus: undefined,
              },
              "Engineer returned the job to the board",
              clean,
            );
          }),
        });
      },
      disburse: (id) => {
        set({
          tickets: get().tickets.map((ticket) => {
            if (ticket.id !== id || ticket.payoutStatus !== "PENDING_DISBURSEMENT") {
              return ticket;
            }
            return withEvent(
              {
                ...ticket,
                payoutStatus: "DISBURSED",
                disbursedAt: new Date().toISOString(),
              },
              "Disbursement recorded",
              "Full fair rate to the crew.",
            );
          }),
        });
      },
      resetDemo: () => set(initial()),
    }),
    {
      name: "civicpatch-ledger",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({
        role: state.role,
        residentName: state.residentName,
        tickets: state.tickets,
        onboarding: state.onboarding,
        scores: state.scores,
      }),
    },
  ),
);

export const OPEN311: Record<TicketStatus, string> = {
  REPORTED: "open",
  APPROVED_FOR_BID: "open",
  CLAIMED: "in_progress",
  WORK_SUBMITTED: "in_progress",
  VERIFIED_PAID: "closed",
  REJECTED: "closed",
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  REPORTED: "Reported",
  APPROVED_FOR_BID: "Open for a crew",
  CLAIMED: "Crew on the clock",
  WORK_SUBMITTED: "Awaiting inspection",
  VERIFIED_PAID: "Repair accepted",
  REJECTED: "Closed",
};
