import { notFound } from "next/navigation";
import { adminGetEvent, optionCities, optionVenues, optionBands } from "@/lib/admin/queries";
import {
  saveEvent,
  addShowtime,
  deleteShowtime,
  addCategory,
  deleteCategory,
  addPartner,
  deletePartner,
} from "@/lib/admin/actions";
import { Field, TextArea, SelectField, Submit, Card } from "@/components/admin/ui";

const STATUSES = ["draft", "pending", "live", "archived"];
const toInput = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 16) : "");
const fmtDT = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(d);

export default async function EventForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [event, cities, venues, bands] = await Promise.all([
    isNew ? null : adminGetEvent(id),
    optionCities(),
    optionVenues(),
    optionBands(),
  ]);
  if (!isNew && !event) notFound();

  const selBands = new Set(event?.bands.map((b) => b.bandId) ?? []);
  const desc = (event?.description as { en?: string } | null)?.en ?? "";
  const gallery = event?.galleryJson ? JSON.stringify(event.galleryJson, null, 2) : "";
  const content = event?.contentJson ? JSON.stringify(event.contentJson, null, 2) : "";

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{isNew ? "New event" : `Edit ${event!.title}`}</h1>
        {!isNew && event!.status === "live" && (
          <a href={`/e/${event!.slug}`} target="_blank" className="text-sm font-bold text-orange-2 hover:underline">
            View public page ↗
          </a>
        )}
      </div>

      {/* Core form */}
      <Card className="mt-6 max-w-3xl">
        <form action={saveEvent} className="grid gap-4 sm:grid-cols-2">
          {!isNew && <input type="hidden" name="id" value={event!.id} />}
          <Field label="Title" name="title" defaultValue={event?.title} required />
          <Field label="Slug" name="slug" defaultValue={event?.slug} required hint="e.g. bhazen-clubbing" />
          <SelectField label="City" name="cityId" defaultValue={event?.cityId ?? ""} required>
            <option value="" disabled>Select…</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
          <SelectField label="Venue" name="venueId" defaultValue={event?.venueId ?? ""}>
            <option value="">— none —</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </SelectField>
          <SelectField label="Status" name="status" defaultValue={event?.status ?? "draft"}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectField>
          <Field label="Hero image URL" name="heroMediaUrl" defaultValue={event?.heroMediaUrl ?? ""} />
          <Field label="On-sale at (UTC)" name="onSaleAt" type="datetime-local" defaultValue={toInput(event?.onSaleAt)} />
          <Field label="Doors at (UTC)" name="doorsAt" type="datetime-local" defaultValue={toInput(event?.doorsAt)} />
          <SelectField label="Fee type" name="feeType" defaultValue={event?.feeType ?? "none"}>
            <option value="none">none</option><option value="flat">flat</option><option value="percent">percent</option>
          </SelectField>
          <Field label="Fee value" name="feeValue" type="number" defaultValue={event?.feeValue ?? 0} hint="paise (flat) or percent×100" />
          <Field label="GST rate" name="gstRate" type="number" defaultValue={event?.gstRate ?? 0} hint="percent×100 (1800 = 18%)" />
          <SelectField label="Refund policy" name="refundPolicyType" defaultValue={event?.refundPolicyType ?? "none"}>
            <option value="none">none</option><option value="self_service">self_service</option><option value="admin_only">admin_only</option>
          </SelectField>
          <Field label="Refund window (days)" name="refundWindowDays" type="number" defaultValue={event?.refundWindowDays ?? ""} />
          <Field label="Refund fee (percent×100)" name="refundFeePct" type="number" defaultValue={event?.refundFeePct ?? ""} />

          <div className="sm:col-span-2">
            <span className="text-sm font-semibold text-ink">Bands</span>
            <div className="mt-1 flex flex-wrap gap-3">
              {bands.length === 0 && <span className="text-xs text-muted">No bands yet — add one under Bands.</span>}
              {bands.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="bandIds" value={b.id} defaultChecked={selBands.has(b.id)} /> {b.name}
                </label>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2"><TextArea label="Description (English)" name="description" rows={3} defaultValue={desc} /></div>
          <div className="sm:col-span-2"><TextArea label="Gallery (JSON array of image URLs)" name="galleryJson" rows={4} defaultValue={gallery} /></div>
          <div className="sm:col-span-2"><TextArea label="Content (JSON: hero logos, features, stats, faqs, contact, trustUrl)" name="contentJson" rows={8} defaultValue={content} /></div>

          <div className="sm:col-span-2"><Submit>{isNew ? "Create event" : "Save changes"}</Submit></div>
        </form>
      </Card>

      {!isNew && (
        <div className="mt-6 grid max-w-3xl gap-6">
          {/* Showtimes */}
          <Card>
            <h2 className="font-display text-xl font-bold">Showtimes</h2>
            <ul className="mt-3 divide-y divide-black/5 text-sm">
              {event!.showtimes.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span>{fmtDT(s.startsAt)} <span className="text-muted">· {s.status}</span></span>
                  <form action={deleteShowtime}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="eventId" value={event!.id} /><button className="text-xs text-red-600 hover:underline">Remove</button></form>
                </li>
              ))}
              {event!.showtimes.length === 0 && <li className="py-2 text-muted">No showtimes.</li>}
            </ul>
            <form action={addShowtime} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="eventId" value={event!.id} />
              <Field label="Starts at (UTC)" name="startsAt" type="datetime-local" required />
              <SelectField label="Status" name="status" defaultValue="live">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</SelectField>
              <Submit>Add showtime</Submit>
            </form>
          </Card>

          {/* Categories */}
          <Card>
            <h2 className="font-display text-xl font-bold">Ticket categories</h2>
            <ul className="mt-3 divide-y divide-black/5 text-sm">
              {event!.categories.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <span><span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: c.color ?? "#999" }} />{c.name} — ₹{(c.basePrice / 100).toLocaleString("en-IN")}</span>
                  <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="eventId" value={event!.id} /><button className="text-xs text-red-600 hover:underline">Remove</button></form>
                </li>
              ))}
              {event!.categories.length === 0 && <li className="py-2 text-muted">No categories.</li>}
            </ul>
            <form action={addCategory} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="eventId" value={event!.id} />
              <Field label="Name" name="name" required />
              <Field label="Color" name="color" defaultValue="#ff8c00" />
              <Field label="Price (₹)" name="price" type="number" required />
              <Submit>Add category</Submit>
            </form>
          </Card>

          {/* Partners */}
          <Card>
            <h2 className="font-display text-xl font-bold">Partners</h2>
            <ul className="mt-3 divide-y divide-black/5 text-sm">
              {event!.partners.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span>{p.name} {p.tier && <span className="text-muted">· {p.tier}</span>}</span>
                  <form action={deletePartner}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="eventId" value={event!.id} /><button className="text-xs text-red-600 hover:underline">Remove</button></form>
                </li>
              ))}
              {event!.partners.length === 0 && <li className="py-2 text-muted">No partners.</li>}
            </ul>
            <form action={addPartner} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="eventId" value={event!.id} />
              <Field label="Name" name="name" required />
              <Field label="Tier" name="tier" />
              <Field label="Logo URL" name="logoUrl" />
              <Field label="Website" name="url" />
              <Submit>Add partner</Submit>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
