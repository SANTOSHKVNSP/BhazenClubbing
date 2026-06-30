import { requireSuper } from "@/lib/admin/auth";

export default async function CitiesLayout({ children }: { children: React.ReactNode }) {
  await requireSuper();
  return <>{children}</>;
}
