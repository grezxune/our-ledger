import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { PrimaryHeader } from "@/components/layout/primary-header";
import { ToastCenter } from "@/components/ui/toast-center";

interface AppShellProps {
  session: Session | null;
  children: ReactNode;
}

/**
 * App shell with responsive navigation and role-aware links.
 */
export function AppShell({ session, children }: AppShellProps) {
  const isAuthenticated = Boolean(session?.user?.email);
  const isSuperAdmin = session?.user?.platformRole === "super_admin";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
      <ToastCenter />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PrimaryHeader
          email={session?.user?.email}
          image={session?.user?.image}
          isAuthenticated={isAuthenticated}
          isSuperAdmin={isSuperAdmin}
          name={session?.user?.name}
        />
        {children}
      </div>
    </main>
  );
}
