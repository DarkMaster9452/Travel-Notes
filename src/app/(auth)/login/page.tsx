import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { loginAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/marketing/auth-form";
import { homeFor } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).auth.login.submit };
}

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));

  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" action={loginAction} />
    </Suspense>
  );
}
