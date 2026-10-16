import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, PageTitle, Panel, StatusPill } from "@/components/chrome";
import { GEOFENCE_METERS, PLATFORM_FEE, money, remaining } from "@/lib/format";
import { haversineMeters } from "@/lib/geo";
import { fileToJpeg } from "@/lib/image";
import { hazardById } from "@/lib/hazards";
import { currentOffer, surgeFactor } from "@/lib/rates";
import { useCivic } from "@/lib/store";
import { townBySlug } from "@/lib/towns";

export const Route = createFileRoute("/jobs/$ticketId")({
  head: () => ({ meta: [{ title: "Job · CivicPatch" }] }),
  component: JobPage,
});

function JobPage() {
  const { ticketId } = Route.useParams();
  const ticket = useCivic((state) => state.tickets.find((item) => item.id === ticketId));
  const onboarding = useCivic((state) => state.onboarding);
  const claim = useCivic((state) => state.claim);
  const release = useCivic((state) => state.release);
  const submitWork = useCivic((state) => state.submitWork);
  const [now, setNow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!ticket) {
    return <PageTitle title="Job not on the board" />;
  }

  const town = townBySlug(ticket.townSlug);
  const hazard = hazardById(ticket.hazardClass);
  const offer = currentOffer(ticket, town.index);
  const surge = surgeFactor(ticket.approvedAt, ticket.status);
  const mine = ticket.contractorName === onboarding.businessName && Boolean(onboarding.businessName);
  const open = ticket.status === "APPROVED_FOR_BID";
  const lesson =
    ticket.hazardClass === "POTHOLE_LARGE"
      ? "hot-mix"
      : ticket.hazardClass === "LINE_STRIPING"
        ? "striping"
        : ticket.hazardClass === "ROAD_MARKER"
          ? "markers"
          : ticket.hazardClass === "ROAD_DEBRIS"
            ? "safety"
            : "cold-patch";

  async function onClaim() {
    const result = claim(ticket!.id);
    if (!result.ok) toast.error(result.error ?? "Could not claim.");
    else toast.success("Lease started. 24 hours.");
  }

  async function onFile(file: File | undefined, mode: "gps" | "sandbox") {
    if (!file || !ticket) return;
    setBusy(true);
    try {
      const photo = await fileToJpeg(file);
      let delta = 4 + Math.random() * 8;
      if (mode === "gps" && navigator.geolocation) {
        delta = await new Promise<number>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve(
                haversineMeters(
                  { lat: pos.coords.latitude, lng: pos.coords.longitude },
                  ticket,
                ),
              ),
            () => resolve(120),
            { enableHighAccuracy: true, timeout: 8000 },
          );
        });
      }
      const result = submitWork(ticket.id, photo, delta, mode);
      if (!result.ok) toast.error(result.error ?? "Could not submit.");
      else if (delta <= GEOFENCE_METERS) toast.success("Photo accepted inside the geofence.");
      else toast("Flagged for the desk. The distance is on the record.");
    } catch {
      toast.error("Could not read that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <Link to="/jobs" className="text-sm font-semibold text-teal-deep underline">
          All jobs
        </Link>
        <PageTitle title={ticket.title} lede={ticket.description} />
        <img src={ticket.beforePhoto} alt="Hazard on the job ticket" className="w-full rounded-md object-cover" />
        <p className="mt-3 text-sm text-muted">{hazard.rule}</p>
      </div>
      <aside className="space-y-4">
        <Panel className="bg-asphalt text-on-asphalt">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-amber">{hazard.label}</p>
              <p className="font-display text-4xl font-semibold tabular-nums">{money(offer)}</p>
              <p className="text-sm">Guaranteed to the crew. Not a bid.</p>
            </div>
            <StatusPill status={ticket.status} />
          </div>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Schedule × {town.name} index {town.index.toFixed(2)}</dt>
              <dd className="tabular-nums">{money(ticket.rateAtApproval ?? offer)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Unclaimed adjustment</dt>
              <dd>{surge > 1 ? `${surge.toFixed(2)}×` : "Not yet"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>City sustainability fee, on top</dt>
              <dd className="tabular-nums">{money(offer * PLATFORM_FEE)}</dd>
            </div>
          </dl>
        </Panel>
        <Panel>
          <p className="font-semibold">{ticket.address}</p>
          <p className="text-sm text-muted">
            {town.name}, {town.state} · {hazard.unit}
          </p>
          <p className="mt-2 text-sm text-muted">{town.localNote}</p>
        </Panel>
        {ticket.status === "CLAIMED" && ticket.claimExpiresAt ? (
          <Panel>
            <p className="text-sm font-semibold">Execution lease</p>
            <p className="font-mono text-2xl tabular-nums">
              {now == null ? "…" : remaining(ticket.claimExpiresAt, now)}
            </p>
            <p className="text-sm text-muted">Held by {ticket.contractorName}.</p>
          </Panel>
        ) : null}
        {open ? (
          onboarding.activatedAt ? (
            <Button type="button" onClick={() => void onClaim()}>
              Claim this job
            </Button>
          ) : (
            <Panel>
              <p className="font-semibold">Activation comes first</p>
              <p className="mt-1 text-sm text-muted">
                Insurance, the OSHA step, the tool list, and the required lessons. It is a real
                sequence, written so it does not feel like a closed door.
              </p>
              <Link to="/become" className={`${"mt-3 inline-flex"} text-sm font-semibold text-teal-deep underline`}>
                Start a crew
              </Link>
            </Panel>
          )
        ) : null}
        {mine && ticket.status === "CLAIMED" ? (
          <Panel className="space-y-3">
            <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-teal px-4 text-sm font-semibold text-paper">
              {busy ? "Checking location…" : "Take the completion photo"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                disabled={busy}
                onChange={(event) => void onFile(event.target.files?.[0], "gps")}
              />
            </label>
            <p className="text-xs text-muted">
              Production crews shoot inside the app, on the patch, within {GEOFENCE_METERS} meters.
              Gallery pictures are refused. If you are learning this screen away from the street, use
              the sandbox attestation and say so.
            </p>
            <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-line px-4 text-sm font-semibold">
              Sandbox: attest an on-site capture
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy}
                onChange={(event) => void onFile(event.target.files?.[0], "sandbox")}
              />
            </label>
            <Button
              type="button"
              variant="line"
              onClick={() => {
                const result = release(ticket.id);
                if (!result.ok) toast.error(result.error ?? "Could not release.");
                else toast("Lease released. The job is back on the board.");
              }}
            >
              Release the lease
            </Button>
          </Panel>
        ) : null}
        {ticket.status === "WORK_SUBMITTED" ? (
          <Panel>
            <p className="text-sm">
              Photo is with the desk.
              {ticket.spatialDeltaM != null
                ? ` Distance ${ticket.spatialDeltaM.toFixed(1)} m.`
                : ""}{" "}
              {ticket.geofencePass ? "Geofence passed." : "Flagged for a person."}
            </p>
          </Panel>
        ) : null}
        <Link
          to="/training/$slug"
          params={{ slug: lesson }}
          className="block text-sm font-semibold text-teal-deep underline"
        >
          Read the field steps for this repair
        </Link>
      </aside>
    </div>
  );
}
