import { requireSuper } from "@/lib/admin/auth";

export default async function BandsLayout({ children }: { children: React.ReactNode }) {
  await requireSuper();
  return <>{children}</>;
}
