import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { PROPERTY_TYPE_LABEL } from "@/lib/domain";
import { BUDGET_STEPS } from "@/lib/filters";
import { formatInrCompact } from "@/lib/format";
import type { Facets } from "@/lib/queries/public";

/**
 * Home-page search. A plain GET form, so it works before JavaScript loads.
 * Options come from published listings, so every choice can return results.
 */
export function QuickSearch({ facets }: { facets: Facets }) {
  return (
    <form
      action="/properties"
      method="get"
      role="search"
      aria-label="Search properties"
      className="grid gap-3 rounded-md border border-line bg-surface p-4 shadow-(--shadow-raised) sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end lg:p-5"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="qs-type" className="text-sm font-semibold">
          Property type
        </label>
        <Select id="qs-type" name="type" defaultValue="">
          <option value="">Any type</option>
          {facets.types.map((t) => (
            <option key={t.value} value={t.value}>
              {PROPERTY_TYPE_LABEL[t.value]} ({t.count})
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="qs-locality" className="text-sm font-semibold">
          Locality
        </label>
        <Select id="qs-locality" name="locality" defaultValue="">
          <option value="">Any locality</option>
          {facets.localities.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name} ({l.count})
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
        <label htmlFor="qs-max" className="text-sm font-semibold">
          Maximum budget
        </label>
        <Select id="qs-max" name="max" defaultValue="">
          <option value="">No limit</option>
          {BUDGET_STEPS.map((b) => (
            <option key={b} value={b}>
              Up to {formatInrCompact(b)}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="lg" className="sm:col-span-2 lg:col-span-1">
        <Search aria-hidden="true" /> Search
      </Button>
    </form>
  );
}
