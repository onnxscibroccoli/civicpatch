export interface QuizQuestion {
  prompt: string;
  choices: string[];
  answer: number;
}

export interface TrainingSection {
  heading: string;
  paragraphs: string[];
  steps?: string[];
}

export interface TrainingModule {
  slug: string;
  title: string;
  minutes: number;
  required: boolean;
  summary: string;
  sections: TrainingSection[];
  quiz: QuizQuestion[];
}

export const MODULES: TrainingModule[] = [
  {
    slug: "orientation",
    title: "How a CivicPatch job actually works",
    minutes: 8,
    required: true,
    summary: "You are a small business doing a published-price repair, not a city employee and not a bidder.",
    sections: [
      {
        heading: "The loop, in order",
        paragraphs: [
          "A resident photographs a hazard. The record is hashed and placed on a public ledger for that town. An engineer checks that the town owns the street and posts the schedule price. You claim it. You have 24 hours. You repair it the way this training describes, photograph the result on site, and the engineer compares before and after.",
          "You are not hired onto the payroll. You do not bid. The price is the price, and it is yours in full.",
        ],
      },
      {
        heading: "What the notice is, and is not",
        paragraphs: [
          "The notice proves a defect was shown to the desk, with a time, a place, and a photo hash. Injury claims are a different paper, with a short clock that depends on the state. Massachusetts is often 30 days from the injury. Connecticut is 90. Rhode Island's highway notice is 60. Read the town page before you talk to a resident about lawsuits. You are there to patch pavement, not to give legal advice.",
        ],
      },
      {
        heading: "Jurisdiction first",
        paragraphs: [
          "Every town page lists what that desk will not touch: state highways, parkways, brick pedestrian streets, bridges. If you arrive and the pin is on the wrong pavement, do not start. Release the job and write what you saw. Working the wrong road is how a small crew inherits someone else's liability.",
        ],
      },
    ],
    quiz: [
      {
        prompt: "Who receives the fair rate?",
        choices: [
          "The local crew, in full",
          "CivicPatch, which then pays the crew a commission",
          "The resident who reported the hole",
        ],
        answer: 0,
      },
      {
        prompt: "A CivicPatch notice is…",
        choices: [
          "A maintenance record of a defect, not an injury claim",
          "A lawsuit against the city",
          "A guarantee the city is liable for damages",
        ],
        answer: 0,
      },
      {
        prompt: "If the pin is on a state highway, you should…",
        choices: [
          "Patch it anyway if it looks easy",
          "Release the job and say what you found",
          "Bill the state directly from the app",
        ],
        answer: 1,
      },
    ],
  },
  {
    slug: "safety",
    title: "Work-zone basics for a one-crew repair",
    minutes: 12,
    required: true,
    summary: "Daytime, cones before tools, and a hard stop when the hole is bigger than the ticket.",
    sections: [
      {
        heading: "This is orientation, not your OSHA card",
        paragraphs: [
          "The OSHA 10-hour course for construction, with roadway content from an OSHA Outreach trainer, is a real class with a real card. This module tells you how to behave on a town street tomorrow morning. It does not replace the card. If you do not have the card yet, book the class before you activate — the onboarding path shows you where that requirement sits.",
        ],
      },
      {
        heading: "Before you touch the pavement",
        paragraphs: [
          "High-visibility vest on before you step out of the truck. Hard hat, glasses, gloves, and boots stay on while you are in the street. Park legally. Put cones out before you turn your back to traffic. Face traffic when the site lets you. Starter-tier work is daytime only.",
        ],
        steps: [
          "Read the ticket, the town, and the lease timer before you drive.",
          "Stop where you can leave without backing into a lane.",
          "Vest on. Then cones. Then tools.",
          "If you cannot see approaching drivers, or they cannot see you, do not start.",
        ],
      },
      {
        heading: "Stop work",
        paragraphs: [
          "Return the job, with a note, if you find any of these: a utility plate or valve in the hole, a void deeper than the ticket, a manhole, a hanging limb, work that needs a bucket truck, or night conditions. You were dispatched for a small surface repair. Excavation and tree work are other trades, with other insurance.",
        ],
      },
    ],
    quiz: [
      {
        prompt: "When does the high-visibility vest go on?",
        choices: [
          "After the first cone is placed",
          "Before you leave the truck",
          "Only if a police officer is present",
        ],
        answer: 1,
      },
      {
        prompt: "The hole is actually a collapsing manhole. You…",
        choices: [
          "Fill it with cold mix and submit the photo",
          "Stop, release or return the job, and describe what you found",
          "Cover it with a cone and leave it claimed until tomorrow",
        ],
        answer: 1,
      },
      {
        prompt: "Night work on the starter tier is…",
        choices: ["Encouraged, because traffic is lighter", "Out of scope", "Allowed if you bring extra cones"],
        answer: 1,
      },
    ],
  },
  {
    slug: "cold-patch",
    title: "Small cold patch, step by step",
    minutes: 10,
    required: true,
    summary: "The first trade most crews should be able to do from the back of a pickup.",
    sections: [
      {
        heading: "When this ticket is the right one",
        paragraphs: [
          "Small cold patch means about two square feet and no more than two inches deep, filled with bagged cold mix. The Worcester schedule price is $120, multiplied by the town index. That price includes a mobilization base so a short trip still pays. If the hole is larger, or the edges need a saw, it is a hot-mix ticket. Do not stretch cold mix across a repair it cannot hold.",
        ],
      },
      {
        heading: "The repair",
        paragraphs: [
          "Cold mix bonds to clean, dry-as-you-can-get stone. It does not bond to mud. Square only the loose raveling. Do not turn a small hole into a reconstruction.",
        ],
        steps: [
          "Cone the site. Keep tools inside the cones.",
          "Sweep water, sand, and loose rock out of the hole.",
          "If the edges are crumbling, knock the loose crust back to sound pavement. Stop if that makes the hole bigger than two square feet — this is now the wrong ticket.",
          "Place cold mix in lifts no thicker than 2 inches.",
          "Overfill slightly. Compact with a hand tamper until the patch is level or a shade high. Traffic will finish a proper patch. It will not save a loose one.",
          "Sweep the scatter back into the patch or into a bucket. Do not leave stones in the lane.",
          "Tools in the truck, then cones, then you.",
        ],
      },
      {
        heading: "The photograph",
        paragraphs: [
          "Stand where the resident stood if you can tell. Take the picture in the app, on site, with location on. The check is 15 meters — about half a basketball court. Across the intersection is too far. Walk to the patch.",
        ],
      },
    ],
    quiz: [
      {
        prompt: "How thick should a lift of cold mix be?",
        choices: ["No more than 2 inches", "As deep as the bag will fill", "Exactly 6 inches"],
        answer: 0,
      },
      {
        prompt: "The hole is full of mud. You…",
        choices: [
          "Place mix on top so the photo looks finished",
          "Sweep the mud out before any mix goes in",
          "Add water to soften the mix",
        ],
        answer: 1,
      },
      {
        prompt: "A photo from your camera roll is…",
        choices: [
          "Fine if the patch is visible",
          "Not accepted — the picture is taken on site",
          "Better, because the light is nicer",
        ],
        answer: 1,
      },
    ],
  },
  {
    slug: "proof",
    title: "Proof of work and the 15-meter check",
    minutes: 8,
    required: true,
    summary: "The engineer is looking at two photos and a distance. Make both honest.",
    sections: [
      {
        heading: "What gets checked",
        paragraphs: [
          "The completion photo has to be taken inside the 24-hour lease, within 15 meters of the original pin. In a town deployment the phone's own photo metadata carries the coordinates, and gallery uploads are refused. This pilot can also use the browser's location. If you are at your kitchen table, say so — there is a clearly labeled sandbox attestation for learning the screens. Do not use it to pretend a real repair happened.",
        ],
      },
      {
        heading: "How to shoot",
        paragraphs: [
          "Location services on. Lens clean. Show the whole repair and a little of the surrounding pavement so the engineer can match the before photo. A tight crop of fresh black mix with no context gets sent back. So does a screenshot.",
        ],
        steps: [
          "Finish the physical work first. Do not photograph a plan.",
          "Stand within 15 meters. If the distance reads long, walk closer and try again.",
          "Match the resident's angle when you can.",
          "Submit once. A second contradictory photo helps nobody.",
        ],
      },
      {
        heading: "If the check fails",
        paragraphs: [
          "A miss does not delete the job. It flags the submission for a person. You will see the meters. The engineer sees them too. Guessing a closer number is a way to lose the crew account. Re-shoot from the patch.",
        ],
      },
    ],
    quiz: [
      {
        prompt: "The geofence is…",
        choices: ["15 meters", "150 meters", "Any photo inside the town line"],
        answer: 0,
      },
      {
        prompt: "The photo's time must fall…",
        choices: [
          "Anytime the same week",
          "Inside the claim window",
          "Before the resident reported it",
        ],
        answer: 1,
      },
      {
        prompt: "The engineer compares…",
        choices: [
          "Your invoice against last year's bid",
          "The before and after photos, plus the location check",
          "Only the hash of the legal notice",
        ],
        answer: 1,
      },
    ],
  },
  {
    slug: "pay",
    title: "The fair rate, the lease, and getting paid",
    minutes: 8,
    required: true,
    summary: "No bids. A schedule, a town index, and a bump if nobody takes the job.",
    sections: [
      {
        heading: "The price",
        paragraphs: [
          "Schedule price times the town's cost index times a surge, if the job has been open and unclaimed for more than 72 hours. Surge adds 8 percent a day after that, and it stops after six steps so a forgotten ticket cannot become a blank check. When you claim, the offer locks. It does not rise or fall while you hold the lease.",
          "The schedule already carries a mobilization base. A two-foot patch in Worcester is $120, not a reimbursement of your receipts. You keep the whole offer. If the town adopted the sustainability fee, the city pays an extra 8 percent on top to keep the nonprofit running and to fund starter help for new crews. That 8 percent is not deducted from you.",
        ],
      },
      {
        heading: "The 24-hour lease",
        paragraphs: [
          "Claiming takes the job off the board. If the timer ends without a completion photo, the job returns for someone else. If you know by noon you will not finish, release it. Holding a job you cannot do is how a storm drain stays open overnight.",
        ],
      },
      {
        heading: "After the engineer accepts",
        paragraphs: [
          "Acceptance queues an ACH-style disbursement targeted inside 48 hours, instead of a 90-day municipal invoice. This pilot records the queue on the ledger. It does not move real dollars. A live town uses its payable process or a nonprofit escrow, and you will have given them a business name and a bank account outside this screen. If your insurance date passes, new claims lock until you update it. Work already accepted still gets paid.",
        ],
      },
    ],
    quiz: [
      {
        prompt: "The sustainability fee is…",
        choices: [
          "Taken out of the crew's fair rate",
          "Added on top, and only if that town adopted it",
          "A tip from the resident",
        ],
        answer: 1,
      },
      {
        prompt: "After an engineer accepts the repair, payment is aimed at…",
        choices: [
          "Inside 48 hours",
          "The next 90-day invoice cycle",
          "December, with the tax bill",
        ],
        answer: 0,
      },
      {
        prompt: "Your insurance expiration date passes. You…",
        choices: [
          "Can keep claiming until someone notices",
          "Cannot claim new work until the date is updated",
          "Lose every payment already queued",
        ],
        answer: 1,
      },
    ],
  },
  {
    slug: "ethics",
    title: "Ethics for a crew the neighbors will see again",
    minutes: 6,
    required: true,
    summary: "The rate is the rate. The photo is this repair. The street should be cleaner when you leave.",
    sections: [
      {
        heading: "Money",
        paragraphs: [
          "Do not ask a resident for cash, a tip, or a side repair while you are on a CivicPatch ticket. The fair rate is the contract. Side cash is how a public schedule turns into the old overbilling story, just smaller.",
        ],
      },
      {
        heading: "The work",
        paragraphs: [
          "Do not split one hole into two tickets. Do not claim three jobs you cannot reach today. Do not submit a photo of a different street, a different day, or a patch you found already done. If a resident thanks you, thank them back, pack the cones, and go.",
        ],
      },
      {
        heading: "The block",
        paragraphs: [
          "Knock scatter off the sidewalk. Do not block a driveway for longer than the repair. If someone needs to get a stroller through, pause and let them. You are trying to build a business in this town. The ledger is public, and so is your name on the job.",
        ],
      },
    ],
    quiz: [
      {
        prompt: "A resident offers cash for a second hole next to the ticket. You…",
        choices: [
          "Take it and keep it off the ledger",
          "Decline, and tell them the second hole needs its own report",
          "Add it to the same photo and invoice double",
        ],
        answer: 1,
      },
      {
        prompt: "Splitting one pothole into two tickets is…",
        choices: ["Efficient", "Not allowed", "Required when the mix runs out"],
        answer: 1,
      },
      {
        prompt: "You cannot finish before the lease ends. The right move is…",
        choices: [
          "Leave it claimed so nobody else interferes",
          "Release the job so another crew can take it",
          "Submit a photo of the unrepaired hole",
        ],
        answer: 1,
      },
    ],
  },
  {
    slug: "hot-mix",
    title: "Medium hot-mix patch",
    minutes: 10,
    required: false,
    summary: "A saw-cut rectangle, hot material, and a plate compactor. Cold mix is the wrong product.",
    sections: [
      {
        heading: "Scope",
        paragraphs: [
          "Two to six square feet, up to about three inches deep. Schedule price $185 at the Worcester index. You need hot mix that is still hot — a hot box or a fresh load — plus a saw or a clean cut and a plate compactor. If you only carry bags of cold mix, do not claim this class.",
        ],
      },
      {
        heading: "The repair",
        steps: [
          "Cut a rectangle past the cracked area. Vertical faces, not a bowl.",
          "Remove loose material. Tack the faces if you have tack.",
          "Place hot mix and compact before it cools. A plate compactor is the tool. A truck tire leaves a lip, and a lip is a new defect.",
          "The finished patch should be flush. Sweep the dust.",
          "Photograph the whole rectangle from within 15 meters.",
        ],
        paragraphs: [
          "If the cut reveals a void, a pipe, or fabric you do not recognize, stop. That is no longer a surface patch.",
        ],
      },
    ],
    quiz: [
      {
        prompt: "What compacts a hot-mix patch?",
        choices: ["A plate compactor", "The truck's tire", "Leaving it proud by two inches"],
        answer: 0,
      },
      {
        prompt: "The edge should be…",
        choices: ["A saw-cut rectangle with vertical faces", "A feathered smear of mix", "Whatever the shovel leaves"],
        answer: 0,
      },
      {
        prompt: "Using cold mix on a hot-mix ticket is…",
        choices: ["A reasonable substitute", "The wrong material", "Required below 40 degrees"],
        answer: 1,
      },
    ],
  },
  {
    slug: "striping",
    title: "Thermoplastic line striping",
    minutes: 9,
    required: false,
    summary: "Dry pavement, a straight layout, glass beads while the line is molten. One hundred feet minimum.",
    sections: [
      {
        heading: "Scope",
        paragraphs: [
          "The schedule price of $115 at index 1.00 is for a minimum of 100 linear feet, including surface prep and glass beads. Shorter gaps are a different kind of work. If you cannot lay the minimum, do not claim it. Wet pavement or a temperature below the product's sheet means you wait. Thermoplastic on a damp street fails, and the photo will show it.",
        ],
      },
      {
        heading: "The repair",
        steps: [
          "Confirm the town adopted striping. Not every pilot town has.",
          "Sweep the line. Layout with a chalk line or a straight edge.",
          "Apply at the thickness on the product sheet.",
          "Drop glass beads while it is still molten so the line reflects at night.",
          "Keep tires off it until it has set.",
          "Photograph the run, not a postage stamp of fresh white, from within 15 meters of the pin.",
        ],
        paragraphs: [
          "Do not restripe a state route because the paint looks tired. Ownership of the street is the engineer's call, and it is written on the town page.",
        ],
      },
    ],
    quiz: [
      {
        prompt: "The pavement is wet. You…",
        choices: [
          "Lay the line anyway and note the weather",
          "Do not lay thermoplastic",
          "Dry it with the truck's exhaust",
        ],
        answer: 1,
      },
      {
        prompt: "The minimum on this schedule is…",
        choices: ["10 feet", "100 linear feet", "A full intersection, whatever the length"],
        answer: 1,
      },
      {
        prompt: "Glass beads go down…",
        choices: [
          "The next day, after the line cures",
          "While the material is still molten",
          "Only if the town pays extra",
        ],
        answer: 1,
      },
    ],
  },
  {
    slug: "markers",
    title: "Reflective raised markers",
    minutes: 8,
    required: false,
    summary: "Five markers minimum. New housing, right epoxy, aligned with the lane.",
    sections: [
      {
        heading: "Scope",
        paragraphs: [
          "Schedule price $111 at the Worcester index, five markers minimum, including epoxy and the housing. A missing reflector on a shattered base is not fixed by gluing a new lens to the broken piece. Replace the housing.",
        ],
      },
      {
        heading: "The repair",
        steps: [
          "Match the marker color and direction to the lane you are in. If you are unsure of the pattern, stop and ask the desk before you drill.",
          "Clear the old socket. Blow out dust.",
          "Mix pavement-marker epoxy to the ratio on the cartridge, not by feel.",
          "Seat the marker, align it, wipe the squeeze-out.",
          "Keep traffic off it until the epoxy grabs. The product sheet tells you how long. Believe the sheet.",
          "Photograph the row from within 15 meters.",
        ],
        paragraphs: [
          "Drilling into a bridge deck or a joint is out. If the marker sits on a structure, return the job.",
        ],
      },
    ],
    quiz: [
      {
        prompt: "The minimum on a marker ticket is…",
        choices: ["1 marker", "5 markers", "A full centerline"],
        answer: 1,
      },
      {
        prompt: "A shattered base should be…",
        choices: [
          "Reused, with a new reflector glued on",
          "Replaced, housing and all",
          "Painted so it looks intact",
        ],
        answer: 1,
      },
      {
        prompt: "Epoxy is mixed…",
        choices: [
          "To the ratio on the product",
          "Until it smells right",
          "With extra hardener so it sets faster",
        ],
        answer: 0,
      },
    ],
  },
];

export const REQUIRED_MODULES = MODULES.filter((module) => module.required);

export function moduleBySlug(slug: string): TrainingModule | undefined {
  return MODULES.find((module) => module.slug === slug);
}
