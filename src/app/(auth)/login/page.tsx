import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { loginAction } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");
  const { t } = await getTranslations();

  return (
    <Suspense fallback={null}>
      <AuthForm mode="login" action={loginAction} t={t} />
    </Suspense>
  );
}
