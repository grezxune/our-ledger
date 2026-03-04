"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOAST_QUERY_KEY, getToastMessage } from "@/lib/navigation/toast";

/**
 * Global query-driven toast viewport rendered once inside the app shell.
 */
export function ToastCenter() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const toastMessage = getToastMessage(searchParams.get(TOAST_QUERY_KEY));

  const dismissToast = useCallback(() => {
    if (!toastMessage) {
      return;
    }

    const nextParams = new URLSearchParams(search);
    nextParams.delete(TOAST_QUERY_KEY);
    const nextSearch = nextParams.toString();
    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false });
  }, [pathname, router, search, toastMessage]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => dismissToast(), 3400);
    return () => window.clearTimeout(timeoutId);
  }, [dismissToast, toastMessage]);

  if (!toastMessage) {
    return null;
  }

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border border-line/80 bg-surface/95 px-4 py-3 text-sm text-foreground shadow-[0_16px_38px_-26px_color-mix(in_oklab,var(--foreground)_60%,transparent)] backdrop-blur-sm"
        role="status"
      >
        <CheckCircle2 aria-hidden className="size-5 shrink-0 text-accent" />
        <p className="flex-1 font-medium">{toastMessage}</p>
        <Button
          ariaLabel="Dismiss notification"
          className="text-foreground/65 hover:text-foreground"
          iconOnly
          type="button"
          unstyled
          onClick={dismissToast}
        >
          <X aria-hidden className="size-4" />
        </Button>
      </div>
    </div>
  );
}
