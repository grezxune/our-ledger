import { describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    replace: () => {},
  }),
  useSearchParams: () => new URLSearchParams(),
}));

import { AppShell } from "@/components/layout/app-shell";

describe("app shell", () => {
  it("renders role-aware navigation links", () => {
    const html = renderToStaticMarkup(
      <AppShell
        session={{
          expires: "2999-12-31T00:00:00.000Z",
          user: {
            id: "user_1",
            email: "admin@example.com",
            name: "Admin",
            platformRole: "super_admin",
          },
        }}
      >
        <div>Dashboard Body</div>
      </AppShell>,
    );

    expect(html).toContain("Create Entity");
    expect(html).toContain("Audits");
    expect(html).toContain("Admin");
    expect(html).toContain("Account menu");
    expect(html).toMatch(/<details[^>]*>\s*<summary[^>]*aria-label="Account menu"/);
    expect(html).toContain("Sign Out");
    expect(html).not.toContain("Sign In");
    expect(html).toContain("Dashboard Body");
  });

  it("renders public navigation for signed-out visitors", () => {
    const html = renderToStaticMarkup(
      <AppShell session={null}>
        <div>Marketing Body</div>
      </AppShell>,
    );

    expect(html).toContain("Home");
    expect(html).toContain("Sign In");
    expect(html).not.toContain("Create Entity");
    expect(html).not.toContain("Audits");
    expect(html).not.toContain("Admin Storage");
    expect(html).not.toContain("Sign Out");
  });
});
