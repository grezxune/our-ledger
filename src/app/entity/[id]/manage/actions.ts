"use server";

import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/auth/session";
import { uploadDocument } from "@/lib/data/documents";
import { withToast } from "@/lib/navigation/toast";

/**
 * Uploads and stores entity document metadata.
 */
export async function uploadDocumentAction(entityId: string, formData: FormData): Promise<void> {
  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A file is required.");
  }

  await uploadDocument(email, entityId, {
    file,
    sourceTransactionId: String(formData.get("sourceTransactionId") || "").trim() || undefined,
  });

  redirect(withToast(`/entity/${entityId}/manage`, "document-uploaded"));
}
