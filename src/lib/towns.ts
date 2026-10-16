import type { HazardClass } from "@/lib/types";

export interface Town {
  slug: string;
  name: string;
  state: string;
  stateName: string;
  kind: "City" | "Town";
  lat: number;
  lng: number;
  department: string;
  delivery: string;
  statute: string;
  noticeSummary: string;
  capSummary: string;
  index: number;
  services: HazardClass[];
  participating: boolean;
  localNote: string;
}

const MA_NOTICE =
  "On a Massachusetts city or town way, a person who is hurt or whose property is damaged by a defect generally must give written notice within 30 days of the injury, not merely of seeing the hole. M.G.L. c. 84, §§ 15 and 18. Recovery from the municipality is capped (the statute's ceiling is $5,000, and also one-fifth of one percent of state valuation). A CivicPatch record shows the desk the defect. It does not file that injury notice for you.";

const MA_CAP =
  "M.G.L. c. 84, § 15 caps municipal road-defect recovery. State highways are a different statute, M.G.L. c. 81, § 18, and are outside this pilot.";

export const TOWNS: Town[] = [
  {
    slug: "worcester",
    name: "Worcester",
    state: "MA",
    stateName: "Massachusetts",
    kind: "City",
    lat: 42.2626,
    lng: -71.8023,
    department: "Department of Public Works & Parks",
    delivery:
      "Defect record addressed to the City Clerk, with a copy for Public Works. This pilot keeps it on the public ledger instead of sending mail.",
    statute: "M.G.L. c. 84, §§ 15, 18",
    noticeSummary: MA_NOTICE,
    capSummary: MA_CAP,
    index: 1,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "LINE_STRIPING", "ROAD_MARKER", "ROAD_DEBRIS"],
    participating: true,
    localNote:
      "Worcester is the index city: schedule prices are published at 1.00 here. Numbered state routes and MassDOT bridges are not city work. If a pin lands on one, the engineer rejects it.",
  },
  {
    slug: "springfield",
    name: "Springfield",
    state: "MA",
    stateName: "Massachusetts",
    kind: "City",
    lat: 42.1015,
    lng: -72.5898,
    department: "Department of Public Works",
    delivery: "City Clerk and DPW. Ledger copy stands in for delivery in this pilot.",
    statute: "M.G.L. c. 84, §§ 15, 18",
    noticeSummary: MA_NOTICE,
    capSummary: MA_CAP,
    index: 0.96,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "ROAD_DEBRIS", "ROAD_MARKER"],
    participating: true,
    localNote:
      "Index 0.96 reflects local mobilization, not a discount on safety. I-91 and the state-numbered arterials stay with MassDOT.",
  },
  {
    slug: "cambridge",
    name: "Cambridge",
    state: "MA",
    stateName: "Massachusetts",
    kind: "City",
    lat: 42.3736,
    lng: -71.1097,
    department: "Department of Public Works",
    delivery: "City Clerk. Engineers also watch for DCR parkways and state roads.",
    statute: "M.G.L. c. 84, §§ 15, 18",
    noticeSummary: MA_NOTICE,
    capSummary: MA_CAP,
    index: 1.18,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "LINE_STRIPING", "ROAD_MARKER"],
    participating: true,
    localNote:
      "Inner-core labor and short-block mobilization price the index at 1.18. Memorial Drive and some parkways are not city streets. A crew should not set cones on them under a city ticket.",
  },
  {
    slug: "lowell",
    name: "Lowell",
    state: "MA",
    stateName: "Massachusetts",
    kind: "City",
    lat: 42.6334,
    lng: -71.3162,
    department: "Department of Public Works",
    delivery: "City Clerk, copy to DPW.",
    statute: "M.G.L. c. 84, §§ 15, 18",
    noticeSummary: MA_NOTICE,
    capSummary: MA_CAP,
    index: 1.02,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "ROAD_DEBRIS", "LINE_STRIPING"],
    participating: true,
    localNote:
      "Canal bridges and the state highway system are out. Debris jobs here are lane-edge only — nothing over the canals.",
  },
  {
    slug: "quincy",
    name: "Quincy",
    state: "MA",
    stateName: "Massachusetts",
    kind: "City",
    lat: 42.2529,
    lng: -71.0023,
    department: "Department of Public Works",
    delivery: "City Clerk, copy to DPW.",
    statute: "M.G.L. c. 84, §§ 15, 18",
    noticeSummary: MA_NOTICE,
    capSummary: MA_CAP,
    index: 1.12,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "LINE_STRIPING", "ROAD_MARKER"],
    participating: true,
    localNote:
      "Index 1.12. Furnace Brook Parkway and I-93 are not Quincy DPW. Confirm the way is accepted as a city street before you approve a rate.",
  },
  {
    slug: "pittsfield",
    name: "Pittsfield",
    state: "MA",
    stateName: "Massachusetts",
    kind: "City",
    lat: 42.4501,
    lng: -73.2454,
    department: "Department of Public Services",
    delivery: "City Clerk. Distances are longer, so the unclaimed adjustment matters here.",
    statute: "M.G.L. c. 84, §§ 15, 18",
    noticeSummary: MA_NOTICE,
    capSummary: MA_CAP,
    index: 0.94,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "ROAD_MARKER", "ROAD_DEBRIS"],
    participating: true,
    localNote:
      "Berkshire mobilization is built into the surge rule: a job that sits three days gets a higher offer so a crew can justify the drive. Night mountain roads are not in the starter tier.",
  },
  {
    slug: "new-bedford",
    name: "New Bedford",
    state: "MA",
    stateName: "Massachusetts",
    kind: "City",
    lat: 41.6362,
    lng: -70.9342,
    department: "Department of Public Infrastructure",
    delivery: "City Clerk, copy to Public Infrastructure.",
    statute: "M.G.L. c. 84, §§ 15, 18",
    noticeSummary: MA_NOTICE,
    capSummary: MA_CAP,
    index: 0.98,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "LINE_STRIPING", "ROAD_DEBRIS"],
    participating: true,
    localNote:
      "Working waterfront truck routes get rejected when they are state or port authority pavement. Cobble and brick need a different spec — this schedule is asphalt only.",
  },
  {
    slug: "holyoke",
    name: "Holyoke",
    state: "MA",
    stateName: "Massachusetts",
    kind: "City",
    lat: 42.2043,
    lng: -72.6162,
    department: "Department of Public Works",
    delivery: "City Clerk, copy to DPW.",
    statute: "M.G.L. c. 84, §§ 15, 18",
    noticeSummary: MA_NOTICE,
    capSummary: MA_CAP,
    index: 0.95,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "ROAD_DEBRIS", "ROAD_MARKER"],
    participating: true,
    localNote:
      "Canal and mill streets can hide thin pavement over old structures. If the hole is deeper than the ticket, stop and send it back. Do not become an excavation crew.",
  },
  {
    slug: "providence",
    name: "Providence",
    state: "RI",
    stateName: "Rhode Island",
    kind: "City",
    lat: 41.824,
    lng: -71.4128,
    department: "Department of Public Works",
    delivery:
      "Highway-injury notice under R.I. Gen. Laws § 45-15-9 goes to the city. This pilot files the defect record with Public Works and keeps a ledger copy.",
    statute: "R.I. Gen. Laws § 45-15-9",
    noticeSummary:
      "Rhode Island gives a person injured or damaged on a highway or bridge 60 days to notify the town of the time, place, and cause. R.I. Gen. Laws § 45-15-9. Suit timing and presentment also involve § 45-15-5. A CivicPatch photo is the maintenance record. It is not that injury notice.",
    capSummary:
      "Municipal damages are limited under Rhode Island law, including the general cap in R.I. Gen. Laws § 9-31-3. The figure that applies depends on the claim. Confirm it before anyone relies on a number.",
    index: 1.08,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "LINE_STRIPING", "ROAD_DEBRIS"],
    participating: true,
    localNote:
      "Providence adopts the same fair-rate schedule, multiplied by 1.08. State roads and the highway interchange are not DPW patches.",
  },
  {
    slug: "hartford",
    name: "Hartford",
    state: "CT",
    stateName: "Connecticut",
    kind: "City",
    lat: 41.7637,
    lng: -72.6851,
    department: "Department of Public Works",
    delivery:
      "A defective-road injury notice under Conn. Gen. Stat. § 13a-149 is served on the city clerk. CivicPatch sends the defect record to Public Works and keeps the hash on the ledger.",
    statute: "Conn. Gen. Stat. § 13a-149",
    noticeSummary:
      "Connecticut's defective-highway statute requires written notice to the proper municipal official within 90 days of the injury, and a lawsuit within two years. Conn. Gen. Stat. § 13a-149. The notice has to name time, place, and cause with care. A maintenance photo does not replace it.",
    capSummary:
      "Section 13a-149 is its own cause of action, with its own notice rules. Do not assume a general municipal cap from another state applies.",
    index: 1.06,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "LINE_STRIPING", "ROAD_MARKER"],
    participating: true,
    localNote:
      "Hartford's index is 1.06. Crews stay on accepted city streets. State routes and the riverfront highway structures are out of scope.",
  },
  {
    slug: "portland",
    name: "Portland",
    state: "ME",
    stateName: "Maine",
    kind: "City",
    lat: 43.6591,
    lng: -70.2568,
    department: "Public Works",
    delivery: "Municipal officers, via Public Works for the defect record. Ledger copy in this pilot.",
    statute: "23 M.R.S. § 3655",
    noticeSummary:
      "Maine allows a civil action for injury or property damage from a highway defect, generally only if the town had 24 hours' actual notice of the defect beforehand, and the injured person gives written notice of the claim within 180 days. 23 M.R.S. § 3655. If the person already knew about the defect, they generally cannot recover unless they had notified a municipal officer first. CivicPatch is built to create that earlier defect record.",
    capSummary:
      "The same section limits what can be recovered from a town (the text states a ceiling of $6,000). Statutes change. Counsel for the city should confirm the current ceiling before a claim is discussed.",
    index: 1.04,
    services: ["POTHOLE_SMALL", "POTHOLE_LARGE", "ROAD_DEBRIS", "ROAD_MARKER"],
    participating: true,
    localNote:
      "Winter sand and freeze-thaw make small patches the core of the Portland pilot. Striping is not adopted yet. State highways on the peninsula approach are not city tickets.",
  },
  {
    slug: "burlington",
    name: "Burlington",
    state: "VT",
    stateName: "Vermont",
    kind: "City",
    lat: 44.4759,
    lng: -73.2121,
    department: "Department of Public Works",
    delivery: "Public Works for the defect record. Bridge and culvert injury notices have their own addressee — the selectboard clock is not this form.",
    statute: "19 V.S.A. § 985; § 987 for certain structures",
    noticeSummary:
      "Vermont towns must keep highways in good and sufficient repair under 19 V.S.A. § 985. Injuries from insufficient bridges or culverts carry a short written notice — 20 days to the selectboard under 19 V.S.A. § 987. That 20-day rule is not a general pothole-photo deadline. Other claims against a city follow their own presentment rules. CivicPatch records the defect for the crew desk and does not file an injury claim.",
    capSummary:
      "Do not import another state's dollar cap. Burlington's counsel sets what, if anything, a claimant can recover.",
    index: 1.05,
    services: ["POTHOLE_SMALL", "ROAD_MARKER", "ROAD_DEBRIS"],
    participating: true,
    localNote:
      "Starter services only: small cold patch, markers, and debris. Church Street's brick is not an asphalt ticket. The bike path and state routes are out.",
  },
];

export function townBySlug(slug: string): Town {
  const found = TOWNS.find((town) => town.slug === slug);
  if (!found) throw new Error(`Unknown town ${slug}`);
  return found;
}

export function nearestTown(lat: number, lng: number): { town: Town; meters: number } {
  let best = TOWNS[0];
  let bestMeters = Number.POSITIVE_INFINITY;
  for (const town of TOWNS) {
    const meters = haversine(lat, lng, town.lat, town.lng);
    if (meters < bestMeters) {
      best = town;
      bestMeters = meters;
    }
  }
  return { town: best, meters: bestMeters };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
