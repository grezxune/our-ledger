const TOAST_QUERY_KEY = "toast";

const TOAST_MESSAGES = {
  "entity-created": "Entity created.",
  "entity-updated": "Entity updated.",
  "budget-created": "Budget created.",
  "income-source-added": "Income source added.",
  "income-source-updated": "Income source updated.",
  "income-source-removed": "Income source removed.",
  "recurring-expense-added": "Recurring expense added.",
  "recurring-expense-updated": "Recurring expense updated.",
  "recurring-expense-removed": "Recurring expense removed.",
  "transaction-created": "Transaction saved.",
  "document-uploaded": "Document uploaded.",
  "invitation-created": "Invitation sent.",
  "invitation-revoked": "Invitation revoked.",
  "invitation-accepted": "Invitation accepted.",
  "storage-configured": "Storage configuration validated.",
} as const;

export type ToastKey = keyof typeof TOAST_MESSAGES;

/**
 * Returns the user-facing message for a toast key.
 */
export function getToastMessage(toast: string | null): string | null {
  if (!toast) {
    return null;
  }
  return TOAST_MESSAGES[toast as ToastKey] || null;
}

/**
 * Appends toast query metadata to a redirect destination.
 */
export function withToast(path: string, toast: ToastKey): string {
  const [pathWithoutHash, hash = ""] = path.split("#", 2);
  const [pathname, query = ""] = pathWithoutHash.split("?", 2);
  const params = new URLSearchParams(query);
  params.set(TOAST_QUERY_KEY, toast);
  const search = params.toString();
  const hashSuffix = hash ? `#${hash}` : "";

  return search ? `${pathname}?${search}${hashSuffix}` : `${pathname}${hashSuffix}`;
}

export { TOAST_QUERY_KEY };
