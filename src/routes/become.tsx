import { Link, createFileRoute } from "@tanstack/react-router";
import { Button, PageTitle, Panel, fieldClass } from "@/components/chrome";
import { activationGaps } from "@/lib/activation";
import { REQUIRED_MODULES } from "@/lib/training";
import { useCivic } from "@/lib/store";
import { TOWNS, townBySlug } from "@/lib/towns";

export const Route = createFileRoute("/become")({
  head: () => ({ meta: [{ title: "Start a crew · CivicPatch" }] }),
  component: BecomePage,
});

const TOOLS: { id: string; label: string }[] = [
  { id: "ppe", label: "High-vis vest, hard hat, glasses, gloves, boots" },
  { id: "traffic", label: "At least six cones, and a plan for where the truck stops" },
  { id: "cold", label: "Cold mix, tamper, broom, shovel" },
  { id: "measure", label: "Tape, and a phone that can share its location" },
];

const STEP_TITLES = [
  "Are you the right size",
  "Pick a town you can reach",
  "Name the business",
  "Insurance, in plain words",
  "The OSHA card",
  "Tools in the truck",
  "Lessons",
  "Town rules",
  "You are active",
];

function BecomePage() {
  const onboarding = useCivic((state) => state.onboarding);
  const scores = useCivic((state) => state.scores);
  const patch = useCivic((state) => state.patchOnboarding);
  const activate = useCivic((state) => state.activateCrew);
  const step = onboarding.step;
  const town = townBySlug(onboarding.townSlug || "worcester");
  const gaps = activationGaps(onboarding, scores);

  function toggleTool(id: string) {
    const has = onboarding.equipment.includes(id);
    patch({
      equipment: has
        ? onboarding.equipment.filter((item) => item !== id)
        : [...onboarding.equipment, id],
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        kicker={`Step ${Math.min(step + 1, 9)} of 9`}
        title={onboarding.activatedAt ? "Your crew is active" : "Start a crew without the maze"}
        lede="You do not need a bond, a lobbyist, or a five-year paving contract. You need a name, insurance, a safety card, and the judgment to leave a job that is bigger than the ticket."
      />
      <ol className="mb-4 flex gap-1" aria-label="Progress">
        {STEP_TITLES.map((title, index) => (
          <li key={title} className="flex-1">
            <button
              type="button"
              aria-label={title}
              onClick={() => patch({ step: index })}
              className={`h-2 w-full rounded-full ${index <= step ? "bg-teal" : "bg-line"}`}
            />
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <Panel className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Small on purpose</h2>
          <p className="text-sm text-muted">
            This is for a person or a two-person outfit that can fix a pothole, clear a limb, lay a
            line, or set markers in daylight, in one town. It is not for interstate milling, and it
            is not a job with the city. You remain your own business.
          </p>
          <label className="flex min-h-11 items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={onboarding.fitAck}
              onChange={(event) => patch({ fitAck: event.target.checked })}
            />
            I can do small daytime street repairs, and I will walk away when the hole is the wrong kind.
          </label>
        </Panel>
      ) : null}

      {step === 1 ? (
        <Panel className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Work where you can show up today</h2>
          <p className="text-sm text-muted">
            Pick the town you can reach inside the 24-hour lease. You can still claim jobs in other
            participating towns, but your rules acknowledgment is for home base.
          </p>
          <label className="block text-sm font-semibold">
            Home town
            <select
              className={`${fieldClass} mt-1`}
              value={onboarding.townSlug}
              onChange={(event) => patch({ townSlug: event.target.value })}
            >
              {TOWNS.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}, {item.state}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-muted">{town.localNote}</p>
        </Panel>
      ) : null}

      {step === 2 ? (
        <Panel className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">A name the ledger can print</h2>
          <p className="text-sm text-muted">
            A sole prop can use your own name. An LLC uses the entity name. An EIN from the IRS is
            free and keeps a Social Security number off forms. CivicPatch never asks for a Social
            Security number.
          </p>
          <label className="block text-sm font-semibold">
            Your name
            <input
              className={`${fieldClass} mt-1`}
              value={onboarding.contactName}
              onChange={(event) => patch({ contactName: event.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            Business name
            <input
              className={`${fieldClass} mt-1`}
              value={onboarding.businessName}
              onChange={(event) => patch({ businessName: event.target.value })}
              placeholder="Your name is fine"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">Structure</legend>
            <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
              <input
                type="radio"
                name="structure"
                checked={onboarding.structure === "sole"}
                onChange={() => patch({ structure: "sole" })}
              />
              Sole proprietor
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="radio"
                name="structure"
                checked={onboarding.structure === "llc"}
                onChange={() => patch({ structure: "llc" })}
              />
              LLC or other entity
            </label>
          </fieldset>
        </Panel>
      ) : null}

      {step === 3 ? (
        <Panel className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">One million dollars of general liability</h2>
          <p className="text-sm text-muted">
            Towns ask for a commercial general liability policy of at least $1,000,000 per
            occurrence, and in a live adoption they are named as an additional insured. Ask a local
            agent for a quote sized to hand tools and a pickup, not to a paving plant. The certificate
            is an ACORD form. Put the expiration date in a calendar.
          </p>
          <label className="flex min-h-11 items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={onboarding.insuranceAck}
              onChange={(event) => patch({ insuranceAck: event.target.checked })}
            />
            I understand the live rule is a real $1,000,000 policy, not a checkbox.
          </label>
          <label className="block text-sm font-semibold">
            Policy number
            <input
              className={`${fieldClass} mt-1`}
              value={onboarding.insurancePolicy}
              onChange={(event) => patch({ insurancePolicy: event.target.value })}
              placeholder="PRACTICE-GL-1000000"
            />
          </label>
          <p className="text-xs text-muted">
            In this pilot, PRACTICE-GL-1000000 stands in for a certificate. Do not type a real policy
            if you are only learning the screens.
          </p>
          <label className="block text-sm font-semibold">
            Expiration
            <input
              type="date"
              className={`${fieldClass} mt-1`}
              value={onboarding.insuranceExpires}
              onChange={(event) => patch({ insuranceExpires: event.target.value })}
            />
          </label>
        </Panel>
      ) : null}

      {step === 4 ? (
        <Panel className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">OSHA 10, the real card</h2>
          <p className="text-sm text-muted">
            Take the 10-hour Construction outreach course from an OSHA-authorized trainer. Roadway
            work zones are the part to pay attention to. The class is a day or two, often under a
            few hundred dollars. The starter fund can stipend up to $150 once a crew is active and
            brings a receipt. Search “OSHA Outreach Training Program 10-hour construction” and book
            through an authorized trainer, not a random PDF.
          </p>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="osha"
              checked={onboarding.oshaPlan === "have"}
              onChange={() => patch({ oshaPlan: "have" })}
            />
            I have the card
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="osha"
              checked={onboarding.oshaPlan === "booked"}
              onChange={() => patch({ oshaPlan: "booked" })}
            />
            I have booked the class
          </label>
          <label className="block text-sm font-semibold">
            {onboarding.oshaPlan === "booked" ? "Class date or confirmation" : "Card number"}
            <input
              className={`${fieldClass} mt-1`}
              value={onboarding.oshaNumber}
              onChange={(event) => patch({ oshaNumber: event.target.value })}
              placeholder={onboarding.oshaPlan === "booked" ? "2026-11-02" : "Card number"}
            />
          </label>
        </Panel>
      ) : null}

      {step === 5 ? (
        <Panel className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">What has to be in the truck</h2>
          <p className="text-sm text-muted">
            Hot-mix, striping, and markers need more gear. You can activate on cold patch and debris
            and add those lessons when you own the tools.
          </p>
          {TOOLS.map((tool) => (
            <label key={tool.id} className="flex min-h-11 items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={onboarding.equipment.includes(tool.id)}
                onChange={() => toggleTool(tool.id)}
              />
              {tool.label}
            </label>
          ))}
        </Panel>
      ) : null}

      {step === 6 ? (
        <Panel className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Pass the required lessons</h2>
          <p className="text-sm text-muted">
            They are short, specific, and scored. Two out of three is a pass. You can leave and come
            back — this step stays put.
          </p>
          <ul className="space-y-2">
            {REQUIRED_MODULES.map((trainingModule) => {
              const score = scores[trainingModule.slug];
              return (
                <li key={trainingModule.slug} className="flex items-center justify-between gap-3 text-sm">
                  <Link
                    to="/training/$slug"
                    params={{ slug: trainingModule.slug }}
                    className="font-semibold text-teal-deep underline"
                  >
                    {trainingModule.title}
                  </Link>
                  <span>{score?.passed ? "Passed" : "Not yet"}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      {step === 7 ? (
        <Panel className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">{town.name} rules, then the ethics line</h2>
          <p className="text-sm">{town.noticeSummary}</p>
          <p className="text-sm text-muted">{town.localNote}</p>
          <Link to="/towns/$slug" params={{ slug: town.slug }} className="text-sm font-semibold text-teal-deep underline">
            Open the full town page
          </Link>
          <label className="flex min-h-11 items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={onboarding.rulesAck}
              onChange={(event) => patch({ rulesAck: event.target.checked })}
            />
            I will only work ways this town owns, and I will not treat a defect photo as legal advice.
          </label>
          <label className="flex min-h-11 items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={onboarding.ethicsAck}
              onChange={(event) => patch({ ethicsAck: event.target.checked })}
            />
            I will not take side cash, split one hole into two tickets, or submit a photo of a different repair.
          </label>
          {gaps.length > 0 ? (
            <div>
              <p className="text-sm font-semibold">Still open</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-muted">
                {gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </div>
          ) : (
            <Button type="button" onClick={() => activate()}>
              Activate my crew
            </Button>
          )}
        </Panel>
      ) : null}

      {step >= 8 && onboarding.activatedAt ? (
        <Panel className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">
            {onboarding.businessName || "Your crew"} can take a job
          </h2>
          <p className="text-sm text-muted">
            Switch the view to Crew if you have not. Claim one open job. The offer locks for 24
            hours. Photograph the finished work on site. The desk compares before and after, then
            queues the full rate.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/jobs" className="inline-flex min-h-11 items-center rounded-md bg-teal px-4 text-sm font-semibold text-paper">
              See open jobs
            </Link>
            <Link to="/training" className="inline-flex min-h-11 items-center rounded-md border border-line bg-sheet px-4 text-sm font-semibold">
              Optional trade lessons
            </Link>
          </div>
        </Panel>
      ) : null}

      {step >= 8 && !onboarding.activatedAt ? (
        <Panel>
          <p className="text-sm">
            Activation sits on the previous step. Finish the open items there, then press Activate my
            crew.
          </p>
          <Button type="button" className="mt-3" variant="line" onClick={() => patch({ step: 7 })}>
            Back to the checklist
          </Button>
        </Panel>
      ) : null}
        <div className="mt-4 flex justify-between gap-3">
          <Button
            type="button"
            variant="line"
            disabled={step === 0}
            onClick={() => patch({ step: Math.max(0, step - 1) })}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={() => patch({ step: Math.min(7, step + 1) })}
            disabled={step >= 7}
          >
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  );
}
