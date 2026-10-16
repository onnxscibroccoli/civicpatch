import type { HazardClass } from "@/lib/types";

export interface Hazard {
  id: HazardClass;
  label: string;
  schedule: number;
  unit: string;
  material: string;
  open311: string;
  before: string;
  after: string;
  rule: string;
}

export const HAZARDS: Hazard[] = [
  {
    id: "POTHOLE_SMALL",
    label: "Small cold patch",
    schedule: 120,
    unit: "Up to 2 sq ft, 2 in deep",
    material: "Bagged cold mix",
    open311: "POTHOLE_SMALL",
    before: "/photos/pothole-small.jpg",
    after: "/photos/pothole-small-fixed.jpg",
    rule: "Sweep out water and mud. Compact in lifts no thicker than 2 inches.",
  },
  {
    id: "POTHOLE_LARGE",
    label: "Medium hot-mix patch",
    schedule: 185,
    unit: "2–6 sq ft, up to 3 in deep",
    material: "Hot mix, saw-cut edges",
    open311: "POTHOLE_LARGE",
    before: "/photos/pothole-large.jpg",
    after: "/photos/pothole-large-fixed.jpg",
    rule: "Saw-cut a rectangle. Compact with a plate, not a truck tire. Do not substitute cold mix.",
  },
  {
    id: "LINE_STRIPING",
    label: "Thermoplastic line",
    schedule: 115,
    unit: "100 linear feet minimum",
    material: "Thermoplastic and glass beads",
    open311: "LINE_STRIPING",
    before: "/photos/striping-faded.jpg",
    after: "/photos/striping-fresh.jpg",
    rule: "Dry pavement only. Drop glass beads while the line is still hot.",
  },
  {
    id: "ROAD_MARKER",
    label: "Reflective marker",
    schedule: 111,
    unit: "5 markers minimum",
    material: "Housing plus pavement epoxy",
    open311: "ROAD_MARKER",
    before: "/photos/marker-broken.jpg",
    after: "/photos/marker-fixed.jpg",
    rule: "Replace the housing. Do not glue a reflector onto a shattered base.",
  },
  {
    id: "ROAD_DEBRIS",
    label: "Debris clearance",
    schedule: 95,
    unit: "One lane-edge obstruction",
    material: "Hand tools, no aerial work",
    open311: "ROAD_DEBRIS",
    before: "/photos/debris.jpg",
    after: "/photos/debris.jpg",
    rule: "Clear what you can lift safely. A hanging limb or a bucket-truck job goes back to the town.",
  },
];

export function hazardById(id: HazardClass): Hazard {
  const found = HAZARDS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown hazard ${id}`);
  return found;
}
