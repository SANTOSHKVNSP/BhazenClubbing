"use server";

import {
  ContentStatus,
  VenueTemplate,
  FeeType,
  RefundPolicyType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { materializeSeats } from "@/lib/seatmap/materialize";
import { refundOrder } from "@/lib/booking/refunds";
import { assertAdmin, assertSuper } from "@/lib/admin/auth";

// ---- FormData helpers ----
const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const opt = (fd: FormData, k: string) => (str(fd, k) === "" ? null : str(fd, k));
const int = (fd: FormData, k: string, def = 0) => {
  const n = parseInt(str(fd, k), 10);
  return Number.isNaN(n) ? def : n;
};
const intOrNull = (fd: FormData, k: string) => (str(fd, k) === "" ? null : int(fd, k));
const paise = (fd: FormData, k: string) => {
  const n = Math.round(parseFloat(str(fd, k)) * 100);
  return Number.isNaN(n) ? 0 : n;
};
const dateOrNull = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) return null;
  // datetime-local gives "YYYY-MM-DDTHH:mm" (no tz) — treat as UTC for a stable round-trip.
  return new Date(v.length === 16 ? `${v}:00Z` : v);
};
const json = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) return null;
  try {
    return JSON.parse(v);
  } catch {
    throw new Error(`Invalid JSON in field "${k}"`);
  }
};
const enText = (fd: FormData, k: string) => (str(fd, k) ? { en: str(fd, k) } : undefined);

// ---- City ----
export async function saveCity(fd: FormData) {
  await assertSuper();
  const id = opt(fd, "id");
  const data = {
    slug: str(fd, "slug"),
    name: str(fd, "name"),
    state: opt(fd, "state"),
    status: str(fd, "status") as ContentStatus,
    intro: enText(fd, "intro"),
  };
  if (id) await prisma.city.update({ where: { id }, data });
  else await prisma.city.create({ data });
  revalidatePath("/admin/cities");
  redirect("/admin/cities");
}
export async function deleteCity(fd: FormData) {
  await assertSuper();
  await prisma.city.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/cities");
}

// ---- Venue ----
export async function saveVenue(fd: FormData) {
  await assertSuper();
  const id = opt(fd, "id");
  const template = str(fd, "template") as VenueTemplate;
  const data = {
    name: str(fd, "name"),
    cityId: str(fd, "cityId"),
    address: opt(fd, "address"),
    template,
    capacity: int(fd, "capacity"),
    mapsEmbed: opt(fd, "mapsEmbed"),
    layoutJson: json(fd, "layoutJson") ?? { template, sections: [] },
  };
  if (id) await prisma.venue.update({ where: { id }, data });
  else await prisma.venue.create({ data });
  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}
export async function deleteVenue(fd: FormData) {
  await assertSuper();
  await prisma.venue.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/venues");
}

// ---- Band (members via JSON: [{ role, photoUrl }]) ----
type MemberInput = { role?: string; name?: string; photoUrl?: string };
export async function saveBand(fd: FormData) {
  await assertSuper();
  const id = opt(fd, "id");
  const bio = enText(fd, "bio");
  const members = json(fd, "members") as MemberInput[] | null;
  const mapMembers = (bandId: string) =>
    (members ?? []).map((m, i) => ({
      bandId,
      name: m.name ?? m.role ?? "Member",
      role: m.role ?? null,
      photoUrl: m.photoUrl ?? null,
      sortOrder: i,
    }));

  if (id) {
    await prisma.band.update({ where: { id }, data: { name: str(fd, "name"), bio } });
    if (members) {
      await prisma.bandMember.deleteMany({ where: { bandId: id } });
      await prisma.bandMember.createMany({ data: mapMembers(id) });
    }
  } else {
    const band = await prisma.band.create({ data: { name: str(fd, "name"), bio } });
    if (members) await prisma.bandMember.createMany({ data: mapMembers(band.id) });
  }
  revalidatePath("/admin/bands");
  redirect("/admin/bands");
}
export async function deleteBand(fd: FormData) {
  await assertSuper();
  await prisma.band.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/bands");
}

// ---- Event ----
export async function saveEvent(fd: FormData) {
  const staff = await assertAdmin();
  const id = opt(fd, "id");
  const cityId = str(fd, "cityId");
  if (!staff.isSuper && !staff.cityIds.includes(cityId)) throw new Error("Not authorized for this city");
  const bandIds = fd.getAll("bandIds").map(String).filter(Boolean);

  // Non-super admins cannot set status directly — they use the approval workflow.
  let status: ContentStatus;
  if (staff.isSuper) status = str(fd, "status") as ContentStatus;
  else if (id) status = (await prisma.event.findUnique({ where: { id } }))?.status ?? "draft";
  else status = "draft";

  const data = {
    slug: str(fd, "slug"),
    title: str(fd, "title"),
    cityId,
    venueId: opt(fd, "venueId"),
    status,
    description: enText(fd, "description"),
    heroMediaUrl: opt(fd, "heroMediaUrl"),
    galleryJson: json(fd, "galleryJson") ?? undefined,
    contentJson: json(fd, "contentJson") ?? undefined,
    feeType: str(fd, "feeType") as FeeType,
    feeValue: int(fd, "feeValue"),
    gstRate: int(fd, "gstRate"),
    refundPolicyType: str(fd, "refundPolicyType") as RefundPolicyType,
    refundWindowDays: intOrNull(fd, "refundWindowDays"),
    refundFeePct: intOrNull(fd, "refundFeePct"),
    onSaleAt: dateOrNull(fd, "onSaleAt"),
    doorsAt: dateOrNull(fd, "doorsAt"),
  };

  let eventId = id ?? "";
  if (id) await prisma.event.update({ where: { id }, data });
  else {
    const ev = await prisma.event.create({ data });
    eventId = ev.id;
  }
  await prisma.eventBand.deleteMany({ where: { eventId } });
  if (bandIds.length)
    await prisma.eventBand.createMany({ data: bandIds.map((bandId) => ({ eventId, bandId })) });

  revalidatePath("/admin/events");
  revalidatePath("/");
  redirect(`/admin/events/${eventId}`);
}
export async function deleteEvent(fd: FormData) {
  await prisma.event.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/events");
  redirect("/admin/events");
}
export async function setEventStatus(fd: FormData) {
  await prisma.event.update({
    where: { id: str(fd, "id") },
    data: { status: str(fd, "status") as ContentStatus },
  });
  revalidatePath("/admin/events");
  revalidatePath("/");
}

