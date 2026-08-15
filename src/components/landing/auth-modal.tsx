"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, signupAction, type AuthState } from "@/app/(auth)/actions";
import { IconGoogle, Modal } from "@/components/field";

export type AuthMode = "login" | "signup";

type AuthModalContextValue = {
  open: (mode?: AuthMode) => void;
};

const AuthModalContext = React.createContext<AuthModalContextValue | null>(null);

/**
 * Opens the auth dialog from anywhere on the landing page.
 *
 * The original page wired this with a delegated `[data-login]` click handler
 * on the document; a context does the same job without every call site having
 * to agree on a magic attribute.
 */
export function useAuthModal(): AuthModalContextValue {
  const context = React.useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used inside <AuthModalProvider>");
  }
  return context;
}

const COPY: Record<AuthMode, { title: string; sub: string; submit: string }> = {
  login: {
    title: "Welcome back.",
    sub: "Log in to see your quests, your history, your stickers and your matches.",
    submit: "Log in",
  },
  signup: {
    title: "Start your quest log.",
    sub: "One free account holds your quests, your history, your sticker sheet and the people you go with.",
    submit: "Create account",
  },
};

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<AuthMode | null>(null);

  const open = React.useCallback((next: AuthMode = "login") => setMode(next), []);
  const close = React.useCallback(() => setMode(null), []);
  const value = React.useMemo(() => ({ open }), [open]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthDialog mode={mode} onModeChange={setMode} onClose={close} />
    </AuthModalContext.Provider>
  );
}

function AuthDialog({
  mode,
  onModeChange,
  onClose,
}: {
  mode: AuthMode | null;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}) {
  const copy = COPY[mode ?? "login"];

  return (
    <Modal
      open={mode !== null}
      onClose={onClose}
      title={copy.title}
      description={copy.sub}
      labelledBy="auth-title"
    >
      {/* Remounted per mode so the form's action state resets rather than
          carrying a login error across into the signup form. */}
      {mode && <AuthForm key={mode} mode={mode} />}

      <div className="modal-alt">or</div>
      <button className="oauth" type="button" disabled title="Not connected yet">
        <IconGoogle />
        Continue with Google
      </button>

      <p className="swap">
        {mode === "login" ? "No account yet? " : "Already have an account? "}
        <button type="button" onClick={() => onModeChange(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Create one" : "Log in"}
        </button>
      </p>
      <p className="note text-center">Google sign-in connects in the auth pass.</p>
    </Modal>
  );
}

function AuthForm({ mode }: { mode: AuthMode }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction] = useActionState<AuthState, FormData>(action, undefined);
  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="modal-form" noValidate>
      {/* Signup needs something to call you. First names only — the product
          never shows a surname, so this is deliberately not "full name". */}
      {mode === "signup" && (
        <>
          <input
            className="input"
            name="name"
            type="text"
            autoComplete="given-name"
            placeholder="First name"
            aria-label="First name"
            aria-invalid={errors.name ? true : undefined}
            required
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </>
      )}

      <input
        className="input"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@email.com"
        aria-label="Email"
        aria-invalid={errors.email ? true : undefined}
        required
      />
      {errors.email && <p className="form-error">{errors.email}</p>}

      <input
        className="input"
        name="password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        placeholder="Password"
        aria-label="Password"
        aria-invalid={errors.password ? true : undefined}
        minLength={mode === "signup" ? 8 : undefined}
        required
      />
      {errors.password && <p className="form-error">{errors.password}</p>}
      {errors.form && <p className="form-error">{errors.form}</p>}

      <SubmitButton>{COPY[mode].submit}</SubmitButton>
    </form>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-signal" type="submit" disabled={pending}>
      {pending ? "One moment…" : children}
    </button>
  );
}
