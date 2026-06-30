import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// Admin RBAC (ADR-004). Roles come from StaffMembership; sessions from Auth.js.
export type Staff = {
  userId: string;
  phone?: string;
  isSuper: boolean;
  cityIds: string[];
  isStaff: boolean;
};

export async function getStaff(): Promise<Staff | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const memberships = await prisma.staffMembership.findMany({ where: { userId: session.user.id } });
  const isSuper = memberships.some((m) => m.role === "super_admin");
  const cityIds = memberships.filter((m) => m.role === "city_admin" && m.cityId).map((m) => m.cityId as string);
  return { userId: session.user.id, phone: session.user.phone, isSuper, cityIds, isStaff: isSuper || cityIds.length > 0 };
}

// Page guards (redirect). For server actions use assertAdmin/assertSuper (throw).
export async function requireAdmin(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/login?callbackUrl=/admin");
  if (!staff.isStaff) redirect("/admin"); // layout renders the denied screen
  return staff;
}
export async function requireSuper(): Promise<Staff> {
  const staff = await requireAdmin();
  if (!staff.isSuper) redirect("/admin");
  return staff;
}

export async function assertAdmin(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff?.isStaff) throw new Error("Not authorized");
  return staff;
}
export async function assertSuper(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff?.isSuper) throw new Error("Not authorized");
  return staff;
}
export function canEditCity(staff: Staff, cityId: string) {
  return staff.isSuper || staff.cityIds.includes(cityId);
}
