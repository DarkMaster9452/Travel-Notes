import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { signupAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/marketing/auth-form";
import { homeFor } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).auth.signup.submit };
}

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));

  return (
    <Suspense fallback={null}>
      <AuthForm mode="signup" action={signupAction} />
    </Suspense>
  );
}
