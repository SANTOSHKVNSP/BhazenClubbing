import { notFound } from "next/navigation";
import { adminGetBand } from "@/lib/admin/queries";
import { saveBand } from "@/lib/admin/actions";
import { Field, TextArea, Submit, Card } from "@/components/admin/ui";

export default async function BandForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const band = isNew ? null : await adminGetBand(id);
  if (!isNew && !band) notFound();
  const bio = (band?.bio as { en?: string } | null)?.en ?? "";
  const members = band
    ? JSON.stringify(band.members.map((m) => ({ role: m.role ?? m.name, photoUrl: m.photoUrl })), null, 2)
    : '[\n  { "role": "Lead Vocalist", "photoUrl": "/images/..." }\n]';

  return (
    <>
      <h1 className="font-display text-3xl font-bold">{isNew ? "New band" : `Edit ${band!.name}`}</h1>
      <Card className="mt-6 max-w-xl">
        <form action={saveBand} className="space-y-4">
          {!isNew && <input type="hidden" name="id" value={band!.id} />}
          <Field label="Name" name="name" defaultValue={band?.name} required />
          <TextArea label="Bio (English)" name="bio" rows={3} defaultValue={bio} />
          <TextArea label="Members (JSON array of { role, photoUrl })" name="members" rows={8} defaultValue={members} hint="Replaces all members on save." />
          <Submit>{isNew ? "Create band" : "Save changes"}</Submit>
        </form>
      </Card>
    </>
  );
}
