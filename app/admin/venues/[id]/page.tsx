import { notFound } from "next/navigation";
import { adminGetVenue, optionCities } from "@/lib/admin/queries";
import { saveVenue } from "@/lib/admin/actions";
import { Field, SelectField, TextArea, Submit, Card } from "@/components/admin/ui";

export default async function VenueForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [venue, cities] = await Promise.all([isNew ? null : adminGetVenue(id), optionCities()]);
  if (!isNew && !venue) notFound();
  const layout = venue ? JSON.stringify(venue.layoutJson, null, 2) : "";

  return (
    <>
      <h1 className="font-display text-3xl font-bold">{isNew ? "New venue" : `Edit ${venue!.name}`}</h1>
      <Card className="mt-6 max-w-xl">
        <form action={saveVenue} className="space-y-4">
          {!isNew && <input type="hidden" name="id" value={venue!.id} />}
          <Field label="Name" name="name" defaultValue={venue?.name} required />
          <SelectField label="City" name="cityId" defaultValue={venue?.cityId ?? ""} required>
            <option value="" disabled>Select a city…</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
          <Field label="Address" name="address" defaultValue={venue?.address ?? ""} />
          <SelectField label="Template" name="template" defaultValue={venue?.template ?? "theatre"}>
            <option value="theatre">theatre</option>
            <option value="stadium">stadium</option>
          </SelectField>
          <Field label="Capacity" name="capacity" type="number" defaultValue={venue?.capacity ?? 0} />
          <TextArea label="Google Maps embed URL" name="mapsEmbed" rows={2} defaultValue={venue?.mapsEmbed ?? ""} />
          <TextArea label="Seat layout (JSON)" name="layoutJson" rows={4} defaultValue={layout} hint="Visual seat-map builder arrives in Phase 2; raw JSON for now." />
          <Submit>{isNew ? "Create venue" : "Save changes"}</Submit>
        </form>
      </Card>
    </>
  );
}
