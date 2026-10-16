import { Link, createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel, StatusPill, buttonStyles } from "@/components/chrome";
import { money } from "@/lib/format";
import { hazardById } from "@/lib/hazards";
import { currentOffer } from "@/lib/rates";
import { useCivic } from "@/lib/store";
import { TOWNS, townBySlug } from "@/lib/towns";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "CivicPatch" }] }),
  component: Home,
});

function Home() {
  const tickets = useCivic((state) => state.tickets);
  const role = useCivic((state) => state.role);
  const open = tickets.filter((ticket) => ticket.status === "APPROVED_FOR_BID");
  const paid = tickets.filter(
    (ticket) =>
      ticket.payoutStatus === "DISBURSED" || ticket.payoutStatus === "PENDING_DISBURSEMENT",
  );
  const paidSum = paid.reduce((sum, ticket) => sum + (ticket.lockedRate ?? 0), 0);
  const spotlight = [...tickets]
    .filter((ticket) => ticket.status !== "REJECTED")
    .slice(0, 3);

  const primary =
    role === "crew" ? "/jobs" : role === "dpw" ? "/admin" : "/report";
  const primaryLabel =
    role === "crew" ? "Open jobs" : role === "dpw" ? "Public works desk" : "Report a hazard";

  return (
    <div className="space-y-10">
      <div className="grid items-center gap-6 lg:grid-cols-2">
        <div>
          <PageTitle
            kicker="Nonprofit · New England pilot"
            title="The town gets notice. A neighbor gets the work."
            lede="A resident files a photo. The clerk’s desk gets a timestamped defect record. A vetted local crew fixes it at a price anyone can read — and keeps the whole fee."
          />
          <div className="flex flex-wrap gap-3">
            <Link to={primary} className={buttonStyles({ variant: "primary" })}>
              {primaryLabel}
            </Link>
            <Link to="/mission" className={buttonStyles({ variant: "line" })}>
              Where the money goes
            </Link>
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-muted">Open jobs</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{open.length}</dd>
            </div>
            <div>
              <dt className="text-muted">To local crews</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{money(paidSum)}</dd>
            </div>
            <div>
              <dt className="text-muted">Towns</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{TOWNS.length}</dd>
            </div>
          </dl>
        </div>
        <figure className="overflow-hidden rounded-md border border-line bg-sheet">
          <img
            src="/photos/street.jpg"
            alt="A quiet New England main street in early spring, bare trees and worn asphalt."
            className="aspect-video w-full object-cover"
          />
          <figcaption className="px-4 py-3 text-sm text-muted">
            The work is small on purpose. A patch, a line, a marker — priced in the open, done by
            someone who lives near it.
          </figcaption>
        </figure>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Panel>
          <h2 className="font-display text-xl font-semibold">Notice, not a rumor</h2>
          <p className="mt-2 text-sm text-muted">
            Each report is hashed. The town page names the real statute — 30 days in Massachusetts,
            90 in Connecticut, 60 in Rhode Island — and says plainly that a defect record is not an
            injury claim.
          </p>
        </Panel>
        <Panel>
          <h2 className="font-display text-xl font-semibold">A price, not a bid</h2>
          <p className="mt-2 text-sm text-muted">
            Small cold patch is $120 in Worcester. Other towns multiply by a published index. If a
            job sits unclaimed for three days, the offer rises so a longer drive still makes sense.
          </p>
        </Panel>
        <Panel>
          <h2 className="font-display text-xl font-semibold">A crew, not a monopoly</h2>
          <p className="mt-2 text-sm text-muted">
            Insurance, an OSHA 10 card, and a short field course. Then you claim one job for 24
            hours. The fair rate is not skimmed.
          </p>
        </Panel>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">How a repair moves</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["1", "Reported", "Photo, place, and a sealed notice."],
            ["2", "Posted", "An engineer confirms the street and the price."],
            ["3", "Claimed", "One crew, 24 hours, then it returns to the board."],
            ["4", "Photographed", "After photo within 15 meters of the pin."],
            ["5", "Accepted", "Side-by-side inspection by the desk."],
            ["6", "Paid", "Full rate queued for the crew, aimed at 48 hours."],
          ].map(([n, title, copy]) => (
            <li key={n} className="rounded-md border border-line bg-sheet p-4">
              <p className="font-mono text-sm text-amber">{n}</p>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted">{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">On the ledger</h2>
          <Link to="/ledger" className="text-sm font-semibold text-teal-deep underline">
            Full ledger
          </Link>
        </div>
        <ul className="grid gap-3">
          {spotlight.map((ticket) => {
            const town = townBySlug(ticket.townSlug);
            const offer =
              ticket.status === "REPORTED"
                ? null
                : currentOffer(ticket, town.index);
            return (
              <li key={ticket.id}>
                <Link
                  to="/ledger/$ticketId"
                  params={{ ticketId: ticket.id }}
                  className="grid gap-3 rounded-md border border-line bg-sheet p-3 sm:grid-cols-[8rem_1fr_auto] sm:items-center"
                >
                  <img
                    src={ticket.beforePhoto}
                    alt=""
                    className="h-24 w-full rounded-sm object-cover sm:h-20"
                  />
                  <span>
                    <span className="block font-mono text-xs text-muted">{ticket.id}</span>
                    <span className="block font-semibold">{ticket.title}</span>
                    <span className="block text-sm text-muted">
                      {hazardById(ticket.hazardClass).label} · {town.name}, {town.state}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <StatusPill status={ticket.status} />
                    {offer != null ? (
                      <span className="font-semibold tabular-nums">{money(offer)}</span>
                    ) : (
                      <span className="text-sm text-muted">Awaiting a price</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <h2 className="font-display text-2xl font-semibold">Town by town</h2>
          <p className="mt-2 text-sm text-muted">
            The same schedule, a local index, and the statute that town actually lives under. State
            highways stay out.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {TOWNS.slice(0, 6).map((town) => (
              <li key={town.slug} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link to="/towns/$slug" params={{ slug: town.slug }} className="font-semibold">
                  {town.name}, {town.state}
                </Link>
                <span className="tabular-nums text-muted">Index {town.index.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <Link to="/towns" className="mt-3 inline-block text-sm font-semibold text-teal-deep underline">
            All twelve towns
          </Link>
        </Panel>
        <Panel className="bg-asphalt text-on-asphalt">
          <h2 className="font-display text-2xl font-semibold">Keep every dollar of the rate</h2>
          <p className="mt-2 text-sm">
            Crews are independent businesses. Any sustainability fee a town adopts is added on top,
            and it funds the service plus a starter fund for tools and the OSHA class.
          </p>
          <Link
            to="/become"
            className={`${buttonStyles({ variant: "amber" })} mt-4`}
          >
            See how to become a crew
          </Link>
        </Panel>
      </section>
    </div>
  );
}
