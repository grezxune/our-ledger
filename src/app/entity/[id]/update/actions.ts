"use server";

import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/auth/session";
import { updateEntity } from "@/lib/data/entities";
import { parseEntityAddress } from "@/lib/data/entity-address";
import { withToast } from "@/lib/navigation/toast";

/**
 * Updates entity profile fields from owner form.
 */
export async function updateEntityAction(entityId: string, formData: FormData): Promise<void> {
  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

  const address = parseEntityAddress(formData);
  await updateEntity(email, entityId, {
    name: String(formData.get("name") || "").trim(),
    address,
    currency: String(formData.get("currency") || "USD").trim().toUpperCase(),
    description: String(formData.get("description") || "").trim() || undefined,
  });

  redirect(withToast(`/entity/${entityId}`, "entity-updated"));
}
