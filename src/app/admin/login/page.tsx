import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/site/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage(props: PageProps<"/admin/login">) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-12">
      <main className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>
        <div className="rounded-md border border-line bg-surface p-6 shadow-(--shadow-card) sm:p-8">
          <h1 className="text-h3">Sign in to manage the website</h1>
          <p className="mt-1 text-sm text-ink-muted">For HKNR staff only.</p>
          <Suspense>
            <LoginGate searchParams={props.searchParams} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Forgotten your password? Ask an administrator to reset it.
        </p>
      </main>
    </div>
  );
}

async function LoginGate({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  return <LoginForm next={next} signedOut={sp.signedOut === "1"} />;
}
