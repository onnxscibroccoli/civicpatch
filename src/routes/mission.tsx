import { Link, createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel, buttonStyles } from "@/components/chrome";
import { PLATFORM_FEE, money } from "@/lib/format";
import { HAZARDS } from "@/lib/hazards";
import { useCivic } from "@/lib/store";

export const Route = createFileRoute("/mission")({
  head: () => ({ meta: [{ title: "Mission · CivicPatch" }] }),
  component: MissionPage,
});

function MissionPage() {
  const tickets = useCivic((state) => state.tickets);
  const toCrews = tickets
    .filter((ticket) => ticket.payoutStatus === "DISBURSED" || ticket.payoutStatus === "PENDING_DISBURSEMENT")
    .reduce((sum, ticket) => sum + (ticket.lockedRate ?? 0), 0);
  const example = 120;
  const fee = example * PLATFORM_FEE;

  return (
    <div className="space-y-8">
      <PageTitle
        kicker="Nonprofit"
        title="The fee keeps the lights on. The rate belongs to the crew."
        lede="CivicPatch is built to run as a nonprofit. There is no equity and no dividend. A town may add a sustainability fee on top of the fair rate. It is never taken out of what the crew earned."
      />
      <section className="grid gap-3 md:grid-cols-3">
        <Panel>
          <p className="text-sm text-muted">Example cold patch, Worcester</p>
          <p className="font-display text-3xl font-semibold tabular-nums">{money(example)}</p>
          <p className="text-sm">Paid in full to the crew.</p>
        </Panel>
        <Panel>
          <p className="text-sm text-muted">Sustainability fee, if the town adopts it</p>
          <p className="font-display text-3xl font-semibold tabular-nums">{money(fee)}</p>
          <p className="text-sm">8% added on top. The city pays it. The crew does not.</p>
        </Panel>
        <Panel>
          <p className="text-sm text-muted">Queued to crews in this pilot</p>
          <p className="font-display text-3xl font-semibold tabular-nums">{money(toCrews)}</p>
          <p className="text-sm">Ledger figures on this device, not a bank transfer.</p>
        </Panel>
      </section>
      <Panel>
        <h2 className="font-display text-2xl font-semibold">Where that {money(fee)} goes</h2>
        <div className="mt-4 grid h-3 grid-cols-12 overflow-hidden rounded-full" aria-hidden>
          <div className="col-span-7 bg-teal" />
          <div className="col-span-3 bg-amber" />
          <div className="col-span-2 bg-asphalt" />
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <li>
            <p className="font-semibold">60% · Keep the service up</p>
            <p className="text-muted">
              Hosting, notice delivery, and the people who answer when a town clerk asks what a hash is.
              About {money(fee * 0.6)} of the example.
            </p>
          </li>
          <li>
            <p className="font-semibold">25% · Starter fund</p>
            <p className="text-muted">
              Help a new sole prop get legal: an OSHA 10 stipend up to $150, a shared plate compactor,
              or a first bag of cones and cold mix up to $75. One grant a year, receipts required.
              About {money(fee * 0.25)}.
            </p>
          </li>
          <li>
            <p className="font-semibold">15% · Reserve</p>
            <p className="text-muted">
              A rainy-day balance so a quiet month does not shut the ledger. About {money(fee * 0.15)}.
            </p>
          </li>
        </ul>
      </Panel>
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display text-2xl font-semibold">What we will not do</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
            <li>Sell the photo ledger or the addresses.</li>
            <li>Charge crews to see jobs, or skim the fair rate.</li>
            <li>Replace a town’s engineer with an automatic payout and no human look.</li>
            <li>Pretend a defect photo is an injury claim.</li>
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-display text-2xl font-semibold">Who holds it</h2>
          <p className="mt-2 text-sm text-muted">
            The governance model is a small board: a working crew member, a resident, and the
            nonprofit’s director, with a town engineer in a non-voting seat so no single city captures
            the schedule. This pilot describes that structure. It is not a claim that a board is already
            seated or that a tax determination has been issued.
          </p>
          <p className="mt-2 text-sm text-muted">
            Crews stay independent businesses. The point is that a person with a truck and a tamper can
            earn a published price for work the block can see, without waiting on a mega-contract.
          </p>
        </Panel>
      </section>
      <Panel>
        <h2 className="font-display text-2xl font-semibold">The published schedule</h2>
        <p className="mt-2 text-sm text-muted">
          Worcester is index 1.00. Mobilization is inside the number, so a short trip still pays.
          After 72 hours unclaimed, the offer rises 8% a day, six steps at most.
        </p>
        <ul className="mt-4 divide-y divide-line text-sm">
          {HAZARDS.map((hazard) => (
            <li key={hazard.id} className="flex justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">{hazard.label}</span>
                <span className="block text-muted">{hazard.unit}</span>
              </span>
              <span className="tabular-nums font-semibold">{money(hazard.schedule)}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="flex flex-wrap gap-3">
        <Link to="/become" className={buttonStyles({ variant: "primary" })}>
          Start a crew
        </Link>
        <Link to="/towns" className={buttonStyles({ variant: "line" })}>
          Read a town’s rules
        </Link>
      </div>
    </div>
  );
}
