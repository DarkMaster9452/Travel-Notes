import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { loginAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboardedAt ? "/dashboard" : "/onboarding");

  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" action={loginAction} />
    </Suspense>
  );
}
