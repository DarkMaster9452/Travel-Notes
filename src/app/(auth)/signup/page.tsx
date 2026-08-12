import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { signupAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardedAt ? "/dashboard" : "/onboarding");

  return (
    <Suspense fallback={null}>
      <AuthForm mode="signup" action={signupAction} />
    </Suspense>
  );
}
