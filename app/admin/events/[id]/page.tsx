import { notFound, redirect } from "next/navigation";
import { adminGetEvent, optionCities, optionVenues, optionBands } from "@/lib/admin/queries";
import {
  saveEvent,
  addShowtime,
  deleteShowtime,
  addCategory,
  deleteCategory,
  addPartner,
  deletePartner,
  generateSeats,
  submitEvent,
  approveEvent,
  rejectEvent,
  addPromo,
  deletePromo,
  issueComp,
} from "@/lib/admin/actions";
import { requireAdmin, canEditCity } from "@/lib/admin/auth";
import { Field, TextArea, SelectField, Submit, Card } from "@/components/admin/ui";

const STATUSES = ["draft", "pending", "live", "archived"];
const toInput = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 16) : "");
const fmtDT = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(d);

export default async function EventForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const staff = await requireAdmin();
  const [event, cities, venues, bands] = await Promise.all([
    isNew ? null : adminGetEvent(id),
    optionCities(),
    optionVenues(),
    optionBands(),
  ]);
  if (!isNew && !event) notFound();
  if (event && !canEditCity(staff, event.cityId)) redirect("/admin/events");
  const visibleCities = staff.isSuper ? cities : cities.filter((c) => staff.cityIds.includes(c.id));

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

      {!isNew && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
          <span className="text-sm">Status: <b>{event!.status}</b></span>
          {event!.rejectedReason && <span className="text-sm text-red-600">Rejected: {event!.rejectedReason}</span>}
          {!staff.isSuper && event!.status === "draft" && (
            <form action={submitEvent}><input type="hidden" name="id" value={event!.id} /><button className="rounded-full bg-gradient-to-br from-orange to-orange-2 px-4 py-1.5 text-sm font-bold text-white">Submit for review</button></form>
          )}
          {staff.isSuper && event!.status === "pending" && (
            <>
              <form action={approveEvent}><input type="hidden" name="id" value={event!.id} /><button className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-bold text-white">Approve &amp; publish</button></form>
              <form action={rejectEvent} className="flex items-center gap-2"><input type="hidden" name="id" value={event!.id} /><input name="reason" placeholder="reason" className="rounded-lg border border-black/15 px-2 py-1 text-sm" /><button className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-bold text-white">Reject</button></form>
            </>
          )}
        </div>
      )}

      {/* Core form */}
      <Card className="mt-6 max-w-3xl">
        <form action={saveEvent} className="grid gap-4 sm:grid-cols-2">
          {!isNew && <input type="hidden" name="id" value={event!.id} />}
          <Field label="Title" name="title" defaultValue={event?.title} required />
          <Field label="Slug" name="slug" defaultValue={event?.slug} required hint="e.g. bhazen-clubbing" />
          <SelectField label="City" name="cityId" defaultValue={event?.cityId ?? visibleCities[0]?.id ?? ""} required>
            <option value="" disabled>Select…</option>
            {visibleCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
          <SelectField label="Venue" name="venueId" defaultValue={event?.venueId ?? ""}>
            <option value="">— none —</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </SelectField>
          {staff.isSuper ? (
            <SelectField label="Status" name="status" defaultValue={event?.status ?? "draft"}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectField>
          ) : (
            <label className="block">
              <span className="text-sm font-semibold text-ink">Status</span>
              <p className="mt-1 rounded-lg bg-black/5 px-3 py-2 text-sm">{event?.status ?? "draft"} <span className="text-muted">· managed via review</span></p>
            </label>
          )}
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
                  <span>{fmtDT(s.startsAt)} <span className="text-muted">· {s.status} · {s._count.seats} seats</span></span>
                  <span className="flex items-center gap-3">
                    <form action={generateSeats}><input type="hidden" name="showtimeId" value={s.id} /><input type="hidden" name="eventId" value={event!.id} /><button className="text-xs text-orange-2 hover:underline">Generate seats</button></form>
                    <form action={deleteShowtime}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="eventId" value={event!.id} /><button className="text-xs text-red-600 hover:underline">Remove</button></form>
                  </span>
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
                  <span><span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: c.color ?? "#999" }} />{c.name} — ₹{(c.basePrice / 100).toLocaleString("en-IN")} <span className="text-muted">· {c.admission}{c.admission === "general" && c.capacity != null ? ` (cap ${c.capacity})` : ""}</span></span>
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
              <SelectField label="Admission" name="admission" defaultValue="reserved"><option value="reserved">reserved (seats)</option><option value="general">general (GA)</option></SelectField>
              <Field label="GA capacity" name="capacity" type="number" />
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

          {/* Promo codes */}
          <Card>
            <h2 className="font-display text-xl font-bold">Promo codes</h2>
            <ul className="mt-3 divide-y divide-black/5 text-sm">
              {event!.promos.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span><b>{p.code}</b> · {p.type === "percent" ? `${p.value / 100}%` : `₹${p.value / 100}`}{p.maxUses != null && <span className="text-muted"> · {p.usedCount}/{p.maxUses} used</span>}</span>
                  <form action={deletePromo}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="eventId" value={event!.id} /><button className="text-xs text-red-600 hover:underline">Remove</button></form>
                </li>
              ))}
              {event!.promos.length === 0 && <li className="py-2 text-muted">No promo codes.</li>}
            </ul>
            <form action={addPromo} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="eventId" value={event!.id} />
              <Field label="Code" name="code" required />
              <SelectField label="Type" name="type" defaultValue="percent"><option value="percent">percent (%)</option><option value="flat">flat (₹)</option></SelectField>
              <Field label="Value" name="value" required />
              <Field label="Max uses" name="maxUses" />
              <Submit>Add promo</Submit>
            </form>
          </Card>

          {/* Comps / guest list */}
          <Card>
            <h2 className="font-display text-xl font-bold">Comps / guest list</h2>
            <ul className="mt-3 divide-y divide-black/5 text-sm">
              {event!.comps.map((c) => (
                <li key={c.id} className="py-2">{c.name}{c.phone && <span className="text-muted"> · {c.phone}</span>} · {c.qty} ticket(s)</li>
              ))}
              {event!.comps.length === 0 && <li className="py-2 text-muted">No comps issued.</li>}
            </ul>
            <form action={issueComp} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="eventId" value={event!.id} />
              <Field label="Guest name" name="name" required />
              <Field label="Phone (+91…)" name="phone" required />
              <Field label="Qty" name="qty" defaultValue="1" />
              <Submit>Issue comps</Submit>
            </form>
            <p className="mt-2 text-xs text-muted">Auto-assigns available seats, blocks them, and issues signed QR tickets. The guest logs in with their phone to view.</p>
          </Card>
        </div>
      )}
    </>
  );
}
