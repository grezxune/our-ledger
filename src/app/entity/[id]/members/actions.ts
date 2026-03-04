"use server";

import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/auth/session";
import { getEntityForUser } from "@/lib/data/entities";
import { createInvitation, revokeInvitation } from "@/lib/data/invitations";
import { withToast } from "@/lib/navigation/toast";

/**
 * Creates owner-issued entity invitations.
 */
export async function createInvitationAction(entityId: string, formData: FormData): Promise<void> {
  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

  await createInvitation(
    email,
    entityId,
    String(formData.get("email") || "").trim().toLowerCase(),
    (formData.get("role") as "owner" | "user") || "user",
  );

  redirect(withToast(`/entity/${entityId}/members`, "invitation-created"));
}

/**
 * Revokes a pending invitation.
 */
export async function revokeInvitationAction(entityId: string, invitationId: string): Promise<void> {
  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

  await getEntityForUser(email, entityId);
  await revokeInvitation(email, invitationId);
  redirect(withToast(`/entity/${entityId}/members`, "invitation-revoked"));
}
