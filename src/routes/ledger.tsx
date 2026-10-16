import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageTitle, StatusPill, fieldClass } from "@/components/chrome";
import { money, when } from "@/lib/format";
import { hazardById } from "@/lib/hazards";
import { currentOffer } from "@/lib/rates";
import { OPEN311, useCivic } from "@/lib/store";
import { TOWNS, townBySlug } from "@/lib/towns";
import type { TicketStatus } from "@/lib/types";

export const Route = createFileRoute("/ledger")({
  head: () => ({ meta: [{ title: "Public ledger · CivicPatch" }] }),
  component: LedgerPage,
});

const FILTERS: { id: "all" | TicketStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "REPORTED", label: "Reported" },
  { id: "APPROVED_FOR_BID", label: "Open" },
  { id: "CLAIMED", label: "Claimed" },
  { id: "WORK_SUBMITTED", label: "In review" },
  { id: "VERIFIED_PAID", label: "Paid" },
  { id: "REJECTED", label: "Closed" },
];

function LedgerPage() {
  const tickets = useCivic((state) => state.tickets);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [town, setTown] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (status !== "all" && ticket.status !== status) return false;
      if (town !== "all" && ticket.townSlug !== town) return false;
      if (!q) return true;
      const place = townBySlug(ticket.townSlug);
      return (
        ticket.id.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q) ||
        ticket.address.toLowerCase().includes(q) ||
        place.name.toLowerCase().includes(q)
      );
    });
  }, [tickets, query, status, town]);

  return (
    <div>
      <PageTitle
        kicker="Public ledger"
        title="Every defect, in the open"
        lede="Statuses map to the Open311 words cities already use: open, in progress, closed. The finer steps stay on the record."
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          className={fieldClass}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search address, town, or record id"
          aria-label="Search the ledger"
        />
        <select
          className={fieldClass}
          value={town}
          onChange={(event) => setTown(event.target.value)}
          aria-label="Filter by town"
        >
          <option value="all">All towns</option>
          {TOWNS.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={status === item.id}
            onClick={() => setStatus(item.id)}
            className={`min-h-11 shrink-0 rounded-md px-3 text-sm font-semibold ${
              status === item.id ? "bg-asphalt text-on-asphalt" : "bg-sheet text-ink border border-line"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-sheet">
        {rows.length === 0 ? (
          <li className="p-6 text-sm text-muted">Nothing on the ledger matches that filter.</li>
        ) : (
          rows.map((ticket) => {
            const place = townBySlug(ticket.townSlug);
            const offer =
              ticket.status === "REPORTED" || ticket.status === "REJECTED"
                ? null
                : currentOffer(ticket, place.index);
            return (
              <li key={ticket.id}>
                <Link
                  to="/ledger/$ticketId"
                  params={{ ticketId: ticket.id }}
                  className="grid gap-3 p-3 hover:bg-paper sm:grid-cols-[7rem_1fr_auto] sm:items-center"
                >
                  <img src={ticket.beforePhoto} alt="" className="h-20 w-full rounded-sm object-cover" />
                  <span className="min-w-0">
                    <span className="font-mono text-xs text-muted">
                      {ticket.id} · Open311 {OPEN311[ticket.status]}
                    </span>
                    <span className="block font-semibold">{ticket.title}</span>
                    <span className="block truncate text-sm text-muted">
                      {hazardById(ticket.hazardClass).label} · {ticket.address}
                    </span>
                    <span className="block text-xs text-muted">{when(ticket.createdAt)}</span>
                  </span>
                  <span className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <StatusPill status={ticket.status} />
                    <span className="text-sm font-semibold tabular-nums">
                      {offer == null ? "—" : money(offer)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
