"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  CalendarRange,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { MembershipRole } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { TabNav } from "@/components/ui/tab-nav";
import { Tooltip } from "@/components/ui/tooltip";
import { shouldCollapseEntityTabs } from "@/components/entity/entity-nav.utils";

interface EntityNavProps {
  entityId: string;
  role: MembershipRole;
}

interface NavLinkItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: "exact" | "prefix";
}

function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function isActiveRoute(pathname: string, link: NavLinkItem): boolean {
  const currentPath = normalizePath(pathname);
  const href = normalizePath(link.href);
  return currentPath === href || (link.match === "prefix" && currentPath.startsWith(`${href}/`));
}

/**
 * Entity-scoped navigation with desktop tabs and mobile slide-over menu.
 */
export function EntityNav({ entityId, role }: EntityNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopTabsCollapsed, setIsDesktopTabsCollapsed] = useState(false);
  const desktopTabContainerRef = useRef<HTMLDivElement>(null);
  const desktopTabNavRef = useRef<HTMLElement>(null);
  const links = useMemo<NavLinkItem[]>(() => {
    const base: NavLinkItem[] = [
      { href: `/entity/${entityId}`, label: "Overview", icon: LayoutDashboard, match: "exact" },
      { href: `/entity/${entityId}/snapshot`, label: "Snapshots", icon: CalendarRange, match: "prefix" },
      { href: `/entity/${entityId}/budget`, label: "Budget", icon: Wallet, match: "prefix" },
      { href: `/entity/${entityId}/transactions`, label: "Transactions", icon: ReceiptText, match: "prefix" },
      { href: `/entity/${entityId}/members`, label: "Members", icon: Users, match: "prefix" },
      { href: `/entity/${entityId}/manage`, label: "Manage", icon: Settings, match: "prefix" },
    ];

    if (role === "owner") {
      base.push({ href: `/entity/${entityId}/update`, label: "Settings", icon: Settings, match: "prefix" });
    }

    return base;
  }, [entityId, role]);
  const activeLink = links.find((link) => isActiveRoute(pathname, link)) || links[0];
  const tabItems = links.map((link) => ({
    href: link.href,
    label: link.label,
    icon: link.icon,
    ariaLabel: `Open ${link.label.toLowerCase()} section`,
    isActive: isActiveRoute(pathname, link),
  }));

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    function syncDesktopTabCollapse() {
      const container = desktopTabContainerRef.current;
      const nav = desktopTabNavRef.current;
      if (!container || !nav) return;

      setIsDesktopTabsCollapsed(
        shouldCollapseEntityTabs(window.innerWidth, nav.scrollWidth, container.clientWidth),
      );
    }

    syncDesktopTabCollapse();
    const resizeObserver = new ResizeObserver(syncDesktopTabCollapse);
    const container = desktopTabContainerRef.current;
    const nav = desktopTabNavRef.current;
    if (container) resizeObserver.observe(container);
    if (nav) resizeObserver.observe(nav);
    window.addEventListener("resize", syncDesktopTabCollapse);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncDesktopTabCollapse);
    };
  }, [tabItems]);

  return (
    <>
      <div className="relative hidden lg:block lg:w-full" ref={desktopTabContainerRef}>
        <TabNav
          ariaLabel="Entity sections"
          className={
            isDesktopTabsCollapsed ? "pointer-events-none invisible absolute left-0 top-0" : "inline-flex"
          }
          items={tabItems}
          navRef={desktopTabNavRef}
        />
      </div>

      <div className={isDesktopTabsCollapsed ? "" : "lg:hidden"}>
        <Tooltip content="Open entity section menu">
          <Button
            aria-controls="entity-mobile-nav"
            aria-expanded={isMobileMenuOpen}
            aria-label="Open entity section menu"
            className="inline-flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-sm"
            onClick={() => setIsMobileMenuOpen(true)}
            type="button"
          >
            <span className="inline-flex items-center gap-2 text-foreground/85">
              <Menu aria-hidden className="size-4" />
              Section
            </span>
            <span className="font-semibold text-foreground">{activeLink.label}</span>
          </Button>
        </Tooltip>
      </div>

      {isMobileMenuOpen ? (
        <div className={isDesktopTabsCollapsed ? "fixed inset-0 z-40" : "fixed inset-0 z-40 lg:hidden"}>
          <Button
            aria-label="Close entity navigation"
            className="absolute inset-0 bg-foreground/45"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
            unstyled
          />
          <aside
            className="absolute right-0 top-0 flex h-full w-[84%] max-w-xs flex-col gap-3 border-l border-line bg-surface p-4 shadow-xl"
            id="entity-mobile-nav"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold tracking-[0.08em] text-foreground/80">Entity Sections</p>
              <Tooltip content="Close section menu">
                <Button
                  aria-label="Close entity section menu"
                  className="inline-flex size-8 items-center justify-center rounded-md text-foreground/75 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  iconOnly
                  onClick={() => setIsMobileMenuOpen(false)}
                  type="button"
                >
                  <X aria-hidden className="size-4" />
                </Button>
              </Tooltip>
            </div>
            <TabNav
              ariaLabel="Entity sections menu"
              className="w-full"
              items={tabItems.map((item) => ({ ...item, onClick: () => setIsMobileMenuOpen(false) }))}
              layout="list"
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
