"use client";

import { useRef } from "react";
import { addLeadNote, updateEnquiry } from "@/app/admin/actions/people";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABEL, type EnquiryStatus } from "@/lib/domain";
import { FormResult, useAdminForm } from "./form-bits";

/** yyyy-mm-dd in India time, for <input type="date">. */
function toDateInput(d: Date | string | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(d));
}

export function EnquiryStatusForm({
  id,
  status,
  assignedTo,
  nextFollowUpAt,
  staff,
}: {
  id: string;
  status: EnquiryStatus;
  assignedTo: string | null;
  nextFollowUpAt: Date | string | null;
  staff: { id: string; name: string }[];
}) {
  const [state, onSubmit, pending] = useAdminForm(updateEnquiry.bind(null, id));
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field id="status" label="Status" error={e.status}>
        {(a) => (
          <Select {...a} name="status" defaultValue={status}>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ENQUIRY_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field id="assignedTo" label="Assigned to" error={e.assignedTo}>
        {(a) => (
          <Select {...a} name="assignedTo" defaultValue={assignedTo ?? ""}>
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field id="nextFollowUpAt" label="Next follow-up" optional error={e.nextFollowUpAt}>
        {(a) => <Input {...a} type="date" name="nextFollowUpAt" defaultValue={toDateInput(nextFollowUpAt)} />}
      </Field>
      <FormResult state={state} />
      <Button type="submit" pending={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

export function NoteForm({ enquiryId }: { enquiryId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, onSubmit, pending] = useAdminForm(async (prev, data) => {
    const r = await addLeadNote(enquiryId, prev, data);
    if (r.ok) formRef.current?.reset();
    return r;
  });
  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field id="body" label="Add a note" hint="Only staff can see notes." error={state.fieldErrors?.body}>
        {(a) => <Textarea {...a} name="body" rows={3} maxLength={2000} placeholder="e.g. Called, interested in a site visit on Saturday" />}
      </Field>
      <FormResult state={{ error: state.error, ok: state.ok }} />
      <div>
        <Button type="submit" variant="secondary" pending={pending}>
          Add note
        </Button>
      </div>
    </form>
  );
}
