import { Link, createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel } from "@/components/chrome";
import { HAZARDS } from "@/lib/hazards";
import { TOWNS } from "@/lib/towns";

export const Route = createFileRoute("/towns")({
  head: () => ({ meta: [{ title: "Towns · CivicPatch" }] }),
  component: TownsPage,
});

const STEPS = [
  "Name the ways the town actually owns. State highways, parkways, and bridges stay out.",
  "The clerk chooses how a defect record arrives: a printable notice, an email, or both. Injury claims stay on their own form.",
  "Finance accepts the schedule and decides whether the 8% sustainability fee is added on top.",
  "Two engineers are named as reviewers. One can post a job. Acceptance of a photo should be a second look when the town can staff it.",
  "Pilot for 90 days on the classes the town checks on its page, then add striping or markers.",
  "Publish the town page so residents see their statute, not a generic one.",
];

function TownsPage() {
  return (
    <div>
      <PageTitle
        kicker="Jurisdiction"
        title="The same idea, tuned to the town"
        lede="A fair-rate schedule only works if it respects who owns the street and which notice rule that state already wrote."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {TOWNS.map((town) => (
          <li key={town.slug}>
            <Link
              to="/towns/$slug"
              params={{ slug: town.slug }}
              className="block h-full rounded-md border border-line bg-sheet p-4 hover:border-teal"
            >
              <p className="text-sm text-muted">{town.stateName}</p>
              <h2 className="font-display text-2xl font-semibold">
                {town.name}, {town.state}
              </h2>
              <p className="mt-1 text-sm">Index {town.index.toFixed(2)}</p>
              <p className="mt-2 text-sm text-muted">{town.statute}</p>
              <p className="mt-2 text-xs text-muted">
                {town.services
                  .map((id) => HAZARDS.find((hazard) => hazard.id === id)?.label)
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <Panel className="mt-8">
        <h2 className="font-display text-2xl font-semibold">How a town adopts this</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
