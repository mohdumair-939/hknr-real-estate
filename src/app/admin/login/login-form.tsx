"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";

export function LoginForm({ next, signedOut }: { next: string; signedOut: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const errs = state.fieldErrors ?? {};
  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      {signedOut && !state.error ? (
        <Alert tone="success" role="status">
          You&apos;ve been signed out.
        </Alert>
      ) : null}
      {state.error ? (
        <Alert tone="danger" role="alert">
          {state.error}
        </Alert>
      ) : null}
      <Field id="email" label="Email" error={errs.email}>
        {(a) => (
          <Input {...a} name="email" type="email" autoComplete="username" required defaultValue={state.email} autoFocus />
        )}
      </Field>
      <Field id="password" label="Password" error={errs.password}>
        {(a) => <Input {...a} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <input type="hidden" name="next" value={next} />
      <Button type="submit" size="lg" pending={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
