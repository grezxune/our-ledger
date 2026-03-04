"use server";

import { redirect } from "next/navigation";
import { createEntity } from "@/lib/data/entities";
import { ensureUser } from "@/lib/data/users";
import { requireAuthSession } from "@/lib/auth/session";
import { parseEntityAddress } from "@/lib/data/entity-address";
import { withToast } from "@/lib/navigation/toast";

/**
 * Creates a new entity and redirects to the entity overview.
 */
export async function createEntityAction(formData: FormData): Promise<void> {
  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

  await ensureUser(email, session.user?.name);
  const address = parseEntityAddress(formData);
  const entity = await createEntity(email, {
    type: (formData.get("type") as "household" | "business") || "household",
    name: String(formData.get("name") || "").trim(),
    address,
    currency: String(formData.get("currency") || "USD").trim().toUpperCase(),
    description: String(formData.get("description") || "").trim() || undefined,
  });

  redirect(withToast(`/entity/${entity.id}`, "entity-created"));
}
