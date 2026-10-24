"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import type { FormState } from "@/app/admin/actions/_shared";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";

/** Result banner for a form action. Announced to screen readers. */
export function FormResult({ state }: { state: FormState }) {
  if (state.error)
    return (
      <div role="alert">
        <Alert tone="danger">{state.error}</Alert>
      </div>
    );
  if (state.ok)
    return (
      <div role="status">
        <Alert tone="success">{state.ok}</Alert>
      </div>
    );
  return null;
}

/**
 * Warns before leaving a page with unsaved edits. Marks the form dirty on any input
 * and clean again after a successful save.
 */
export function useUnsavedGuard(formRef: React.RefObject<HTMLFormElement | null>, saved: unknown) {
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const mark = () => setDirty(true);
    form.addEventListener("input", mark);
    return () => form.removeEventListener("input", mark);
  }, [formRef]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDirty(false);
  }, [saved]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return dirty;
}

/**
 * Runs a bound server action from a button, optionally after a confirmation dialog.
 * Shows the result inline and refreshes server data.
 */
export function ActionButton({
  action,
  children,
  confirm,
  confirmLabel = "Confirm",
  variant = "secondary",
  size = "sm",
  className,
}: {
  action: () => Promise<FormState>;
  children: ReactNode;
  confirm?: { title: string; body: ReactNode };
  confirmLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<FormState>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const titleId = useId();

  const run = () =>
    start(async () => {
      const r = await action();
      setResult(r);
      router.refresh();
    });

  return (
    <span className="inline-flex flex-col gap-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        pending={pending}
        className={className}
        onClick={() => (confirm ? dialogRef.current?.showModal() : run())}
      >
        {children}
      </Button>
      {result.error ? (
        <span role="alert" className="max-w-sm text-sm font-medium text-danger">
          {result.error}
        </span>
      ) : result.ok ? (
        <span role="status" className="max-w-sm text-sm font-medium text-success">
          {result.ok}
        </span>
      ) : null}
      {confirm ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-md bg-surface p-0 text-ink shadow-(--shadow-overlay)"
        >
          <div className="p-6">
            <h2 id={titleId} className="text-h3">
              {confirm.title}
            </h2>
            <div className="mt-2 text-ink-muted">{confirm.body}</div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()} autoFocus>
                Cancel
              </Button>
              <Button
                type="button"
                variant={variant === "danger" ? "danger" : "primary"}
                onClick={() => {
                  dialogRef.current?.close();
                  run();
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </dialog>
      ) : null}
    </span>
  );
}

/**
 * Submits a form to a server action without React's automatic form reset, so a failed
 * save never wipes what the user typed. Returns [state, onSubmit, pending].
 */
export function useAdminForm(action: (prev: FormState, form: FormData) => Promise<FormState>) {
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => {
      const next = await action(state, data);
      setState(next);
      if (next.ok) router.refresh();
      if (next.error || next.fieldErrors) {
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>("[aria-invalid=true], [role=alert]")?.focus({ preventScroll: false }),
        );
      }
    });
  };
  return [state, onSubmit, pending, setState] as const;
}
