import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
 * Form primitives. Each control is labelled, wires hints and errors through
 * aria-describedby, and sets aria-invalid so assistive tech announces problems.
 */

const control =
  "block w-full rounded-md border border-line-strong bg-surface px-3.5 text-base text-ink placeholder:text-ink-muted/80 transition-colors hover:border-ink focus-visible:border-ink aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-soft/40 disabled:bg-sunken disabled:text-ink-muted";

type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (a11y: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
};

export function Field({ id, label, hint, error, optional, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-ink-muted">(optional)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? <FieldError id={errorId!}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-medium text-danger">
      <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 size-4 shrink-0" fill="currentColor">
        <path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-.9 4.25h1.8v5.5H9.1v-5.5Zm.9 9a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input {...rest} className={cn(control, "min-h-11 py-2", className)} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea {...rest} className={cn(control, "min-h-28 py-2.5 leading-relaxed", className)} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...rest} className={cn(control, "min-h-11 appearance-none py-2 pr-10", className)}>
        {children}
      </select>
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
        fill="currentColor"
      >
        <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
      </svg>
    </div>
  );
}

export function Checkbox({
  id,
  label,
  hint,
  error,
  className,
  ...rest
}: Omit<ComponentProps<"input">, "type"> & { id: string; label: ReactNode; hint?: ReactNode; error?: string }) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-start gap-3">
        <input
          {...rest}
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className="mt-0.5 size-5 shrink-0 rounded-xs border-line-strong accent-charcoal"
        />
        <label htmlFor={id} className="text-sm leading-snug text-ink">
          {label}
          {hint ? (
            <span id={hintId} className="mt-0.5 block text-ink-muted">
              {hint}
            </span>
          ) : null}
        </label>
      </div>
      {error ? <FieldError id={errorId!}>{error}</FieldError> : null}
    </div>
  );
}
