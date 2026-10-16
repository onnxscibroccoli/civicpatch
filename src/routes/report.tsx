import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button, PageTitle, Panel, fieldClass } from "@/components/chrome";
import { money } from "@/lib/format";
import { fileToJpeg } from "@/lib/image";
import { haversineMeters, miles } from "@/lib/geo";
import { HAZARDS } from "@/lib/hazards";
import { basePayout } from "@/lib/rates";
import { useCivic } from "@/lib/store";
import { TOWNS, nearestTown, townBySlug } from "@/lib/towns";
import type { HazardClass } from "@/lib/types";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "Report a hazard · CivicPatch" }] }),
  component: ReportPage,
});

function ReportPage() {
  const navigate = useNavigate();
  const report = useCivic((state) => state.report);
  const residentName = useCivic((state) => state.residentName);
  const tickets = useCivic((state) => state.tickets);
  const [name, setName] = useState(residentName);
  const [hazard, setHazard] = useState<HazardClass>("POTHOLE_SMALL");
  const [townSlug, setTownSlug] = useState("worcester");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const town = townBySlug(townSlug);
  const estimate = basePayout(hazard, town.index);
  const selected = HAZARDS.find((item) => item.id === hazard)!;
  const townAllows = town.services.includes(hazard);

  const nearby =
    lat != null && lng != null
      ? tickets.find((ticket) => {
          if (ticket.status === "REJECTED" || ticket.status === "VERIFIED_PAID") return false;
          if (ticket.hazardClass !== hazard) return false;
          return haversineMeters({ lat, lng }, ticket) < 40;
        })
      : undefined;

  function locate() {
    if (!navigator.geolocation) {
      setNote("This browser will not share a location. Pick the town and type the address.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        const nearest = nearestTown(nextLat, nextLng);
        setLat(nextLat);
        setLng(nextLng);
        setTownSlug(nearest.town.slug);
        if (!address.trim()) {
          setAddress(
            `Near ${nearest.town.name} pin (${nextLat.toFixed(5)}, ${nextLng.toFixed(5)})`,
          );
        }
        setNote(
          nearest.meters > 40_000
            ? `Nearest participating desk is ${nearest.town.name}, ${miles(nearest.meters)} away. If this is a state highway, the desk will reject it.`
            : `Matched to ${nearest.town.name}, about ${miles(nearest.meters)} from the desk pin.`,
        );
        setLocating(false);
      },
      () => {
        setNote("Location stayed off. Choose the town yourself and type a street address.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      setPhoto(await fileToJpeg(file));
    } catch {
      toast.error("That photo could not be read.");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !address.trim() || !description.trim() || !photo) {
      toast.error("Name, photo, place, and a short description are required.");
      return;
    }
    if (!townAllows) {
      toast.error(`${town.name} has not adopted ${selected.label.toLowerCase()} yet.`);
      return;
    }
    const useLat = lat ?? town.lat;
    const useLng = lng ?? town.lng;
    setBusy(true);
    const id = report({
      reporterName: name,
      description,
      hazardClass: hazard,
      lat: useLat,
      lng: useLng,
      address,
      townSlug,
      beforePhoto: photo,
    });
    await useCivic.getState().sealNotices();
    setBusy(false);
    await navigate({ to: "/receipt/$ticketId", params: { ticketId: id } });
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <PageTitle
          kicker="Resident"
          title="Report a road hazard"
          lede="A minute of detail beats a vague complaint. The desk gets a place, a photo, and a hash. You get a receipt."
        />
        <Panel className="space-y-4">
          <label className="block text-sm font-semibold">
            Your name
            <input
              className={`${fieldClass} mt-1`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <div>
            <p className="text-sm font-semibold">Photo of the hazard</p>
            <label className="mt-1 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-line bg-paper px-4 py-6 text-center">
              {photo ? (
                <img src={photo} alt="Hazard you are about to file" className="max-h-56 rounded-sm object-cover" />
              ) : (
                <>
                  <span className="font-semibold">Take or choose a photo</span>
                  <span className="mt-1 text-sm text-muted">The street, not a screenshot of a map.</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => void onPhoto(event.target.files?.[0])}
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            What is it
            <select
              className={`${fieldClass} mt-1`}
              value={hazard}
              onChange={(event) => setHazard(event.target.value as HazardClass)}
            >
              {HAZARDS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            What should the crew know
            <textarea
              className={`${fieldClass} mt-1 min-h-24 py-2`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              placeholder="How big, how deep, what it is doing to people who use the street."
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="line" onClick={locate} disabled={locating}>
              {locating ? "Finding you…" : "Use my location"}
            </Button>
          </div>
          {note ? <p className="text-sm text-muted">{note}</p> : null}
          <label className="block text-sm font-semibold">
            Town desk
            <select
              className={`${fieldClass} mt-1`}
              value={townSlug}
              onChange={(event) => setTownSlug(event.target.value)}
            >
              {TOWNS.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}, {item.state}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Street address
            <input
              className={`${fieldClass} mt-1`}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              placeholder="Number and street, city"
            />
          </label>
          {lat != null && lng != null ? (
            <p className="font-mono text-xs text-muted">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          ) : (
            <p className="text-sm text-muted">
              Without a device location, the pin sits on the town desk until an engineer corrects it.
            </p>
          )}
          {!townAllows ? (
            <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {town.name} has not adopted this repair class. Pick another class or another town.
            </p>
          ) : null}
          {nearby ? (
            <p className="rounded-md bg-amber-soft px-3 py-2 text-sm">
              {nearby.id} is already open within 40 meters for the same kind of repair. You can still
              file if this is a different defect. The desk may close it as a duplicate.
            </p>
          ) : null}
          <Button type="submit" disabled={busy || !photo}>
            {busy ? "Sealing notice…" : "File the report"}
          </Button>
        </Panel>
      </div>
      <aside className="space-y-4">
        <Panel>
          <p className="text-sm font-semibold text-teal-deep">Estimated schedule</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{money(estimate)}</p>
          <p className="mt-2 text-sm text-muted">
            {selected.unit}. {town.name} index {town.index.toFixed(2)}. An engineer still has to post
            it before a crew can claim it. The crew would keep this full amount.
          </p>
          <p className="mt-3 text-sm">{selected.rule}</p>
        </Panel>
        <Panel>
          <h2 className="font-semibold">What this filing is</h2>
          <p className="mt-2 text-sm text-muted">{town.noticeSummary}</p>
        </Panel>
      </aside>
    </form>
  );
}
