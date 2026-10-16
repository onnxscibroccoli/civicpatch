import { isPastDate } from "@/lib/format";
import { REQUIRED_MODULES } from "@/lib/training";
import type { Onboarding, QuizScore } from "@/lib/types";

export const STARTER_TOOLS = ["ppe", "traffic", "cold", "measure"] as const;

export function activationGaps(
  onboarding: Onboarding,
  scores: Record<string, QuizScore>,
): string[] {
  const gaps: string[] = [];
  if (!onboarding.fitAck) gaps.push("Confirm you can do small daytime repairs.");
  if (!onboarding.contactName.trim()) gaps.push("Add your name.");
  if (!onboarding.businessName.trim()) {
    gaps.push("Name the business. Your own name is enough for a sole prop.");
  }
  if (!onboarding.townSlug) gaps.push("Choose a home town.");
  if (!onboarding.structure) gaps.push("Say whether you are a sole prop or an LLC.");
  if (!onboarding.insuranceAck) gaps.push("Read the insurance requirement and check it.");
  if (!onboarding.insurancePolicy.trim()) {
    gaps.push("Enter a policy number. PRACTICE-GL-1000000 works in this pilot.");
  }
  if (!onboarding.insuranceExpires) {
    gaps.push("Enter the policy expiration date.");
  } else if (isPastDate(onboarding.insuranceExpires)) {
    gaps.push("That policy date is already past.");
  }
  if (!onboarding.oshaPlan) {
    gaps.push("Say whether you have the OSHA 10 card or have booked the class.");
  }
  if (onboarding.oshaPlan && onboarding.oshaNumber.trim().length < 4) {
    gaps.push(
      onboarding.oshaPlan === "have"
        ? "Enter the OSHA card number."
        : "Enter the class date or a confirmation code.",
    );
  }
  if (!STARTER_TOOLS.every((id) => onboarding.equipment.includes(id))) {
    gaps.push("Confirm the starter tool list.");
  }
  for (const trainingModule of REQUIRED_MODULES) {
    if (!scores[trainingModule.slug]?.passed) {
      gaps.push(`Pass “${trainingModule.title}”.`);
    }
  }
  if (!onboarding.rulesAck) gaps.push("Acknowledge your town's rules.");
  if (!onboarding.ethicsAck) gaps.push("Acknowledge the ethics rules.");
  return gaps;
}
