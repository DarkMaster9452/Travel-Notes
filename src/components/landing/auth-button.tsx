"use client";

import * as React from "react";

import { useAuthModal, type AuthMode } from "./auth-modal";

/**
 * Any button on the landing page that opens the auth dialog. Replaces the
 * `[data-login]` attribute the original page delegated on.
 */
export function AuthButton({
  mode = "login",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { mode?: AuthMode }) {
  const { open } = useAuthModal();
  return (
    <button type="button" className={className} onClick={() => open(mode)} {...props}>
      {children}
    </button>
  );
}
