import { notFound } from "next/navigation";
import { adminGetCity } from "@/lib/admin/queries";
import { saveCity } from "@/lib/admin/actions";
import { Field, SelectField, Submit, Card } from "@/components/admin/ui";

const STATUSES = ["draft", "pending", "live", "archived"];

export default async function CityForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const city = isNew ? null : await adminGetCity(id);
  if (!isNew && !city) notFound();
  const intro = (city?.intro as { en?: string } | null)?.en ?? "";

  return (
    <>
      <h1 className="font-display text-3xl font-bold">{isNew ? "New city" : `Edit ${city!.name}`}</h1>
      <Card className="mt-6 max-w-xl">
        <form action={saveCity} className="space-y-4">
          {!isNew && <input type="hidden" name="id" value={city!.id} />}
          <Field label="Name" name="name" defaultValue={city?.name} required />
          <Field label="Slug" name="slug" defaultValue={city?.slug} required hint="URL path, e.g. vizag" />
          <Field label="State" name="state" defaultValue={city?.state ?? ""} />
          <SelectField label="Status" name="status" defaultValue={city?.status ?? "draft"}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectField>
          <Field label="Intro (English)" name="intro" defaultValue={intro} />
          <Submit>{isNew ? "Create city" : "Save changes"}</Submit>
        </form>
      </Card>
    </>
  );
}
