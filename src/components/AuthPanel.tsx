"use client";

import { useState, type FormEvent } from "react";

export type AuthMode = "login" | "register";

export function AuthPanel({
  mode,
  loading,
  error,
  onModeChange,
  onSubmit,
}: {
  mode: AuthMode;
  loading: boolean;
  error: string;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (values: { name: string; email: string; password: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ name, email, password });
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-accent font-mono text-base font-bold text-canvas">
            R
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Service Desk</p>
            <p className="label">Restaurant Operations</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {mode === "login"
            ? "Authenticate to open the workspace."
            : "Staff accounts get immediate access."}
        </p>

        <div
          role="tablist"
          aria-label="Account access"
          className="mt-6 grid grid-cols-2 gap-1 rounded-lg border border-edge bg-surface p-1"
        >
          {(["login", "register"] as const).map((option) => (
            <button
              key={option}
              role="tab"
              aria-selected={mode === option}
              type="button"
              onClick={() => onModeChange(option)}
              className={`rounded-md py-1.5 text-xs font-medium capitalize transition ${
                mode === option
                  ? "bg-raised text-ink"
                  : "text-ink-subtle hover:text-ink-muted"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-cancelled/30 bg-cancelled/10 px-3 py-2 text-sm text-cancelled">
            <span aria-hidden="true">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form className="mt-5 flex flex-col gap-3" onSubmit={submit}>
          {mode === "register" && (
            <label className="flex flex-col gap-1.5">
              <span className="label">Name</span>
              <input
                className="field"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="label">Email</span>
            <input
              className="field"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label">Password</span>
            <input
              className="field"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {mode === "register" && (
              <span className="text-xs text-ink-subtle">Minimum 8 characters.</span>
            )}
          </label>

          <button
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-canvas transition hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />
                Please wait
              </>
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}