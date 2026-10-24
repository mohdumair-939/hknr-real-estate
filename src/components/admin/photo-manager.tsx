"use client";

import { ArrowDown, ArrowUp, Star, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deletePhoto, movePhoto, updatePhotoDetails } from "@/app/admin/actions/properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/feedback";
import { ActionButton, FormResult, useAdminForm } from "./form-bits";

export type AdminPhoto = { id: string; thumb: string; altText: string; caption: string | null; width: number; height: number };

type UploadItem = { key: string; name: string; progress: number; status: "queued" | "uploading" | "done" | "error"; error?: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX = 15 * 1024 * 1024;

function uploadOne(owner: string, id: string | null, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.set("owner", owner);
    if (id) body.set("id", id);
    body.set("file", file);
    xhr.open("POST", "/admin/api/media");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = "Upload failed.";
      try {
        msg = (JSON.parse(xhr.responseText) as { error?: string }).error ?? msg;
      } catch {}
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Network error. Check your connection and try again."));
    xhr.send(body);
  });
}

/** Multi-file uploader with per-file progress. Files go up one at a time. */
export function Uploader({ owner, id, multiple = true, label = "Upload photos" }: { owner: "property" | "project" | "hero"; id: string | null; multiple?: boolean; label?: string }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const update = (key: string, patch: Partial<UploadItem>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    const queue = Array.from(files).map((f) => ({ file: f, key: `${f.name}-${f.size}-${Math.random()}` }));
    setItems(queue.map((q) => ({ key: q.key, name: q.file.name, progress: 0, status: "queued" })));
    setBusy(true);
    for (const q of queue) {
      if (q.file.size > MAX) {
        update(q.key, { status: "error", error: "Larger than 15 MB. Export a smaller copy." });
        continue;
      }
      update(q.key, { status: "uploading" });
      try {
        await uploadOne(owner, id, q.file, (p) => update(q.key, { progress: p }));
        update(q.key, { status: "done", progress: 100 });
        router.refresh();
      } catch (err) {
        update(q.key, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const failed = items.filter((i) => i.status === "error").length;

  return (
    <div>
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-line-strong/60 bg-canvas px-4 py-8 text-center hover:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy) handle(e.dataTransfer.files);
        }}
      >
        <Upload className="size-6 text-bronze-ink" aria-hidden="true" />
        <span className="font-semibold">{busy ? "Uploading…" : label}</span>
        <span className="text-sm text-ink-muted">JPEG, PNG, WebP or AVIF · up to 15 MB each · at least 400 px. Location data in photos is removed.</span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          disabled={busy}
          className="sr-only"
          onChange={(e) => handle(e.target.files)}
        />
      </label>
      {items.length ? (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {items.map((i) => (
            <li key={i.key} className="text-sm">
              <div className="flex justify-between gap-3">
                <span className="truncate">{i.name}</span>
                <span className={i.status === "error" ? "text-danger" : i.status === "done" ? "text-success" : "text-ink-muted"}>
                  {i.status === "uploading" ? `${i.progress}%` : i.status === "done" ? "Uploaded" : i.status === "error" ? "Failed" : "Waiting"}
                </span>
              </div>
              {i.status === "uploading" || i.status === "done" ? (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={i.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${i.name}`}>
                  <div className="h-full bg-charcoal transition-[width]" style={{ width: `${i.progress}%` }} />
                </div>
              ) : null}
              {i.error ? <p className="mt-0.5 text-danger">{i.error}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {failed && !busy ? (
        <Alert tone="danger" className="mt-3">
          {failed} {failed === 1 ? "photo" : "photos"} didn&apos;t upload. Fix the problem shown and choose {failed === 1 ? "it" : "them"} again.
        </Alert>
      ) : null}
    </div>
  );
}

function PhotoRow({ photo, index, total }: { photo: AdminPhoto; index: number; total: number }) {
  const [state, onSubmit, pending] = useAdminForm(updatePhotoDetails.bind(null, photo.id));
  return (
    <li className="grid gap-4 rounded-md border border-line bg-surface p-3 sm:grid-cols-[9rem_1fr]">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of a pre-generated variant */}
        <img src={photo.thumb} alt="" width={photo.width} height={photo.height} className="aspect-[4/3] w-full rounded-sm object-cover" />
        {index === 0 ? (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-xs bg-charcoal px-1.5 py-0.5 text-xs font-semibold text-ivory">
            <Star className="size-3" aria-hidden="true" /> Cover
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <label htmlFor={`alt-${photo.id}`} className="text-sm font-semibold">
            Photo {index + 1}: description for screen readers
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`alt-${photo.id}`}
              name="altText"
              defaultValue={photo.altText}
              maxLength={200}
              placeholder="e.g. Front elevation from the street"
            />
            <Button type="submit" variant="secondary" pending={pending}>
              Save
            </Button>
          </div>
          {!photo.altText ? <p className="text-sm text-warning">Add a short description of what the photo shows.</p> : null}
          <FormResult state={state} />
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {index > 0 ? (
            <ActionButton action={() => movePhoto(photo.id, -1)} variant="ghost">
              <ArrowUp aria-hidden="true" /> {index === 1 ? "Make cover" : "Move up"}
              <span className="sr-only"> photo {index + 1}</span>
            </ActionButton>
          ) : null}
          {index < total - 1 ? (
            <ActionButton action={() => movePhoto(photo.id, 1)} variant="ghost">
              <ArrowDown aria-hidden="true" /> Move down<span className="sr-only"> photo {index + 1}</span>
            </ActionButton>
          ) : null}
          <ActionButton
            action={() => deletePhoto(photo.id)}
            variant="danger"
            confirm={{ title: "Delete this photo?", body: "It will be removed from the website and can't be recovered." }}
            confirmLabel="Delete photo"
          >
            <Trash2 aria-hidden="true" /> Delete<span className="sr-only"> photo {index + 1}</span>
          </ActionButton>
        </div>
      </div>
    </li>
  );
}

export function PhotoManager({ owner, ownerId, photos }: { owner: "property" | "project"; ownerId: string; photos: AdminPhoto[] }) {
  return (
    <div className="flex flex-col gap-5">
      <Uploader owner={owner} id={ownerId} />
      {photos.length ? (
        <ol className="flex flex-col gap-3">
          {photos.map((p, i) => (
            <PhotoRow key={p.id} photo={p} index={i} total={photos.length} />
          ))}
        </ol>
      ) : (
        <p className="text-sm text-ink-muted">No photos yet. The first photo becomes the cover image on listing cards.</p>
      )}
    </div>
  );
}
