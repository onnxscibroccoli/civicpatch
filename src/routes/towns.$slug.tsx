import { Link, createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel } from "@/components/chrome";
import { money } from "@/lib/format";
import { HAZARDS } from "@/lib/hazards";
import { basePayout } from "@/lib/rates";
import { useCivic } from "@/lib/store";
import { townBySlug } from "@/lib/towns";

export const Route = createFileRoute("/towns/$slug")({
  head: () => ({ meta: [{ title: "Town rules · CivicPatch" }] }),
  component: TownPage,
});

function TownPage() {
  const { slug } = Route.useParams();
  const tickets = useCivic((state) => state.tickets);
  let town: ReturnType<typeof townBySlug> | null = null;
  try {
    town = townBySlug(slug);
  } catch {
    town = null;
  }
  if (!town) return <PageTitle title="That town is not in the pilot" />;

  const local = tickets.filter((ticket) => ticket.townSlug === town.slug);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <Link to="/towns" className="text-sm font-semibold text-teal-deep underline">
          All towns
        </Link>
        <PageTitle
          kicker={town.stateName}
          title={`${town.kind} of ${town.name}`}
          lede={town.localNote}
        />
        <Panel>
          <h2 className="font-semibold">Notice rule</h2>
          <p className="mt-2 text-sm font-semibold">{town.statute}</p>
          <p className="mt-2 text-sm text-muted">{town.noticeSummary}</p>
          <p className="mt-3 text-sm text-muted">{town.capSummary}</p>
        </Panel>
        <Panel className="mt-4">
          <h2 className="font-semibold">How the desk receives a record</h2>
          <p className="mt-2 text-sm">{town.delivery}</p>
          <p className="mt-2 text-sm text-muted">{town.department}</p>
        </Panel>
      </div>
      <aside className="space-y-4">
        <Panel>
          <h2 className="font-semibold">Schedule at index {town.index.toFixed(2)}</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {HAZARDS.map((hazard) => {
              const adopted = town.services.includes(hazard.id);
              return (
                <li key={hazard.id} className="flex items-start justify-between gap-3 py-2">
                  <span>
                    <span className="block font-semibold">{hazard.label}</span>
                    <span className="text-muted">{adopted ? hazard.unit : "Not adopted here"}</span>
                  </span>
                  <span className="tabular-nums">
                    {adopted ? money(basePayout(hazard.id, town.index)) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Open311 service codes follow the class ids ({town.services.join(", ")}). A town system
            that already speaks GeoReport can map them without a second vocabulary.
          </p>
        </Panel>
        <Panel>
          <h2 className="font-semibold">On the ledger</h2>
          <p className="mt-1 text-sm text-muted">{local.length} records in this pilot.</p>
          <ul className="mt-2 space-y-1 text-sm">
            {local.slice(0, 5).map((ticket) => (
              <li key={ticket.id}>
                <Link to="/ledger/$ticketId" params={{ ticketId: ticket.id }} className="underline">
                  {ticket.id} · {ticket.title}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </aside>
    </div>
  );
}
