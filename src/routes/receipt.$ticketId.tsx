import { Link, createFileRoute } from "@tanstack/react-router";
import { Button, PageTitle } from "@/components/chrome";
import { when } from "@/lib/format";
import { hazardById } from "@/lib/hazards";
import { useCivic } from "@/lib/store";
import { townBySlug } from "@/lib/towns";

export const Route = createFileRoute("/receipt/$ticketId")({
  head: () => ({ meta: [{ title: "Defect notice · CivicPatch" }] }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { ticketId } = Route.useParams();
  const ticket = useCivic((state) => state.tickets.find((item) => item.id === ticketId));
  if (!ticket) {
    return <PageTitle title="Notice not found" lede="This device does not have that record." />;
  }
  const town = townBySlug(ticket.townSlug);
  const hazard = hazardById(ticket.hazardClass);

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap gap-3">
        <Button type="button" variant="line" onClick={() => window.print()}>
          Print or save
        </Button>
        <Link to="/ledger/$ticketId" params={{ ticketId: ticket.id }} className="self-center text-sm font-semibold text-teal-deep underline">
          Back to the ledger
        </Link>
      </div>
      <article className="mx-auto max-w-2xl rounded-md border border-line bg-sheet p-6 sm:p-8">
        <p className="text-sm font-semibold tracking-wide text-teal-deep uppercase">Defect notice</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {town.kind} of {town.name}, {town.state}
        </h1>
        <p className="mt-2 text-sm text-muted">{town.department}</p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Record</dt>
            <dd className="font-mono">{ticket.id}</dd>
          </div>
          <div>
            <dt className="text-muted">Reported</dt>
            <dd>{when(ticket.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Reporter</dt>
            <dd>{ticket.reporterName}</dd>
          </div>
          <div>
            <dt className="text-muted">Classification</dt>
            <dd>
              {hazard.label} ({hazard.open311})
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">Place</dt>
            <dd>
              {ticket.address}
              <span className="mt-1 block font-mono text-xs">
                {ticket.lat.toFixed(5)}, {ticket.lng.toFixed(5)}
              </span>
            </dd>
          </div>
        </dl>
        <p className="mt-4">{ticket.description}</p>
        <img
          src={ticket.beforePhoto}
          alt="Photograph attached to the defect notice"
          className="mt-4 w-full rounded-md object-cover"
        />
        <h2 className="mt-6 font-semibold">Framework this town uses</h2>
        <p className="mt-1 text-sm">{town.statute}</p>
        <p className="mt-2 text-sm text-muted">{town.noticeSummary}</p>
        <p className="mt-2 text-sm text-muted">{town.delivery}</p>
        <h2 className="mt-6 font-semibold">SHA-256 of this notice</h2>
        <p className="mt-1 break-all font-mono text-xs">{ticket.noticeSha256 ?? "Sealing…"}</p>
        {ticket.noticeBody ? (
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-md bg-paper p-3 font-mono text-xs">
            {ticket.noticeBody}
          </pre>
        ) : null}
        <p className="mt-6 text-sm text-muted">
          This document records a defect for maintenance. It is not an injury claim, not a bid, and
          not legal advice.
        </p>
      </article>
    </div>
  );
}
