import { Link, createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel, StatusPill } from "@/components/chrome";
import { money, when } from "@/lib/format";
import { hazardById } from "@/lib/hazards";
import { currentOffer } from "@/lib/rates";
import { OPEN311, useCivic } from "@/lib/store";
import { townBySlug } from "@/lib/towns";

export const Route = createFileRoute("/ledger/$ticketId")({
  head: () => ({ meta: [{ title: "Ledger record · CivicPatch" }] }),
  component: LedgerDetail,
});

function LedgerDetail() {
  const { ticketId } = Route.useParams();
  const ticket = useCivic((state) => state.tickets.find((item) => item.id === ticketId));
  if (!ticket) {
    return (
      <PageTitle
        title="That record is not on this ledger"
        lede="It may have been reset on this device."
      />
    );
  }
  const town = townBySlug(ticket.townSlug);
  const hazard = hazardById(ticket.hazardClass);
  const offer =
    ticket.status === "REPORTED" || ticket.status === "REJECTED"
      ? null
      : currentOffer(ticket, town.index);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="font-mono text-sm text-muted">
          {ticket.id} · Open311 {OPEN311[ticket.status]}
        </p>
        <PageTitle title={ticket.title} lede={ticket.description} />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusPill status={ticket.status} />
          <Link to="/towns/$slug" params={{ slug: town.slug }} className="text-sm font-semibold text-teal-deep underline">
            {town.name}, {town.state}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <figure>
            <img src={ticket.beforePhoto} alt="Before the repair" className="w-full rounded-md object-cover" />
            <figcaption className="mt-1 text-xs text-muted">Before</figcaption>
          </figure>
          <figure>
            {ticket.afterPhoto ? (
              <img src={ticket.afterPhoto} alt="After the repair" className="w-full rounded-md object-cover" />
            ) : (
              <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-line text-sm text-muted">
                No completion photo yet
              </div>
            )}
            <figcaption className="mt-1 text-xs text-muted">After</figcaption>
          </figure>
        </div>
        <ol className="mt-6 space-y-3 border-l border-line pl-4">
          {ticket.events.map((event, index) => (
            <li key={`${event.at}-${index}`}>
              <p className="text-xs text-muted">{when(event.at)}</p>
              <p className="font-semibold">{event.label}</p>
              {event.detail ? <p className="text-sm text-muted">{event.detail}</p> : null}
            </li>
          ))}
        </ol>
      </div>
      <aside className="space-y-4">
        <Panel>
          <h2 className="font-semibold">Place</h2>
          <p className="mt-1">{ticket.address}</p>
          <p className="font-mono text-xs text-muted">
            {ticket.lat.toFixed(5)}, {ticket.lng.toFixed(5)}
          </p>
          <p className="mt-3 text-sm text-muted">
            {hazard.label}. {hazard.unit}.
          </p>
          <p className="mt-2 text-sm">
            Offer to the crew:{" "}
            <span className="font-semibold tabular-nums">
              {offer == null ? "Not posted" : money(offer)}
            </span>
          </p>
          {ticket.contractorName ? (
            <p className="mt-2 text-sm">Crew: {ticket.contractorName}</p>
          ) : null}
          {ticket.spatialDeltaM != null ? (
            <p className="mt-2 text-sm">
              Completion photo was {ticket.spatialDeltaM.toFixed(1)} m from the pin
              {ticket.geofencePass ? " — inside 15 m." : " — outside 15 m, flagged."}
              {ticket.captureMode === "sandbox" ? " Sandbox attestation, not a live GPS fix." : ""}
            </p>
          ) : null}
          {ticket.rejectReason ? (
            <p className="mt-2 text-sm text-danger">{ticket.rejectReason}</p>
          ) : null}
        </Panel>
        <Panel>
          <h2 className="font-semibold">Defect notice</h2>
          <p className="mt-2 break-all font-mono text-xs">
            {ticket.noticeSha256 ?? "Sealing the hash…"}
          </p>
          <Link
            to="/receipt/$ticketId"
            params={{ ticketId: ticket.id }}
            className="mt-3 inline-block text-sm font-semibold text-teal-deep underline"
          >
            Read the notice
          </Link>
        </Panel>
      </aside>
    </div>
  );
}
