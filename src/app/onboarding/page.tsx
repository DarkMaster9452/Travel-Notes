import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { completeOnboardingAction } from "@/app/onboarding/actions";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Set up your preferences" };

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  if (user.onboardedAt) redirect("/dashboard");

  return <OnboardingFlow action={completeOnboardingAction} name={user.name} />;
}
