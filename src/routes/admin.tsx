import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button, PageTitle, Panel, StatusPill, fieldClass } from "@/components/chrome";
import { money, when } from "@/lib/format";
import { haversineMeters } from "@/lib/geo";
import { hazardById } from "@/lib/hazards";
import { currentOffer } from "@/lib/rates";
import { useCivic } from "@/lib/store";
import { TOWNS, townBySlug } from "@/lib/towns";
import type { Ticket, TicketStatus } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Public works · CivicPatch" }] }),
  component: AdminPage,
});

const QUEUES: { id: string; label: string; statuses: TicketStatus[] }[] = [
  { id: "inbox", label: "Inbox", statuses: ["REPORTED"] },
  { id: "board", label: "Board", statuses: ["APPROVED_FOR_BID", "CLAIMED"] },
  { id: "inspect", label: "Inspect", statuses: ["WORK_SUBMITTED"] },
  { id: "closed", label: "Closed", statuses: ["VERIFIED_PAID", "REJECTED"] },
];

function AdminPage() {
  const role = useCivic((state) => state.role);
  const tickets = useCivic((state) => state.tickets);
  const approveForBid = useCivic((state) => state.approveForBid);
  const rejectTicket = useCivic((state) => state.rejectTicket);
  const acceptWork = useCivic((state) => state.acceptWork);
  const returnWork = useCivic((state) => state.returnWork);
  const disburse = useCivic((state) => state.disburse);
  const voidLease = useCivic((state) => state.voidLease);
  const [queue, setQueue] = useState("inbox");
  const [town, setTown] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showList, setShowList] = useState(true);

  const rows = useMemo(() => {
    const statuses = QUEUES.find((item) => item.id === queue)?.statuses ?? [];
    return tickets.filter((ticket) => {
      if (!statuses.includes(ticket.status)) return false;
      if (town !== "all" && ticket.townSlug !== town) return false;
      return true;
    });
  }, [tickets, queue, town]);

  const selected =
    tickets.find((ticket) => ticket.id === selectedId) ?? rows[0] ?? null;

  const awaiting = tickets.filter((ticket) => ticket.status === "REPORTED").length;
  const inspect = tickets.filter((ticket) => ticket.status === "WORK_SUBMITTED").length;
  const committed = tickets
    .filter((ticket) => ticket.payoutStatus === "DISBURSED" || ticket.payoutStatus === "PENDING_DISBURSEMENT")
    .reduce((sum, ticket) => sum + (ticket.lockedRate ?? 0), 0);

  return (
    <div>
      <PageTitle
        kicker="Public works desk"
        title="Post the real ones. Pay the crews who did them."
        lede="You confirm the street is yours, the price is the schedule, and the after photo is the same place. The resident already has a hash."
      />
      {role !== "dpw" ? (
        <p className="mb-4 rounded-md bg-amber-soft px-3 py-2 text-sm">
          You are not viewing as public works. The desk is open so you can learn it. Switch the
          role at the top when you want the resident or crew path back.
        </p>
      ) : null}
      <dl className="mb-4 grid grid-cols-3 gap-3 text-sm">
        <Panel>
          <dt className="text-muted">Inbox</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">{awaiting}</dd>
        </Panel>
        <Panel>
          <dt className="text-muted">Photos waiting</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">{inspect}</dd>
        </Panel>
        <Panel>
          <dt className="text-muted">To crews</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums">{money(committed)}</dd>
        </Panel>
      </dl>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="flex gap-2 overflow-x-auto">
          {QUEUES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={queue === item.id}
              onClick={() => {
                setQueue(item.id);
                setSelectedId(null);
                setShowList(true);
              }}
              className={`min-h-11 shrink-0 rounded-md px-3 text-sm font-semibold ${
                queue === item.id ? "bg-asphalt text-on-asphalt" : "border border-line bg-sheet"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select
          className={fieldClass}
          value={town}
          aria-label="Town"
          onChange={(event) => setTown(event.target.value)}
        >
          <option value="all">All towns</option>
          {TOWNS.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <ul className={`divide-y divide-line overflow-hidden rounded-md border border-line bg-sheet ${showList ? "" : "hidden lg:block"}`}>
          {rows.length === 0 ? (
            <li className="p-4 text-sm text-muted">Nothing in this queue.</li>
          ) : (
            rows.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(ticket.id);
                    setReason("");
                    setShowList(false);
                  }}
                  className={`w-full px-3 py-3 text-left ${
                    selected?.id === ticket.id ? "bg-foam" : ""
                  }`}
                >
                  <span className="font-mono text-xs text-muted">{ticket.id}</span>
                  <span className="block font-semibold">{ticket.title}</span>
                  <span className="block text-sm text-muted">{townBySlug(ticket.townSlug).name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className={showList ? "hidden lg:block" : ""}>
          {selected ? (
            <DeskDetail
              ticket={selected}
              reason={reason}
              setReason={setReason}
              onBack={() => setShowList(true)}
              onApprove={() => approveForBid(selected.id)}
              onReject={() => {
                rejectTicket(selected.id, reason);
                setReason("");
              }}
              onAccept={() => acceptWork(selected.id)}
              onReturn={() => {
                returnWork(selected.id, reason);
                setReason("");
              }}
              onDisburse={() => disburse(selected.id)}
              onVoid={() => voidLease(selected.id)}
              duplicate={duplicateOf(selected, tickets)}
            />
          ) : (
            <Panel>
              <p className="text-sm text-muted">Select a record.</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function duplicateOf(ticket: Ticket, tickets: Ticket[]) {
  return tickets.find((other) => {
    if (other.id === ticket.id) return false;
    if (other.hazardClass !== ticket.hazardClass) return false;
    if (other.status === "REJECTED") return false;
    return haversineMeters(ticket, other) < 30;
  });
}

function DeskDetail({
  ticket,
  reason,
  setReason,
  onBack,
  onApprove,
  onReject,
  onAccept,
  onReturn,
  onDisburse,
  onVoid,
  duplicate,
}: {
  ticket: Ticket;
  reason: string;
  setReason: (value: string) => void;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
  onAccept: () => void;
  onReturn: () => void;
  onDisburse: () => void;
  onVoid: () => void;
  duplicate?: Ticket;
}) {
  const town = townBySlug(ticket.townSlug);
  const hazard = hazardById(ticket.hazardClass);
  const offer = currentOffer(ticket, town.index);
  const adopted = town.services.includes(ticket.hazardClass);

  return (
    <div className="space-y-4">
      <button type="button" className="text-sm font-semibold text-teal-deep underline lg:hidden" onClick={onBack}>
        Back to the queue
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={ticket.status} />
        <span className="font-mono text-xs text-muted">{ticket.id}</span>
      </div>
      <h2 className="font-display text-2xl font-semibold">{ticket.title}</h2>
      <p className="text-sm text-muted">{ticket.description}</p>
      <p className="text-sm">
        {ticket.address} · {town.name}, {town.state}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <figure>
          <img src={ticket.beforePhoto} alt="Before" className="w-full rounded-md object-cover" />
          <figcaption className="mt-1 text-xs text-muted">Before · {when(ticket.createdAt)}</figcaption>
        </figure>
        <figure>
          {ticket.afterPhoto ? (
            <img src={ticket.afterPhoto} alt="After" className="w-full rounded-md object-cover" />
          ) : (
            <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-line text-sm text-muted">
              Waiting on a completion photo
            </div>
          )}
          <figcaption className="mt-1 text-xs text-muted">
            After
            {ticket.workSubmittedAt ? ` · ${when(ticket.workSubmittedAt)}` : ""}
          </figcaption>
        </figure>
      </div>
      <Panel>
        <p className="text-sm">
          {hazard.label} · schedule at this index{" "}
          <span className="font-semibold tabular-nums">{money(offer)}</span>
        </p>
        <p className="mt-1 text-sm text-muted">{town.localNote}</p>
        {!adopted ? (
          <p className="mt-2 text-sm text-danger">This class is not adopted in {town.name}. Reject it.</p>
        ) : null}
        {duplicate && ticket.status === "REPORTED" ? (
          <p className="mt-2 text-sm">
            Possible duplicate of{" "}
            <Link to="/ledger/$ticketId" params={{ ticketId: duplicate.id }} className="font-semibold underline">
              {duplicate.id}
            </Link>{" "}
            within 30 meters.
          </p>
        ) : null}
        {ticket.spatialDeltaM != null ? (
          <p className="mt-2 text-sm">
            Photo was {ticket.spatialDeltaM.toFixed(1)} m from the pin.
            {ticket.geofencePass ? " Inside 15 m." : " Outside 15 m."}{" "}
            {ticket.captureMode === "sandbox"
              ? "The crew used a sandbox attestation. Treat it as training, not field GPS."
              : "Captured with device location."}
          </p>
        ) : null}
        {ticket.contractorName ? <p className="mt-2 text-sm">Crew: {ticket.contractorName}</p> : null}
        {ticket.payoutStatus ? (
          <p className="mt-2 text-sm">Payout: {ticket.payoutStatus.replaceAll("_", " ").toLowerCase()}</p>
        ) : null}
      </Panel>
      {ticket.status === "REPORTED" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onApprove} disabled={!adopted}>
            Post at {money(offer)}
          </Button>
        </div>
      ) : null}
      {ticket.status === "WORK_SUBMITTED" ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onAccept}>
            Accept and queue payment
          </Button>
          <Button type="button" variant="line" onClick={onReturn}>
            Return to the board
          </Button>
        </div>
      ) : null}
      {ticket.payoutStatus === "PENDING_DISBURSEMENT" ? (
        <Button type="button" variant="asphalt" onClick={onDisburse}>
          Mark disbursed
        </Button>
      ) : null}
      {ticket.status === "CLAIMED" ? (
        <Button type="button" variant="line" onClick={onVoid}>
          Void the lease
        </Button>
      ) : null}
      {ticket.status !== "VERIFIED_PAID" && ticket.status !== "REJECTED" ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold">
            Note, if you are closing or returning it
            <textarea
              className={`${fieldClass} mt-1 min-h-20 py-2`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <Button type="button" variant="danger" onClick={onReject} disabled={!reason.trim()}>
            Close without repair
          </Button>
        </div>
      ) : null}
      <Link to="/receipt/$ticketId" params={{ ticketId: ticket.id }} className="inline-block text-sm font-semibold text-teal-deep underline">
        Open the notice
      </Link>
    </div>
  );
}
