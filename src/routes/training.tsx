import { Link, createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel } from "@/components/chrome";
import { MODULES } from "@/lib/training";
import { useCivic } from "@/lib/store";

export const Route = createFileRoute("/training")({
  head: () => ({ meta: [{ title: "Field training · CivicPatch" }] }),
  component: TrainingPage,
});

function TrainingPage() {
  const scores = useCivic((state) => state.scores);
  const passed = MODULES.filter((module) => scores[module.slug]?.passed).length;

  return (
    <div>
      <PageTitle
        kicker="Field school"
        title="Learn the work before you claim it"
        lede="Six lessons are required to activate a crew. Three more open the hot-mix, striping, and marker jobs with a clear method. Each one ends in a short check you can retake."
      />
      <p className="mb-4 text-sm text-muted">
        {passed} of {MODULES.length} lessons passed.
      </p>
      <ul className="grid gap-3">
        {MODULES.map((module) => {
          const score = scores[module.slug];
          return (
            <li key={module.slug}>
              <Link
                to="/training/$slug"
                params={{ slug: module.slug }}
                className="block rounded-md border border-line bg-sheet p-4 hover:border-teal"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold">{module.title}</h2>
                  <span className="text-xs font-semibold text-muted">
                    {module.required ? "Required" : "Trade lesson"} · {module.minutes} min
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{module.summary}</p>
                <p className="mt-2 text-sm font-semibold text-teal-deep">
                  {score?.passed
                    ? `Passed ${score.correct}/${score.total}`
                    : score
                      ? `Last try ${score.correct}/${score.total} — not yet`
                      : "Not started"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      <Panel className="mt-6">
        <h2 className="font-semibold">What this school is not</h2>
        <p className="mt-2 text-sm text-muted">
          It does not issue an OSHA card, a contractor license, or a law degree. The OSHA 10-hour
          construction course is a separate class from an Outreach trainer. Town pages point at the
          statute. Your insurer still has to put the coverage on paper.
        </p>
      </Panel>
    </div>
  );
}
