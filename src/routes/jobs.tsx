import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageTitle, StatusPill, fieldClass } from "@/components/chrome";
import { money } from "@/lib/format";
import { haversineMeters, miles } from "@/lib/geo";
import { HAZARDS, hazardById } from "@/lib/hazards";
import { currentOffer, surgeFactor } from "@/lib/rates";
import { useCivic } from "@/lib/store";
import { TOWNS, townBySlug } from "@/lib/towns";
import type { HazardClass } from "@/lib/types";

export const Route = createFileRoute("/jobs")({
  head: () => ({ meta: [{ title: "Job board · CivicPatch" }] }),
  component: JobsPage,
});

function JobsPage() {
  const tickets = useCivic((state) => state.tickets);
  const business = useCivic((state) => state.onboarding.businessName);
  const [town, setTown] = useState("all");
  const [hazard, setHazard] = useState<"all" | HazardClass>("all");
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);

  const mine = tickets.filter(
    (ticket) =>
      business &&
      ticket.contractorName === business &&
      (ticket.status === "CLAIMED" || ticket.status === "WORK_SUBMITTED"),
  );

  const open = useMemo(() => {
    const rows = tickets.filter((ticket) => {
      if (ticket.status !== "APPROVED_FOR_BID" && ticket.status !== "CLAIMED") return false;
      if (town !== "all" && ticket.townSlug !== town) return false;
      if (hazard !== "all" && ticket.hazardClass !== hazard) return false;
      return true;
    });
    return rows
      .map((ticket) => {
        const place = townBySlug(ticket.townSlug);
        const meters = origin ? haversineMeters(origin, ticket) : null;
        return { ticket, place, meters, offer: currentOffer(ticket, place.index) };
      })
      .sort((a, b) => {
        if (a.meters != null && b.meters != null) return a.meters - b.meters;
        return b.offer - a.offer;
      });
  }, [tickets, town, hazard, origin]);

  function sortByMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }

  return (
    <div>
      <PageTitle
        kicker="Crew board"
        title="Published prices. One lease at a time."
        lede="Claiming locks the offer and starts a 24-hour clock. If you cannot finish, release it. Someone else in town can."
      />
      {mine.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold">Your leases</h2>
          <ul className="grid gap-2">
            {mine.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to="/jobs/$ticketId"
                  params={{ ticketId: ticket.id }}
                  className="flex items-center justify-between gap-3 rounded-md border border-amber bg-amber-soft px-3 py-3"
                >
                  <span>
                    <span className="block font-semibold">{ticket.title}</span>
                    <span className="text-sm">{ticket.address}</span>
                  </span>
                  <StatusPill status={ticket.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <select className={fieldClass} value={town} onChange={(event) => setTown(event.target.value)} aria-label="Town">
          <option value="all">All towns</option>
          {TOWNS.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          className={fieldClass}
          value={hazard}
          onChange={(event) => setHazard(event.target.value as "all" | HazardClass)}
          aria-label="Repair class"
        >
          <option value="all">All classes</option>
          {HAZARDS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={sortByMe} className="min-h-11 shrink-0 rounded-md border border-line bg-sheet px-3 text-sm font-semibold">
          {origin ? "Sorted from you" : "Sort from my location"}
        </button>
      </div>
      <ul className="grid gap-3">
        {open.length === 0 ? (
          <li className="rounded-md border border-line bg-sheet p-6 text-sm text-muted">
            No jobs in that filter. Try another town, or check back after the desk posts the inbox.
          </li>
        ) : (
          open.map(({ ticket, place, meters, offer }) => {
            const surge = surgeFactor(ticket.approvedAt, ticket.status);
            return (
              <li key={ticket.id}>
                <Link
                  to="/jobs/$ticketId"
                  params={{ ticketId: ticket.id }}
                  className="grid gap-3 rounded-md border border-line bg-sheet p-3 sm:grid-cols-[9rem_1fr_auto]"
                >
                  <img src={ticket.beforePhoto} alt="" className="h-28 w-full rounded-sm object-cover" />
                  <span>
                    <span className="font-mono text-xs text-muted">{ticket.id}</span>
                    <span className="block font-semibold">{ticket.title}</span>
                    <span className="block text-sm text-muted">
                      {hazardById(ticket.hazardClass).label} · {place.name}, {place.state}
                    </span>
                    <span className="block text-sm text-muted">{ticket.address}</span>
                    {meters != null ? (
                      <span className="block text-sm">{miles(meters)} from you</span>
                    ) : null}
                    {ticket.status === "CLAIMED" ? (
                      <span className="mt-1 block text-sm">Held by {ticket.contractorName}</span>
                    ) : null}
                  </span>
                  <span className="sm:text-right">
                    <span className="block font-display text-2xl font-semibold tabular-nums">{money(offer)}</span>
                    <span className="text-xs text-muted">
                      {surge > 1 ? `Includes ${surge.toFixed(2)}× unclaimed adjustment` : "Fair rate, full amount"}
                    </span>
                    <span className="mt-2 block">
                      <StatusPill status={ticket.status} />
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
