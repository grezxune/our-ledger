import { describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/navigation", () => ({
  usePathname: () => "/entity/entity_1/budget",
}));

import { EntityNav } from "@/components/entity/entity-nav";

describe("entity nav", () => {
  it("renders section links and mobile menu trigger", () => {
    const html = renderToStaticMarkup(<EntityNav entityId="entity_1" role="owner" />);

    expect(html).toContain("Budget");
    expect(html).toContain("Snapshots");
    expect(html).toContain("Transactions");
    expect(html).toContain("Members");
    expect(html).toContain("aria-label=\"Open entity section menu\"");
    expect(html).toContain("aria-expanded=\"false\"");
  });

  it("marks only the route-matched section as active", () => {
    const html = renderToStaticMarkup(<EntityNav entityId="entity_1" role="owner" />);

    expect(html).toMatch(/aria-current="page"[^>]*href="\/entity\/entity_1\/budget"/);
    expect(html).not.toMatch(/aria-current="page"[^>]*href="\/entity\/entity_1"/);
    expect(html.match(/aria-current=\"page\"/g)?.length).toBe(1);
  });
});
