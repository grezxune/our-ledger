"use server";

import { redirect } from "next/navigation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { setupStorageInfrastructure } from "@/lib/aws/storage-admin";
import { upsertStorageConfiguration } from "@/lib/data/storage-config";
import { withToast } from "@/lib/navigation/toast";

/**
 * Validates AWS credentials and stores non-secret storage configuration.
 */
export async function configureStorageAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdminSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

  try {
    const result = await setupStorageInfrastructure({
      credentials: {
        accessKeyId: String(formData.get("accessKeyId") || "").trim(),
        secretAccessKey: String(formData.get("secretAccessKey") || "").trim(),
        sessionToken: String(formData.get("sessionToken") || "").trim() || undefined,
      },
      region: String(formData.get("region") || "").trim(),
      bucket: String(formData.get("bucket") || "").trim(),
      cloudFrontDistributionId:
        String(formData.get("cloudFrontDistributionId") || "").trim() || undefined,
      createBucketIfMissing: formData.get("createBucketIfMissing") === "on",
    });

    await upsertStorageConfiguration(email, {
      bucket: String(formData.get("bucket") || "").trim(),
      region: String(formData.get("region") || "").trim(),
      cloudFrontDistributionId:
        String(formData.get("cloudFrontDistributionId") || "").trim() || undefined,
      cloudFrontDomain:
        String(formData.get("cloudFrontDomain") || "").trim() || result.distributionDomain || undefined,
    });

    redirect(withToast(`/admin/storage?status=ok&account=${encodeURIComponent(result.accountId)}`, "storage-configured"));
  } catch {
    redirect("/admin/storage?status=error");
  }
}
