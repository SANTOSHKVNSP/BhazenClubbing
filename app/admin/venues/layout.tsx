import { requireSuper } from "@/lib/admin/auth";

export default async function VenuesLayout({ children }: { children: React.ReactNode }) {
  await requireSuper();
  return <>{children}</>;
}
