"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { clearList, useIdList } from "@/lib/browser-store";

/** Mirrors browser-stored ids into the URL so the server can render the cards. */
export function SavedSync() {
  const router = useRouter();
  const params = useSearchParams();
  const saved = useIdList("saved");
  const recent = useIdList("recent");

  useEffect(() => {
    const want = new URLSearchParams();
    if (saved.length) want.set("saved", saved.join(","));
    if (recent.length) want.set("recent", recent.join(","));
    const current = new URLSearchParams(params.toString());
    if (want.get("saved") !== current.get("saved") || want.get("recent") !== current.get("recent")) {
      router.replace(`/saved${want.size ? `?${want}` : ""}`, { scroll: false });
    }
  }, [saved, recent, params, router]);

  return null;
}

export function ClearListButton({ list, label }: { list: "saved" | "recent"; label: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => clearList(list)}>
      {label}
    </Button>
  );
}