// ---- Event sub-entities ----
export async function addShowtime(fd: FormData) {
  const eventId = str(fd, "eventId");
  await prisma.showtime.create({
    data: {
      eventId,
      startsAt: new Date(str(fd, "startsAt")),
      endsAt: dateOrNull(fd, "endsAt") ?? undefined,
      status: str(fd, "status") as ContentStatus,
    },
  });
  revalidatePath(`/admin/events/${eventId}`);
}
export async function deleteShowtime(fd: FormData) {
  const eventId = str(fd, "eventId");
  await prisma.showtime.delete({ where: { id: str(fd, "id") } });
  revalidatePath(`/admin/events/${eventId}`);
}
export async function addCategory(fd: FormData) {
  const eventId = str(fd, "eventId");
  await prisma.ticketCategory.create({
    data: { eventId, name: str(fd, "name"), color: opt(fd, "color"), basePrice: paise(fd, "price") },
  });
  revalidatePath(`/admin/events/${eventId}`);
}
export async function deleteCategory(fd: FormData) {
  const eventId = str(fd, "eventId");
  await prisma.ticketCategory.delete({ where: { id: str(fd, "id") } });
  revalidatePath(`/admin/events/${eventId}`);
}
export async function addPartner(fd: FormData) {
  const eventId = str(fd, "eventId");
  await prisma.partner.create({
    data: {
      eventId,
      name: str(fd, "name"),
      logoUrl: opt(fd, "logoUrl"),
      tier: opt(fd, "tier"),
      url: opt(fd, "url"),
    },
  });
  revalidatePath(`/admin/events/${eventId}`);
}
export async function deletePartner(fd: FormData) {
  const eventId = str(fd, "eventId");
  await prisma.partner.delete({ where: { id: str(fd, "id") } });
  revalidatePath(`/admin/events/${eventId}`);
}

// Materialize seats for a showtime from the venue's seat map (ADR-002/013).
export async function generateSeats(fd: FormData) {
  const eventId = str(fd, "eventId");
  await materializeSeats(str(fd, "showtimeId"));
  revalidatePath(`/admin/events/${eventId}`);
}

// Admin refund (bypasses per-event policy; ADR-008). Scoped to the admin's city.
export async function adminRefundOrder(fd: FormData) {
  const staff = await assertAdmin();
  const id = str(fd, "id");
  if (!staff.isSuper) {
    const order = await prisma.order.findUnique({ where: { id }, include: { showtime: { include: { event: true } } } });
    if (!order || !staff.cityIds.includes(order.showtime.event.cityId)) throw new Error("Not authorized");
  }
  await refundOrder(id, { isAdmin: true, actorId: staff.userId });
  revalidatePath("/admin/orders");
}

// Approval workflow (ADR-004): draft → pending → live / rejected.
export async function submitEvent(fd: FormData) {
  const staff = await assertAdmin();
  const id = str(fd, "id");
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || (!staff.isSuper && !staff.cityIds.includes(event.cityId))) throw new Error("Not authorized");
  await prisma.event.update({ where: { id }, data: { status: "pending", submittedById: staff.userId, rejectedReason: null } });
  await prisma.auditLog.create({ data: { actorId: staff.userId, action: "submit", entity: "Event", entityId: id } });
  revalidatePath(`/admin/events/${id}`);
}
export async function approveEvent(fd: FormData) {
  const staff = await assertSuper();
  const id = str(fd, "id");
  await prisma.event.update({ where: { id }, data: { status: "live", approvedById: staff.userId, rejectedReason: null } });
  await prisma.auditLog.create({ data: { actorId: staff.userId, action: "approve", entity: "Event", entityId: id } });
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/");
}
export async function rejectEvent(fd: FormData) {
  const staff = await assertSuper();
  const id = str(fd, "id");
  const reason = str(fd, "reason") || "Rejected";
  await prisma.event.update({ where: { id }, data: { status: "draft", rejectedReason: reason } });
  await prisma.auditLog.create({ data: { actorId: staff.userId, action: "reject", entity: "Event", entityId: id, after: { reason } } });
  revalidatePath(`/admin/events/${id}`);
}
